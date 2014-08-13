'use strict';
	
angular.module('microbe.services',[])

.factory('UserService',['$http','$rootScope','$location','$q',
	function($http,$rootScope,$location,$q){
	
	var u = $q.defer(),
	service = {
		user:null,
		qUser: function() {
			return u.promise;
		}
	}
	
	$http({method: 'GET', url: servicesRoot+'/user'})
		
		.success(function(data, status, headers) {
			if (status == 200 && data.hasOwnProperty('identifier') && data.hasOwnProperty('displayName')) service.user = data;
			else service.user = null; // 401
			$rootScope.$broadcast('userUpdated',service.user);
			u.resolve(data)
		})
		
		.error(function(data, status) {
			service.user = null;
			$rootScope.$broadcast('userUpdated',null);
			console.log('login failed: '+status);
		})

	service.logout = function() {
		service.user = null;
		$rootScope.$broadcast('userUpdated',null);
		$location.path(servicesRoot);
		$http({method: 'GET', url: servicesRoot+'/logout'})
	}

	return service;
}])


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
