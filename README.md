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
	var port = 8080;
	var url = 'http://yourdomain.com:'+port;
	
	var applicaion = new microbe(
		__dirname+'/clients/html/public', // <-- do not intersect the public and private static folders
		__dirname+'/clients/html/private', // <-- privately served static content is only available to authenticated sessions
		url,
		port,
		redisConfig,
		fbConfig
	);


Make sure redis is accessible from your node process. execute:

	node server.js

##Add a socket api

	application.app.add(function(socket, user){ // <-- .app is the express instance

		// here, a new socket connection is exposed along with the authenticated user of that socket
		socket.on('some_client_event', function(someClientData){
			var result = doSomethingWith(someClientData);
			socket.emit('server_result', result);
		});
	});

##Database
microbe uses redisConnect to store session information, and therefore requires a redis client

	var redis = require('redis').createClient(redisConfig.port,redisConfig.host,{no_ready_check: true});
	redis.auth(redisConfig.pass, function(){}); // <-- only required for a remote paas service

	app.add(function(socket, user){

		var namespace = 'microbe-example:'+user.identifier+':foo';

		// here, a new socket connection is exposed along with the authenticated user of that socket
		socket.on('some_client_event', function(someClientData){
			redis.get(namespace, function(err, userData){
				var result = doSomethingWith(someClientData, userData);
				socket.emit('server_result', result);
			});
		});
	});
	
##Add REST api

	application.app.get('/messages',function(req,res){
		var namespace = 'microbe-example:'+req.session.passport.user.identifier+':messages'; // <-- the user credentials are available in the session cookie
		redis.lrange(namespace+':messages',0,-1,function(err,messages){
			if (!messages) res.send(null,401);
			else res.send(messages);
		});
	});
	
##Application Template

The application template adds an mvp client built with angular.js and Twitter Bootstrap. Copy the files to a new project and look for 'ApplicationName' prompts.



On npm : https://npmjs.org/package/microbe 
