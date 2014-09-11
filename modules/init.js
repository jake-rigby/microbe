module.exports = function(callbackurl, port, config){

	var ip = require(__dirname+'/utils').myip();
	if (callbackurl.indexOf('http://'+ip) != 0) {
		console.info('[MICROBE] for dev, ensure the following line is in C:\\Windows\\System32\\drivers\\etc');
		console.info("");
		console.info("   \""+ip+"  "+callbackurl.split('//')[1].split(':')[0]+"\"");
		console.info("");
	}


	/*
	 * deps
	 */

	var express = require('express'),
		expressSession = require('express-session'),
		passport = require('passport'),
		redis = require('redis'),
		socketio = require('socket.io')
		socketioRedis = require('socket.io-redis'),
		http = require('http'),
		cookie = require('cookie'),
		cookieParser = require('cookie-parser'),
		cookieSignature = require('cookie-signature'),
		bodyParser = require('body-parser'),
		LocalStrategy = require('passport-local').Strategy,
		GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
		FacebookStrategy = require('passport-facebook').Strategy,
		TwitterStrategy = require('passport-twitter').Strategy;



	/*
	 * init components
	 */

	var app = express(),
		httpserver = http.createServer(app),
		redisClient = redis.createClient(config.redis.port,config.redis.host,{no_ready_check: false}),
		sessionStore = new (require('connect-redis')(expressSession))({host: 'localhost', port: 6379}),
		io = socketio.listen(httpserver);

	app.io = io;


	/*
	 * configure passport
	 */
	
	passport.use(new LocalStrategy({		
			usernameField:'username',
			passwordField:'password'
		},		
		function(username, password, done) {
			redisClient.get('user:'+username, function(err, user) {				
				try { user = JSON.parse(user) } catch(e) { err = e}
				if (err) return done(err);
				if (!user) {
					user = {
						displayName : username,
						password : password,
						identifier : username
					}
					redisClient.set('user:'+username, JSON.stringify(user));
					return done(null, user);
				}
				if (user.password != password) return done(null, false,'Incorrect password');
				return done(null, user);
			})
		})
	);

	if (config.google) passport.use(new GoogleStrategy({
			clientID: config.google.client_id,
			clientSecret: config.google.client_secret,
			callbackURL: callbackurl+'/oauth2callback'
		},
		function(accessToken, refreshToken, profile, done) {
			redisClient.get('user:'+profile.id, function(err, user){
				try { user = JSON.parse(user) } catch(e) { err = e}
				if (err) return done(err);
				if (!user) {
					user = profile;
					user.identifier = user.id;
					redisClient.set('user:'+profile.id, JSON.stringify(user));
				}
				return done(null, user);
			})
		}
	));

	if (config.facebook) passport.use(new FacebookStrategy({		
			clientID: config.facebook.id,
			clientSecret: config.facebook.secret,
			callbackURL: callbackurl+'/auth/facebook/callback'
		},
		function(accessToken, refreshToken, profile, done) {
			redisClient.get('user:'+profile.id, function(err, user){
				try { user = JSON.parse(user) } catch(e) { err = e}
				if (err) return done(err);
				if (!user) {
					user = profile;
					user.identifier = user.id;
					redisClient.set('user:'+profile.id, JSON.stringify(user));
				}
				return done(null, user);
			})
		})
	);

	if (config.twitter) passport.use(new TwitterStrategy({
			consumerKey: config.twitter.key,
			consumerSecret: config.twitter.secret,
			callbackurl: callbackurl+'/auth/twitter/callback'
		}, 	
		function(accessToken, tokenSecret, profile, done) {
			redisClient.get('user:'+profile.id, function(err, user){
				try { user = JSON.parse(user) } catch(e) { err = e}
				if (err) return done(err);
				if (!user) {
					user = profile;
					user.identifier = user.id;
					redisClient.set('user:'+profile.id, JSON.stringify(user));
				}
				return done(null, user);
			})
		})
	);

	// tell passport how to serialise the user (you can use another store here)
	passport.serializeUser(function(user, done) {
		done(null, user);
	});
	passport.deserializeUser(function(identifier, done) {
		done(null, identifier);	
	});


	/*
	 * configure express
	 */

	// execution order important
	app.use(bodyParser());
	app.use(cookieParser()); 	
	app.use(expressSession({
		secret: 'secret', 
		store : sessionStore,
		key : 'express.sid'
	}));
	app.use(passport.initialize()); 
	app.use(passport.session());

	
	/*
	 * configure socket mware
	 */


	function authenticate(socket, next) {
		 
		if (socket.request.headers.cookie) {

			// the express session id has been signed and added to the cookie
			socket.request.cookie = cookie.parse(socket.request.headers.cookie);
			var sid = socket.request.cookie['express.sid'].replace("s:", "");
			sid = cookieSignature.unsign(sid, 'secret');

			// store the unsigned id on the request itself
			socket.request.sessionID = sid;

			// use it to retrieve the session express placed in the store
			sessionStore.load(socket.request.sessionID, function(err, sess) {

				// place the retrieved seesion on the reqest
				socket.request.session = sess;
				socket.session = sess;

				next();
			})

		} else {
			console.log('[microbe] init no cookie');
		
		}
	}
	
	// authenticate the default socket
	io.use(authenticate);


	/*
	 * expose a socket connection and inject the user - optional namespace
	 */

	app.add = function(mw, ns) {
		var nsSocket;
		if (!ns) nsSocket = io.sockets;
		else {
			nsSocket = io.of(ns);
			nsSocket.use(authenticate); // <-- remember to authenticate/ add user info
		}
		nsSocket.on('connection', function(socket){
			if (socket.session && socket.session.passport.user) {
				mw(socket,socket.session.passport.user);
			}			
		});
	};
	

	/*
	 * Routes
	 */

	// logout	
	app.get('/logout', function(req,res){
		//http://stackoverflow.com/questions/13758207/why-is-passportjs-in-node-not-removing-session-on-logout
		req.session.destroy(); 
		res.clearCookie('express.sid');
		res.redirect('/');
		req.logout();
	});	
	
	// routes for local login
	app.post('/login', 					passport.authenticate('local',		{successRedirect: '/', failureRedirect: '/login'}));

	// configure passport routes for google login (you need scopes here, not documented on library github site)
	app.get(config.google.authRoute, 	passport.authenticate('google', 	{scope: 'https://www.googleapis.com/auth/plus.login'}));
	app.get(config.google.callback, 	passport.authenticate('google',		{successRedirect:'/',failureRedirect:'/login'}));
	
	// routes for facebook login
	app.get(config.facebook.authRoute, 	passport.authenticate('facebook'));
	app.get(config.facebook.callback, 	passport.authenticate('facebook', 	{ successRedirect: '/', failureRedirect: '/login' }));

	// routes for twitter login
	app.get(config.twitter.authRoute, 	passport.authenticate('twitter'));
	app.get(config.twitter.callback, 	passport.authenticate('twitter', 	{successRedirect: '/', failureRedirect: '/login'}));

	// add a route to get the user // 401 is not authorised
	app.get('/user', function (req, res) {
		if (req.session.passport && req.session.passport.user && req.session.passport.user != '' )
			res.send(req.session.passport.user);
		else
			res.send(null,401);
	});


	/*
	 * go
	 */

	httpserver.listen(port);
	return app;

}