const express = require("express");
const router = express.Router();
const rp = require("request-promise");
const sanitize = require("mongo-sanitize");

const mailer = require("./helpers/mailer");
const { ROLE, setUser, authUser, authRole, authToken } = require("./helpers/middlewares");
const pHelpers = require("./helpers/pwintyHelpers");
const utils = require("./helpers/utils");
const Order = require("../models/Order");
const { ERROR_MESSAGE } = require("./helpers/errorMessages");
const { fullLog, threatLog } = require("./helpers/log4");
require("dotenv").config();

const memjs = require("memjs");
let mc = memjs.Client.create(process.env.MEMCACHIER_SERVERS, {
	failover: true, // default: false
	timeout: 1, // default: 0.5 (seconds)
	keepAlive: true // default: false
});

router.post("/orders/create", authToken, setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		let options = {
			method: "POST",
			uri: `${process.env.PWINTY_API_URL}/v3.0/Orders`,
			headers: {
				"X-Pwinty-MerchantId": process.env.PWINTY_MERCHANTID,
				"X-Pwinty-REST-API-Key": process.env.PWINTY_APIKEY
			},
			body: req.body,
			json: true
		};

		let response = await rp(options).catch(function (err) {
			throw new Error(err.response.body.statusTxt);
		});

		fullLog.info(`Pwinty order created: user[${req.user._id}]/${response.data.id}`);
		return res.status(200).json({ error: false, order: response.data });
	} catch (err) {
		threatLog.error("PWINTY ORDER CREATE ERROR:", err, req.headers, req.ipAddress);
		return res.status(200).json({ error: true, message: err.message });
	}
});

router.get("/orders/:id", authToken, setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		let id = sanitize(req.params.id);
		let options = {
			method: "GET",
			uri: `${process.env.PWINTY_API_URL}/v3.0/Orders/${id}`,
			headers: {
				"X-Pwinty-MerchantId": process.env.PWINTY_MERCHANTID,
				"X-Pwinty-REST-API-Key": process.env.PWINTY_APIKEY
			},
			json: true
		};

		let response = await rp(options).catch(function (err) {
			throw new Error(err.error.message);
		});

		fullLog.info(`Pwinty order fetch: user[${req.user._id}]/${id}`);
		return res.status(200).json({ error: false, response: response.data });
	} catch (err) {
		threatLog.error("PWINTY ORDER FETCH ERROR:", err, req.headers, req.ipAddress);
		return res.status(200).json({ error: true, message: err.message });
	}
});

router.get("/orders/:id/status", authToken, setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		let id = sanitize(req.params.id);
		let options = {
			method: "GET",
			uri: `${process.env.PWINTY_API_URL}/v3.0/Orders/${id}/SubmissionStatus`,
			headers: {
				"X-Pwinty-MerchantId": process.env.PWINTY_MERCHANTID,
				"X-Pwinty-REST-API-Key": process.env.PWINTY_APIKEY
			},
			json: true
		};

		let response = await rp(options).catch(function (err) {
			throw new Error(err.error.message);
		});

		fullLog.info(`Pwinty check status: user[${req.user._id}]/${id}`);
		return res.status(200).json({ error: false, response: response.data });
	} catch (err) {
		threatLog.error("PWINTY ORDER STATUS ERROR:", err, req.headers, req.ipAddress);
		return res.status(200).json({ error: true, message: err.message });
	}
});

router.post("/orders/:id/submit", authToken, setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		const id = sanitize(req.params.id);
		let options = {
			method: "POST",
			uri: `${process.env.PWINTY_API_URL}/v3.0/Orders/${id}/status`,
			headers: {
				"X-Pwinty-MerchantId": process.env.PWINTY_MERCHANTID,
				"X-Pwinty-REST-API-Key": process.env.PWINTY_APIKEY
			},
			body: { status: req.body.status },
			json: true
		};
		let response = await rp(options).catch(function (err) {
			throw new Error(err.error.message);
		});

		fullLog.info(`Pwinty submit: user[${req.user._id}]/${id}/status[${req.body.status}]`);
		return res.status(200).json({ error: false, order: response });
	} catch (err) {
		threatLog.error("PWINTY ORDER SUBMIT ERROR:", err, req.headers, req.ipAddress);
		return res.status(200).json({ error: true, message: err.message });
	}
});
/* END ORDERS */

