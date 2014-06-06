var qoncrete = require('/nodejs/qoncrete/client.js');
var config = require('../config');


var updateNsRecordIndex = function() {
	var db_index = new qoncrete(config.INDEX_DB, {
		host: config.INDEX_HOST,
		port: config.INDEX_PORT,
		safe: false
	}, function(error) {});

	// console.log(config);

	var exists = {
		"x2.adpro.cn:1": {},
		"m.adpro.cn:1": {},
		"ad.x2.adpro.cn:1": {},
		"dns.x2.adpro.cn:1": {},
		"mn.x2.adpro.cn:1": {},
		"qdb.x2.adpro.cn:1": {},
		"ds.x2.adpro.cn:1": {},
		"www.yunpro.cn:1": {},
		"yunpro.cn:1": {},
		"*.yunpro.cn:1": {},
		"media2.adpro.cn:1": {}
	}

	for (var i in exists) {
		var _key = i + ':setting:isp';
		// console.log(_key);
		db_index.put(config.RECORDS_DB + ':ns:' + _key, _key);
		db_index.get(config.RECORDS_DB + ':ns:' + _key, function(k, y, e) {
			console.log(k, y, e);
		});
	}
};

updateNsRecordIndex();