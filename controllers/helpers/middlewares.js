const rp = require("request-promise");
require("dotenv").config();

const utils = require("./utils");
const sanitize = require("mongo-sanitize");
const Order = require("../../models/Order");
const Gallery = require("../../models/Gallery");
const Shop = require("../../models/Shop");
const User = require("../../models/User");
const DeliveryInfo = require("../../models/DeliveryInfo");
const { ERROR_MESSAGE } = require("./errorMessages");
const { FRA_sizes, CAN_sizes, PRINT_sizes, FRA_SUR_sizes, attributesList } = require("./pwintyData");
const { fullLog, threatLog } = require("./log4");
//const { count } = require("../../models/User");

const ROLE = {
	ADMIN: "admin",
	BASIC: "basic"
};

async function setUser(req, res, next) {
	const userId = req.session._id;
	console.log(req.session._id, "SETUSER MIDDLEWARE");

	if (userId) {
		let [err, user] = await utils.to(User.findById(userId));
		if (err || user == null) {
			req.flash("warning", ERROR_MESSAGE.userNotFound);
			return res.status(401).redirect("/Account");
		}
		user.password = undefined;
		req.user = user;
	}

	//let [err, user] = await utils.to(User.findById(process.env.USERKEY)); //
	//req.user = user; //

	next();
}

function authUser(req, res, next) {
	if (!req.user) {
		req.flash("warning", ERROR_MESSAGE.logInNeeded);
		return res.status(403).redirect("/Account");
	}

	next();
}

function notLoggedUser(req, res, next) {
	if (req.user) {
		req.flash("warning", ERROR_MESSAGE.alreadyLoggedIn);
		return res.status(403).redirect("/");
	}

	next();
}

function authRole(role) {
	return (req, res, next) => {
		if (req.user.role !== role) {
			req.flash("warning", ERROR_MESSAGE.unauthorized);
			return res.status(401).redirect("back");
		}

		next();
	};
}

async function checkAddress(req, res, next) {
	try {
		const addressData = req.body.billing || req.body;

		let encoded_address = encodeURI(addressData.fulltext_address);
		let street_number = parseInt(addressData.street_name);

		if (Number.isNaN(street_number)) throw new Error(ERROR_MESSAGE.noStreetNb);

		let options = {
			uri: `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encoded_address}&inputtype=textquery&key=${process.env.GOOGLE_API_KEY}`,
			json: true
		};
		let address = await rp(options);
		if (address.status != "OK" || !address.candidates[0].place_id) throw new Error(ERROR_MESSAGE.deliveryAddressNotFound);

		options.uri = `https://maps.googleapis.com/maps/api/place/details/json?placeid=${address.candidates[0].place_id}&key=${process.env.GOOGLE_API_KEY}`;
		address = await rp(options);
		if (address.status != "OK") throw new Error(ERROR_MESSAGE.deliveryAddressNotFound);
		let components = address.result.address_components;

		req.address = {
			firstname: addressData.firstname,
			lastname: addressData.lastname,
			full_address: addressData.fulltext_address,
			full_street: components[1].long_name,
			country: components[5].long_name,
			street_name: addressData.street_name,
			street_number: components[0].long_name,
			city: components[2].long_name,
			state: components[4].long_name,
			zipcode: components[6].long_name
		};
		if (addressData.instructions) req.address.instructions = addressData.instructions;
		if (addressData.tos) req.address.tos = addressData.tos;

		next();
	} catch (err) {
		threatLog.error("CHECK ADDRESS ERROR:", err, req.headers, req.ipAddress);
		if (req.body.billing) return res.status(200).json({ error: true, message: err.message });

		req.flash("warning", err.message);
		return res.status(400).redirect("/User");
	}
}

async function setDelivery(req, res, next) {
	const userId = req.session._id;

	if (userId) {
		let [err, result] = await utils.to(DeliveryInfo.findOne({ _userId: userId }));
		if (err || !result) {
			req.flash("warning", ERROR_MESSAGE.deliveryAddressNotFound);
			return res.status(401).redirect("/User");
		}
		req.delivery = result;
	}

	next();
}

function isDelivery(req, res, next) {
	if (!req.delivery) {
		req.flash("warning", ERROR_MESSAGE.unsetDeliveryAddress);
		return res.status(403).redirect("/User");
	}

	next();
}

async function setOrder(req, res, next) {
	const orderId = sanitize(req.params.id);

	let [err, order] = await utils.to(Order.findById(orderId));
	if (err || !order) {
		req.flash("warning", ERROR_MESSAGE.noResult);
		return res.status(404).redirect("/User");
	}
	req.order = order;

	next();
}

function canViewOrder(user, order) {
	return user.role == ROLE.ADMIN || order._userId == user._id;
}

function authGetOrder(req, res, next) {
	if (!canViewOrder(req.user, req.order)) {
		req.flash("warning", ERROR_MESSAGE.unauthorized);
		return res.status(401).redirect("/User");
	}

	next();
}

function checkBilling(req, res, next) {
	const billing = req.session.billing;

	if (!billing) {
		req.flash("warning", ERROR_MESSAGE.missingBilling);
		return res.status(404).redirect("/Billing");
	}

	next();
}

function authToken(req, res, next) {
	const token = req.headers["access_token"];
	if (!token || token !== process.env.ACCESS_TOKEN)
		return res.status(200).json({ error: true, message: ERROR_MESSAGE.unauthorized });

	next();
}

