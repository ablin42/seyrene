const express = require("express");
const router = express.Router();
const rp = require("request-promise");
const sanitize = require("mongo-sanitize");

const mailer = require("./helpers/mailer");
const { ROLE, setUser, authUser, authRole, setOrder, authGetOrder } = require("./helpers/verifySession");
const utils = require("./helpers/utils");
const Order = require("../models/Order");
const Money = require("money-exchange");
const { ERROR_MESSAGE } = require("./helpers/errorMessages");
const fx = new Money();
fx.init();
require("dotenv").config();

const formatter = new Intl.NumberFormat("de-DE", {
	style: "currency",
	currency: "EUR"
});

const API_URL = "https://sandbox.pwinty.com";
const MERCHANTID = "sandbox_1e827211-b264-4962-97c0-a8b74a6f5e98";
const APIKEY = "61cf3a92-0ede-4c83-b3d8-0bb0aee55ed8";

router.post("/orders/create", setUser, authUser, async (req, res) => {
	//might need delivery etc
	try {
		let options = {
			method: "POST",
			uri: `${API_URL}/v3.0/Orders`,
			headers: {
				"X-Pwinty-MerchantId": MERCHANTID,
				"X-Pwinty-REST-API-Key": APIKEY
			},
			body: req.body,
			json: true
		};

		let response = await rp(options).catch(function (err) {
			console.log(err, "XDD");
			throw new Error(err.response.body.statusTxt);
		});

		return res.status(200).json({ error: false, order: response.data });
	} catch (err) {
		console.log("PWINTY ORDER CREATE ERROR:", err);
		return res.status(200).json({ error: true, message: err.message });
	}
});

router.get("/orders/:id", setUser, authUser, async (req, res) => {
	try {
		let id = sanitize(req.params.id);
		let options = {
			method: "GET",
			uri: `${API_URL}/v3.0/Orders/${id}`,
			headers: {
				"X-Pwinty-MerchantId": MERCHANTID,
				"X-Pwinty-REST-API-Key": APIKEY
			},
			json: true
		};

		let response = await rp(options).catch(function (err) {
			throw new Error(err.error.message);
		});

		return res.status(200).json({ error: false, response: response.data });
	} catch (err) {
		console.log("PWINTY ORDER FETCH ERROR:", err);
		return res.status(200).json({ error: true, message: err.message });
	}
});

router.get("/orders/:id/status", setUser, authUser, async (req, res) => {
	try {
		let id = sanitize(req.params.id);
		let options = {
			method: "GET",
			uri: `${API_URL}/v3.0/Orders/${id}/SubmissionStatus`,
			headers: {
				"X-Pwinty-MerchantId": MERCHANTID,
				"X-Pwinty-REST-API-Key": APIKEY
			},
			json: true
		};

		let response = await rp(options).catch(function (err) {
			throw new Error(err.error.message);
		});

		return res.status(200).json({ error: false, response: response.data });
	} catch (err) {
		console.log("PWINTY ORDER STATUS ERROR:", err);
		return res.status(200).json({ error: true, message: err.message });
	}
});

router.post("/orders/:id/submit", setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		const id = sanitize(req.params.id);
		let options = {
			method: "POST",
			uri: `${API_URL}/v3.0/Orders/${id}/status`,
			headers: {
				"X-Pwinty-MerchantId": MERCHANTID,
				"X-Pwinty-REST-API-Key": APIKEY
			},
			body: { status: req.body.status },
			json: true
		};
		let response = await rp(options).catch(function (err) {
			throw new Error(err.error.message);
		});

		return res.status(200).json({ error: false, order: response });
	} catch (err) {
		console.log("PWINTY ORDER SUBMIT ERROR:", err);
		return res.status(200).json({ error: true, message: err.message });
	}
});
/* END ORDERS */

/* IMAGES */

router.post("/orders/:id/images/batch", setUser, authUser, async (req, res) => {
	try {
		let id = sanitize(req.params.id);
		let options = {
			method: "POST",
			uri: `${API_URL}/v3.0/orders/${id}/images/batch`,
			headers: {
				"X-Pwinty-MerchantId": MERCHANTID,
				"X-Pwinty-REST-API-Key": APIKEY
			},
			body: req.body,
			json: true
		};
		let response = await rp(options).catch(function (err) {
			throw new Error(err.error.message);
		});

		return res.status(200).json({ error: false, response: response });
	} catch (err) {
		console.log("PWINTY IMAGE BATCH ERROR:", err);
		return res.status(200).json({ error: true, message: err.message });
	}
});
/* END IMAGES */

/* COUNTRIES */
//not used but might server later to display country selection to be sure to have code or something
router.get("/countries", setUser, async (req, res) => {
	try {
		let options = {
			method: "GET",
			uri: `${API_URL}/v3.0/countries`,
			headers: {
				"X-Pwinty-MerchantId": MERCHANTID,
				"X-Pwinty-REST-API-Key": APIKEY
			},
			json: true
		};
		let response = await rp(options).catch(function (err) {
			throw new Error(err.response.body.statusTxt);
		});
		if (response.statusCode !== 200) throw new Error(response.statusTxt);

		return res.status(200).json({ error: false, response: response });
	} catch (err) {
		console.log("PWINTY COUNTRIES ERROR:", err);
		return res.status(200).json({ error: true, message: err.message });
	}
});
/* END COUNTRIES */

