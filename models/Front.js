const mongoose = require("mongoose");

const FrontSchema = mongoose.Schema(
	{
		null: {
			type: Boolean,
			default: false
		},
		referenceId: {
			type: Number,
			required: true
		},
		key: {
			type: String,
			required: true
		},
		path: {
			type: String,
			required: true
		},
		mimetype: {
			type: String,
			required: true
		},
		date: {
			type: Date,
			default: Date.now
		}
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Front", FrontSchema);
