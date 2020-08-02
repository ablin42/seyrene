const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const MongoStore = require("rate-limit-mongo");
const { vName, vEmail, vPassword, vLostPw, vDelivery } = require("./validators/vUser");
const countryList = require("country-list-js");
const IPinfo = require("node-ipinfo");
const rp = require("request-promise");

const mailer = require("./helpers/mailer");
const { setUser, authUser, checkAddress, notLoggedUser } = require("./helpers/middlewares");
const { checkCaptcha } = require("./helpers/captcha");
const utils = require("./helpers/utils");
const User = require("../models/User");
const Token = require("../models/VerificationToken");
const PwToken = require("../models/PasswordToken");
const DeliveryInfo = require("../models/DeliveryInfo");
const { ERROR_MESSAGE } = require("./helpers/errorMessages");
const { fullLog, threatLog } = require("./helpers/log4");
const sanitize = require("mongo-sanitize");
require("dotenv").config();

const memjs = require("memjs");
let mc = memjs.Client.create(process.env.MEMCACHIER_SERVERS, {
	failover: true,
	timeout: 1,
	keepAlive: true
});

const limiter = rateLimit({
	store: new MongoStore({
		uri: process.env.DB_CONNECTION,
		collectionName: "userRateLimit",
		expireTimeMs: 15 * 60 * 1000
	}),
	windowMs: 15 * 60 * 1000,
	max: 50,
	handler: function (req, res) {
		res.status(200).json({ error: true, message: "Too many requests, please try again later" });
	}
});

router.post("/lostpw", limiter, vLostPw, checkCaptcha, setUser, notLoggedUser, async (req, res) => {
	try {
		let err, user, pwToken, result;
		await utils.checkValidity(req);

		[err, user] = await utils.to(User.findOne({ email: req.body.email }));
		if (err || !user) throw new Error(ERROR_MESSAGE.userNotFound);

		[err, pwToken] = await utils.to(PwToken.findOne({ _userId: user._id }));
		if (err) throw new Error(ERROR_MESSAGE.serverError);

		const token = crypto.randomBytes(16).toString("hex");
		if (pwToken === null) {
			pwToken = new PwToken({ _userId: user._id, token: token });
			[err, result] = await utils.to(pwToken.save());
			if (err) throw new Error(ERROR_MESSAGE.saveError);
		} else {
			[err, result] = await utils.to(PwToken.updateOne({ _userId: user._id }, { $set: { token: token } }));
			if (err) throw new Error(ERROR_MESSAGE.saveError);
		}

		const subject = "Password Reset Token for Maral",
			content = "Hello, You asked your password to be reset, please click the button below in order to change your password";
		if (await mailer(req.body.email, subject, content, `${process.env.BASEURL}/resetpw/${pwToken._id}/${token}`))
			throw new Error(ERROR_MESSAGE.sendMail);

		fullLog.info(`Lostpw request token: ${user.email}/${user._id}`);
		req.flash("success", ERROR_MESSAGE.lostpwEmail);
		return res.status(200).json({ error: false });
	} catch (err) {
		threatLog.error("ERROR LOSTPW:", err, req.headers, req.ipAddress);
		return res.status(200).json({ error: true, message: err.message });
	}
});

router.post("/resetpw", limiter, vPassword, setUser, notLoggedUser, async (req, res) => {
	try {
		let err, pwToken, user;
		await utils.checkValidity(req);

		const hashPw = await bcrypt.hash(req.body.password, 10);
		if (!hashPw) throw new Error(ERROR_MESSAGE.serverError);

		[err, pwToken] = await utils.to(PwToken.findOne({ _id: req.body.tokenId, token: req.body.token }));
		if (err || !token) throw new Error(ERROR_MESSAGE.tokenNotFound);

		[err, user] = await utils.to(User.updateOne({ _id: pwToken._userId }, { $set: { password: hashPw } }));
		if (err) throw new Error(ERROR_MESSAGE.userUpdate);

		[err, pwToken] = await utils.to(PwToken.deleteOne({ _id: req.body.tokenId }));
		if (err) throw new Error(ERROR_MESSAGE.serverError);

		fullLog.info(`Resetpw success: ${user._id}`);
		req.flash("success", ERROR_MESSAGE.updatedPw);
		return res.status(200).redirect("/Account");
	} catch (err) {
		threatLog.error("ERROR RESETPW:", err, req.headers, req.ipAddress);
		req.flash("warning", err.message);
		return res.status(400).redirect(`/Resetpw/${req.body.tokenId}/${req.body.token}`);
	}
});

