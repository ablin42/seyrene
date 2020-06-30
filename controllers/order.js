const express = require("express");
const router = express.Router();
const { validationResult } = require("express-validator");
const sanitize = require("mongo-sanitize");
const { vDelivery } = require("./validators/vUser");
const rp = require("request-promise");
const country = require("country-list-js");

const Order = require("../models/Order");
const Purchase = require("../models/PurchaseData");
const User = require("../models/User");
const Shop = require("../models/Shop");
const DeliveryInfo = require("../models/DeliveryInfo");
const { ROLE, setUser, authUser, authRole, setOrder, authGetOrder, checkAddress, authToken } = require("./helpers/verifySession");
const utils = require("./helpers/utils");
const mailer = require("./helpers/mailer");
const { ERROR_MESSAGE } = require("./helpers/errorMessages");
const format = require("date-format");
const formatter = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });
require("dotenv").config();

router.get("/", setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		const options = {
			page: parseInt(req.query.page, 10) || 1,
			limit: 20,
			sort: { date: -1 }
		};

		let query = {};
		if (req.query.tab && req.query.tab === "approval") query.status = "awaitingApproval";

		let [err, result] = await utils.to(Order.paginate(query, options));
		if (err || result === null) throw new Error(ERROR_MESSAGE.fetchError);

		let orders = [];
		result.docs.forEach(order => {
			let orderObj = {
				_id: order._id,
				status: order.status,
				price: formatter.format(order.price).substr(2),
				date_f: format.asString("dd/MM/yyyy", new Date(order.date)),
				lastname: order.lastname,
				firstname: order.firstname
			};
			orders.push(orderObj);
		});

		return res.status(200).json({ error: false, orders: orders });
	} catch (err) {
		console.log("FETCHING ORDERS ERROR:", err);
		return res.status(200).json({ error: true, message: err.message });
	}
});

router.get("/:id", setUser, authUser, setOrder, authGetOrder, async (req, res) => {
	try {
		let id = sanitize(req.params.id);

		let [err, result] = await utils.to(Order.findById(id));
		if (err) throw new Error(ERROR_MESSAGE.fetchError);
		if (result === null) throw new Error(ERROR_MESSAGE.noResult);

		result.price = formatter.format(result.price).substr(2);
		result.items.forEach((item, index) => {
			result.items[parseInt(index)].price = formatter.format(item.price).substr(2);
			result.items[parseInt(index)].attributes.content = item.attributes.content.substr(0, 128);
			result.items[parseInt(index)].attributes.title = item.attributes.title.substr(0, 64);
		});

		return res.status(200).json(result);
	} catch (err) {
		console.log("FETCHING ORDER ERROR:", err);
		return res.status(200).json({ error: true, message: err.message });
	}
});

function getNeededAttributes(attributes) {
	let obj = {};

	switch (attributes.category) {
	case "CAN":
		{
			if (attributes.subcategory === "ROL" && typeof attributes.glaze === "string") obj.glaze = attributes.glaze;
			else obj.wrap = attributes.wrap;
		}
		break;
	case "FRA":
		{
			obj.frameColour = attributes.frameColour;
			if (
				attributes.subcategory === "BOX" ||
					attributes.subcategory === "CLA" ||
					attributes.subcategory === "GLO" ||
					attributes.subcategory === "SWO"
			) {
				if (attributes.mountColour && attributes.mountType !== "NM") obj.mountColour = attributes.mountColour;
			}
		}
		break;
	}

	return obj;
}

