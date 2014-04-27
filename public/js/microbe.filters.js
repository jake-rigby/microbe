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

.filter('trunc', function() {

	return function(d) {
		/*
		var a = function(data, depth) {
			if (Array.isArray(data) || Object.prototype.toString.call(data) == '[object Object]') {
				for (var p in data) {
					if (depth > 2) {
						data[p] = Object.prototype.toString.call(data[p]);
					} else {
						a(data, depth++);
					}
				}
			}
		}
		a(d,0);*/
		return angular.toJSON(d,true);
	}
})