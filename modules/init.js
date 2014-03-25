

module.exports = function(callbackurl, port, redisConfig, fbConfig){

	// params
	var redisHost = redisConfig.host,
		redisPort = redisConfig.port,
		redisPass = redisConfig.pass,
		fbAppId = fbConfig.id,
		fbAppSecret = fbConfig.secret;


	// dependencies
	var express = require('express'),
		passport = require('passport'),
		LocalStrategy = require('passport-local').Strategy,
		GoogleStrategy = require('passport-google').Strategy,
		FacebookStrategy = require('passport-facebook').Strategy,
		connect = require('connect'),
		http = require('http'),
		cookie = require('cookie'),
		redis = require('redis'),
		socketRedisStore = require('socket.io/lib/stores/redis')		

	
	// initialise
	var app = express(),
		server = http.createServer(app),
		redisClient = redis.createClient(redisConfig.port,redisConfig.host,{no_ready_check: false}),
		RedisStore = require('connect-redis')(express),
		io = require('socket.io').listen(server),
		redisPub = redis.createClient(redisConfig.port,redisConfig.host,{no_ready_check: false}),
		redisSub = redis.createClient(redisConfig.port,redisConfig.host,{no_ready_check: false}),
		sessionStore,
    	cookieParser = require('express/node_modules/cookie');
    
    
    // pub and sub..
	redisClient.auth(redisConfig.pass, function(err){
		if (err) throw err; 
		else console.log('microbe redis client ready') } );
	

	redisPub.auth(redisConfig.pass, function(err){
		if (err) throw err; 
		else console.log('microbe redisPub client ready') } );
	

	redisSub.auth(redisConfig.pass, function(err){
		if (err) throw err; 
		else console.log('microbe redissub client ready') } );
	
	
	// configure passport
	passport.use(new GoogleStrategy({
		
			returnURL: callbackurl+'/auth/google/return',
			realm: callbackurl+'/'
		},

		function(identifier, profile, done){

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
		}
	));
	
	passport.use(new LocalStrategy({
		
			usernameField:'username',
			passwordField:'password'
		},
		
		function(username, password, done){
			redisClient.get('localuser:'+username,function(err,user){
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



	// configure express
	app.configure(function(){
		sessionStore = new RedisStore({client:redisClient});
		app.use(express.cookieParser('secret')); // <-- #executionorder cookie parser used first
		app.use(express.bodyParser());
		app.use(express.session({
			secret: 'secret', 
			store : sessionStore ,
			key : 'express.sid'
		}));
		app.use(passport.initialize()); // <-- init passport after session and cookie mware
	});

	// add a route to get the user // 401 is not authorised
	app.get('/user', function (req, res) {
		if (req.session.passport && req.session.passport.user && req.session.passport.user != '' )
			res.send(req.session.passport.user);
		else
			res.send(null,401);
	});
	
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


	// configure socket.io
	io.configure(function () {
		
		io.set('log level', 1)
		io.set('store', new socketRedisStore({
			redis : redis,
			redisPub : redisPub,
			redisSub : redisSub,
			redisClient : redisClient
		}))
		
		io.set('authorization', function (data, accept) {
			if (data.headers.cookie) {
				data.cookie = cookie.parse(data.headers.cookie)
				data.cookie = connect.utils.parseSignedCookies(data.cookie, 'secret')
				data.cookie = connect.utils.parseJSONCookies(data.cookie)
				data.sessionID = data.cookie['express.sid']
				sessionStore.load(data.sessionID, function (err, session) {
					if (err || !session) {
						// invalid session identifier. tl;dr gtfo.
						accept('session error', false)
					} else {
						data.session = session
						accept(null, true)
					}
				})
			} else {
				accept('session error', false)
			}
		})
	});


	// implement socket.io
	io.sockets.on('connection',function(socket){
		socket.session = new connect.middleware.session.Session({ sessionStore: sessionStore }, socket.handshake.session);			
		if (socket.session && socket.session.passport.user) {
			//console.log('socket recognising '+socket.session.passport.user.displayName+' in session '+socket.handshake.sessionID);			
		}
	});


	// expose a socket connection and inject the user
	app.add = function(api) {
		io.sockets.on('connection', function(socket){
			socket.session = new connect.middleware.session.Session({ sessionStore: sessionStore }, socket.handshake.session);			
			if (socket.session && socket.session.passport.user) {
				//console.log('socket recognising '+socket.session.passport.user.displayName+' in session '+socket.handshake.sessionID);			
				api(socket,socket.session.passport.user);
			}
		});
	};
	

	server.listen(port);


	return app;

};
