var ndp = require('native-dns-packet');
var shell = require('child_process');
var config = require('../config');
var Record = require('./record');
var RootService = require('./root-service');
var DB = require('./db');

var rootService = new RootService();
var record = new Record();
var nullcb = function() {};

var updateRecord = function(domain) {
	var req = {
		header: {
			id: 0,
			qr: 0,
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
		question: [{
			name: domain.split(':')[0],
			type: domain.split(':')[1] || 1,
			class: 1
		}],
		answer: [],
		authority: [],
		additional: [],
		edns_options: [],
		payload: undefined
	};

	try {
		var question_buf = new Buffer(512);
		var written_length = ndp.write(question_buf, req);
	} catch (error) {
		console.log('ERROR REQ PACKET', req);
		return;
	}

	var written_length = ndp.write(question_buf, req);
	question_buf = question_buf.slice(0, written_length);

	// REASK
	CONFIG.DNS_ROOT.forEach(function(dns_server) {
		rootService.ask(question_buf, dns_server, domain, callbackOfRootDnsRes);
	});
};

var callbackOfRootDnsRes = function(error, answer_buf, question_buf, dns_server) {
	try {
		var answer = ndp.parse(answer_buf);
	} catch (error) {
		// RETURN QUESTION AS THE ANSWER
		// var answer = ndp.parse(question_buf);

		return;
	}

	// IF ANSWER EMPTY
	if (answer.answer.length == 0) return;
	if (answer.question.length == 0) return;

	// REPLY ALL CLIENTS
	var question = answer.question[0] || question,
		question_key = question.name + ':' + question.type;

	// REPLACE OLD RECORD
	record.set(question_key, {
		answer: answer.answer,
		authority: answer.authority,
		additional: answer.additional,
		length: answer_buf.length
	});
};

var loopFilter = function(expires_db, loop_interval) {
	var records_count = 0;

	// LOOP TO CHECK WHETHER HAVE DOMAIN ALREADY EXPIRED
	setInterval(function() {
		// console.log('; prefetch domains count', records_count);

		// EXPIRED DOMAIN COUNTER
		records_count = 0;
		// 5s - 10s
		var expExpire = new RegExp('^' + (Date.now() / 10000 | 0) * 10);

		// console.log(', expExpire', expExpire);
		
		expires_db.collection('main').get({_id: expExpire}, function(results) {
			// console.log(', results', results);

			// {
			// 	_id: '1400231750_www.ibm.com:1',
			// 	record: 'www.ibm.com:1',
			// 	expire: 1400231750
			// }

			results.forEach(function(result) {	
				var domain = result.record.substr(result.record.indexOf('.') + 1);

				// IF USE OUR NS
				if (domain.split('.').length > 2) {
					record.get(domain + ':setting:isp', function(result) {
						if (!result)
							updateRecord(domain);
					});
				}

				// COUNTER
				records_count++;

				// DELETE THIS RECORD FROM EXPIRED DB
				record.remove(domain);
				expires_db.collection('main').remove(result._id, nullcb);
			});
		});
	}, loop_interval);
};

var runService = function(loop_interval) {
	console.log('; dns prefetch service running.');

	var expires_db = new DB('EXPIRES', function() {
		loopFilter(expires_db, loop_interval);
	});
};

exports.run = runService;