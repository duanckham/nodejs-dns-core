var Tasks = function() {
	this.tasks = {};
	return this;
}

Tasks.prototype.list = function() {
	return this.tasks;
};

Tasks.prototype.get = function(key) {
	var key = key.toLocaleLowerCase();
	return this.tasks[key];
};

Tasks.prototype.set = function(key, value) {

	console.log('set', key);

	var key = key.toLocaleLowerCase();
	this.tasks[key] = [];
	return this.put(key, value);
};

Tasks.prototype.put = function(key, value) {

	console.log('put', key);

	var key = key.toLocaleLowerCase();
	return this.tasks[key].push(value);
},

Tasks.prototype.remove = function(key) {

	console.log('remove', key);

	var key = key.toLocaleLowerCase();
	delete this.tasks[key];
};

module.exports = Tasks;