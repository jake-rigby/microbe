'use strict';
	
angular.module('microbe.controllers',[])

.controller('UserController',['$scope','UserService','$window',function($scope,UserService,$window){


	$scope.$watch(function(){
		return UserService.user;
	}, function(user) {
		$scope.user = user;
	}, true);
	
	$scope.login = function() {
		$scope.loggingIn = true;
	}
	$scope.logout = UserService.logout;	
	$scope.poll = UserService.poll;
	/*
	$scope.$on('userUpdated',function(event,user) {
		
		$scope.user = user;
	});
	*/
	$scope.googleLogin = function() {

		$window.open(servicesRoot+'/auth/google','_self');
	}
}])
