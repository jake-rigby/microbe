var app = angular.module('DealerBlackMarketIndex',['services.public'])
'use strict';
	
angular.module('controllers.public',[])
.controller('UserController',['$scope','UserService','$rootScope',function($scope,UserService,$rootScope){
	$scope.user = null;
	$scope.logout = UserService.logout;
	$scope.$on('userUpdated',function(event,user){
		$scope.user = user;
	})
}])
