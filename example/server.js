var microbe = require('../../microbe'),
	
	redisConfig = {
		host: "127.0.0.1",
		port: 6379
	},

	fbConfig = {
		"name" : "fb-app-name",
		"id" : "fb-app-id",
		"secret" : "fb-app-secret"
	},

	redis = require('redis').createClient(redisConfig.port, redisConfig.host, {no_ready_check: true}),
	port = process.env.PORT ? process.env.PORT : 8080,
	url = process.env.URL ? process.env.URL : 'http://'+require('../../microbe').utils.myip()+':'+port;
	app = microbe.init(url, port, redisConfig, fbConfig);

app.use(microbe.express.static('./client'));
app.use(microbe.express.static('../public'));

app.add(function(socket, user) {

	socket.on('hello', function(message) {
		console.log(user.displayName, 'says hello,', message);
		socket.emit('hello','back at you');
	})
});

console.log('app running at', url);