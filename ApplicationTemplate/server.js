// initialise framework
var microbe = require('microbe').microbe;

// load configuration files
var fbConfig = require('./config/facebook');
var redisConfig = require('./config/redisLocal');

// initialise redis client
var redis = require('redis').createClient(redisConfig.port,redisConfig.host,{no_ready_check: true});
redis.auth(redisConfig.pass, function(){});

// derive the port and url
var port = process.env.PORT ? process.env.PORT : 1131;
var url = process.env.URL ? process.env.URL : 'http://'+require('./tools/utils.js').myip()+':'+port;

// microbe
var app = new microbe(
	__dirname+'/clients/html/public', 
	__dirname+'/clients/html/private', 
	url,
	port,
	redisConfig,
	fbConfig
);

// your location
console.log('application running at '+url);

// add authenticated routes to app pages in the restricted area
app.app.get('/app',function(req,res){
	res.sendfile('clients/html/hidden/app.html');
});

// add REST apis
app.app.get('/messages',function(req,res){
	var namespace = 'ApplicationName:'+req.session.passport.user.identifier;
	redis.lrange(namespace+':messages',0,-1,function(err,messages){
		if (!messages) res.send(null,401);
		else res.send(messages);
	});
});

// add socket.io apis
app.add(function(socket,user){
	var namespace = 'ApplicationName:'+user.identifier;
	socket.on('example_message',function(message){
		redis.lpush(namespace+':messages',message);
		socket.emit('example_message','You said : '+message);
	});
});
