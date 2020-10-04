const rp = require("request-promise");
const country = require("country-list-js");
require("dotenv").config();
const utils = require("./utils");
const { ERROR_MESSAGE } = require("./errorMessages");
const { fullLog, threatLog } = require("./log4");
const Order = require("../../models/Order");
const Purchase = require("../../models/PurchaseData");
const User = require("../../models/User");
const DeliveryInfo = require("../../models/DeliveryInfo");
const mailer = require("./mailer");

module.exports = {
	cancelPwintyOrder: async function (pwintyOrderId) {
		let options = {
			method: "GET",
			uri: `${process.env.BASEURL}/api/pwinty/orders/${pwintyOrderId}`,
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
		options.uri = `${process.env.BASEURL}/api/pwinty/orders/${pwintyOrderId}/submit`;
		options.body = { status: "Cancelled" };
		response = await rp(options);
		if (response.error === true) throw new Error(ERROR_MESSAGE.cancelOrder);

		return;
	},
	getNeededAttributes: function (attributes) {
		let obj = {};

		switch (attributes.category) {
			case "CAN":
				{
					obj.wrap = attributes.wrap;
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
					)
						if (attributes.mountColour && attributes.mountType !== "NM") obj.mountColour = attributes.mountColour;
				}
				break;
		}

		return obj;
	},
	generateBatchBody: function (items) {
		let body = [];

		items.forEach(item => {
			if (item.attributes.isUnique !== true) {
				item.elements.forEach(product => {
					let obj = {
						sku: product.attributes.SKU,
						url: item.attributes.mainImg,
						sizing: "crop",
						copies: product.qty,
						attributes: ""
					};

					obj.attributes = this.getNeededAttributes(product.attributes);
					body.push(obj);
				});
			}
		});
		return body;
	},
	createPwintyOrder: async function (order, req) {
		let err, user, orderResponse, delivery;

		[err, delivery] = await utils.to(DeliveryInfo.findOne({ _userId: req.user._id }));
		if (err) throw new Error(ERROR_MESSAGE.serverError);
		if (!delivery) throw new Error(ERROR_MESSAGE.countryCode);
		let countryCode = delivery.isoCode;

		[err, user] = await utils.to(User.findById(order._userId));
		if (err || !user) throw new Error(ERROR_MESSAGE.userNotFound);

		let options = {
			method: "POST",
			uri: `${process.env.BASEURL}/api/pwinty/orders/create`,
			body: {
				merchantOrderId: order._id,
				recipientName: order.firstname + " " + order.lastname,
				address1: order.full_address,
				addressTownOrCity: order.city,
				stateOrCounty: order.state,
				postalOrZipCode: order.zipcode,
				countryCode: countryCode,
				preferredShippingMethod: "standard",
				email: user.email,
				payment: "InvoiceMe"
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

		options.body = this.generateBatchBody(order.items);
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

		[err, orderResponse] = await utils.to(Order.findOneAndUpdate({ _id: order._id }, { $set: { pwintyOrderId: pwintyOrderId } }));
		if (err || !orderResponse) throw new Error(ERROR_MESSAGE.submitOrder);

		[err, orderResponse] = await utils.to(
			Purchase.findOneAndUpdate({ _orderId: order._id }, { $set: { pwintyId: pwintyOrderId } })
		);
		if (err || !orderResponse) throw new Error(ERROR_MESSAGE.saveError);

		await this.submitOrder(order);
		return;
	},
	submitOrder: async function (order) {
		let err, response, user;

		[err, response] = await utils.to(
			Order.findOneAndUpdate({ _id: order._id, status: "awaitingApproval" }, { $set: { status: "Submitted" } })
		);
		if (err || !response) throw new Error(ERROR_MESSAGE.submitOrder);

		let subject = `Order Approved #${order._id}`;
		let content = "Une nouvelle commande à été approuvée, cliquez ici pour y accéder";
		if (await mailer(process.env.EMAIL, subject, content, `${process.env.BASEURL}/Admin/Order/${order._id}`))
			throw new Error(ERROR_MESSAGE.sendMail);

		[err, user] = await utils.to(User.findById(order._userId));
		if (err || !user) throw new Error(ERROR_MESSAGE.userNotFound);
		content = "To see your order, please click the link below (make sure you're logged in)";
		if (await mailer(user.email, subject, content, `${process.env.BASEURL}/Order/${order._id}`))
			throw new Error(ERROR_MESSAGE.sendMail);

		fullLog.info("Order saved to DB", order._id);
		return { err: false, orderId: order._id };
	},
	refundStripe: async function (req, chargeId, orderId) {
		let options = {
			uri: `${process.env.BASEURL}/api/stripe/refund/${orderId}`,
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Accept": "application/json",
				"CSRF-Token": req.csrfToken(),
				"cookie": req.headers.cookie,
				"ACCESS_TOKEN": process.env.ACCESS_TOKEN
			},
			body: { chargeId: chargeId },
			json: true
		};
		let result = await rp(options);

		return result;
	}
};