/* IMAGES */

router.post("/orders/:id/images/batch", authToken, setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		let id = sanitize(req.params.id);
		let options = {
			method: "POST",
			uri: `${process.env.PWINTY_API_URL}/v3.0/orders/${id}/images/batch`,
			headers: {
				"X-Pwinty-MerchantId": process.env.PWINTY_MERCHANTID,
				"X-Pwinty-REST-API-Key": process.env.PWINTY_APIKEY
			},
			body: req.body,
			json: true
		};
		let response = await rp(options).catch(function (err) {
			throw new Error(err.error.message);
		});

		fullLog.info(`Pwinty image batch: user[${req.user._id}]/${id}`);
		return res.status(200).json({ error: false, response: response });
	} catch (err) {
		threatLog.error("PWINTY IMAGE BATCH ERROR:", err, req.headers, req.ipAddress);
		return res.status(200).json({ error: true, message: err.message });
	}
});
/* END IMAGES */

/* COUNTRIES */
router.get("/countries", setUser, authToken, async (req, res) => {
	try {
		let options = {
			method: "GET",
			uri: `${process.env.PWINTY_API_URL}/v3.0/countries`,
			headers: {
				"X-Pwinty-MerchantId": process.env.PWINTY_MERCHANTID,
				"X-Pwinty-REST-API-Key": process.env.PWINTY_APIKEY
			},
			json: true
		};
		let response = await rp(options).catch(function (err) {
			console.log(err, "xx");

			throw new Error(err.response.body.statusTxt);
		});
		if (response.statusCode !== 200) throw new Error(response.statusTxt);

		return res.status(200).json({ error: false, response: response });
	} catch (err) {
		threatLog.error("PWINTY COUNTRIES ERROR:", err, req.headers, req.ipAddress);
		return res.status(200).json({ error: true, message: err.message });
	}
});
/* END COUNTRIES */