router.post("/patch/name", limiter, vName, setUser, authUser, async (req, res) => {
	try {
		await utils.checkValidity(req);

		const name = req.body.name.toLowerCase();
		const id = req.user._id;

		let [err, user] = await utils.to(User.updateOne({ _id: id }, { $set: { name: name } }));
		if (err || !user) throw new Error(ERROR_MESSAGE.userUpdate);
		req.user.name = name;

		fullLog.info(`Username patched: ${name}/${id}`);
		req.flash("success", ERROR_MESSAGE.updatedUsername);
		return res.status(200).redirect("/User");
	} catch (err) {
		threatLog.error("ERROR PATCHING NAME:", err, req.headers, req.ipAddress);
		req.flash("warning", err.message);
		return res.status(400).redirect("/User");
	}
});

router.post("/patch/email", limiter, vEmail, setUser, authUser, async (req, res) => {
	try {
		let err, user, token;
		await utils.checkValidity(req);
		const newEmail = req.body.email;
		const id = req.user._id;
		const vToken = crypto.randomBytes(16).toString("hex");

		[err, user] = await utils.to(User.updateOne({ _id: id }, { $set: { email: newEmail, isVerified: false } }));
		if (err || !user) throw new Error(ERROR_MESSAGE.userUpdate);

		[err, token] = await utils.to(Token.updateOne({ _userId: id }, { $set: { token: vToken } }));
		if (err || !token) throw new Error(ERROR_MESSAGE.saveError);

		let subject = "Account Verification Token for Maral",
			content = "Hello, Please verify your account by clicking the button below";
		if (await mailer(newEmail, subject, content, `${process.env.BASEURL}/api/auth/confirmation/${vToken}`))
			throw new Error(ERROR_MESSAGE.sendMail);

		fullLog.info(`Email patched: ${newEmail}/${id}`);
		req.flash("success", ERROR_MESSAGE.updatedEmail);
		return res.status(200).redirect("/User");
	} catch (err) {
		threatLog.error("ERROR PATCHING EMAIL:", err, req.headers, req.ipAddress);
		req.flash("warning", err.message);
		return res.status(400).redirect("/User");
	}
});

router.post("/patch/password", limiter, vPassword, setUser, authUser, async (req, res) => {
	try {
		await utils.checkValidity(req);
		const user = req.user;
		const cpassword = req.body.cpassword;
		const password = req.body.password;

		const validPw = await bcrypt.compare(cpassword, user.password);
		if (!validPw) throw new Error(ERROR_MESSAGE.invalidCredentials);

		const hashPw = await bcrypt.hash(password, 10);
		if (!hashPw) throw new Error(ERROR_MESSAGE.serverError);

		let [err, result] = await utils.to(User.updateOne({ _id: user._id }, { $set: { password: hashPw } }));
		if (err || !result) throw new Error(ERROR_MESSAGE.userUpdate);

		fullLog.info(`Password patched: ${user._id}`);
		req.flash("success", ERROR_MESSAGE.updatedPw);
		return res.status(200).redirect("/User");
	} catch (err) {
		threatLog.error("ERROR PATCHING PASSWORD:", err, req.headers, req.ipAddress);
		req.flash("warning", err.message);
		return res.status(400).redirect("/User");
	}
});

