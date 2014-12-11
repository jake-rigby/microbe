Microbe
=========

Use passport.js to authenticate a user in an express app, include their credentials in the session on the socket.io socket

## install

npm install microbe

### config.json

Set up your accounts and export the details to look like this. the field names were chosen to match the exported names at the timeof writing, but best to check.

```json
{
	"redis": {
		"host" : "127.0.0.1",
		"port" : "6379",
		"pass" : ""
	},
	"google": {
		"client_secret":"secretsecretsecretsecret",
		"client_id":"clientidclientidclientid",
		"authRoute": "/auth/google",
		"callback": "/oauth2callback"
	},
	"facebook": {
		"id": "clientidclientidclientid",
		"secret": "secretsecretsecretsecret",
		"authRoute": "/auth/facebook",
		"callback": "/auth/facebook/callback"
	},
	"twitter": {
		"key": "clientidclientidclientid",
		"secret": "secretsecretsecretsecret",
		"authRoute": "/auth/twitter",
		"callback": "/auth/twitter/callback"
	}	
}

```
##server

```javascript


var 	microbe = require('microbe'),
	redis = require('redis').createClient(config.redis.port, config.redis.host, {no_ready_check: true}),
	port = process.env.PORT ? process.env.PORT : 8080,
	url = process.env.URL ? process.env.URL : 'http://your.domain:'+port;
	app = microbe.init(url, port, config);

app.use(microbe.express.static('path/to/client/www'));

app.add(function(socket, user) {

	socket.on('hello', function(message) {
		console.log(user.displayName, 'says hello,', message);
		socket.emit('hello','back at you');
	})
}, '/namespace-for-this-api');

```

## client login

Here's an example of how to use the UserController (the markup is Bootstrap 3)

``` html
<div class="container ng-cloak center" ng-controller="UserController">
	<form role="form" class="form" ng-submit="login(username, password)">
		<div class="form-group">
			<div ng-show="!loginError">Log in or enter your guest credentials (taken user names will result in incorrect password)</div>
			<div ng-show="loginError" class="text-danger"> {{loginError}}</div>
			<div ng-show="logoutError" class="text-danger"> {{logoutError}}</div>
		</div>
		<div class="form-group">
			<input name="username" id="em" type="text" class="form-control" placeholder="username" ng-model="username">
		</div>
		<div class="form-group">
			<input name="password" id="pw" type="password" class="form-control" placeholder="password" ng-model="password">
		</div>
		<button type="submit" class="btn btn-default">sign in</button>			
		<div class="form-group text-right">
			<a class="text-lg" href="/auth/google" ng-click="loggingIn=true" >google</a>
			<a class="text-lg" href="/auth/facebook" ng-click="loggingIn=true">facebook</a>
			<a class="text-lg" href="/auth/twitter" ng-click="loggingIn=true" >twitter</a>
		</div>
	</form>
</div>

```

## socket api

If the api was namespaced in the server :

``` js
.controller('Cntrl', ['socket.io.ns', function(socketions) {
	
	var socket = socketions.get('/namespace-for-this-api');
	
	socket.on('my-api', function(data) {
		// stuff with data
	});
	
}]);
```

or use the default namespace (these services will be merged and renamed in future version)

``` js
.controller('Cntrl', ['socket.io', function(socketio) {
	
	socketio.on('my-api', function(data) {
		// stuff with data
	});
	
}]);
```
