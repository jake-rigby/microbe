var microbe = require('./../lib/microbe/microbe').microbe;
var app = new microbe(__dirname+'/public', 'http://localhost', 1130, '390313717746623', '0730cc9a6555cddc6f155d018e35bf7f');

/*
app.add(function(api,user){

		api.name = 'example_api';

		api.handler = function(apiData, userData, apiUserData, clientData, callback){ // <-- set assumes we persist to the namespace indicated by the api name
			var gotdbvalue = get;
			var result = data;
			// modify the values apiData, userData and apiUserData //
			callback(apiData, userData, apiUserData);
		};
	};
);
*/