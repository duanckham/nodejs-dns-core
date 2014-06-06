var DB = require('./db');
var config = require('../config');
var nullcb = function() {};

var Statistics = function() {
	this.db_statistics = new DB('STATISTICS');
	return this;
};

Statistics.prototype.hit = function(domain, isp, type, callback) {
	var domain = domain.toLocaleLowerCase();
	var date = new Date(),
		_y = date.getFullYear() + '',
		_m = date.getMonth() + 1 + '',
		_d = date.getDate() + '',
		_h = date.getHours() + '';

	//
	_m = _m[1] ? _m : '0' + _m;
	_d = _d[1] ? _d : '0' + _d;
	_h = _h[1] ? _h : '0' + _h;

	_month = _y + _m;
	_day = _month + _d;
	_hour = _day + _h;

	// MONTH, DAY, HOUR	
	this.db_statistics.collection('main').inc({_id: domain + ':' + isp + ':' + type + ':' + _month}, {count: 1}, nullcb);
	this.db_statistics.collection('main').inc({_id: domain + ':' + isp + ':' + type + ':' + _day}, {count: 1}, nullcb);
	this.db_statistics.collection('main').inc({_id: domain + ':' + isp + ':' + type + ':' + _hour}, {count: 1}, nullcb);
	
	// TOTAL
	this.db_statistics.collection('main').inc({_id: 'total:' + _month}, {count: 1}, nullcb);
	this.db_statistics.collection('main').inc({_id: 'total:' + _day}, {count: 1}, nullcb);
	this.db_statistics.collection('main').inc({_id: 'total:' + _hour}, {count: 1}, nullcb);

	callback && callback();
};

module.exports = Statistics;