'use strict';

angular.module('ApplicationName.controllers.private',[])

// example controller
.controller('HelloworldController',['$scope','messengerService',function($scope,messengerService){

	// watch the incoming message
	$scope.$watch(function(){
		return messengerService.message;
	}, function(message){
		$scope.incoming = message;
	});

	// watch the message log
	$scope.$watch(function(){
		return messengerService.logs;
	}, function (logs){
		$scope.logs = logs;
	});

	// hook to submit a message
	$scope.send = function(){
		messengerService.send($scope.outgoing);
		$scope.outgoing = '';
	};
}]);