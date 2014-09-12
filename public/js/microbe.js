angular.module('microbe', [])

.factory('UserService', $http, $q, $window) {

	var userInfo;

	function login(username, password) {
		$http.post("/api/login", {
			userName: userName,
			password: password
		}).then(function(result) {
			userInfo = {
				console.log(result.data);
				accessToken: result.data.access_token,
				userName: result.data.userName
			};
			$window.sessionStorage["userInfo"] = JSON.stringify(userInfo);
			deferred.resolve(userInfo);
		}, function(error) {
			deferred.reject(error);
		});
		return deferred.promise
	}

	function logout() {
	var deferred = $q.defer();

	$http({
		method: "POST",
		url: logoutUrl,
		headers: {
			"access_token": userInfo.accessToken
		}
	}).then(function(result) {
		$window.sessionStorage["userInfo"] = null;
		userInfo = null;
		deferred.resolve(result);
	}, function(error) {
		deferred.reject(error);
	});

	return deferred.promise;
}})