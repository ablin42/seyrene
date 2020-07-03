const rp = require("request-promise");
const country = require("country-list-js");
require("dotenv").config();
const utils = require("./utils");
const { ERROR_MESSAGE } = require("./errorMessages");
const { fullLog, threatLog } = require("./log4");
const Order = require("../../models/Order");
const Purchase = require("../../models/PurchaseData");
const User = require("../../models/User");
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
	},
	generateBatchBody: function (items) {
		let body = [];

		items.forEach(item => {
			if (item.attributes.isUnique !== true) {
				item.elements.forEach(product => {
					let obj = {
						sku: product.attributes.SKU,
						url: `${process.env.BASEURL}/api/image/main/Shop/${item.attributes._id}`,
						sizing: "crop", // idk yet (resize for canvas?)
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
		let countryCode = country.findByName(utils.toTitleCase(order.country));
		if (countryCode) countryCode = countryCode.code.iso2;
		else throw new Error(ERROR_MESSAGE.countryCode);

		let options = {
			method: "POST",
			uri: `${process.env.BASEURL}/api/pwinty/orders/create`,
			body: {
				merchantOrderId: order._id, //not good
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

		let [err, orderResponse] = await utils.to(
			Order.findOneAndUpdate({ _id: order._id }, { $set: { pwintyOrderId: pwintyOrderId } })
		);
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

		let subject = `New Order #${order._id}`;
		let content = `Une nouvelle commande à été approuvée: <hr/><a href="${process.env.BASEURL}/Admin/Order/${order._id}">Cliquez ici pour voir la commande</a>`;
		//maral.canvas@gmail.com
		if (await mailer("ablin@byom.de", subject, content)) throw new Error(ERROR_MESSAGE.sendMail);

		[err, user] = await utils.to(User.findById(order._userId));
		if (err || !user) throw new Error(ERROR_MESSAGE.userNotFound);
		content = `To see your order, please follow the link below (make sure you're logged in): <hr/><a href="${process.env.BASEURL}/Order/${order._id}">CLICK HERE</a>`;
		if (await mailer(user.email, subject, content)) throw new Error(ERROR_MESSAGE.sendMail);

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
				"AUTH_TOKEN": process.env.ACCESS_TOKEN
			},
			body: { chargeId: chargeId },
			json: true
		};
		let result = await rp(options);

		return result;
	}
};
