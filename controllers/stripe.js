const express = require("express");
const router = express.Router();
const stripe = require("stripe")("sk_test_52HhMBaVOLRzC2iN3zljiCcP00Zb6YvQ3W");
const rp = require("request-promise");

const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Gallery = require("../models/Gallery");
const Shop = require("../models/Shop");
const { setUser, authUser, setOrder, authGetOrder } = require("./helpers/verifySession");
const utils = require("./helpers/utils");
require("dotenv").config();

router.post("/create-intent", setUser, authUser, async (req, res) => {
	try {
		let err, item;
		let cart = new Cart(req.session.cart ? req.session.cart : {});
		let total = cart.price.totalIncludingTax; /////////////////////HERE
		let items = cart.generateArray();

		if (total > 0) {
			for (let i = 0; i < items.length; i++) {
				if (items[i].attributes.isUnique) {
					[err, item] = await utils.to(Shop.findById(items[i].attributes._id));
					if (err || item === null) throw new Error("An error occurred while looking for an item you tried to purchase");
				} else {
					[err, item] = await utils.to(Gallery.findById(items[i].attributes._id));
					if (err || item === null) throw new Error("An error occurred while looking for an item you tried to purchase");
				}
			}

			stripe.paymentIntents.create(
				{
					amount: Math.round(total * 100), ///////////////////////add delivery price here (and taxes)
					currency: "eur",
					description: "Charging for purchase @ maral"
				},
				async (err, paymentIntent) => {
					if (err) return res.status(200).send({ error: true, message: err.message });

					let options = {
						uri: `${process.env.BASEURL}/api/order/initialize`,
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							"Accept": "application/json",
							"cookie": req.headers.cookie
						},
						body: {
							items: items,
							price: total,
							deliveryPrice: cart.price.shippingIncludingTax,
							user: req.user,
							chargeId: paymentIntent.id
						},
						json: true
					};

					let result = await rp(options);
					if (typeof result === "string")
						return res
							.status(200)
							.send({ error: true, message: "Unauthorized. Contact your administrator if you think this is a mistake" });
					if (result.err) return res.status(200).send({ error: true, message: result.message });

					return res.status(200).send({ error: false, clientSecret: paymentIntent.client_secret, orderId: result._id });
				}
			);
		} else throw new Error("Your cart is empty!");
	} catch (err) {
		console.log("STRIPE CREATE INTENT ERROR:", err);
		return res.status(200).json({ error: true, message: err.message });
	}
});

router.post("/refund/:id", setUser, authUser, setOrder, authGetOrder, async (req, res) => {
	try {
		let chargeId = req.body.chargeId;

		let [err, order] = await utils.to(Order.findOne({ chargeId: chargeId }));
		if (err || order === null) throw new Error("We couldn't find your order, please try again");

		stripe.refunds.create({ payment_intent: chargeId }, (err, refund) => {
			if (err) return res.status(200).json({ error: true, message: err.raw.message });
			return res.status(200).json({ error: false, data: refund });
		});
	} catch (err) {
		console.log("STRIPE REFUND ERROR:", err);
		return res.status(200).json({ error: true, message: err.message });
	}
});

module.exports = router;
