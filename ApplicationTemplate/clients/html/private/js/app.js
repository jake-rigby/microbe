'use strict';

var servicesRoot = ''; 
//var servicesRoot = 'http://application-domain.com'; // <-- harcode for packaged app

// plugins go here
angular.module('ApplicationName',[
	'ngRoute',
	'services.public',
	'controllers.public',
	'ApplicationName.services.private',
	'ApplicationName.controllers.private'
])

.config(['$routeProvider',function($routeProvider){

	// example route
	$routeProvider.when('/helloworld' , {
		templateUrl : 'partials/helloworld.html', 
		controller : 'HelloworldController'
	});

	$routeProvider.otherwise({redirectTo:'/'});

}])