async function createPwintyOrder(order, req) {
	let countryCode = country.findByName(utils.toTitleCase(order.country));
	if (countryCode) countryCode = countryCode.code.iso2;
	else throw new Error(ERROR_MESSAGE.countryCode);

	let options = {
		method: "POST",
		uri: `${process.env.BASEURL}/api/pwinty/orders/create`,
		body: {
			merchantOrderId: order._id, ///not good
			recipientName: order.firstname + " " + order.lastname,
			address1: order.full_address, //has city + country, might need to use only full_street
			addressTownOrCity: order.city,
			stateOrCounty: order.state,
			postalOrZipCode: order.zipcode,
			countryCode: countryCode,
			preferredShippingMethod: "standard"
		},
		headers: {
			"ACCESS_TOKEN": process.env.ACCESS_TOKEN,
			"CSRF-Token": req.csrfToken(),
			"cookie": req.headers.cookie
		},
		json: true
	};
	let response = await rp(options);
	if (response.error === true) throw new Error(response.message);

	let pwintyOrderId = response.order.id;
	let body = [];

	order.items.forEach(item => {
		if (item.attributes.isUnique !== true) {
			item.elements.forEach(product => {
				let obj = {
					sku: product.attributes.SKU,
					url: `${process.env.BASEURL}/api/image/main/Shop/${item.attributes._id}`,
					sizing: "crop", // idk yet // resize for canvas
					copies: product.qty,
					attributes: ""
				};

				obj.attributes = getNeededAttributes(product.attributes);
				body.push(obj);
			});
		}
	});

	options.body = body;
	options.uri = `${process.env.BASEURL}/api/pwinty/orders/${pwintyOrderId}/images/batch`;
	response = await rp(options);
	if (response.error === true) throw new Error(response.message);

	options.uri = `${process.env.BASEURL}/api/pwinty/orders/${pwintyOrderId}/status`;
	options.method = "GET";
	response = await rp(options);
	if (response.error === true) throw new Error(response.message);
	if (response.response.isValid === false) throw new Error(response.response.generalErrors[0]);

	options.uri = `${process.env.BASEURL}/api/pwinty/orders/${pwintyOrderId}/submit`;
	options.method = "POST";
	options.body = { status: "Submitted" };
	response = await rp(options);
	if (response.error === true) throw new Error(response.message);

	let [err, orderResponse] = await utils.to(
		Order.findOneAndUpdate({ _id: order._id }, { $set: { pwintyOrderId: pwintyOrderId } })
	);
	if (err || !orderResponse) throw new Error(ERROR_MESSAGE.submitOrder);

	[err, orderResponse] = await utils.to(
		Purchase.findOneAndUpdate({ _orderId: order._id }, { $set: { pwintyId: pwintyOrderId } })
	);
	if (err || !orderResponse) throw new Error(ERROR_MESSAGE.saveError);

	await submitOrder(order, req);
	return;
}

async function submitOrder(order, req) {
	let err, response, user;

	[err, response] = await utils.to(
		Order.findOneAndUpdate({ _id: order._id, status: "awaitingApproval" }, { $set: { status: "Submitted" } })
	);
	if (err || !response) throw new Error(ERROR_MESSAGE.submitOrder);

	// Send mails
	let subject = `New Order #${order._id}`;
	let content = `To see the order, please follow the link below using your administrator account: <hr/><a href="${process.env.BASEURL}/Admin/Order/${order._id}">CLICK HERE</a>`;
	//maral.canvas@gmail.com
	if (await mailer("ablin@byom.de", subject, content)) throw new Error(ERROR_MESSAGE.sendMail);

	[err, user] = await utils.to(User.findById(order._userId));
	if (err || !user) throw new Error(ERROR_MESSAGE.userNotFound);
	content = `To see your order, please follow the link below (make sure you're logged in): <hr/><a href="${process.env.BASEURL}/Order/${order._id}">CLICK HERE</a>`;
	if (await mailer(user.email, subject, content)) throw new Error(ERROR_MESSAGE.sendMail);

	console.log("order saved to db", order._id);
	return { err: false, orderId: order._id };
}

router.post("/confirm", async (req, res) => {
	try {
		if (req.body.type === "payment_intent.succeeded" && req.body.data.object.id) {
			let err, delivery, user, response;
			[err, order] = await utils.to(
				Order.findOneAndUpdate(
					{ chargeId: req.body.data.object.id, status: "awaitingStripePayment" },
					{ $set: { status: "awaitingApproval" } }
				)
			);
			if (err || !order) throw new Error(ERROR_MESSAGE.fetchError);

			[err, delivery] = await utils.to(DeliveryInfo.findOne({ _userId: order._userId }));
			if (err || !delivery) throw new Error(ERROR_MESSAGE.deliveryAddressNotFound);

			[err, user] = await utils.to(User.findOne({ _id: order._userId }));
			if (err || !user) throw new Error(ERROR_MESSAGE.userNotFound);

			const purchaseData = new Purchase({
				_orderId: order._id,
				_userId: order._userId,
				chargeId: order.chargeId,
				pwintyId: "notYetProcessed",
				shippingAddress: delivery,
				billingAddress: order.billing,
				username: user.name,
				email: user.email,
				paymentInfo: req.body
			});

			[err, response] = await utils.to(purchaseData.save());
			if (err) throw new Error(ERROR_MESSAGE.saveError);
		}

		return res.status(200).send("OK");
	} catch (err) {
		console.log("CONFIRMING ORDER ERROR:", err);
		return res.status(200).json({ error: true, message: err.message });
	}
});