/* CATALOGUE */
router.post("/countries/:countryCode", setUser, async (req, res) => {
	try {
		let countryCode = sanitize(req.params.countryCode);
		let options = {
			method: "POST",
			uri: `${API_URL}/v3.0/catalogue/prodigi%20direct/destination/${countryCode}/prices`,
			headers: {
				"X-Pwinty-MerchantId": MERCHANTID,
				"X-Pwinty-REST-API-Key": APIKEY
			},
			body: {
				skus: req.body.skus
			},
			json: true
		};

		let response = await rp(options).catch(function (err) {
			throw new Error(ERROR_MESSAGE.serverError);
		});
		if (!response.prices) throw new Error(ERROR_MESSAGE.serverError);

		return res.status(200).json({ error: false, response });
	} catch (err) {
		console.log("PWINTY COUNTRYCODE ERROR:", err);
		return res.status(200).json({ error: true, message: err.message });
	}
});

router.post("/pricing/:countryCode", setUser, async (req, res) => {
	try {
		if (!req.body.items) throw new Error(ERROR_MESSAGE.incorrectInput);
		let countryCode = sanitize(req.params.countryCode);
		let items = [];

		req.body.items.forEach(item => {
			if (item && item.attributes && item.attributes.isUnique !== true) {
				let obj = {
					sku: item.elements[0].attributes.SKU,
					quantity: item.qty
				};
				items.push(obj);
			} else if (item && item.SKU) {
				let obj = {
					sku: item.SKU,
					quantity: item.quantity
				};
				items.push(obj);
			}
		});

		let options = {
			method: "POST",
			uri: `${API_URL}/v3.0/catalogue/prodigi%20direct/destination/${countryCode}/order/price`,
			headers: {
				"X-Pwinty-MerchantId": MERCHANTID,
				"X-Pwinty-REST-API-Key": APIKEY
			},
			body: { items: items },
			json: true
		};

		let response = await rp(options).catch(function (err) {
			throw new Error(ERROR_MESSAGE.serverError);
		});

		let formatted = [];
		response.shipmentOptions.forEach(shipmentOption => {
			if (shipmentOption.isAvailable && shipmentOption.shippingMethod === "Standard") {
				formatted = {
					isAvailable: shipmentOption.isAvailable,
					unitPriceIncludingTax: formatter
						.format(fx.convert(shipmentOption.shipments[0].items[0].unitPriceIncludingTax / 100, "GBP", "EUR"))
						.substr(2)
						.replace(",", ""),
					totalPriceIncludingTax: formatter
						.format(fx.convert(shipmentOption.totalPriceIncludingTax / 100, "GBP", "EUR"))
						.substr(2)
						.replace(",", ""),
					totalPriceExcludingTax: formatter
						.format(fx.convert(shipmentOption.totalPriceExcludingTax / 100, "GBP", "EUR"))
						.substr(2)
						.replace(",", ""),
					shippingMethod: shipmentOption.shippingMethod,
					shippingPriceIncludingTax: formatter
						.format(fx.convert(shipmentOption.shippingPriceIncludingTax / 100, "GBP", "EUR"))
						.substr(2)
						.replace(",", ""),
					shippingPriceExcludingTax: formatter
						.format(fx.convert(shipmentOption.shippingPriceExcludingTax / 100, "GBP", "EUR"))
						.substr(2)
						.replace(",", ""),
					shipments: shipmentOption.shipments
				};
			}
		});

		let error = false;
		if (formatted.length <= 0) error = true;
		return res.status(200).json({ error: error, response: formatted });
	} catch (err) {
		console.log("PWINTY PRICING ERROR:", err);
		return res.status(200).json({ error: true, message: err.message });
	}
});
/* END CATALOGUE */

router.post("/callback/status", async (req, res) => {
	try {
		console.log("api callback called");

		let err, order, user;
		if (req.body.orderId && req.body.status) {
			[err, order] = await utils.to(Order.findOne({ pwintyOrderId: req.body.orderId }));
			if (err || !order) throw new Error(ERROR_MESSAGE.noResult);

			[err, order] = await utils.to(
				Order.findOneAndUpdate({ pwintyOrderId: req.body.orderId }, { $set: { status: req.body.status } })
			);
			if (err || !order) throw new Error(ERROR_MESSAGE.updateError);

			let subject = `Updated Order #${order._id}`;
			let content = `Le status d'une commande vient d'être modifié par pwinty: <hr/><a href="${process.env.BASEURL}/Admin/Order/${order._id}">Voir la commande</a>`;
			if (await mailer("ablin@byom.de", subject, content)) throw new Error(ERROR_MESSAGE.sendMail);
			//maral.canvas@gmail.com

			[err, user] = await utils.to(Order.findOne({ _userId: order._userId }));
			if (err || !user) throw new Error(ERROR_MESSAGE.userNotFound);

			content = `Your order's status was updated, to see your order please follow the link below (make sure you're logged in): <hr/><a href="${process.env.BASEURL}/Order/${order._id}">CLICK HERE</a>`;
			if (await mailer(user.email, subject, content)) throw new Error(ERROR_MESSAGE.sendMail);

			return res.status(200).send({ error: false, message: "OK" });
		} else throw new Error(ERROR_MESSAGE.incorrectInput);
	} catch (err) {
		console.log("PWINTY CALLBACK ERROR:", err.message);
		return res.status(200).json({ error: true, message: err.message });
	}
});

module.exports = router;
