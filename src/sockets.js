var dgram = require('dgram');
var config = require('../config');

var Sockets = function() {
	this.sockets_timeout = CONFIG.DNS_SOCKET_TIMEOUT;
	this.sockets_max_count = CONFIG.DNS_SOCKET_COUNT;
	this.sockets_use_count = 0;
	this.sockets_queue = [];
	this.tasks_queue = [];

	return this;
};

Sockets.prototype.create = function(callback) {
	var client = dgram.createSocket('udp4');
	this.sockets_use_count++;
	return callback(this.wraper(client));
};

Sockets.prototype.get = function(callback) {
	if ((this.sockets_queue.length + this.sockets_use_count) < this.sockets_max_count) {
		this.create(callback);
	} else {
		if (this.sockets_queue.length > 0) {
			this.sockets_use_count++;
			callback(this.wraper(this.sockets_queue.shift()));
		} else {
			this.tasks_queue.push(callback);
		}
	}
};

Sockets.prototype.wraper = function(client) {
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
	this.sockets_use_count--;

	if (this.tasks_queue.length > 0 && this.sockets_queue.length > 0) {
		this.sockets_use_count++;
		this.tasks_queue.shift()(this.wraper(this.sockets_queue.shift()));
	}
};

module.exports = Sockets;