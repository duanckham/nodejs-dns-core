var MongoClient = require('mongodb').MongoClient;
var config = require('../config');

var DB = function(db_name, callback) {
	callback
		? this.init(db_name, callback)
		: this.init(db_name);

	return this;
};

DB.prototype.init = function(db_name, callback) {
	var self = this;

	this.db = {};
	this.collections = {};

	MongoClient.connect(CONFIG.DNS_DB[db_name], function(err, db) {
		self.db = db;
		callback && callback(self);
	});

	return this;
};

DB.prototype.collection = function(collection_name) {
	try {
		var coll;
		this.collections[collection_name]
			? coll = this.collections[collection_name]
			: coll = this.collections[collection_name] = this.db.collection(collection_name);
	} catch (err) {
		return false;
	}

	return {
		coll: coll,
		set: function(data, newData, callback) {
			if (arguments.length === 2) {
				callback = newData;
				coll.insert(data, callback);
			} else {
				coll.update(data, newData, {upsert: true}, callback);
			}
		},
		get: function(data, callback) {
			coll.find(data).toArray(function(err, replies) {
				callback(replies);
			});
		},
		one: function(data, callback) {
			coll.find(data).toArray(function(err, replies) {
				callback(replies.length > 0 ? replies[0] : false);
			});
		},
		all: function(callback) {
			coll.find().toArray(function(err, replies) {
				callback(replies);
			});
		},
		inc: function(data, inc, callback) {
			coll.update(data, {$inc: inc}, {upsert: true}, callback);
		},
		remove: function(data, callback) {
			coll.remove(data, callback);
		}
	}
};

DB.prototype.uid = function() {
	var s4 = function() {
		return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
	};

	return s4() + s4() + s4() + s4() + s4();
};

module.exports = DB;