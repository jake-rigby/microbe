'use strict';
	
var services = angular.module('ApplicationName.services.private',[]);


// socket.io
services.factory('socket.io',[function(){

	var service = {};

	// 'io' and 'servicesRoot' are defined in the root html file
	var socket = io.connect(servicesRoot);
	
	socket.once('disconnect', function(){
		// de-initialise socket
		console.log('socket disconnected by server');
	});

	socket.on('connect',function(data){
		// initialise socket
		console.log('socket connected');
	});

	return socket;
}]);


// example service
services.factory('messengerService',['$rootScope','socket.io','$http',function($rootScope,socketio,$http){

	var service = {message:'Echos your message and persist in a log'};

	$http({method: 'GET', url: servicesRoot+'/messages'})
	.success(function(data,status){
		service.logs = data;
		if (!service.logs) service.logs = [];
	})
	.error(function(data,status){
		service.logs = [];
	})

	socketio.on('example_message',function(message){
		$rootScope.$apply(function(){service.message = message;});
	});

	service.send = function(message){
		service.logs.unshift(message)
		socketio.emit('example_message',message);
	}

	return service
}]);

