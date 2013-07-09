microbe
=======

Combines and encapsulates the following, adding nothing new or novel:

http://nodejs.org/
http://expressjs.com/
http://socket.io/
http://passport.io/
https://github.com/MSOpenTech/redis (http://redis.io/)


##Install

	npm install microbe

##Run

Create a server.js :

	var microbe = require('microbe').microbe;
	var app = new microbe(__dirname+'/node_modules/microbe/example/public', 
						  'http://localhost', 
						  6666, // <-- port
						  yourFacebookAppId, 
						  yourFacebookAppSecret);


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

microbe uses redisConnect to store session information, but you can just create another redis client here for whatever your needs. Updating the previuos method :

	var redis = require('redis').createClient();

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
