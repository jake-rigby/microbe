
module.exports = function(callbackurl, port, redisConfig, fbConfig){

	// params
	var redisHost = redisConfig.host,
		redisPort = redisConfig.port,
		redisPass = redisConfig.pass,
		fbAppId = fbConfig.id,
		fbAppSecret = fbConfig.secret;

	// deps
	var express = require('express'),
		expressSession = require('express-session'),
		passport = require('passport'),
		redis = require('redis'),
		socketio = require('socket.io')
		socketioRedis = require('socket.io-redis'),
connect = require('connect'),
		http = require('http'),
cookie = require('cookie'),
cookieParser = require('cookie-parser'),
cookieSignature = require('cookie-signature'),
		bodyParser = require('body-parser'),
		LocalStrategy = require('passport-local').Strategy,
		GoogleStrategy = require('passport-google').Strategy,
		FacebookStrategy = require('passport-facebook').Strategy;


	// init systems
	var app = express(),
		httpserver = http.createServer(app),
		redisClient = redis.createClient(redisConfig.port,redisConfig.host,{no_ready_check: false}),
		sessionStore = new (require('connect-redis')(expressSession))({host: 'localhost', port: 6379}),
		io = socketio.listen(httpserver);


	// config passport
	passport.use(new GoogleStrategy({		
			returnURL: callbackurl+'/auth/google/return',
			realm: callbackurl+'/'
		},
		function(identifier, profile, done) {
			profile.identifier = identifier;
			redisClient.set(identifier,profile);
			return done(null, profile);
		})
	);

	passport.use(new FacebookStrategy({		
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
	
	passport.use(new LocalStrategy({		
			usernameField:'username',
			passwordField:'password'
		},		
		function(username, password, done) {
			redisClient.get('localuser:'+username, function(err, user) {				
				user = JSON.parse(user);
				if (err) return done(err);
				if (!user) {
					user = {
						displayName : username,
						password : password,
						identifier : username
					}
					redisClient.set('localuser:'+username,JSON.stringify(user));
					return done(null,user);
				}
				if (user.password != password) return done(null, false,'Incorrect password');
				return done(null,user);
			})
		})
	);

	/*
	 * passport allows hooks to serialise the user data 
	 * into the session key and retreive it out
	 * here we are serialising the lot
	 * but you can use another store here
	 */
	passport.serializeUser(function(user, done) {
		done(null, user);
	});

	passport.deserializeUser(function(identifier, done) {
		done(null, identifier);	
	});


	// config express
	app.use(bodyParser());
	app.use(cookieParser('secret')); // <-- #executionorder cookie parser used first
	app.use(expressSession({
		secret: 'secret', 
		store : sessionStore,
		key : 'express.sid'
	}));
	app.use(passport.initialize()); // <-- init passport after session and cookie mware


	// config socket.io
	io.adapter(socketioRedis({
		host: 'localhost', 
		port:6379
	}));	

	io.use(function(socket, next) {
		var data = socket.request;
		if (socket.request.headers.cookie) {

			// parse the cookie in the head and set the session id on the request 
			socket.request.cookie = cookie.parse(socket.request.headers.cookie);
			socket.request.sessionID = socket.request.cookie['express.sid'];

			console.log('your cookie', socket.request.cookie);
			console.log('your sid', socket.request.cookie['express.sid']);
		}
		next();
	})

	// implement socket.io
	io.sockets.on('connection',function(socket){
		//socket.session = new connect.middleware.session.Session({ sessionStore: sessionStore }, socket.handshake.session);
		socket.session = new expressSession.Session(socket.request);
		if (socket.session && socket.session.passport.user) {
			//console.log('socket recognising '+socket.session.passport.user.displayName+' in session '+socket.handshake.sessionID);			
		}
	});


	// expose a socket connection and inject the user
	app.add = function(api) {
		io.sockets.on('connection', function(socket){
			socket.session = new connect.middleware.session.Session({ sessionStore: sessionStore }, socket.handshake.session);			
			console.log('connect session', session); 
			if (socket.session && socket.session.passport.user) {
				//console.log('socket recognising '+socket.session.passport.user.displayName+' in session '+socket.handshake.sessionID);			
				api(socket,socket.session.passport.user);
			}
		});
	};
	

	/*
	 * Routes
	 */

	// logout	
	app.get('/logout', function(req,res){
		req.logout();
		res.redirect('/');
	});	
	

	// configure passport routes for google login
	app.get('/auth/google', passport.authenticate('google'));
	app.get('/auth/google/return', passport.authenticate('google',{successRedirect:'/',failureRedirect:'/'}));
	
	
	// routes for local login
	app.post('/login', passport.authenticate('local',{successRedirect: '/', failureRedirect: '/'}));
	
	
	// routes for facebook login
	app.get('/auth/facebook', passport.authenticate('facebook'));
	app.get('/auth/facebook/callback', 
	passport.authenticate('facebook', { successRedirect: '/', failureRedirect: '/login.html' }));


	// add a route to get the user // 401 is not authorised
	app.get('/user', function (req, res) {
		if (req.session.passport && req.session.passport.user && req.session.passport.user != '' )
			res.send(req.session.passport.user);
		else
			res.send(null,401);
	});


	httpserver.listen(port);


	return app;

}