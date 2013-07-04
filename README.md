microbe
=======

This was created for beginners, like me. It encapsulates the following technologies, and adds nothing new to them :


http://nodejs.org/ - a networking platform that runs on a JavaScript runtime

http://expressjs.com/ - a node package for serving web content

http://socket.io/ - very simple to use web socket package

http://twitter.github.io/bootstrap/ - HTML and CSS framework

http://passport.io/ - authentication package for node

https://github.com/MSOpenTech/redis - a (experimental) port of ..

http://redis.io/ - a fast,no-sql, in-memory store like Memcached 


To install it download and install node and redis. Navigate in the node command promt to a new /microbeproject folder and execute :

npm microbe


To run it, create a file in the project called server.js containing :

var microbe = require('microbe').microbe;
var app = new microbe(__dirname+'/node_modules/microbe/example/public', 'http://localhost', 1130);


, and in the command prompt execute:

node server.js


Browse to http://localhost:1130/
