var microbe = require('microbe').App;

var app = new microbe(__dirname+'public', 'http://localhost', 1130);

app.configure(function(user,socket,database){

	app.add(function(api,user){

			api.name = 'increment_score';

			api.handler = function(apiData, userData, apiUserData, clientData, callback){ // <-- set assumes we persist to the namespace indicated by the api name
				var gotdbvalue = get;
				var result = data;
				callback(apiData, userData, apiUserData);
			};
		}
	);
	
});