async function setGallery(req, res, next) {
	const galleryId = sanitize(req.params.id);

	let [err, gallery] = await utils.to(Gallery.findById(galleryId));
	if (err || !gallery) {
		if (req.headers["content-type"] === "application/x-www-form-urlencoded") {
			req.flash("warning", ERROR_MESSAGE.noResult);
			return res.status(404).redirect("/Galerie");
		}
		return res.status(200).json({ url: "/Galerie", message: ERROR_MESSAGE.noResult, err: true });
	}
	req.product = gallery;

	next();
}

async function setShop(req, res, next) {
	const shopId = sanitize(req.params.id);

	let [err, shop] = await utils.to(Shop.findById(shopId));
	if (err || !shop) {
		if (req.headers["content-type"] === "application/x-www-form-urlencoded") {
			req.flash("warning", ERROR_MESSAGE.noResult);
			return res.status(404).redirect("/Shop");
		}
		return res.status(200).json({ url: "/Shop", message: ERROR_MESSAGE.noResult, err: true });
	}
	req.product = shop;

	next();
}

async function checkPwintyAttributes(req, res, next) {
	const attributes = req.body.attributes;
	let error = false;

	Object.keys(attributes).forEach(attribute => {
		if (attributesList.indexOf(attribute) === -1) error = true;
	});

	if (error === true) return res.status(400).json({ error: true, message: "Invalid attributes" });

	switch (attributes.category) {
		case "CAN":
			{
				if (attributes.subcategory !== "FRA" && attributes.subcategory !== "STR") error = true;
				if (CAN_sizes.indexOf(attributes.size) === -1) error = true;
				if (
					attributes.wrap !== "Black" &&
					attributes.wrap !== "White" &&
					attributes.wrap !== "ImageWrap" &&
					attributes.wrap !== "MirrorWrap"
				)
					error = true;
			}
			break;
		case "FRA":
			{
				if (
					attributes.subcategory !== "BOX" &&
					attributes.subcategory !== "CLA" &&
					attributes.subcategory !== "GLO" &&
					attributes.subcategory !== "SWO" &&
					attributes.subcategory !== "SPACE" &&
					attributes.subcategory !== "SUR"
				)
					error = true;
				if (FRA_sizes.indexOf(attributes.size) === -1) error = true;
				if (
					attributes.mountType &&
					attributes.mountType !== "MOUNT1" &&
					attributes.mountType !== "MOUNT2" &&
					attributes.mountType !== "NM"
				)
					error = true;
				if (attributes.glaze && attributes.glaze !== "ACRY" && attributes.glaze !== "GLA" && attributes.glaze !== "TRU")
					error = true;
				if (
					attributes.frameColour &&
					attributes.frameColour !== "Black" &&
					attributes.frameColour !== "Brown" &&
					attributes.frameColour !== "White" &&
					attributes.frameColour !== "Natural" &&
					attributes.frameColour !== "Silver" &&
					attributes.frameColour !== "Gold"
				)
					error = true;
				if (
					attributes.mountColour &&
					attributes.mountColour !== "Black" &&
					attributes.mountColour !== "Off-White" &&
					attributes.mountColour !== "Snow White"
				)
					error = true;
				if (
					attributes.substrateType &&
					attributes.substrateType !== "BAP" &&
					attributes.substrateType !== "CPWP" &&
					attributes.substrateType !== "EMA" &&
					attributes.substrateType !== "MFA" &&
					attributes.substrateType !== "HGE" &&
					attributes.substrateType !== "SAP"
				)
					error = true;
				if (attributes.depth && attributes.depth !== "1" && attributes.detph !== "2") error = true;
			}
			break;

		case "PRINT":
			{
				if (attributes.subcategory !== "GLOBAL") error = true;
				if (attributes.substrateType !== "FAP" && attributes.substrateType !== "HGE") error = true;
				if (PRINT_sizes.indexOf(attributes.size) === -1) error = true;
			}
			break;

		default:
			error = true;
	}

	if (error === true) return res.status(400).json({ error: true, message: "Invalid attributes" });

	req.attributes = req.body.attributes;
	next();
}

async function pwintyGetPrice(req, res, next) {
	const SKU = req.body.SKU;
	let countryCode;

	let options = {
		uri: `${process.env.BASEURL}/api/user/countryCode/`,
		method: "GET",
		headers: {
			"Content-Type": "application/json",
			"Accept": "application/json"
		},
		json: true
	};
	let response = await rp(options);

	if (response.error === true) return res.status(400).json({ error: true, message: response.message });
	else countryCode = response.countryCode;

	options = {
		uri: `${process.env.BASEURL}/api/pwinty/pricing/${countryCode}`,
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Accept": "application/json",
			"CSRF-Token": req.csrfToken(),
			"cookie": req.headers.cookie
		},
		body: JSON.stringify({ items: [{ SKU: SKU, quantity: 1 }] })
	};
	response = await rp(options);
	response = JSON.parse(response);
	if (response.error === true || response.response.length <= 0)
		return res.status(400).json({ error: true, message: "Invalid SKU" });

	req.price = response.response.unitPriceIncludingTax;
	next();
}

function errorHandler(err, req, res, next) {
	if (res.headersSent) return next(err);

	threatLog.warn(err.message, req.ipAddress);
	return res.status(500).json({ url: "/", message: err.message, err: true });
}

module.exports = {
	ROLE,
	errorHandler,
	setUser,
	notLoggedUser,
	authUser,
	authRole,
	setDelivery,
	isDelivery,
	setOrder,
	canViewOrder,
	authGetOrder,
	checkBilling,
	checkAddress,
	authToken,
	setGallery,
	setShop,
	checkPwintyAttributes,
	pwintyGetPrice
};
