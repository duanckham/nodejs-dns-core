// APPLICATION
var dnsCoreService = require('./src/dns-service');
var dnsPrefetchService = require('./src/prefetch-service');
var config = require('./config');
var fs = require('fs');

// // JUST RELOAD config.js, CAN NOT RESTART SERVER
// fs.watchFile(__dirname + '/config.js', function(curr, prev) {
// 	delete require.cache[__dirname + '/config.js'];
// });

// // GLOBAL ERROR CATCH
// process.on('uncaughtException', function(error) {
// 	if (typeof error === 'object') {
// 		if (error.message) {
// 			console.error(error.message);
// 		}
// 		if (error.stack) {
// 			console.error(error.stack);
// 		}
// 	} else {
// 		console.error('Error::argument is not an object!');
// 	}
// });

dnsCoreService.run(CONFIG.DNS_PORT, CONFIG.DNS_HOST);
dnsPrefetchService.run(CONFIG.DNS_PREFETCH_HEARTBEAT);