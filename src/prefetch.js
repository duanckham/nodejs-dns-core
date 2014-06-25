var DB = require('./db');
var config = require('../config');
var nullcb = function() {};

var Prefetch = function() {
	this.db_index = new DB('INDEX');
	this.db_expires = new DB('EXPIRES');

	return this;
};

Prefetch.prototype.expireTime = function(ttl) {
	return (((Date.now() / 1000 | 0) + ttl - 10) / 10 | 0) * 10;
};

Prefetch.prototype.save = function(domain, ttl) {
	var domain = domain.toLocaleLowerCase();
	var expire_time = this.expireTime(ttl); // EXPIRES_ADVANCE: 10secs, ADVANCE 10 ~ 20 SECS

	this.db_expires
		.collection('main')
		.set({
			_id: expire_time + '_' + domain
		}, {
			record: domain,
			expire: expire_time
		}, nullcb);

	this.db_index
		.collection('main')
		.set({
			_id: 'expires:' + domain + ':' + expire_time
		}, {
			record: domain,
			expire: expire_time
		}, nullcb);
};

Prefetch.prototype.update = function(domain) {
	var self = this;
	var domain = domain.toLocaleLowerCase();
	var counter = 0;
	var expId = new RegExp('^expires:' + domain + ':');

	this.db_index.collection('main').get({_id: expId}, function(results) {
		results.forEach(function(result) {
			counter++;
			if (parseInt(self.expireTime(10)) - parseInt(result.expire) > 3600)
				self.db_index.collection('main').remove(result._id, nullcb);
		});

		self.save(domain, 60);
	});
};

module.exports = Prefetch;