/**
 * use express to serve some static content and mount some routes
 * add passport to authenticate the user with google
 * do some fuckery to get the user information serialised into the session id, so it is available from the socket connection
 * (the key reference that enabled this to work was https://gist.github.com/durango/4195802)
 */
function microbe(staticPath, url, port){

	// dependencies
	var express = require('express'),
		passport = require('passport'),
		LocalStrategy = require('passport-local').Strategy,
		GoogleStrategy = require('passport-google').Strategy,
		FacebookStrategy = require('passport-facebook').Strategy,
		connect = require('connect'),
		http = require('http'),
		util = require('util'),
		cookie = require('cookie'),
		redis = require('redis'),
		socketRedisStore = require('socket.io/lib/stores/redis')		


	// initialise
	var app = express();
	var server = http.createServer(app);
	var redisClient = redis.createClient();
	var RedisStore = require('connect-redis')(express);
	var io = require('socket.io').listen(server);
	var redisPub = redis.createClient();
	var redisSub = redis.createClient();
	var passportSocketIo = require('passport.socketio');
	var sessionStore;
    var cookieParser = require('express/node_modules/cookie');

	
	// configure passport
	passport.use(new GoogleStrategy({
		    returnURL: url+':'+port+'/auth/google/return',
			realm: url+':'+port+'/'
		},
		function(identifier, profile, done){

			profile.identifier = identifier;
			console.log("user login");
			console.log(profile);
			redisClient.set(identifier,profile);
			return done(null, profile);
		})
	);
	passport.use(new FacebookStrategy({
			clientID: '390313717746623',
			clientSecret: '0730cc9a6555cddc6f155d018e35bf7f',
			callbackURL: url+':'+port+'/auth/facebook/callback'
		},
		function(accessToken, refreshToken, fbprofile, done) {
			profile = {
				accessToken : fbprofile.accessToken,
				displayName : fbprofile.displayName,
				identifier : fbprofile.id
			}
			console.log("user login");
			console.log(profile);
			redisClient.set(accessToken,profile);
			return done(null, profile);
		}
	));
	/*
	passport.use(new LocalStrategy({
			usernameField:'username',
			passwordField:'password'
		},
		function(username, password, done){
			console.log('local login');
			var user = redisClient.get('localuser:'+username,function(err,user){
				if (err) return done(err);
				if (!user) {
					user = {
						displayName : username,
						password : password
					}
					redisClient.set('localuser:'+username,user);
					return done(null,user);
				}
				if (user.password != password) return done(null, false,'Incorrect password');
				return done(null,user);
			})
		})
	);
	*/
	// configure express
	app.configure(function(){
		sessionStore = new RedisStore({client:redisClient});
		app.use(express.cookieParser('secret')); // <-- #executionorder cookie parser used first
		app.use(express.session({
			secret: 'secret', 
			store : sessionStore ,
			key : 'express.sid'
		}));
		app.use(passport.initialize()); // <-- #executionorder passport must be initialised after the things above apparently!
		app.use(passport.session());
		app.use(express.static(staticPath));
	});


	// add a route to get the user
	app.get('/user', function (req, res) {
		if (req.session.passport && req.session.passport.user && req.session.passport.user != '' )
			res.send(req.session.passport.user);
	});

	// and a logout
	app.get('/logout', function(req,res){
		req.logout();
		res.redirect('/');
	});
	
	// configure passport routes for google login
	app.get('/auth/google', passport.authenticate('google'));
	app.get('/auth/google/return', passport.authenticate('google',{successRedirect:'/',failureRedirect:'/login.html'}));
	/*
	// routes for local login
	app.post('/l', passport.authenticate('local',{successRedirect: '/', failureRedirect: '/login.html'}));
	*/
	// routes for facebook login
	app.get('/auth/facebook', passport.authenticate('facebook'));
	app.get('/auth/facebook/callback', 
		passport.authenticate('facebook', { successRedirect: '/', failureRedirect: '/login' }));

	// passport allows hooks to serialise the user data into the session key and retreive it out - you can use another store here or just serialise the lot
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
			redisPub : redisPub, // <-- what are these?
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
			console.log('socket recognising '+socket.session.passport.user.displayName+' in session '+socket.handshake.sessionID);			
		}
	});
	

	// finally listen
	server.listen(port);

	// expose stuff (all needed?)
	this.httpServer = server;
	this.app = app;
	this.sockets = io.sockets;
	this.redisClient = redisClient;
};

// A generic api config path
microbe.prototype.add = function(configMethod) {
	
	// pass a new api object into the config method
	var api = {}; //new api();

	// the developer hook to configure the api
	configMethod(api, this.user);

	// scope
	var that = this;

	// hook it up according to how the developer specified
	this.sockets.on('connection', function(socket){
		socket.on(api.name, function(clientData){
			
			var apiGlobalKey = 'global:'+api.name;
			var userKey = 'users:'+this.user.identifier;
			var apiUserKey = 'users:'+this.user.identifier+':'+api.name;

			that.redisClient.get([apiGlobalKey,userKey,apiUserKey], function(err, alldata){
				
				var apiGlobalData = alldata[0];
				var userData = alldata[1];
				var apiUserData = alldata[2];

				api.handler(apiData, userData, apiUserData, clientData, function(){
					that.redisClient.mset(apiGlobalKey, apiGlobalData, userKey, userData, apiUserKey, apiUserData)
				})
			});

			api.handler(data, api.set, api.get)
			this.redisClient.set(api.set.key, api.set.value);
		})
	})
};


// export api
module.exports.microbe = microbe;
