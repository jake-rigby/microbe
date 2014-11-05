Microbe
=========

Use passport.js to authenticate a user in an express app, include their credentials in the session on the socket.io socket

## install

npm install microbe

##server

```javascript
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

 
```

##client
```html
<!DOCTYPE html>
<html ng-app="microbe-example">
	<head>

		<meta charset="utf-8" />
		<meta http-equiv="X-UA-Compatible" content="IE=9" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0"/>

		<title>microbe-example</title>
		
		<link rel="stylesheet" type="text/css" href="http://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.1.1/css/bootstrap-rtl.css">
		<style type="text/css">
			ul {
				list-style-type: none;
			}
		</style>

		<!-- load angular script in head to allow ng-cloak to work-->
		<script src="//ajax.googleapis.com/ajax/libs/angularjs/1.2.1/angular.min.js"></script>
		<script src="//ajax.googleapis.com/ajax/libs/angularjs/1.2.1/angular-route.min.js"></script>
		<script src="//ajax.googleapis.com/ajax/libs/angularjs/1.2.1/angular-sanitize.min.js"></script>
		<script src="//ajax.googleapis.com/ajax/libs/angularjs/1.2.1/angular-animate.min.js"></script>

		<!-- socket.io -->
		<script src="https://cdn.socket.io/socket.io-1.0.4.js"></script>

	</head>

	<body ng-controller="UserController">
		
		<!-- login controls -->
		<div class="container padtop" ng-cloak ng-show="!user" >
			<div class="row">
				
				<div class="col-xs-12">
					<h1 class="">Sign in</h1>

					<!-- use /auth/google for google login -->
					<a class="text-lg" href="/auth/google" >Google</a>,

					<!-- use auth/facebook for facebook login -->
					<a class="text-lg" href="/auth/facebook" >Facebook</a>

				</div>
			</div>
			<div class="row pad">
				<div class="col-xs-6">

					<!-- use /login for local login/signup -->
					<form role="form" class="form" action="/login" method="post">
						<div class="form-group">
							<input name="username" id="em" type="text" class="form-control" placeholder="Enter email">
						</div>
						<div class="form-group">
							<input name="password" id="pw" type="password" class="form-control" placeholder="Password">
						</div>
						<button type="submit" class="btn btn-default">login/signup</button>
					</form>
					
				</div>
			</div>
		</div>

		<!-- main view -->
		<div class="container" ng-show="user" ng-cloak >
			<ul>
				<li ng-repeat="(key,value) in user"><h3>{{key}}:{{value}}</h3></li>
			</ul>
		</div>

		<div class="navbar-fixed-bottom" ng-cloak ng-show="user">
			<div class="pull-left">
				{{user.displayName}}
				<a ng-click="logout()">logout</a>
			</div>
		</div>

		<!-- include the microbe angularjs tools -->
		<script type="text/javascript" src="js/microbe.js"></script>


		<script type="text/javascript">

			// blank for website served from the app, service url for a packaged app
			var servicesRoot = '';

			angular.module('microbe-example',[
				'ngRoute',
				'microbe.services',
				'microbe.controllers',
				'microbe.filters'
			])

		</script>

	</body>
</html>
```
