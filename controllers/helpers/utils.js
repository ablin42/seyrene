const User = require("../../models/User");
const pe = require("parse-error");

module.exports = {
	emailExist: async function emailExist(email) {
		if (await User.findOne({ email: email })) {
			return true;
		}
		return false;
	},
	nameExist: async function (name) {
		if (await User.findOne({ name: name })) return true;
		return false;
	},
	to: function (promise) {
		return promise
			.then(data => {
				return [null, data];
			})
			.catch(err => [pe(err)]);
	}
};