/* CATALOGUE */
//only used in pwinty_test
router.post("/countries/:countryCode", setUser, async (req, res) => {
	try {
		let countryCode = sanitize(req.params.countryCode);
		let options = {
			method: "POST",
			uri: `${process.env.PWINTY_API_URL}/v3.0/catalogue/prodigi%20direct/destination/${countryCode}/prices`,
			headers: {
				"X-Pwinty-MerchantId": process.env.PWINTY_MERCHANTID,
				"X-Pwinty-REST-API-Key": process.env.PWINTY_APIKEY
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
		threatLog.error("PWINTY COUNTRYCODE ERROR:", err, req.headers, req.ipAddress);
		return res.status(200).json({ error: true, message: err.message });
	}
});

router.post("/pricing/:countryCode", setUser, async (req, res) => {
	try {
		if (!req.body.items) throw new Error(ERROR_MESSAGE.incorrectInput);
		if (!req.params.countryCode) throw new Error(ERROR_MESSAGE.countryCode);
		let countryCode = sanitize(req.params.countryCode);

		let pricing_key = "pricing." + countryCode + "." + req.body.items;
		let result;
		mc.get(pricing_key, async function (err, val) {
			if (err == null && val != null) {
				// Found it!
				result = JSON.parse(val);
			} else {
				// not in cache (calculate and store)
				items = pHelpers.genPricingObj(req.body.items);
				let options = {
					method: "GET",
					uri: `${process.env.BASEURL}/api/pwinty/pricing/fetch/${countryCode}`,
					headers: {
						"X-Pwinty-MerchantId": process.env.PWINTY_MERCHANTID,
						"X-Pwinty-REST-API-Key": process.env.PWINTY_APIKEY,
						"ACCESS_TOKEN": process.env.ACCESS_TOKEN
					},
					body: { items: items },
					json: true
				};
				let response = await rp(options);
				if (response.error === true) throw new Error(response.message);

				result = { error: response.error, response: response.formatted };

				mc.set(pricing_key, JSON.stringify(result), { expires: 0 }, function (err, val) {
					/* handle error */
					console.log(err, val);
				});

				console.log("went through no cache");
			}

			console.log(result);
			return res.status(200).json({ error: result.error, response: result.response });
		});
	} catch (err) {
		threatLog.error("PWINTY PRICING ERROR:", err, req.headers, req.ipAddress);
		return res.status(200).json({ error: true, message: err.message });
	}
});

router.get("/pricing/fetch/:countryCode", authToken, async (req, res) => {
	try {
		if (!req.body.items) throw new Error(ERROR_MESSAGE.incorrectInput);
		if (!req.params.countryCode) throw new Error(ERROR_MESSAGE.countryCode);
		let countryCode = sanitize(req.params.countryCode);
		let options = {
			method: "POST",
			uri: `${process.env.PWINTY_API_URL}/v3.0/catalogue/prodigi%20direct/destination/${countryCode}/order/price`,
			headers: {
				"X-Pwinty-MerchantId": process.env.PWINTY_MERCHANTID,
				"X-Pwinty-REST-API-Key": process.env.PWINTY_APIKEY
			},
			body: { items: req.body.items },
			json: true
		};
		let response = await rp(options).catch(function (err) {
			throw new Error(ERROR_MESSAGE.serverError);
		});
		let formatted = pHelpers.treatShipment(response.shipmentOptions);

		let error = false;
		if (formatted.length <= 0) error = true;
		return res.status(200).json({ error: error, formatted: formatted });
	} catch (err) {
		threatLog.error("PWINTY PRICING ERROR:", err, req.headers, req.ipAddress);
		return res.status(200).json({ error: true, message: err.message });
	}
});

/* END CATALOGUE */

router.post("/callback/status", async (req, res) => {
	try {
		let err, order, user;

		if (req.body.orderId && req.body.eventData && req.body.eventId === "orderStatusChanged") {
			[err, order] = await utils.to(Order.findOne({ pwintyOrderId: req.body.orderId }));
			if (err || !order) throw new Error(ERROR_MESSAGE.noResult);

			[err, order] = await utils.to(
				Order.findOneAndUpdate({ pwintyOrderId: req.body.orderId }, { $set: { status: req.body.eventId } })
			);
			if (err || !order) throw new Error(ERROR_MESSAGE.updateError);

			let subject = `Updated Order (Pwinty) #${order._id}`;
			let content = "Le status d'une commande vient d'être modifié par pwinty, cliquez ici pour y accéder";
			if (await mailer(process.env.EMAIL, subject, content, `${process.env.BASEURL}/Admin/Order/${order._id}`))
				throw new Error(ERROR_MESSAGE.sendMail);

			[err, user] = await utils.to(Order.findOne({ _userId: order._userId }));
			if (err || !user) throw new Error(ERROR_MESSAGE.userNotFound);

			content = "Your order's status was updated, to see your order please click the button below (make sure you're logged in)";
			if (await mailer(user.email, subject, content, `${process.env.BASEURL}/Order/${order._id}`))
				throw new Error(ERROR_MESSAGE.sendMail);

			fullLog.info(`Pwinty status updated: ${req.body.orderId} - ${req.body.eventId}`);
			return res.status(200).send({ error: false, message: "OK" });
		} else throw new Error(ERROR_MESSAGE.incorrectInput);
	} catch (err) {
		threatLog.error("PWINTY CALLBACK ERROR:", err, req.headers, req.ipAddress);
		return res.status(200).json({ error: true, message: err.message });
	}
});

module.exports = router;
