const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");
const Gallery = require("../models/Gallery");
const Shop = require("../models/Shop");

const { setUser } = require("./helpers/verifySession");
const { ERROR_MESSAGE } = require("./helpers/errorMessages");
require("dotenv/config");
const formatter = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

router.get("/add/:itemId", setUser, async (req, res) => {
	try {
		let productId = req.params.itemId;
		let cart = new Cart(req.session.cart ? req.session.cart : {});

		Shop.findById(productId, (err, product) => {
			if (err) return res.status(400).json({ error: true, message: ERROR_MESSAGE.serverError });
			if (product.isUnique === true) {
				let arr = cart.generateArray();
				for (let i = 0; i < arr.length; i++) {
					if (arr[i].attributes._id == product._id) {
						//elements: [{attributes : attributes}]
						return res.status(200).json({ error: true, message: ERROR_MESSAGE.addTwiceUnique });
					}
				}
			}

			cart.add(product, product.id);
			req.session.cart = cart;
			let cartCpy = JSON.parse(JSON.stringify(cart));
			cartCpy.totalPrice = formatter.format(cart.totalPrice).substr(2);
			cartCpy.items[product.id].price = formatter.format(cart.items[product.id].price).substr(2);

			return res.status(200).json({ error: false, message: ERROR_MESSAGE.addedToCart, cart: cartCpy });
		});
	} catch (err) {
		console.log("ADD TO CART ERROR");
		return res.status(400).json({ error: true, message: err.message });
	}
});

router.get("/del/:itemId", setUser, async (req, res) => {
	try {
		let productId = req.params.itemId;
		let cart = new Cart(req.session.cart ? req.session.cart : {});

		Shop.findById(productId, (err, product) => {
			if (err) return res.status(400).json({ error: true, message: ERROR_MESSAGE.serverError });
			cart.delete(product, product.id);
			req.session.cart = cart;
			let cartCpy = JSON.parse(JSON.stringify(cart));
			cartCpy.totalPrice = formatter.format(cart.totalPrice).substr(2);
			if (cartCpy.items[productId]) cartCpy.items[product.id].price = formatter.format(cart.items[product.id].price).substr(2);

			return res.status(200).json({ error: false, message: ERROR_MESSAGE.removedFromCart, cart: cartCpy });
		});
	} catch (err) {
		console.log("DELETE FROM CART ERROR");
		return res.status(400).json({ error: true, message: err.message });
	}
});

router.post("/add/pwinty/:itemId", setUser, async (req, res) => {
	try {
		let productId = req.params.itemId;
		let cart = new Cart(req.session.cart ? req.session.cart : {});
		let data = {
			SKU: req.body.SKU,
			price: req.body.price,
			attributes: req.body.attributes
		};

		Gallery.findById(productId, async (err, product) => {
			try {
				if (err) return res.status(400).json({ error: true, message: ERROR_MESSAGE.serverError });

				let item = await cart.pwintyAdd(product, data);
				req.session.cart = cart;

				let cartCpy = JSON.parse(JSON.stringify(cart));
				cartCpy.totalPrice = formatter.format(cart.totalPrice).substr(2);
				if (cartCpy.items[data.SKU]) cartCpy.items[data.SKU].price = formatter.format(cart.items[data.SKU].price).substr(2);

				return res.status(200).json({ error: false, message: ERROR_MESSAGE.addedToCart, cart: cartCpy, item: item });
			} catch (err) {
				return res.status(400).json({ error: true, message: err.message });
			}
		});
	} catch (err) {
		console.log("ADD TO CART ERROR");
		return res.status(400).json({ error: true, message: err.message });
	}
});

router.post("/update/pwinty/:itemId/:qty", setUser, async (req, res) => {
	try {
		let productId = req.params.itemId;
		let newQty = parseInt(req.params.qty); //sanitize
		let cart = new Cart(req.session.cart ? req.session.cart : {});
		let data = {
			SKU: req.body.SKU,
			price: req.body.price,
			attributes: req.body.attributes
		};

		if (Number.isInteger(newQty) && newQty >= 0 && newQty <= 99) {
			Gallery.findById(productId, async (err, product) => {
				try {
					if (err || !product) return res.status(400).json({ error: true, message: ERROR_MESSAGE.serverError });

					let item = await cart.pwintyUpdate(data, newQty);
					item.price = formatter.format(item.price).substr(2);
					req.session.cart = cart;
					let cartCpy = JSON.parse(JSON.stringify(cart));
					cartCpy.totalPrice = formatter.format(cart.totalPrice).substr(2);
					if (cartCpy.items[productId])
						cartCpy.items[product.id].price = formatter.format(cart.items[product.id].price).substr(2);

					let message = ERROR_MESSAGE.qtyUpdated;
					if (newQty == 0) message = ERROR_MESSAGE.removedFromCart;
					return res.status(200).json({ error: false, message: message, cart: cartCpy, item: item });
				} catch (err) {
					return res.status(400).json({ error: true, message: err.message });
				}
			});
		} else throw new Error(ERROR_MESSAGE.updateQty);
	} catch (err) {
		console.log("UPDATE CART ERROR");
		return res.status(400).json({ error: true, message: err.message });
	}
});

router.post("/del/pwinty/:itemId", setUser, async (req, res) => {
	try {
		let productId = req.params.itemId;
		let cart = new Cart(req.session.cart ? req.session.cart : {});
		let data = {
			SKU: req.body.SKU,
			price: req.body.price,
			attributes: req.body.attributes
		};

		Gallery.findById(productId, async err => {
			try {
				if (err) return res.status(400).json({ error: true, message: ERROR_MESSAGE.serverError });

				let item = await cart.pwintyDelete(data);
				req.session.cart = cart;
				let cartCpy = JSON.parse(JSON.stringify(cart));
				cartCpy.totalPrice = formatter.format(cart.totalPrice).substr(2);
				if (cartCpy.items[data.SKU]) cartCpy.items[data.SKU].price = formatter.format(cartCpy.items[data.SKU].price).substr(2);

				return res.status(200).json({ error: false, message: ERROR_MESSAGE.removedFromCart, cart: cartCpy, item: item });
			} catch (err) {
				console.log(err);
				return res.status(400).json({ error: true, message: err.message });
			}
		});
	} catch (err) {
		console.log("DELETE FROM CART ERROR");
		return res.status(400).json({ error: true, message: err.message });
	}
});

router.get("/clear/:id", setUser, async (req, res) => {
	try {
		let cart = new Cart({});
		cart.clearCart();
		req.session.cart = cart;
		req.flash("success", ERROR_MESSAGE.placedOrder);

		return res.status(200).redirect(`/Order/${req.params.id}`);
	} catch (err) {
		console.log("CLEAR CART ERROR");
		req.flash("warning", err.message);
		return res.status(400).redirect("/");
	}
});

/*
router.get('/totalprice', setUser, async (req, res) => {
try {
    let total = 0;   

    if (req.session.cart) 
        total = req.session.cart.totalPrice; ///////////////WTF IS THIS

    console.log(total, req.session.cart.totalPrice)

    //maybe add delivery fees and taxes etc
    return res.status(400).json({"err": false, "total": total})
} catch (err) {
    console.log("TOTAL PRICE CART ERROR");
    return res.status(400).json({err: true, message: err.message})
}})*/

module.exports = router;
