const mongoose = require("mongoose");

const cookieSchema = new mongoose.Schema(
	{
		ip: {
			type: String,
			required: true
		},
		accepted_cookies: {
			type: Boolean,
			required: true,
			default: true
		},
		date: {
			type: Date,
			default: Date.now
		}
	},
	{ timestamps: true }
);

module.exports = mongoose.model("CookieAccept", cookieSchema);
