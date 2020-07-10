const express = require("express");
const router = express.Router();
const sanitize = require("mongo-sanitize");
const { vDelivery } = require("./validators/vUser");

const Order = require("../models/Order");
const Purchase = require("../models/PurchaseData");
const User = require("../models/User");
const Shop = require("../models/Shop");
const DeliveryInfo = require("../models/DeliveryInfo");
const { ROLE, setUser, authUser, authRole, setOrder, authGetOrder, checkAddress, authToken } = require("./helpers/middlewares");
const utils = require("./helpers/utils");
const mailer = require("./helpers/mailer");
const { ERROR_MESSAGE } = require("./helpers/errorMessages");
const oHelpers = require("./helpers/orderHelpers");
const format = require("date-format");
const formatter = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });
const { fullLog, threatLog } = require("./helpers/log4");
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
		if (err || !result) throw new Error(ERROR_MESSAGE.fetchError);

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
		threatLog.error("FETCHING ORDERS ERROR:", err, req.headers, req.ipAddress);
		return res.status(200).json({ error: true, message: err.message });
	}
});

router.get("/:id", setUser, authUser, setOrder, authGetOrder, async (req, res) => {
	try {
		let id = sanitize(req.params.id);
		let order = req.order;

		order.price = formatter.format(order.price).substr(2);
		order.items.forEach((item, index) => {
			order.items[parseInt(index)].price = formatter.format(item.price).substr(2);
			order.items[parseInt(index)].attributes.content = item.attributes.content.substr(0, 128);
			order.items[parseInt(index)].attributes.title = item.attributes.title.substr(0, 64);
		});

		fullLog.info(`Order accessed: Order: ${id} - User: ${req.user._id}`);
		return res.status(200).json(order);
	} catch (err) {
		threatLog.error("FETCHING ORDER ERROR:", err, req.headers, req.ipAddress);
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

		fullLog.info(`Order initialized: Order: ${order._id} - User: ${req.user._id}`);
		return res.status(200).json({ error: false, order: response });
	} catch (err) {
		threatLog.error("INITIALIZING ORDER ERROR:", err, req.headers, req.ipAddress);
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

		fullLog.info(`Order completed: Order: ${order._id} - User: ${req.user._id}`);
		return res.status(200).json({ error: false, message: "La commande à été marquée comme complétée" });
	} catch (err) {
		threatLog.error("COMPLETE ORDER ERROR:", err, req.headers, req.ipAddress);
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

		if (isPwinty === false) await oHelpers.submitOrder(order);
		else await oHelpers.createPwintyOrder(order, req);

		fullLog.info(`Order approved: Order: ${order._id} - User: ${req.user._id}`);
		return res.status(200).json({ error: false, message: "La commande à été approuvée et mise en production" });
	} catch (err) {
		threatLog.error("APPROVING ORDER ERROR:", err, req.headers, req.ipAddress);
		return res.status(200).json({ error: true, message: err.message });
	}
});

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
			let refund = await oHelpers.refundStripe(req, order.chargeId, order._id);
			if (refund.error === true) throw new Error(refund.message);
		} else {
			await oHelpers.cancelPwintyOrder(order.pwintyOrderId);

			let refund = await oHelpers.refundStripe(req, order.chargeId, order._id);
			if (refund.error === true) throw new Error(refund.message);
		}

		[err, order] = await utils.to(Order.findByIdAndUpdate({ _id: order._id }, { $set: { status: "Cancelled" } }));
		if (err || !order) throw new Error(ERROR_MESSAGE.fetchError);

		let subject = `Cancelled Order #${order._id}`;
		let content = `Une commande à été annulée: <hr/><a href="${process.env.BASEURL}/Admin/Order/${order._id}">Cliquez ici pour voir la commande</a>`;
		//maral.canvas@gmail.com
		if (await mailer("ablin@byom.de", subject, content)) throw new Error(ERROR_MESSAGE.sendMail);

		content = `You cancelled your order, to see the cancelled order, please follow the link below (make sure you're logged in): <hr/><a href="${process.env.BASEURL}/Order/${order._id}">CLICK HERE</a>`;
		if (await mailer(user.email, subject, content)) throw new Error(ERROR_MESSAGE.sendMail);

		fullLog.info(`Order cancelled: Order: ${order._id} - User: ${req.user._id}`);
		return res.status(200).json({ error: false, message: ERROR_MESSAGE.cancelOrderSuccess });
	} catch (err) {
		threatLog.error("CANCEL ORDER ERROR:", err, req.headers, req.ipAddress);
		return res.status(200).json({ error: true, message: err.message });
	}
});

router.post("/billing/save", vDelivery, setUser, authUser, checkAddress, async (req, res) => {
	try {
		await utils.checkValidity(req.address);
		req.session.billing = req.address;

		req.flash("success", ERROR_MESSAGE.savedBilling);
		fullLog.info(`Billing saved: User: ${req.user._id} / ${req.address.full_address}.`);
		return res.status(200).json({ error: false });
	} catch (err) {
		threatLog.error("SAVE BILLING ERROR:", err, req.headers, req.ipAddress);
		return res.status(200).json({ error: true, message: err.message });
	}
});

router.post("/confirm", async (req, res) => {
	try {
		const sig = request.headers["stripe-signature"];
		let event = stripe.webhooks.constructEvent(req.body, sig, process.env.ENDPOINT_SECRET);

		console.log(event, "event stripe");

		//mail on success and verify webhook
		if (event.type === "payment_intent.succeeded" && req.body.data.object.id) {
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

			fullLog.info(`Order confirmed: Order: ${order._id} - User: ${req.user._id}`);
			return res.status(200).send("OK");
		}

		threatLog.error("INVALID WEBHOOK ERROR:", err, req.headers, req.ipAddress);
		return res.status(200).send("OK");
	} catch (err) {
		threatLog.error("CONFIRMING ORDER ERROR:", err, req.headers, req.ipAddress);
		return res.status(200).json({ error: true, message: err.message });
	}
});

module.exports = router;
