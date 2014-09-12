angular.module('microbe', [])

.factory('UserService', function($http, $q, $window) {

	var service = {user:null},
		deferred = $q.defer();

	service.login = function(username, password) {
		$http({
			method: 'post',
			url: servicesRoot+"/login",
			params: {
				username: username,
				password: password
			}
		}).success(function(data, status, headers, config) {
			$window.sessionStorage["user"] = JSON.stringify(data.user);
			service.user = data.user;
			deferred.resolve(data.user);
		}).error(function(data, status, headers, config) {
			deferred.reject(data);
		});
		return deferred.promise
	}

	service.logout = function() {
		var deferred = $q.defer();
		$http({
			method: "GET",
			url: '/logout',
			/*headers: {
				"access_token": service.user.accessToken
			}*/
		}).then(function(result) {
			$window.sessionStorage["user"] = null;
			service.user = null;
			deferred.resolve(result);
		}, function(error) {
			deferred.reject(error);
		});

		return deferred.promise;
	}

	service.refresh = function() {
		if (service.user) return service.user;
		var deferred = $q.defer();
		$http({
			method:"GET",
			url: '/user'
		}).success(function(data, status, headers, config) {
			$window.sessionStorage["user"] = null;
			service.user = data;
			deferred.resolve(data);
		}).error(function(data, status, headers, config) {
			console.log('no user');
		})
	}

	if ($window.sessionStorage["user"]) {
		try { service.user = JSON.parse($window.sessionStorage["user"]) } catch (e) { service.user = null; }
	}

	return service;
})

.controller('UserController', function($scope, UserService) {

	UserService.refresh();

	$scope.$watch(function(){
		return UserService.user;
	}, function(user) {
		$scope.user = user;
	}, true);

	$scope.login = UserService.login;
	$scope.logout = UserService.logout;
})

.factory('socket.io', ['$rootScope', function($rootScope) {

	// the default namespace
	var socket = io.connect(servicesRoot ? servicesRoot:'');
	
	socket.once('disconnect', function(){
		console.log('socket disconnected by server');
		$rootScope.$broadcast('socket.io.disconnected');
	});

	socket.on('connect',function(data){
		console.log('socket connected');
		$rootScope.$broadcast('socket.io.connected');
	});

	return socket;

}])

.factory('socket.io.ns', ['$rootScope', function($rootScope) {

	var service = {},
		nsSockets = {};

	// add the api to get a namespace socket to the default socket
	service.get = function(ns) {

		if (nsSockets[ns]) return nsSockets[ns];

		var nsSocket = io(ns).connect(servicesRoot ? servicesRoot:'');
		
		nsSocket.once('disconnect', function(){
			console.log('ns nsSocket disconnected by server');
			$rootScope.$broadcast('socket.io.ns.disconnected', {ns:ns});
		});
		
		nsSocket.on('connect',function(data){
			console.log('ns nsSocket connected:', ns);
			$rootScope.$broadcast('socket.io.ns.connected', {ns:ns});
		});

		return nsSocket;
	}

	return service;	
}])

.filter('orderObjectBy', function(){
	return function(input, attribute, reverse) {
		if (!angular.isObject(input)) return input;
		var array = [];
		for(var objectKey in input) {
			array.push(input[objectKey]);
		}
		array.sort(function(a, b){
			a = parseInt(a[attribute]);
			b = parseInt(b[attribute]);
			return reverse ? a - b : b - a;
		});
		return array;
	}
})



.filter('trunc', function() {

	return function(d) {
		/*
		var a = function(data, depth) {
			if (Array.isArray(data) || Object.prototype.toString.call(data) == '[object Object]') {
				for (var p in data) {
					if (depth > 2) {
						data[p] = Object.prototype.toString.call(data[p]);
					} else {
						a(data, depth++);
					}
				}
			}
		}
		a(d,0);*/
		return angular.toJSON(d,true);
	}
})