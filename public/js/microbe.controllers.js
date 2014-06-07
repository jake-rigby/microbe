'use strict';
	
angular.module('microbe.controllers',[])

.controller('UserController',['$scope','UserService','$window',function($scope,UserService,$window){
	
	$scope.user = UserService.user;
	$scope.logout = UserService.logout;

	$scope.$on('userUpdated',function(event,user) {
		
		$scope.user = user;
	});

	$scope.googleLogin = function() {

		$window.open(servicesRoot+'/auth/google','_self');
	}
}])
