// APPLICATION
var dnsCoreService = require('./src/dns-service');
var dnsPrefetchService = require('./src/prefetch-service');
var config = require('./config');
var fs = require('fs');

// GLOBAL ERROR CATCH
process.on('uncaughtException', function(error) {
	if (typeof error === 'object') {
		if (error.message)
			console.error(error.message);

		if (error.stack)
			console.error(error.stack);
	} else {
		console.error('Error::argument is not an object!');
	}
});

dnsCoreService.run(CONFIG.DNS_PORT);
dnsPrefetchService.run(CONFIG.DNS_PREFETCH_HEARTBEAT);