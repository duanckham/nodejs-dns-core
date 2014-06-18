var config = require('../config');
var DB = require('./db');
var nullcb = function() {};

/*
 *
 * MONGO DATABASE
 *
 */
var Record = function() {
	return this.init();
};

Record.prototype.init = function() {
	this.db = new DB('RECORDS');
	return this;
};

Record.prototype.set = function(key, value) {
	var key = key.toLocaleLowerCase();

	value.answer.length > 0
		? value._expired = Date.now() + (value.answer[0].ttl * 1000)
		: value._expired = Date.now() + (3600 * 1000);

	this.db.collection('main').set({_id: key}, value, nullcb);
};

Record.prototype.get = function(key, callback) {
	this.db.collection('main').one({_id: key.toLocaleLowerCase()}, function(result) {
		// FILTER EXPIRED RECORD
		result && result._expired > Date.now()
			? callback(result)
			: callback(false);
	});
};

Record.prototype.remove = function(key) {
	this.db.collection('main').remove({_id: key.toLocaleLowerCase()}, nullcb);
};

module.exports = Record;