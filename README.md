Microbe
=========

Combine express, socket.io, passport and redis to quickly implement an authenticated web app


##5 mins

```javascript
var microbe = require('microbe');
var express = require('express');

var port = process.env.PORT ? process.env.PORT : 8080;
var url = process.env.URL ? process.env.URL : 'http://'+microbe.myip()+':'+port;

var fbConfig = {
    "name" : "MyFacebookApp,
    "id" : "123456789123456",
    "secret" : "4a16acac100822728b47c860e88aecd1"
}

var app = microbe.init(url, port, microbe.utils.redisDefaultConfig(), fbConfig);

/*
 * seperate public and secured content
 */
app.use(express.static(__dirname+'/www/public'));
app.use(microbe.secure('/auth/')); 
app.use(express.static(__dirname+'/www/private'));

/*
 * add socket functionality like middleware
 */
app.add(function(socket, user) {
    
    socket.on('connect', function() {
        socket.emit('message', 'welcome '+user.displayName);
    });
});

 
```
