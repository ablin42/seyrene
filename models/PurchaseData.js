const mongoose = require("mongoose");

const PurchaseSchema = mongoose.Schema(
	{
		_orderId: {
			type: String,
			required: true
		},
		_userId: {
			type: String,
			required: true
		},
		chargeId: {
			type: String,
			required: true
		},
		pwintyId: {
			type: String,
			required: false
		},
		shippingAddress: {
			type: Array,
			required: true
		},
		billingAddress: {
			type: Array,
			required: false
		},
		username: {
			type: String,
			require: true
		},
		email: {
			type: String,
			require: true
		},
		paymentInfo: {
			type: Array,
			required: true
		},
		date: {
			type: Date,
			default: Date.now
		}
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Purchase", PurchaseSchema);
