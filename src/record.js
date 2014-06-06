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
	this.db.collection('main').set({_id: key}, value, nullcb);
};

Record.prototype.get = function(key, callback) {
	this.db.collection('main').one({_id: key.toLocaleLowerCase()}, callback);
};

Record.prototype.remove = function(key) {
	this.db.collection('main').remove({_id: key.toLocaleLowerCase()}, nullcb);
};

module.exports = Record;