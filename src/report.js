var config = require('../config');
var DB = require('./db');
var nullcb = function() {};

var Report = function() {
	this.db = new DB('REPORT');
	this.init();
	return this;
};

Report.prototype.init = function() {
	this.dns_req_count = 0;
	this.dns_res_count = 0;
	this.dns_ask_count = 0;
	this.dns_err_count = 0;
	this.dns_ign_count = 0;
	this.dns_dbr_count = 0;
	this.dns_dbw_count = 0;
	return this;
};

Report.prototype.view = function(secend) {
	var self = this;

	setInterval(function() {
		self.monitor();
		console.log(
			'REQ', self.fixlen(self.dns_req_count), 
			', RES', self.fixlen(self.dns_res_count),
			', ASK', self.fixlen(self.dns_ask_count),
			', IGN', self.fixlen(self.dns_ign_count),
			', DBR', self.fixlen(self.dns_dbr_count),
			', DBW', self.fixlen(self.dns_dbw_count),
			', ERR', self.fixlen(self.dns_err_count)
		);
		self.init();
	}, 1000);
};

Report.prototype.log = function(type, content, spot) {
	var uuid = this.db.uid();
	var data = {
		_id: uuid,
		type: type,
		content: content,
		spot: spot,
		read: 0,
		date: Date.now()
	};

	this.db.collection('main').set({_id: uuid}, data, nullcb);
};

Report.prototype.fixlen = function(str) {
	return '       '.substr(('' + str).length) + str;
};

Report.prototype.monitor = function() {
	// CAN NOT RESPONSE
	if (this.dns_req_count > (5 * this.dns_res_count))
		process.emit('WARNING_CANNOT_RESPONSE');
};

module.exports = Report;