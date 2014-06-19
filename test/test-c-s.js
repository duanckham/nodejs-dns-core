var domains = require('./domains').domains;
var createClients = function(count) {
	var clients = [],
		client;

	for (var i = count; i > 0; i--) {
		client = require('child_process');
		clients.push(client);
	}

	return clients;
};

var test_a = function(server, clients_count, request_count) {
	var clients = createClients(clients_count);
	var num = (Math.random() * domains.length) | 0;

	var _total = 0;
	var _error = 0;

	console.time('test');

	for (var i = 0; i < clients_count; i++) {
		for (var j = 0; j < request_count; j++) {
			clients[i].exec('dig @' + server + ' ' + domains[num], function(error) {
				if (error) _error++;
				_total++;

				if (_total == clients_count * request_count) {
					console.timeEnd('test');
					console.log('total', _total);
					console.log('error', _error);
				}

				return;
			});
		}
	}
};

var test_b = function(server, secs, limit) {
	var count = 0;
	var total = 0;

	setInterval(function() {
		console.log('speed', total/secs, 'req/s');
		total = 0;
	}, secs * 1000);

	setInterval(function(){
		if (count < limit) {
			total++;
			count++;

			require('child_process').exec('dig @' + server + ' ' + 'www.baidu.com', function(error) {
				count--;
			});
		}
	}, 1);
};

var test_c = function(server, secs, limit) {
	var count = 0;
	var total = 0;

	setInterval(function() {
		console.log('speed', total/secs, 'req/s');
		total = 0;
	}, secs * 1000);

	setInterval(function(){
		if (count < limit) {
			total++;
			count++;

			require('child_process').exec('curl -l ' + server, function(error) {
				count--;
			});
		}
	}, 1);
};

// console.time('test');
test_a('127.0.0.1', 4, 50);
test_b('127.0.0.1', 5, 200);
// test_c('127.0.0.1:1337', 5, 500);


/*
ALL TESTS ARE WRONG.
PLEASE TEST DNS WITH QUERYPERF

AND THE RESULT OF NOW(20130814):
Queries per second:   5113.896441 qps
Sockets set 1000 and 2000 (result same)

IF USER CLUSTER:
Queries per second:   7470.649420 qps
Sockets set 1000

IF NOT USE QDB:
Queries per second:   7290.913841 qps
*/