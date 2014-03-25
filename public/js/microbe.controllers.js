'use strict';
	
angular.module('microbe.controllers',[])

.controller('UserController',['$scope','UserService','$rootScope',function($scope,UserService,$rootScope){
	
	$scope.user = UserService.user;
	$scope.logout = UserService.logout;

	$scope.$on('userUpdated',function(event,user) {
		
		$scope.user = user;
	});

	$scope.reset = function() {
		
		UserService.reset();
	}

	$scope.exportClass = function(classkey) {
		console.log('export', classkey);
		UserService.export(classkey);
	}
}])
