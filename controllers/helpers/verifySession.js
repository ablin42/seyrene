const utils = require("../helpers/utils");
const sanitize = require("mongo-sanitize");
const Order = require("../../models/Order");
const User = require("../../models/User");
const DeliveryInfo = require("../../models/DeliveryInfo");
const { ERROR_MESSAGE } = require("./errorMessages");
const rp = require("request-promise");

const ROLE = {
	ADMIN: "admin",
	BASIC: "basic"
};

async function setUser(req, res, next) {
	const userId = req.session._id;

	if (userId) {
		let [err, user] = await utils.to(User.findById(userId));
		if (err || user == null) {
			req.flash("warning", ERROR_MESSAGE.userNotFound);
			return res.status(401).redirect("/Account");
		}
		req.user = user;
		req.user.password = undefined;
	}

	let [err, user] = await utils.to(User.findById("5d810b9365761c0840e0de25")); //
	req.user = user; //

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

		console.log(req.address, "x");

		next();
	} catch (err) {
		console.log("CHECK ADDRESS ERROR:", err);
		if (req.body.billing) return res.status(200).json({ error: true, message: err.message });

		req.flash("warning", err.message);
		return res.status(400).redirect("/User");
	}
}

async function setDelivery(req, res, next) {
	const userId = "5d810b9365761c0840e0de25"; //req.session._id;

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
	const token = req.headers.access_token;
	if (!token || token !== process.env.ACCESS_TOKEN)
		return res.status(200).json({ error: true, message: ERROR_MESSAGE.unauthorized });

	next();
}

module.exports = {
	ROLE,
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
	authToken
};
