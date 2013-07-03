var microbe = require('./../lib/microbe/App').App;
console.log(__dirname+'/public');
var app = new microbe(__dirname+'/public', 'http://localhost', 1130);

//app.configure(function(user,socket,database){

	app.add(function(api,user){

			api.name = 'increment_score';

			api.handler = function(apiData, userData, apiUserData, clientData, callback){ // <-- set assumes we persist to the namespace indicated by the api name
				var gotdbvalue = get;
				var result = data;
				// modify the values apiData, userData and apiUserData //
				callback(apiData, userData, apiUserData);
			};
		}
	);

//});