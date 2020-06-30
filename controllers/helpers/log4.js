const log4js = require("log4js");

log4js.configure({
	appenders: {
		completeLogs: {
			type: "file",
			filename: "./logs/log4js/fullreport.log",
			maxLogSize: 100000,
			backups: 5,
			compress: true,
			keepFileExt: true
		},
		threatLogs: {
			type: "file",
			filename: "./logs/log4js/threat.log",
			maxLogSize: 100000,
			backups: 5,
			compress: true,
			keepFileExt: true
		},
		console: { type: "console" }
	},
	categories: {
		complete: { appenders: ["completeLogs"], level: "trace" },
		threat: { appenders: ["threatLogs", "completeLogs"], level: "warn" },
		default: { appenders: ["console"], level: "trace" }
	}
});

const fullLog = log4js.getLogger("complete");
const threatLog = log4js.getLogger("threat");

module.exports = { fullLog, threatLog };
