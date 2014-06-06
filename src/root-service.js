var Sockets = require('./sockets');

var RootService = function(){
	this.sockets = new Sockets();
	return this;
};

RootService.prototype.ask = function(question_buf, dns_server, question_name, callback) {
	var self = this;

	// ASK REMOTE SERVER
	self.sockets.get(function(client) {
		// IF TIMEOUT
		var _timeout = setTimeout(function() {
			self.sockets.back(client);
			callback('timeout', null);
		}, 1000);

		// IF GET REPLY MESSAGE FROM ROOT DNS SERVER
		client.on('message', function(msg) {
			callback(null, msg, question_buf, dns_server);
			self.sockets.back(client);
			clearTimeout(_timeout);
			return;
		});

		// ON ERROR
		client.on('error', function(error) {
			console.log('; proxy client error', error);
			self.sockets.back(client);
			clearTimeout(_timeout);
			return;
		});

		// SEND TO ROOT DOMAIN
		client.send(question_buf, 0, question_buf.length, 53, dns_server, function(error, sent) {
			if (error)
				console.log('; server:error');
		});
	});
};

module.exports = RootService;