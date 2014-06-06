var config = require('../config');
var DB = require('./db');
var nullcb = function() {};

var Proxy = function() {
	this.db_proxy = new DB('PROXY');
	return this;
};

Proxy.prototype.get = function(domain, callback) {
	domain = domain.toLocaleLowerCase();

	this.db_proxy.one({_id: domain}, function(result) {
		return callback(result);
	});
};

module.exports = Proxy;