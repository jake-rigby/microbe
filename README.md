microbe
=======

Combines and encapsulates the following, adding nothing new or novel:

http://nodejs.org/
http://expressjs.com/
http://socket.io/
http://passport.io/
https://github.com/MSOpenTech/redis (http://redis.io/)


##Install

<code>npm install microbe</code>

##Run

Create a server.js :
<code>
<br>var microbe = require('microbe').microbe;
<br>var app = new microbe(__dirname+'/node_modules/microbe/example/public', 
<br>'http://localhost', 6666, yourFacebookAppId, yourFacebookAppSecret);
</code>

Make sure redis is accessible from your node process. execute:

<code>node server.js</code>

On npm : https://npmjs.org/package/microbe 
