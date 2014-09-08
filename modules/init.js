module.exports = function(callbackurl, port, redisConfig, fbConfig, googleConfig, twitterConfig){

	console.log('callback url', callbackurl)
	/*
	 * params
	 */

	var redisHost = redisConfig.host,
		redisPort = redisConfig.port,
		redisPass = redisConfig.pass;


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
		//GoogleStrategy = require('passport-google').Strategy,
		GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
		FacebookStrategy = require('passport-facebook').Strategy,
		TwitterStrategy = require('passport-twitter').Strategy;



	/*
	 * init components
	 */

	var app = express(),
		httpserver = http.createServer(app),
		redisClient = redis.createClient(redisConfig.port,redisConfig.host,{no_ready_check: false}),
		sessionStore = new (require('connect-redis')(expressSession))({host: 'localhost', port: 6379}),
		io = socketio.listen(httpserver);

	app.io = io;


	/*
	 * configure passport
	 */
	 /* OpenID authentication is being 'sunsetted'
	passport.use(new GoogleStrategy({		
			returnURL: callbackurl+'/auth/google/return',
			realm: callbackurl+'/'
		},
		function(identifier, profile, done) {
			profile.identifier = identifier;
			redisClient.set(identifier,profile);
			return done(null, profile);
		})
	);*/
	
	passport.use(new LocalStrategy({		
			usernameField:'username',
			passwordField:'password'
		},		
		function(username, password, done) {
			redisClient.get('user:'+username, function(err, user) {				
				user = JSON.parse(user);
				if (err) return done(err);
				if (!user) {
					user = {
						displayName : username,
						password : password,
						identifier : username
					}
					redisClient.set('user:'+username,JSON.stringify(user));
					return done(null,user);
				}
				if (user.password != password) return done(null, false,'Incorrect password');
				return done(null,user);
			})
		})
	);

	if (googleConfig) passport.use(new GoogleStrategy({
			clientID: googleConfig.client_id,
			clientSecret: googleConfig.client_secret,
			callbackURL: callbackurl+'/auth/google/callback'
		},
		function(accessToken, refreshToken, profile, done) {
			/*User.findOrCreate({ googleId: profile.id }, function (err, user) {
				return done(err, user);
			});*/
			profile.accessToken = accessToken;
			profile.refreshToken = refreshToken;
			redisClient.set(profile.id, profile, function(err, result) {
 				done(err, profile);
			});
		}
	));

	if (fbConfig) passport.use(new FacebookStrategy({		
			clientID: fbConfig.id,
			clientSecret: fbConfig.secret,
			callbackURL: callbackurl+'/auth/facebook/callback'
		},
		function(accessToken, refreshToken, fbprofile, done) {		
			profile = {
				accessToken : fbprofile.accessToken,
				displayName : fbprofile.displayName,
				identifier : fbprofile.id
			}
			redisClient.set(accessToken,profile);
			return done(null, profile);
		})
	);

	if (twitterConfig) passport.use(new TwitterStrategy({
			consumerKey: twitterConfig.consumer_key,
			consumerSecret: twitterConfig.consumer_secret,
			callbackurl: callbackurl+'/auth/twitter/callback'
		}, 	
		function(accessToken, tokenSecret, twprofile, done) {
			profile = {
				accessToken : twprofile.accessToken,
				displayName : twprofile.displayName,
				identifier : twprofile.id
			}
			redisClient.set(accessToken,profile);
			return done(null, profile);		})
	);

	// tell passport how to serialise the user (you can use anoter store here)
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
		req.logout();
		//http://stackoverflow.com/questions/13758207/why-is-passportjs-in-node-not-removing-session-on-logout
		req.session.destroy(function(err) {
			res.clearCookie('express.sid');
			res.redirect('/');
		}); 
	});	
	
	// routes for local login
	app.post('/login', passport.authenticate('local',{successRedirect: '/', failureRedirect: '/'}));

	// configure passport routes for google login
	app.get('/auth/google', passport.authenticate('google', {scope: 'https://www.googleapis.com/auth/plus.login'})); // <-- you need scopes here, not documented on library github site
	app.get('/auth/google/callback', passport.authenticate('google',{successRedirect:'/',failureRedirect:'/'}));
	
	// routes for facebook login
	app.get('/auth/facebook', passport.authenticate('facebook'));
	app.get('/auth/facebook/callback', passport.authenticate('facebook', { successRedirect: '/', failureRedirect: '/login' }));

	// routes for twitter login
	app.get('/auth/twitter', passport.authenticate('twitter'));
	app.get('/auth/twitter/callback', passport.authenticate('twitter', {successRedirect: '/', failureRedirect: '/login'}));

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