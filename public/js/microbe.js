angular.module('microbe', [])
.factory('io', function($window) {
	return $window.io;
})
.factory('UserService', function($http, $q, $window) {

	var service = {},
		user;

	service.login = function(username, password) {
		var deferred = $q.defer();
		if (user) deferred.resolve(user);
		else $http({
			method: 'post',
			url: servicesRoot+'/login',
			params: {
				username: username,
				password: password
			}
		}).success(function(data, status, headers, config) {
			user = data;
			deferred.resolve(data);
		}).error(function(data, status, headers, config) {
			deferred.reject({ authenticated: false, message: data});
		});
		return deferred.promise;
	}

	service.logout = function() {
		var deferred = $q.defer();
		$http({
			method: 'get',
			url: servicesRoot+'/logout'
		}).then(function(result) {
			user = null;
			deferred.resolve(result);
		}, function(error) {
			deferred.reject(error);
		});
		return deferred.promise;
	}

	service.getUser = function() {
		var deferred = $q.defer();
		if (user) deferred.resolve(user); 
		else $http({
			method: 'get',
			url: servicesRoot+'/user'
		}).success(function(data, status, headers, config) {
			user = data;
			deferred.resolve(data);
		}).error(function(data, status, headers, config) {
			deferred.reject({ authenticated: false });
		})
		return deferred.promise;
	}

	return service;
})
.controller('UserController', function($scope, UserService, $location) {

	UserService.getUser().then(function(user) { 
		$scope.user = user;
		if (user &&  $location.url() == '/login') $location.url('/');	
	});

	$scope.login = function(username, password) {
		$scope.loginError = null;
		UserService.login(username, password)
		.then(function(user) {
			if (user) $location.url('/');
		})
		.catch(function(err) {
			$scope.loginError = err.message;
			$scope.password = '';
		})
	}

	$scope.logout = function() {
		$scope.logoutError = null;
		UserService.logout()
		.then(function() {
			$location.url('/login');
			$scope.user = null
		})
		.catch(function(err) {
			$scope.logoutError = err;
		})
	}	
})
.factory('socket.io', ['$rootScope','io', function($rootScope, io) {

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
.factory('socket.io.ns', ['$rootScope', 'io', function($rootScope, io) {

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
}]);
