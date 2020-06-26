const User = require("../../models/User");
const pe = require("parse-error");

module.exports = {
	emailExist: async function emailExist(email) {
		if (await User.findOne({ email: email })) return true;

		return false;
	},
	nameExist: async function (name) {
		if (await User.findOne({ name: name.toLowerCase() })) return true;

		return false;
	},
	to: function (promise) {
		return promise
			.then(data => {
				return [null, data];
			})
			.catch(err => [pe(err)]);
	},
	sanitizeFile: async function (file, cb) {
		let fileExts = ["png", "jpg", "jpeg", "gif"];
		let isAllowedExt = fileExts.includes(file.originalname.split(".")[1].toLowerCase());
		let isAllowedMimeType = file.mimetype.startsWith("image/");

		if (isAllowedExt && isAllowedMimeType) return cb(null, true);
		else cb("File type not allowed");
	},
	toTitleCase: function (phrase) {
		let arr = phrase.toLowerCase().split(" ");
		let parsed = [];

		arr.forEach(item => {
			let obj = item.charAt(0).toUpperCase() + item.slice(1);
			if (item === "and") obj = "and";
			parsed.push(obj);
		});

		return parsed.join(" ");
	}
};