router.post("/initialize", authToken, setUser, authUser, async (req, res) => {
	try {
		let err, infos, response, deletedOrder;

		[err, infos] = await utils.to(DeliveryInfo.findOne({ _userId: req.user._id }));
		if (err || !infos) throw new Error(ERROR_MESSAGE.deliveryAddressNotFound);

		[err, deletedOrder] = await utils.to(Order.findOneAndDelete({ _userId: req.user._id, status: "awaitingStripePayment" }));
		if (err) throw new Error(ERROR_MESSAGE.serverError);

		const order = new Order({
			_userId: req.user._id,
			chargeId: req.body.chargeId,
			items: req.body.items,
			price: req.body.price,
			deliveryPrice: req.body.deliveryPrice,
			billing: req.body.billing,
			status: "awaitingStripePayment",
			firstname: infos.firstname,
			lastname: infos.lastname,
			full_address: infos.full_address,
			full_street: infos.full_street,
			country: infos.country,
			street_name: infos.street_name,
			street_number: infos.street_number,
			city: infos.city,
			state: infos.state,
			zipcode: infos.zipcode,
			instructions: infos.instructions
		});

		[err, response] = await utils.to(order.save());
		if (err || !response) throw new Error(ERROR_MESSAGE.saveError);

		return res.status(200).json({ error: false, order: response });
	} catch (err) {
		console.log("INITIALIZING ORDER ERROR:", err);
		return res.status(200).json({ error: true, message: err.message });
	}
});

router.post("/complete/:id", setUser, authUser, authRole(ROLE.ADMIN), setOrder, authGetOrder, async (req, res) => {
	try {
		const order = req.order;

		if (order.status !== "Submitted")
			throw new Error("La commande doit être approvée et traitée avant d'être marquée comme complétée");

		let [err, result] = await utils.to(Order.findByIdAndUpdate(order._id, { $set: { status: "Completed" } }));
		if (err || !result) throw new Error(ERROR_MESSAGE.saveError);

		let subject = `Commande complétée #${order._id}`;
		let content = `Vous avez marquée une commande comme étant complétée <hr/><a href="${process.env.BASEURL}/Admin/Order/${order._id}">Lien vers le commande</a>`;
		//maral.canvas@gmail.com
		if (await mailer("ablin@byom.de", subject, content)) throw new Error(ERROR_MESSAGE.sendMail);

		return res.status(200).json({ error: false, message: "La commande à été marquée comme complétée" });
	} catch (err) {
		console.log("COMPLETE ORDER ERROR:", err);
		return res.status(200).json({ error: true, message: err.message });
	}
});

router.post("/approve/:id", setUser, authUser, authRole(ROLE.ADMIN), setOrder, authGetOrder, async (req, res) => {
	try {
		const order = req.order;

		if (order.status !== "awaitingApproval") throw new Error("Seule une commande en attente d'approbation peut être approuvée");

		let isPwinty = false;
		for (let index = 0; index < order.items.length; index++)
			if (!order.items[parseInt(index)].attributes.isUnique) isPwinty = true;

		if (isPwinty === false) await submitOrder(order, req);
		else await createPwintyOrder(order, req);

		return res.status(200).json({ error: false, message: "La commande à été approuvée et mise en production" });
	} catch (err) {
		console.log("APPROVING ORDER ERROR:", err);
		return res.status(200).json({ error: true, message: err.message });
	}
});

async function refundStripe(req, chargeId, orderId) {
	let options = {
		uri: `${process.env.BASEURL}/api/stripe/refund/${orderId}`,
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Accept": "application/json",
			"CSRF-Token": req.csrfToken(),
			"cookie": req.headers.cookie,
			"AUTH_TOKEN": process.env.ACCESS_TOKEN
		},
		body: { chargeId: chargeId },
		json: true
	};
	let result = await rp(options);

	return result;
}

