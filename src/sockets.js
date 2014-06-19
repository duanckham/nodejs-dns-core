var dgram = require('dgram');
var config = require('../config');

var Sockets = function() {
	this.sockets_timeout = CONFIG.DNS_SOCKET_TIMEOUT;
	this.sockets_max = CONFIG.DNS_SOCKET_COUNT;
	this.sockets_used = 0;
	this.sockets_queue = [];
	this.tasks_queue = [];

	return this;
};

Sockets.prototype.create = function(callback) {
	var client = dgram.createSocket('udp4');
	this.sockets_used++;
	return callback(this.wrapper(client));
};

Sockets.prototype.get = function(callback) {
	if ((this.sockets_queue.length + this.sockets_used) < this.sockets_max) {
		this.create(callback);
	} else {
		if (this.sockets_queue.length > 0) {
			this.sockets_used++;
			callback(this.wrapper(this.sockets_queue.shift()));
		} else {
			this.tasks_queue.push(callback);
		}
	}
};

Sockets.prototype.wrapper = function(client) {
	var self = this;
	var timeout = setTimeout(function() {
		client.emit('timeout');
		self.back(client);
	}, this.sockets_timeout);

	client.on('message', function() {
		clearTimeout(timeout);
		self.back(client);
	});

	client.on('error', function() {
		clearTimeout(timeout);
		self.back(client);
	});

	return client;
};

Sockets.prototype.back = function(client) {
	// REMOVE ALL EVENTS LISTENERS
	client.removeAllListeners();

	// SAVE SOCKET TO QUEUE
	this.sockets_queue.push(client);
	this.sockets_used--;

	if (this.tasks_queue.length > 0 && this.sockets_queue.length > 0) {
		this.sockets_used++;
		this.tasks_queue.shift()(this.wrapper(this.sockets_queue.shift()));
	}
};

module.exports = Sockets;