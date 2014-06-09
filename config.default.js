global.CONFIG = {
	DNS_PORT: 53,
	DNS_SOCKETS_COUNT: 1000,

	// PROXY
	DNS_PROXY_ON: false,
	DNS_PROXY_IP: {
		TELECOM: '116.255.220.140',
		UNICOM: '116.255.220.140',
		OTHER: '116.255.220.140'
	},

	DNS_MISS: '127.0.0.1',
	DNS_PREFETCH_HEARTBEAT: 5000,

	// DB
	DNS_DB: {
		INDEX: 'mongodb://127.0.0.1:27017/dns-index',
		RECORDS: 'mongodb://127.0.0.1:27017/dns-records',
		STATISTICS: 'mongodb://127.0.0.1:27017/dns-statistics',
		PROXY: 'mongodb://127.0.0.1:27017/dns-proxy',
		EXPIRES: 'mongodb://127.0.0.1:27017/dns-expires',
		REPORT: 'mongodb://127.0.0.1:27017/dns-report'
	},

	// NS
	DNS_NS: [
		'ns1.dnspro.cn',
		'ns2.dnspro.cn',
		'ns1.adpro.cn',
		'ns2.adpro.cn'
	],

	// ROOT DNS LIST
	DNS_ROOT: [
		'223.5.5.5',
		'223.6.6.6'
	]
};