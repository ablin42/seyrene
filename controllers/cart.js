const express = require("express");
const sanitize = require("mongo-sanitize");
const router = express.Router();
const Cart = require("../models/Cart");
const Gallery = require("../models/Gallery");
const rateLimit = require("express-rate-limit");
const MongoStore = require("rate-limit-mongo");

const { setUser, setShop, setGallery, checkPwintyAttributes, pwintyGetPrice } = require("./helpers/middlewares");
const { ERROR_MESSAGE } = require("./helpers/errorMessages");
const utils = require("./helpers/utils");
require("dotenv/config");
const { fullLog, threatLog } = require("./helpers/log4");
const formatter = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

const limiter = rateLimit({
	store: new MongoStore({
		uri: process.env.DB_CONNECTION,
		collectionName: "cartRateLimit",
		expireTimeMs: 15 * 60 * 1000
	}),
	windowMs: 15 * 60 * 1000,
	max: 100,
	handler: function (req, res) {
		res.status(200).json({ error: true, message: "Too many requests, please try again later" });
	}
});

router.post("/add/:id", limiter, setUser, setShop, async (req, res) => {
	try {
		const product = req.product;
		let cart = new Cart(req.session.cart ? req.session.cart : {});
		let arr = cart.generateArray();

		for (let i = 0; i < arr.length; i++) {
			if (arr[i].attributes._id == product._id) throw new Error(ERROR_MESSAGE.addTwiceUnique);
		}

		cart.add(product, product.id);
		req.session.cart = cart;

		let formatted = JSON.parse(JSON.stringify(cart));
		formatted.totalPrice = formatter.format(cart.totalPrice).substr(2);
		formatted.items[product._id].price = formatter.format(cart.items[product._id].price).substr(2);

		fullLog.info(`Added to cart(unique): ${product._id}`);
		return res.status(200).json({ error: false, message: ERROR_MESSAGE.addedToCart, cart: formatted });
	} catch (err) {
		threatLog.error("ADD TO CART ERROR", err, req.headers, req.ipAddress);
		return res.status(400).json({ error: true, message: err.message });
	}
});

router.post("/del/:id", limiter, setUser, setShop, async (req, res) => {
	try {
		const product = req.product;
		let cart = new Cart(req.session.cart ? req.session.cart : {});

		cart.delete(product, product._id);
		req.session.cart = cart;

		let formatted = JSON.parse(JSON.stringify(cart));
		formatted.totalPrice = formatter.format(cart.totalPrice).substr(2);
		if (formatted.items[product._id])
			formatted.items[product._id].price = formatter.format(cart.items[product._id].price).substr(2);

		fullLog.info(`Deleted from cart(unique): ${product._id}`);
		return res.status(200).json({ error: false, message: ERROR_MESSAGE.removedFromCart, cart: formatted });
	} catch (err) {
		threatLog.error("DELETE FROM CART ERROR", err, req.headers, req.ipAddress);
		return res.status(400).json({ error: true, message: err.message });
	}
});

router.post("/add/pwinty/:id", limiter, setUser, setGallery, pwintyGetPrice, checkPwintyAttributes, async (req, res) => {
	try {
		const product = req.product;
		let cart = new Cart(req.session.cart ? req.session.cart : {});
		let data = {
			SKU: req.body.SKU,
			price: req.price,
			attributes: req.body.attributes
		};

		let item = await cart.pwintyAdd(product, data, req);
		req.session.cart = cart;

		let formatted = JSON.parse(JSON.stringify(cart));
		formatted.totalPrice = formatter.format(cart.totalPrice).substr(2);
		if (formatted.items[data.SKU]) formatted.items[data.SKU].price = formatter.format(cart.items[data.SKU].price).substr(2);

		fullLog.info(`Added to cart(pwinty): ${product._id}/${data.SKU}`);
		return res.status(200).json({ error: false, message: ERROR_MESSAGE.addedToCart, cart: formatted, item: item });
	} catch (err) {
		threatLog.error("ADD TO CART ERROR", err, req.headers, req.ipAddress);
		return res.status(400).json({ error: true, message: err.message });
	}
});

router.post("/update/pwinty/:id/:qty", limiter, setUser, setGallery, pwintyGetPrice, checkPwintyAttributes, async (req, res) => {
	try {
		const product = req.product;
		let newQty = parseInt(sanitize(req.params.qty));
		let cart = new Cart(req.session.cart ? req.session.cart : {});
		let data = {
			SKU: req.body.SKU,
			price: req.price,
			attributes: req.body.attributes
		};

		if (Number.isInteger(newQty) && newQty >= 0 && newQty <= 99) {
			let item = await cart.pwintyUpdate(data, newQty, req);
			req.session.cart = cart;

			let formatted = JSON.parse(JSON.stringify(cart));
			formatted.totalPrice = formatter.format(cart.totalPrice).substr(2);
			if (formatted.items[data.SKU]) formatted.items[data.SKU].price = formatter.format(cart.items[data.SKU].price).substr(2);

			let message = ERROR_MESSAGE.qtyUpdated;
			if (newQty == 0) message = ERROR_MESSAGE.removedFromCart;

			fullLog.info(`Updated cart(pwinty): ${product._id}/${data.SKU}`);
			return res.status(200).json({ error: false, message: message, cart: formatted, item: item });
		} else throw new Error(ERROR_MESSAGE.updateQty);
	} catch (err) {
		threatLog.error("UPDATE CART ERROR", err, req.headers, req.ipAddress);
		return res.status(400).json({ error: true, message: err.message });
	}
});

router.post("/del/pwinty/:id", limiter, setUser, setGallery, pwintyGetPrice, checkPwintyAttributes, async (req, res) => {
	try {
		const product = req.product;
		let cart = new Cart(req.session.cart ? req.session.cart : {});
		let data = {
			SKU: req.body.SKU,
			price: req.price,
			attributes: req.body.attributes
		};

		let item = await cart.pwintyDelete(data, req);
		req.session.cart = cart;

		let formatted = JSON.parse(JSON.stringify(cart));
		formatted.totalPrice = formatter.format(cart.totalPrice).substr(2);
		if (formatted.items[data.SKU]) formatted.items[data.SKU].price = formatter.format(formatted.items[data.SKU].price).substr(2);

		fullLog.info(`Deleted from cart(pwinty): ${product._id}/${data.SKU}`);
		return res.status(200).json({ error: false, message: ERROR_MESSAGE.removedFromCart, cart: formatted, item: item });
	} catch (err) {
		threatLog.error("DELETE FROM CART ERROR", err, req.headers, req.ipAddress);
		return res.status(400).json({ error: true, message: err.message });
	}
});

router.get("/clear/:id", limiter, setUser, async (req, res) => {
	try {
		let cart = new Cart({});
		const id = sanitize(req.params.id);
		cart.clearCart();
		req.session.cart = cart;

		req.flash("success", ERROR_MESSAGE.placedOrder);
		return res.status(200).redirect(`/Order/${id}`);
	} catch (err) {
		threatLog.error("CLEAR CART ERROR", err, req.headers, req.ipAddress);
		req.flash("warning", err.message);
		return res.status(400).redirect("/");
	}
});

module.exports = router;
