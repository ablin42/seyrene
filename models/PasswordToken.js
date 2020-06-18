const mongoose = require("mongoose");

const passwordSchema = new mongoose.Schema(
	{
		_userId: {
			type: String,
			required: true,
			ref: "User"
		},
		token: {
			type: String,
			required: true
		},
		createdAt: {
			type: Date,
			required: true,
			default: Date.now,
			expires: 43200
		}
	},
	{ timestamps: true }
);

module.exports = mongoose.model("PasswordToken", passwordSchema);
