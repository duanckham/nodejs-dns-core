var dgram = require('dgram');
var message = new Buffer('Some bytes');
var client = dgram.createSocket('udp4')
client.send(message, 0, message.length, , '127.0.0.1', function(err, bytes) {
	console.log(err, bytes);
	client.close();
});