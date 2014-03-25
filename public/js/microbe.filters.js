'use strict';
	

angular.module('microbe.filters',[])

.filter('orderObjectBy', function(){
	return function(input, attribute, reverse) {
		if (!angular.isObject(input)) return input;
		var array = [];
		for(var objectKey in input) {
			array.push(input[objectKey]);
		}
		array.sort(function(a, b){
			a = parseInt(a[attribute]);
			b = parseInt(b[attribute]);
			return reverse ? a - b : b - a;
		});
		return array;
	}
})



/**
 * pretty print directive, place filtered results in <pre> tag
 */
.filter('pp', function() {
	return function(data) {
		return angular.toJson(data, true);
	}
})