router.post("/cancel/:id", setUser, authUser, setOrder, authGetOrder, async (req, res) => {
	try {
		let err,
			order = req.order,
			item,
			user = req.user;

		if (order.status === "Cancelled" || order.status === "Completed" || order.status === "awaitingStripePayment")
			throw new Error(ERROR_MESSAGE.badOrderStatus);

		let isPwinty = false;
		for (let index = 0; index < order.items.length; index++) {
			[err, item] = await utils.to(
				Shop.findOneAndUpdate({ _id: order.items[parseInt(index)].attributes._id }, { $set: { soldOut: false } })
			);
			if (err) throw new Error(ERROR_MESSAGE.serverError);
			if (!order.items[parseInt(index)].attributes.isUnique) isPwinty = true;
		}

		if (isPwinty === false || order.status === "awaitingApproval") {
			let refund = await refundStripe(req, order.chargeId, order._id);
			if (refund.error === true) throw new Error(refund.message);
		} else {
			let options = {
				method: "GET",
				uri: `${process.env.BASEURL}/api/pwinty/orders/${order.pwintyOrderId}`,
				body: {},
				json: true,
				headers: {
					ACCESS_TOKEN: process.env.ACCESS_TOKEN
				}
			};

			let response = await rp(options);
			if (response.error === true) throw new Error(ERROR_MESSAGE.fetchStatus);
			if (response.response.canCancel !== true) throw new Error(ERROR_MESSAGE.badOrderStatus);

			options.method = "POST";
			options.uri = `${process.env.BASEURL}/api/pwinty/orders/${order.pwintyOrderId}/submit`;
			options.body = { status: "Cancelled" };

			response = await rp(options);
			if (response.error === true) throw new Error(ERROR_MESSAGE.cancelOrder);

			let refund = await refundStripe(req, order.chargeId, order._id);
			if (refund.error === true) throw new Error(refund.message);
		}

		[err, order] = await utils.to(Order.findByIdAndUpdate({ _id: order._id }, { $set: { status: "Cancelled" } }));
		if (err || !order) throw new Error(ERROR_MESSAGE.fetchError);

		// Send mails
		let subject = `Cancelled Order #${order._id}`;
		let content = `To see the cancelled order, please follow the link below using your administrator account: <hr/><a href="${process.env.BASEURL}/Admin/Order/${order._id}">CLICK HERE</a>`;
		//maral.canvas@gmail.com
		if (await mailer("ablin@byom.de", subject, content)) throw new Error(ERROR_MESSAGE.sendMail);

		content = `You cancelled your order, to see the cancelled order, please follow the link below (make sure you're logged in): <hr/><a href="${process.env.BASEURL}/Order/${order._id}">CLICK HERE</a>`;
		if (await mailer(user.email, subject, content)) throw new Error(ERROR_MESSAGE.sendMail);

		console.log("cancelled order");
		return res.status(200).json({ error: false, message: ERROR_MESSAGE.cancelOrderSuccess });
	} catch (err) {
		console.log("CANCEL ORDER ERROR:", err);
		return res.status(200).json({ error: true, message: err.message });
	}
});

router.post("/billing/save", vDelivery, setUser, authUser, checkAddress, async (req, res) => {
	try {
		const vResult = validationResult(req.body.billing);
		if (!vResult.isEmpty()) {
			vResult.errors.forEach(item => {
				req.flash("info", item.msg);
			});
			throw new Error(ERROR_MESSAGE.incorrectInput);
		}

		req.session.billing = req.address;
		req.flash("success", ERROR_MESSAGE.savedBilling);
		return res.status(200).json({ error: false });
	} catch (err) {
		console.log("SAVE BILLING ERROR:", err);
		return res.status(200).json({ error: true, message: err.message });
	}
});

/*
router.get('/cc', async (req, res) => {
try {
    let nbFail = 0;
    
    pwintyCountries.forEach(countryn => {
        resu = country.findByName(utils.toTitleCase(countryn.name));
        //resu = getCode(countryn.name)
        //resu = countries.getAlpha2Code(countryn.name, 'en');
        if (!resu) {
            console.log("Err:", countryn.name)
            nbFail++;
        }
    })
    //console.log(country.findByName(pwintyCountries[0].name.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')), pwintyCountries[0].name.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '))
    //console.log(country.findByIso2("BA"))
    return res.status(200).json({error: false, number: nbFail});
} catch (err) {
    console.log("COUNTRY TESTS ERR", err);
    return res.status(200).json({error: true, message: err.message})
}})*/

module.exports = router;
