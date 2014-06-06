var http = require('http');

var test = function() {	
	console.log(process.argv);

	var api = process.argv[2],
		data = process.argv[3] || '{}';

	var req = http.request({
		hostname: '127.0.0.1',
		port: 10000,
		path: '/api/' + api,
		method: 'POST'
	}, function(res) {
  		res.on('data', function (chunk) {
			console.log('BODY:', chunk.toString());
  		});
	});

	req.write(data + '\n');
	req.end();
};

test();