router.post("/patch/delivery-info", limiter, vDelivery, setUser, authUser, checkAddress, async (req, res) => {
	try {
		let err,
			result,
			infos,
			isoCodeList,
			obj = req.address;
		await utils.checkValidity(req.address);

		let options = {
			method: "GET",
			uri: `${process.env.BASEURL}/api/pwinty/countries`,
			headers: {
				ACCESS_TOKEN: process.env.ACCESS_TOKEN
			},
			json: true
		};

		let response = await rp(options);
		if (response.error === false) isoCodeList = response.response.data;
		else throw new Error(response.message);

		if (
			isoCodeList
				.map(function (e) {
					return e.isoCode;
				})
				.indexOf(req.body["country-iso"]) === -1
		)
			throw new Error("Invalid iso code");
		obj.isoCode = req.body["country-iso"];

		[err, infos] = await utils.to(DeliveryInfo.findOne({ _userId: req.user._id }));
		if (err) throw new Error(ERROR_MESSAGE.serverError);

		if (!infos) {
			obj._userId = req.user._id;
			let info = new DeliveryInfo(obj);

			[err, result] = await utils.to(info.save());
			if (err) throw new Error(ERROR_MESSAGE.updateError);
		} else {
			[err, result] = await utils.to(DeliveryInfo.updateOne({ _userId: req.user._id }, { $set: obj }));
			if (err || !result) throw new Error(ERROR_MESSAGE.deliveryAddressNotFound);
		}

		fullLog.info(`Delivery info patched: ${obj._userId}`);
		req.flash("success", ERROR_MESSAGE.updatedDelivery);
		return res.status(200).redirect("/User");
	} catch (err) {
		threatLog.error("ERROR PATCHING PASSWORD:", err, req.headers, req.ipAddress);
		req.flash("warning", err.message);
		return res.status(400).redirect("/User");
	}
});

router.get("/countryCode", setUser, async (req, res) => {
	try {
		/* */
		req.ipAddress = "90.79.211.103";

		const ip = req.ipAddress;
		const IPINFO_TOKEN = process.env.IPINFO_TOKEN;
		const ipinfo = new IPinfo(IPINFO_TOKEN);
		let countryCode = undefined;
		let err, result, data;
		let country_key = "country." + ip;

		mc.get(country_key, async function (err, val) {
			if (err == null && val != null) {
				countryCode = val.toString();
			} else {
				if (req.user) {
					[err, result] = await utils.to(DeliveryInfo.findOne({ _userId: req.user._id }));
					if (err) throw new Error(ERROR_MESSAGE.serverError);
				}

				if (result && result.isoCode) countryCode = result.isoCode;
				else {
					let response = await ipinfo.lookupIp(ip);

					console.log(response);
					countryCode = countryList.findByName(utils.toTitleCase(response.country));
					if (countryCode) countryCode = countryCode.code.iso2;
					else throw new Error(ERROR_MESSAGE.countryCode);
				}

				mc.set(country_key, "" + countryCode, { expires: 86400 }, function (err, val) {
					if (err) throw new Error(ERROR_MESSAGE.serverError);
				});
			}
			return res.status(200).json({ error: false, countryCode: countryCode });
		});
	} catch (err) {
		threatLog.error("USER COUNTRY CODE ERROR", err, req.headers, req.ipAddress);
		return res.status(400).json({ error: true, message: err.message });
	}
});

router.post("/delete/:id", setUser, authUser, async (req, res) => {
	try {
		let userId = sanitize(req.params.id);

		if (req.user._id == userId) {
			[err, result] = await utils.to(User.findOneAndDelete({ _id: userId }));
			if (err) throw new Error(ERROR_MESSAGE.serverError);

			req.session.destroy(function (err) {
				if (err) throw new Error(ERROR_MESSAGE.serverError);
			});

			fullLog.info("ACCOUNT DELETED", userId);
			return res.status(200).json({ error: false, message: "ACCOUNT DELETED" });
		} else throw new Error(ERROR_MESSAGE.unauthorized);
	} catch (err) {
		threatLog.error("DELETING ACCOUNT ERROR", err, req.headers, req.ipAddress);
		return res.status(400).json({ error: true, message: err.message });
	}
});

module.exports = router;
