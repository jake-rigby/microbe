'use strict';
	
angular.module('microbe.controllers',[])

.controller('UserController',['$scope','UserService','$rootScope','$window',function($scope,UserService,$rootScope,$window){
	
	$scope.user = UserService.user;
	$scope.logout = UserService.logout;

	$scope.$on('userUpdated',function(event,user) {
		
		$scope.user = user;
	});

	$scope.reset = function() {
		
		UserService.reset();
	}

	$scope.googleLogin = function() {

		$window.open(servicesRoot+'/auth/google','_self');
	}
}])
