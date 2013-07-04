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

On npm : https://npmjs.org/package/microbe 
