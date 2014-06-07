
/**
 * @author Jake Rigby
 *
 * Just give us the http content
 */
module.exports = function() {
	return require('path').normalize(__dirname+'/../public');
}