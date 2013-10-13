microbe
=======

The microbe node.js module is an implementation of the following stack : 

http://nodejs.org/
http://expressjs.com/
http://socket.io/
http://passport.io/
https://github.com/MSOpenTech/redis (http://redis.io/)

It enables the creation of an application server with a RESTful API, a socket implementation and user authentication with the user credentials available in both the socket scope and serialised into the session cookie

##Install

	npm install microbe

##Run

Create a server.js :

	var microbe = require('microbe').microbe;
	
	var fbConfig = { name : "yourAppName", id : "youFbAppId", secret : "yourFbAppSecret" };
	var dbConfig = { host : "127.0.0.1", port : "6379", pass : "" }; // <-- default redis host and port
	
	var app = new microbe(
		__dirname+'/clients/html/public', 
		__dirname+'/clients/html/private', 
		url,
		port,
		redisConfig,
		fbConfig
	);


Make sure redis is accessible from your node process. execute:

	node server.js

##Add socket functionality

continue in server.js :

	app.add(function(socket, user){

		// here, a new socket connection is exposed along with the authenticated user of that socket
		socket.on('some_client_event', function(someClientData){
			var result = doSomethingWith(someClientData);
			socket.emit('server_result', result);
		});
	});

microbe uses redisConnect to store session information, and therefore requires a redis client

	var redis = require('redis').createClient(redisConfig.port,redisConfig.host,{no_ready_check: true});
	redis.auth(redisConfig.pass, function(){}); // <-- only required for a remote paas service

	app.add(function(socket, user){

		var key = 'microbe-example:'+user.identifier+':someNamespace';

		// here, a new socket connection is exposed along with the authenticated user of that socket
		socket.on('some_client_event', function(someClientData){
			redis.get(key, function(err, userData){
				var result = doSomethingWith(someClientData, userData);
				socket.emit('server_result', result);
			});
		});
	});

On npm : https://npmjs.org/package/microbe 
