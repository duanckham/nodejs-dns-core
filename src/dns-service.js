var os = require('os');
var dgram = require('dgram');
var cluster = require('cluster');
var ndp = require('native-dns-packet');

var Record = require('./record');
var Statistics = require('./statistics');
var Prefetch = require('./prefetch');
var Tasks = require('./tasks');
var Isp = require('./isp');
var RootService = require('./root-service');
var Report = require('./report');
var Dns = require('./dns');
var Proxy = require('./proxy');

var tasks = new Tasks();
var proxy = new Proxy();

var createTask = function(dns) {
	var question_key = dns.client_req_name + ':' + dns.client_req_type;

	if (tasks.get(question_key)) {
		tasks.put(question_key, dns);
		return false;
	} else {
		tasks.set(question_key, dns);
		return true;
	}
};

var runTask = function(dns) {
	var question_key = dns.client_req_name + ':' + dns.client_req_type;
	var tasks_arr = tasks.get(question_key);

	// FIRST ONE ALREADY COMPLETE
	if (!tasks_arr)
		return;

	tasks_arr.shift();
	tasks_arr.forEach(function(dns) {
		dns.process();
	});
	tasks.remove(question_key);
};

var readProxy = function(hostname, callback) {
	var counter = 3;
	var _result = false;

	proxy.get('auto:' + hostname, function(error, result) {
		counter--;
		if (!error && result) _result = true;
		if (counter === 0) callback(null, _result);
	});

	proxy.get('pass:' + hostname, function(error, result) {
		counter--;
		if (!error && result) _result = true;
		if (counter === 0) callback(null, _result);
	});

	proxy.get('pass:*.' + hostname.substr(hostname.indexOf('.') + 1), function(error, result) {
		counter--;
		if (!error && result) _result = true;
		if (counter === 0) callback(null, _result);
	});
};

// RUN THE DNS SERVER
var runService = function(port, host) {
	var rootService = new RootService();
	var record = new Record();
	var report = new Report();
	var isp = new Isp();
	var statistics = new Statistics();
	var prefetch = new Prefetch();
	var server = dgram.createSocket('udp4');

	server.on('message', function(msg, rinfo) {
		var dns = new Dns(msg, rinfo, report);

		// console.log('rinfo', rinfo);

		dns.rootService = rootService;
		dns.record = record;
		dns.isp = isp;
		dns.udp = server;
		dns.statistics = statistics;
		dns.prefetch = prefetch;

		// PROXY
		if (CONFIG.DNS_PROXY_ON) {
			return readProxy(dns.client_req_name, function(error, result) {
				if (!error && result) {
					if (!createTask(dns)) 
						return;
					
					dns.process(function(dns) {
						runTask(dns);
					});
				} else {
					dns.spoof();
				}
			});
		}

		// DNS
		if (createTask(dns)) {
			return dns.process(function(dns) {
				runTask(dns);
			});
		}
	});

	server.on('error', function(error) {
		process.exit(1);
	});

	server.bind(port, host);
	report.view();

	console.log('; dns core service running. host:', CONFIG.DNS_HOST, 'port:', CONFIG.DNS_PORT);
};

exports.run = runService;