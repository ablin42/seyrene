const mongoose = require("mongoose");

const ImageSchema = mongoose.Schema(
	{
		_itemId: {
			type: String,
			required: true
		},
		itemType: {
			type: String,
			required: true
		},
		isMain: {
			type: Boolean,
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

module.exports = mongoose.model("Image", ImageSchema);
