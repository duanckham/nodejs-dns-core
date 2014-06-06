var fs = require('fs');
var config = require('../config');
var Record = require('./record');

var Isp = function() {
	var self = this;

	// INIT ISP RANGE
	self.isp = {};
	['telecom', 'unicom'].forEach(function(i) {
		var _data = fs.readFileSync(__dirname + '/../isp/' + i + '.range');
		self.isp[i] = _data.toString().split('\n');
	});

	// INIT CACHE
	self.cache = new Record();
	
	return this;
};

Isp.prototype.type_map = {
	'A': 1,
	'NS': 2,
	'CNAME': 5,
	'MX': 15,
	'AAAA': 28
};

Isp.prototype.findIpRange = function(ip, dic) {
	var len = dic.length;
	var mid = ~~ (len / 2);

	if (dic.length > 1) return (ip < dic[mid].split('-')[0]) ? this.findIpRange(ip, dic.slice(0, mid)) : this.findIpRange(ip, dic.slice(mid));
	return dic[0];
};

Isp.prototype.parseIp = function(ip) {
	var d = ip.split('.');
	return ((((((+d[0]) * 256) + (+d[1])) * 256) + (+d[2])) * 256) + (+d[3]);
};

Isp.prototype.getLine = function(ip_address) {
	var self = this;
	var _isp = false;

	['telecom', 'unicom'].forEach(function(i) {
		var _range = self.findIpRange(self.parseIp(ip_address) + '', self.isp[i]);
		var _split = _range.split('-');

		if (self.parseIp(ip_address) > _split[0] && self.parseIp(ip_address) < _split[1]) _isp = i;
	});

	return _isp;
};

Isp.prototype.updateIspData = function(domain, value) {
	var _answer = {};

	for (var isp in value) {
		for (var part in value[isp]) {
			for (var item in value[isp][part]) {
				value[isp][part][item].type = self.type_map[value[isp][part][item].type];
				value[isp][part][item].class = 1;
			}
		}
	}

	this.cache.set(domain + ':setting:isp', value);
};

module.exports = Isp;