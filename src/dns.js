var ndp = require('native-dns-packet');
var config = require('../config');

var Dns = function(msg, rinfo, report) {
	this.answered = false;

	this.udp;
	this.client_req_msg;
	this.client_req_info;
	this.client_req_isp;
	this.client_req_packet;
	this.client_req_question;
	this.client_req_id;
	this.client_req_name;
	this.client_req_type;

	this.client_res_msg;
	this.client_res_info;
	this.client_res_packet;

	this.server_req_msg;
	this.server_res_packet;

	this.ns_servers = CONFIG.DNS_NS;
	this.root_dns_servers = CONFIG.DNS_ROOT;
	this.root_dns_answers = CONFIG.DNS_ROOT.length;

	this.rootService;
	this.record;
	this.report;
	this.isp;
	this.statistics;
	this.prefetch;

	this.init(msg, rinfo, report);
	return this;
};

Dns.prototype.type = function(type) {
	var map = {
		'A': 1,
		'NS': 2,
		'MD': 3,
		'MF': 4,
		'CNAME': 5,
		'SOA': 6,
		'MB': 7,
		'MG': 8,
		'MR': 9,
		'NULL': 10,
		'WKS': 11,
		'PTR': 12,
		'HINFO': 13,
		'MINFO': 14,
		'MX': 15,
		'TXT': 16,
		'RP': 17,
		'AFSDB': 18,
		'X25': 19,
		'ISDN': 20,
		'RT': 21,
		'NSAP': 22,
		'NSAP-PTR': 23,
		'SIG': 24,
		'KEY': 25,
		'PX': 26,
		'GPOS': 27,
		'AAAA': 28,
		'LOC': 29,
		'NXT': 30,
		'EID': 31,
		'NIMLOC': 32,
		'SRV': 33,
		'ATMA': 34,
		'NAPTR': 35,
		'KX': 36,
		'CERT': 37,
		'A6': 38,
		'DNAME': 39,
		'SINK': 40,
		'OPT': 41,
		'APL': 42,
		'DS': 43,
		'SSHFP': 44,
		'IPSECKEY': 45,
		'RRSIG': 46,
		'NSEC': 47,
		'DNSKEY': 48,
		'DHCID': 49,
		'NSEC3': 50,
		'NSEC3PARAM': 51,
		'HIP': 55,
		'NINFO': 56,
		'RKEY': 57,
		'TALINK': 58,
		'CDS': 59,
		'SPF': 99,
		'UINFO': 100,
		'UID': 101,
		'GID': 102,
		'UNSPEC': 103,
		'TKEY': 249,
		'TSIG': 250,
		'IXFR': 251,
		'AXFR': 252,
		'MAILB': 253,
		'MAILA': 254,
		'ANY': 255,
		'URI': 256,
		'CAA': 257,
		'TA': 32768,
		'DLV': 32769
	};

	if (typeof type === 'string') 
		return map[type];

	for (var num in map)
		if (map[num] == type) 
			return num;
};

Dns.prototype.init = function(msg, rinfo, report) {
	if (msg[11] !== 0) 
		msg[11] = 0;

	this.report = report;
	this.client_req_msg = msg;
	this.client_req_info = rinfo || false;
	this.parseClientMsg(msg);
	this.report.dns_req_count++;
};

Dns.prototype.sendToClient = function() {
	// CHECK RINFO
	if (!this.client_req_info || !this.client_req_info.port || !this.client_req_info.address) {
		this.report.dns_err_count++;
		this.report.log('error', 'Can not get client source info.', {
			req: this.client_req_packet,
			res: this.client_res_packet,
			client: this.client_req_info
		});
		return;
	}

	// CHECK RINFO VALIDITY
	if (this.client_req_info.port > 65535 || this.client_req_info.port < 1) {
		this.report.dns_err_count++;
		this.report.log('error', 'Client info have some error.', {
			client: this.client_req_info
		});
		return;
	}

	try {
		this.udp.send(this.client_res_msg, 0, this.client_res_msg.length, this.client_req_info.port, this.client_req_info.address);
		this.report.dns_res_count++;
		this.answered = true;
	} catch (error) {
		this.report.dns_err_count++;
		this.report.log('error', 'Catch an error when send package to client.', {
			req: this.client_req_packet,
			res: this.client_res_packet,
			client: this.client_req_info
		});
	}
};

