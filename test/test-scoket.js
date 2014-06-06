var dgram = require('dgram');
var clients = [];

var test = function() {
	console.time('test-create');
	for (var i = 0; i < 1000000; i++) {
		var client = dgram.createSocket('udp4');
		var buf = new Buffer('hello');
		clients.push(client);
	}
	console.timeEnd('test-create');
};

test();

/*
SOCKET CREATE

1000       - 7ms
10000     - 35ms
100000   - 316ms
1000000 - 3660ms

300000/s
*/