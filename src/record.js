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
	var data = {
		custom: false,
		general: value	
	};

	// 60sec
	value.answer.length > 0
		? data.expired = Date.now() + (value.answer[0].ttl * 1000)
		: data.expired = Date.now() - 1000;

	this.db.collection('main').set({_id: key}, data, nullcb);
};

Record.prototype.get = function(key, callback) {
	var key = key.toLocaleLowerCase();

	this.db.collection('main').one({_id: key}, function(result) {
		if (result.custom)
			return callback(result);

		// FILTER EXPIRED RECORD
		result && result.general.answer.length && result.expired > Date.now()
			? callback(result)
			: callback(false);
	});
};

Record.prototype.remove = function(key) {
	this.db.collection('main').remove({_id: key.toLocaleLowerCase()}, nullcb);
};

module.exports = Record;