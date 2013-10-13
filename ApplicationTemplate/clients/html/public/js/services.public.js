'use strict';
	
angular.module('services.public',[])
.factory('UserService',['$http','$rootScope',function($http,$rootScope){
	
	var service = {user:null};
	
	$http({method: 'GET', url: servicesRoot+'/user'})
		.success(function(data, status,headers){
			if (status == 200 && data.hasOwnProperty('identifier') && data.hasOwnProperty('displayName')) {
				service.user = data; 
				$rootScope.$broadcast('userUpdated',data);
			}
			else user = null; // 401
		})
		.error(function(data, status){
			console.log('login failed: '+status);
		})

	service.logout = function(){
		service.user = null;
		$rootScope.$broadcast('userUpdated',null);
		// TODO - remove authentication frmo the session/ force a new one
	}

	return service;
}]);