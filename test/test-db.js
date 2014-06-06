var qoncrete = require('qoncrete');

var Cache = function(callback) {
	this.qdb = new qoncrete('dns_expires', {
		host: '127.0.0.1',
		port: '6990',
		safe: true
	}, function(error) {
		callback(error);
	});
	return this;
}

Cache.prototype.set = function(key, value) {
	this.qdb.put(key, JSON.stringify(value));
	return;
};

Cache.prototype.get = function(key, callback) {
	this.qdb.get(key, function(key, value, error) {
		if (!error && value != 'undefined') {
			value = JSON.parse(value);
			callback(error, value);
		} else {
			callback(error, false);
		}
	});
};

/*
Cache= new qdb();

d1 12330
d2 12300
d3 12330

Date.now

Math.round((Date.now()/1000|0)/100);
(Date.now()/100000|0)*100

           sec
1111111111 22
1111111111 00

save
1111111111 00

setInterval(find 111111111100, 300000);
	delete
	ask localdns(make it update);
*/


var cache = new Cache(function(error) {
	if (error) {
		console.log(error);
	}

	// setInterval(function(){
	// 	cache.qdb.find({}, function(key, value){
	// 		if (key != 'undefined' && value){
	// 			console.log(key, value);
	// 		}
	// 	});
	// }, 3000);

	// setInterval(function(){
	// 	console.log('insert')
	// 	var _expire_time = (Date.now() / 100000 | 0) * 100 + 200;
	// 	cache.set(_expire_time + '_www.' + Date.now() + '.com', 'www.baidu.com', function(){
	// 		console.log('add', _expire_time);
	// 	});
	// }, 10000);

	cache.set('www.baidu.com:1', 'a');
	cache.set('www.baidu.com:1', 'b');
	cache.set('1122334466_aabbdd', 'c');

	cache.qdb.find({
		prefix: '1122334466'
	}, function(key, value, error) {
		if (error) return console.log(error);

		console.log(key, value);
	});
});