const express = require("express");
const sanitize = require("mongo-sanitize");
const router = express.Router();
const Cart = require("../models/Cart");
const Gallery = require("../models/Gallery");
const Shop = require("../models/Shop");
const rp = require("request-promise");

const { setUser } = require("./helpers/verifySession");
const { ERROR_MESSAGE } = require("./helpers/errorMessages");
const utils = require("./helpers/utils");
require("dotenv/config");
const formatter = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

router.post("/add/:itemId", setUser, async (req, res) => {
	try {
		let productId = sanitize(req.params.itemId);
		let cart = new Cart(req.session.cart ? req.session.cart : {});
		let arr = cart.generateArray();

		let [err, product] = await utils.to(Shop.findById(productId));
		if (err) throw new Error(ERROR_MESSAGE.serverError);
		if (!product) throw new Error(ERROR_MESSAGE.noResult);

		for (let i = 0; i < arr.length; i++) {
			if (arr[i].attributes._id == product._id) throw new Error(ERROR_MESSAGE.addTwiceUnique);
		}

		cart.add(product, product.id);
		req.session.cart = cart;

		let formatted = JSON.parse(JSON.stringify(cart));
		formatted.totalPrice = formatter.format(cart.totalPrice).substr(2);
		formatted.items[product.id].price = formatter.format(cart.items[product.id].price).substr(2);

		return res.status(200).json({ error: false, message: ERROR_MESSAGE.addedToCart, cart: formatted });
	} catch (err) {
		console.log("ADD TO CART ERROR");
		return res.status(400).json({ error: true, message: err.message });
	}
});

router.post("/del/:itemId", setUser, async (req, res) => {
	try {
		let productId = sanitize(req.params.itemId);
		let cart = new Cart(req.session.cart ? req.session.cart : {});

		let [err, product] = await utils.to(Shop.findById(productId));
		if (err) throw new Error(ERROR_MESSAGE.serverError);
		if (!product) throw new Error(ERROR_MESSAGE.noResult);

		cart.delete(product, product.id);
		req.session.cart = cart;

		let formatted = JSON.parse(JSON.stringify(cart));
		formatted.totalPrice = formatter.format(cart.totalPrice).substr(2);
		if (formatted.items[productId]) formatted.items[product.id].price = formatter.format(cart.items[product.id].price).substr(2);

		return res.status(200).json({ error: false, message: ERROR_MESSAGE.removedFromCart, cart: formatted });
	} catch (err) {
		console.log("DELETE FROM CART ERROR");
		return res.status(400).json({ error: true, message: err.message });
	}
});

router.post("/add/pwinty/:itemId", setUser, async (req, res) => {
	try {
		let productId = sanitize(req.params.itemId);
		let cart = new Cart(req.session.cart ? req.session.cart : {});
		let data = {
			SKU: req.body.SKU,
			price: req.body.price,
			attributes: req.body.attributes
		};

		[err, product] = await utils.to(Gallery.findById(productId));
		if (err) throw new Error(ERROR_MESSAGE.serverError);
		if (!product) throw new Error(ERROR_MESSAGE.noResult);

		let item = await cart.pwintyAdd(product, data, req);
		req.session.cart = cart;

		let formatted = JSON.parse(JSON.stringify(cart));
		formatted.totalPrice = formatter.format(cart.totalPrice).substr(2);
		if (formatted.items[data.SKU]) formatted.items[data.SKU].price = formatter.format(cart.items[data.SKU].price).substr(2);

		return res.status(200).json({ error: false, message: ERROR_MESSAGE.addedToCart, cart: formatted, item: item });
	} catch (err) {
		console.log("ADD TO CART ERROR");
		return res.status(400).json({ error: true, message: err.message });
	}
});

router.post("/update/pwinty/:itemId/:qty", setUser, async (req, res) => {
	try {
		let productId = sanitize(req.params.itemId);
		let newQty = parseInt(sanitize(req.params.qty));
		let cart = new Cart(req.session.cart ? req.session.cart : {});
		let data = {
			SKU: req.body.SKU,
			price: req.body.price,
			attributes: req.body.attributes
		};

		if (Number.isInteger(newQty) && newQty >= 0 && newQty <= 99) {
			let [err, product] = await utils.to(Gallery.findById(productId));
			if (err) throw new Error(ERROR_MESSAGE.serverError);
			if (!product) throw new Error(ERROR_MESSAGE.noResult);

			let item = await cart.pwintyUpdate(data, newQty, req);
			req.session.cart = cart;

			let formatted = JSON.parse(JSON.stringify(cart));
			formatted.totalPrice = formatter.format(cart.totalPrice).substr(2);
			if (formatted.items[data.SKU]) formatted.items[data.SKU].price = formatter.format(cart.items[data.SKU].price).substr(2);

			let message = ERROR_MESSAGE.qtyUpdated;
			if (newQty == 0) message = ERROR_MESSAGE.removedFromCart;
			return res.status(200).json({ error: false, message: message, cart: formatted, item: item });
		} else throw new Error(ERROR_MESSAGE.updateQty);
	} catch (err) {
		console.log("UPDATE CART ERROR");
		return res.status(400).json({ error: true, message: err.message });
	}
});

router.post("/del/pwinty/:itemId", setUser, async (req, res) => {
	try {
		let productId = sanitize(req.params.itemId);
		let cart = new Cart(req.session.cart ? req.session.cart : {});
		let data = {
			SKU: req.body.SKU,
			price: req.body.price,
			attributes: req.body.attributes
		};

		let [err, product] = await utils.to(Gallery.findById(productId));
		if (err) throw new Error(ERROR_MESSAGE.serverError);
		if (!product) throw new Error(ERROR_MESSAGE.noResult);

		let item = await cart.pwintyDelete(data, req);
		req.session.cart = cart;

		let formatted = JSON.parse(JSON.stringify(cart));
		formatted.totalPrice = formatter.format(cart.totalPrice).substr(2);
		if (formatted.items[data.SKU]) formatted.items[data.SKU].price = formatter.format(formatted.items[data.SKU].price).substr(2);

		return res.status(200).json({ error: false, message: ERROR_MESSAGE.removedFromCart, cart: formatted, item: item });
	} catch (err) {
		console.log("DELETE FROM CART ERROR");
		return res.status(400).json({ error: true, message: err.message });
	}
});

router.get("/clear/:id", setUser, async (req, res) => {
	try {
		let cart = new Cart({});
		const id = sanitize(req.params.id);
		cart.clearCart();
		req.session.cart = cart;

		req.flash("success", ERROR_MESSAGE.placedOrder);
		return res.status(200).redirect(`/Order/${id}`);
	} catch (err) {
		console.log("CLEAR CART ERROR");
		req.flash("warning", err.message);
		return res.status(400).redirect("/");
	}
});

module.exports = router;
