var fs = require('fs');

var isp = {};

var parseIp = function(ip) {
	var d = ip.split('.');
	return ((((((+d[0]) * 256) + (+d[1])) * 256) + (+d[2])) * 256) + (+d[3]);
};

var loadRangeData = function() {
	['telecom', 'unicom'].forEach(function(i) {
		var _data = fs.readFileSync('../isp/' + i + '.range');
		isp[i] = _data.toString().split('\r\n');
	});
};

var findIpRange = function(ip, dic) {
	var len = dic.length;
	var mid = ~~ (len / 2);

	if (dic.length > 1) return (ip < dic[mid].split('-')[0]) ? findIpRange(ip, dic.slice(0, mid)) : findIpRange(ip, dic.slice(mid));
	return dic[0];
};

loadRangeData();

var _ip = parseIp('116.255.220.130');
var _time = process.hrtime();

console.log(_ip);

var _telecom = findIpRange(_ip + '', isp.telecom);
var _unicom = findIpRange(_ip + '', isp.unicom);

['telecom', 'unicom'].forEach(function(i) {
	var _range = findIpRange(_ip + '', isp[i]);
	var _split = _range.split('-');

	if (_ip > _split[0] && _ip < _split[1]) {
		console.log(i);
	}
});

console.log(process.hrtime(_time)[1] / 1000000000);