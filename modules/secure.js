/*
 * Security restictive middleware 
 * requires the user has connected to a socket and therefore serialised the user into the seesion cookie
 * OR that the url is prefixed with a valid (harcoded for now) auth addres
 */
module.exports = function(validPathPrefix) {
	return function(req,res, next){
		if (req.session.passport.user || (validPathPrefix && req.url.indexOf(validPathPrefix) == 0)) next();
		else res.redirect('/');
	}
}