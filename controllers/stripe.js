const express = require("express");
const router = express.Router();
const stripe = require("stripe")("sk_test_52HhMBaVOLRzC2iN3zljiCcP00Zb6YvQ3W");
const rp = require("request-promise");

const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Gallery = require("../models/Gallery");
const Shop = require("../models/Shop");
const { setUser, authUser, setOrder, authGetOrder, checkBilling, authToken } = require("./helpers/middlewares");
const utils = require("./helpers/utils");
const { ERROR_MESSAGE } = require("./helpers/errorMessages");
const { fullLog, threatLog } = require("./helpers/log4");
require("dotenv").config();

router.post("/create-intent", setUser, authUser, checkBilling, async (req, res) => {
	try {
		let err, item;
		let cart = new Cart(req.session.cart ? req.session.cart : {});
		let total = cart.price.totalIncludingTax;
		let items = cart.generateArray();

		if (total > 0) {
			for (let i = 0; i < items.length; i++) {
				if (items[i].isUnique) {
					[err, item] = await utils.to(Shop.findById(items[i].attributes._id));
					if (err || !item) throw new Error(ERROR_MESSAGE.itemNotFound);
				} else {
					[err, item] = await utils.to(Gallery.findById(items[i].attributes._id));
					if (err || !item) throw new Error(ERROR_MESSAGE.itemNotFound);
				}
			}

			let paymentIntent = await stripe.paymentIntents.create({
				amount: Math.round(total * 100), //add delivery price here (and taxes)
				currency: "eur",
				description: "Charging for purchase @ maral"
			});
			if (err) return res.status(200).send({ error: true, message: err.message });

			let options = {
				uri: `${process.env.BASEURL}/api/order/initialize`,
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Accept": "application/json",
					"CSRF-Token": req.csrfToken(),
					"cookie": req.headers.cookie,
					"ACCESS_TOKEN": process.env.ACCESS_TOKEN
				},
				body: {
					items: items,
					price: total,
					deliveryPrice: cart.price.shippingIncludingTax,
					user: req.user,
					chargeId: paymentIntent.id,
					billing: req.session.billing
				},
				json: true
			};
			let result = await rp(options);
			if (result.error === true) throw new Error(result.message);

			fullLog.info(`Initialized order (stripe): Intent[${paymentIntent.id}], ${total}€`);
			return res.status(200).send({ error: false, clientSecret: paymentIntent.client_secret, orderId: result.order._id });
		} else throw new Error(ERROR_MESSAGE.emptyCart);
	} catch (err) {
		threatLog.error("STRIPE CREATE INTENT ERROR:", err, req.headers, req.ip);
		return res.status(200).json({ error: true, message: err.message });
	}
});

router.post("/refund/:id", authToken, setUser, authUser, setOrder, authGetOrder, async (req, res) => {
	try {
		let chargeId = req.body.chargeId;

		let [err, order] = await utils.to(Order.findOne({ chargeId: chargeId })); //might be extra
		if (err || !order) throw new Error(ERROR_MESSAGE.noResult);

		stripe.refunds.create({ payment_intent: chargeId }, (err, refund) => {
			if (err) return res.status(200).json({ error: true, message: err.raw.message });

			fullLog.info(`Refunded order (stripe): ChargeId[${chargeId}]`);
			return res.status(200).json({ error: false, data: refund });
		});
	} catch (err) {
		threatLog.error("STRIPE REFUND ERROR:", err, req.headers, req.ip);
		return res.status(200).json({ error: true, message: err.message });
	}
});

module.exports = router;
