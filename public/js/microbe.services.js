'use strict';
	
angular.module('microbe.services',[])

.factory('UserService',['$http','$rootScope','socket.io','$location',
	function($http,$rootScope,socketio,$location){
	
	var service = {user:null};
	
	$http({method: 'GET', url: servicesRoot+'/user'})
		
		.success(function(data, status,headers){
			if (status == 200 && data.hasOwnProperty('identifier') && data.hasOwnProperty('displayName')) service.user = data;
			else service.user = null; // 401
			$rootScope.$broadcast('userUpdated',service.user);
		})
		
		.error(function(data, status){
			service.user = null;
			$rootScope.$broadcast('userUpdated',null);
			console.log('login failed: '+status);
		})

	service.logout = function(){
		service.user = null;
		$rootScope.$broadcast('userUpdated',null);
		$location.path(servicesRoot);
		$http({method: 'GET', url: servicesRoot+'/logout'})
	}

	return service;
}])


.factory('socket.io',['$rootScope',function($rootScope){

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