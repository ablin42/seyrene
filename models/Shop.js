const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const ShopSchema = mongoose.Schema(
	{
		isUnique: {
			type: Boolean,
			default: false
		},
		pwintyData: {
			type: Array,
			required: false
		},
		soldOut: {
			type: Boolean,
			default: false
		},
		title: {
			type: String,
			required: true
		},
		content: {
			type: String,
			required: true
		},
		price: {
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

ShopSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("Shop", ShopSchema);