Dns.prototype.sendToServer = function(callback) {
	this.report.dns_ask_count++;
	
	var self = this;
	var counter = this.root_dns_servers.length;
	var times = 0;

	var askRootServer = function() {
		var server = self.root_dns_servers[times];

		self.rootService.ask(self.server_req_msg, server, self.client_req_name, function(error, msg) {
			times++;

			if (self.answered)
				return;

			if (times == counter)
				return callback(false);

			if (error)
				return askRootServer();

			parseResult(msg);
		});
	};

	var parseResult = function(msg) {
		self.parseServerMsg(msg, function(result) {	
			if (!result)
				return askRootServer();

			if (result && result.answer && result.authority && !result.answer.length && !result.authority.length)
				return askRootServer();

			callback(result);
		});
	};

	askRootServer();
};

Dns.prototype.parseClientMsg = function(msg) {
	try {
		this.client_req_packet = ndp.parse(msg);
		this.client_req_question = this.client_req_packet.question[0];
		this.client_req_id = this.client_req_packet.header.id;
		this.client_req_name = this.client_req_question.name;
		this.client_req_type = this.client_req_question.type;
	} catch (error) {
		this.report.dns_ign_count++;
		return null;
	}
};

Dns.prototype.parseServerMsg = function(msg, callback) {
	if (this.answered) return callback(false);
	if (this.server_res_packet) return callback(false);

	try {
		this.root_dns_answers--;
		this.server_res_packet = ndp.parse(msg);
		this.server_res_packet.answer.length > 0
			? _ttl = this.server_res_packet.answer[0].ttl
			: _ttl = 60;
		this.prefetch.save(this.client_req_name + ':' + this.client_req_type, _ttl);

		return callback(this.server_res_packet);
	} catch (error) {
		if (this.root_dns_answers > 0) 
			return;

		this.server_res_packet = {};
		this.report.dns_err_count++;
		this.report.log('error', 'Catch an error when parse server package.', {
			req: this.client_req_packet,
			client: this.client_req_info
		});

		return callback(false);
	}
};

Dns.prototype.writeResMsg = function(answer_packet, callback) {
	var res = this.createPacket(this.client_req_id, 1);

	// HEADER
	res.header.aa = this.authority(answer_packet); // DEFAULT AUTHORITATIVE ANSWER
	res.header.ra = res.header.rd; // CHECK RECURSION DESIRED

	// ANSWER
	// FILTER RUBBISH DATA
	['answer', 'authority', 'additional'].forEach(function(item) {
		res[item] = answer_packet[item] || [];

		for (var i = res[item].length; i > 0; i--) {
			if (res[item][i - 1].type === 0)
				res[item].splice(i - 1, 1);
		}
	});

	// MISS, JUMP
	if (res.answer.length === 0 && CONFIG.DNS_MISS_ON) {
		this.report.dns_mis_count++;
		res.answer.push({
			'name': this.client_req_name,
			'type': 1,
			'ttl': 5,
			'address': CONFIG.DNS_MISS_IP,
			'class': 1
		});
	}

	this.client_res_packet = res;
	this.client_res_packet.question.push(this.client_req_question);
	this.client_res_msg = new Buffer(512);

	try {
		var written_length = ndp.write(this.client_res_msg, this.client_res_packet);
		this.client_res_msg = this.client_res_msg.slice(0, written_length);
		callback && callback();
	} catch (error) {
		this.report.dns_err_count++;
		this.report.log('error', 'Catch an error when write response message.', {
			req: this.client_req_packet,
			res: this.client_res_packet,
			client: this.client_req_info
		});
	}
};

Dns.prototype.checkIsp = function() {
	this.client_req_isp = this.isp.getLine(this.client_req_info.address) || 'other';
	return this;
};

Dns.prototype.saveRecord = function() {
	this.record.set(this.client_req_name + ':' + this.client_req_type, {
		answer: this.client_res_packet.answer,
		authority: this.client_res_packet.authority,
		additional: this.client_res_packet.additional,
		length: this.client_res_msg.length
	});
	this.report.dns_dbw_count++;
};

