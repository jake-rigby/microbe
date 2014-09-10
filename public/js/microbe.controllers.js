'use strict';
	
angular.module('microbe.controllers',[])

.controller('UserController', ['$scope', 'UserService', function($scope, UserService){

	$scope.$watch(function(){
		return UserService.user;
	}, function(user) {
		$scope.user = user;
	}, true);

	$scope.poll = UserService.poll;

}])
