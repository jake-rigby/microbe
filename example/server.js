var microbe = require('./../lib/microbe/microbe').microbe;

var appConfig = { location : "http://localhost", port : 1130 };
var fbConfig = { name : "yourAppName", id : "youFbAppId", secret : "yourFbAppSecret" };
var dbConfig = { host : "127.0.0.1", port : "6379", pass : "" }; 

var app = new microbe(__dirname+'/public', 'http://localhost', 1130, 'fbappid', 'fbappsecret');

var redis = require('redis').createClient();


app.add(function(socket, user){

		var key = 'microbe-example:'+user.identifier;

		socket.on('add_thing', function(thing){
			redis.sadd(key, thing);
		});

		socket.on('get_things', function(){
			redis.smembers(key, function(err, list){
				socket.emit('got_things',list);
			});
		});
	}
);