Dns.prototype.readRecord = function(callback) {
	var self = this;
	var counter = 2;
	var domain_key = this.client_req_name + ':' + this.client_req_type;
	var domain_any;
	var results = {
		length: 0
	};

	// WAIT TO FIX
	if (!this.client_req_name)
		return callback(false);

	// ANY WILCARD DOMAIN NAME
	this.client_req_name.split('.').length > 2
		? domain_any = '*.' + this.client_req_name.substr(this.client_req_name.indexOf('.') + 1) + ':' + this.client_req_type
		: domain_any = '*.' + domain_key;

	// NORMAL
	this.record.get(domain_key, function(result) {
		results.normal = result;
		results.length++;
		self.chooseFitRecord(results, callback);
	});

	// WILCARD
	this.record.get(domain_any, function(result) {
		results.wilcard = result;
		results.length++;
		self.chooseFitRecord(results, callback);
	});

	this.report.dns_dbr_count += 2;
};

Dns.prototype.chooseFitRecord = function(results, callback) {
	if (results.length < 2)
		return;

	// SET STATISTICS AND PREFETCH
	this.statistics.hit(this.client_req_name, this.client_req_isp, this.client_req_type);
	this.prefetch.update(this.client_req_name + ':' + this.client_req_type);

	var self = this;
	var insertAnswer = function(result) {
		var name = results.wilcard._id.split(':')[0];
		var str = JSON.stringify(result);
		var tmp;

		while (1) {
			str = str.replace(name, self.client_req_name);
			if (str === tmp) break;
			tmp = str;
		}

		return JSON.parse(str);
	};

	if (results.normal) {
		if (results.normal.telecom)
			return callback(results.normal.telecom);

		if (results.normal.unicom)
			return callback(results.normal.unicom);

		if (results.normal.general)
			return callback(results.normal.general);
	}

	if (results.wilcard) {
		if (results.wilcard.telecom)
			return callback(insertAnswer(results.wilcard.telecom));

		if (results.wilcard.unicom)
			return callback(insertAnswer(results.wilcard.unicom));

		if (results.wilcard.general)
			return callback(insertAnswer(results.wilcard.general));
	}

	this.server_req_msg = this.client_req_msg;
	this.sendToServer(callback);
	return;
};

Dns.prototype.createPacket = function(id, is_answer) {
	return {
		header: {
			id: id || 0,
			qr: is_answer || 0,
			opcode: 0,
			aa: 0,
			tc: 0,
			rd: 1,
			ra: 0,
			res1: 0,
			res2: 0,
			res3: 0,
			rcode: 0
		},
		question: [],
		answer: [],
		authority: [],
		additional: [],
		edns_options: [],
		payload: undefined
	};
};

Dns.prototype.authority = function(answer_packet) {
	if (answer_packet.authority && answer_packet.authority.length === 0) 
		return 0;

	var nss = this.ns_servers.join(',');

	for (var i in answer_packet.authority)
		if (nss.indexOf(answer_packet.authority[i].data) >= 0) 
			return 1;

	return 0;
};

Dns.prototype.validity = function(callback) {
	var reg = /^(([01]?[\d]{1,2})|(2[0-4][\d])|(25[0-5]))(\.(([01]?[\d]{1,2})|(2[0-4][\d])|(25[0-5]))){3}$/;

	if (!this.client_req_packet)
		return false;

	return !reg.test(this.client_req_name);
};

Dns.prototype.spoof = function() {
	var isp_ip = {
		'telecom': CONFIG.DNS_PROXY_IP.TELECOM,
		'unicom': CONFIG.DNS_PROXY_IP.UNICOM,
		'other': CONFIG.DNS_PROXY_IP.OTHER
	};

	var res = {
		answer: [{
			'name': this.client_req_name,
			'type': this.client_req_type,
			'ttl': 1, // 1 SEC
			'address': isp_ip[this.checkIsp().client_req_isp],
			'class': 1
		}]
	};

	this.writeResMsg(res);
	this.sendToClient();
};

Dns.prototype.process = function(callback) {
	var self = this;
	var normalRequest = function() {
		self.readRecord(function(result) {
			if (result) {
				self.writeResMsg(result, function() {
					if (self.server_res_packet)
						self.saveRecord();
				});
				self.sendToClient();
			} else {
				badRequest();
			}

			callback && callback(self);
		});
	};

	var badRequest = function() {
		self.server_res_packet = self.createPacket(self.client_req_id, 1);
		self.writeResMsg(self.server_res_packet);
		self.sendToClient();

		callback && callback(self);
		return;
	};

	this.checkIsp();
	this.validity()
		? normalRequest()
		: badRequest();
};

module.exports = Dns;