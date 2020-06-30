const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const MongoStore = require("rate-limit-mongo");
const { validationResult } = require("express-validator");
const { vName, vEmail, vPassword, vLostPw, vDelivery } = require("./validators/vUser");
const countryList = require("country-list-js");
const IPinfo = require("node-ipinfo");

const mailer = require("./helpers/mailer");
const { setUser, authUser, checkAddress, notLoggedUser } = require("./helpers/verifySession");
const { checkCaptcha } = require("./helpers/captcha");
const utils = require("./helpers/utils");
const User = require("../models/User");
const Token = require("../models/VerificationToken");
const PwToken = require("../models/PasswordToken");
const DeliveryInfo = require("../models/DeliveryInfo");
const { ERROR_MESSAGE } = require("./helpers/errorMessages");
require("dotenv").config();

const limiter = rateLimit({
	store: new MongoStore({
		uri: process.env.DB_CONNECTION,
		collectionName: "userRateLimit",
		expireTimeMs: 15 * 60 * 1000
	}),
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 50, // limit each IP to 100 requests per windowMs
	handler: function (req, res) {
		res.status(200).json({ error: true, message: "Too many requests, please try again later" });
	}
});

router.post("/lostpw", limiter, vLostPw, checkCaptcha, setUser, notLoggedUser, async (req, res) => {
	try {
		let err, user, pwToken, result;
		const vResult = validationResult(req);
		if (!vResult.isEmpty()) throw new Error(ERROR_MESSAGE.incorrectInput);

		[err, user] = await utils.to(User.findOne({ email: req.body.email }));
		if (err || !user) throw new Error(ERROR_MESSAGE.userNotFound);

		[err, pwToken] = await utils.to(PwToken.findOne({ _userId: user._id }));
		if (err) throw new Error(ERROR_MESSAGE.tokenNotFound);

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
			content = `Hello,\n\n You asked your password to be reset, please follow this link in order to change your password: \n ${process.env.BASEURL}/resetpw/${pwToken._id}/${token}`;
		if (await mailer(req.body.email, subject, content)) throw new Error(ERROR_MESSAGE.sendMail);

		req.flash("success", ERROR_MESSAGE.lostpwEmail);
		return res.status(200).json({ error: false });
	} catch (err) {
		console.log("ERROR LOSTPW:", err);
		return res.status(200).json({ error: true, message: err.message });
	}
});

router.post("/resetpw", limiter, vPassword, setUser, notLoggedUser, async (req, res) => {
	try {
		let err, pwToken, user;
		const vResult = validationResult(req);
		if (!vResult.isEmpty()) {
			vResult.errors.forEach(item => {
				req.flash("info", item.msg);
			});
			throw new Error(ERROR_MESSAGE.incorrectInput);
		}

		const hashPw = await bcrypt.hash(req.body.password, 10);
		if (!hashPw) throw new Error(ERROR_MESSAGE.serverError);

		[err, pwToken] = await utils.to(PwToken.findOne({ _id: req.body.tokenId, token: req.body.token }));
		if (err || !token) throw new Error(ERROR_MESSAGE.tokenNotFound);

		[err, user] = await utils.to(User.updateOne({ _id: pwToken._userId }, { $set: { password: hashPw } }));
		if (err) throw new Error(ERROR_MESSAGE.userUpdate);

		[err, pwToken] = await utils.to(PwToken.deleteOne({ _id: req.body.tokenId }));
		if (err) throw new Error(ERROR_MESSAGE.serverError);

		req.flash("success", ERROR_MESSAGE.updatedPw);
		return res.status(200).redirect("/Account");
	} catch (err) {
		console.log("ERROR RESETPW:", err);
		req.flash("warning", err.message);
		return res.status(400).redirect(`/Resetpw/${req.body.tokenId}/${req.body.token}`);
	}
});

router.post("/patch/name", limiter, vName, setUser, authUser, async (req, res) => {
	try {
		const vResult = validationResult(req);
		if (!vResult.isEmpty()) {
			vResult.errors.forEach(item => {
				req.flash("info", item.msg);
			});
			throw new Error(ERROR_MESSAGE.incorrectInput);
		}

		const name = req.body.name.toLowerCase();
		const id = req.user._id;

		let [err, user] = await utils.to(User.updateOne({ _id: id }, { $set: { name: name } }));
		if (err || !user) throw new Error(ERROR_MESSAGE.userUpdate);

		req.flash("success", ERROR_MESSAGE.updatedUsername);
		return res.status(200).redirect("/User");
	} catch (err) {
		console.log("ERROR PATCHING NAME:", err);
		req.flash("warning", err.message);
		return res.status(400).redirect("/User");
	}
});

router.post("/patch/email", limiter, vEmail, setUser, authUser, async (req, res) => {
	try {
		let err, user, token;
		const vResult = validationResult(req);
		if (!vResult.isEmpty()) {
			vResult.errors.forEach(item => {
				req.flash("info", item.msg);
			});
			throw new Error(ERROR_MESSAGE.incorrectInput);
		}

		const newEmail = req.body.email;
		const id = req.user._id;
		const vToken = crypto.randomBytes(16).toString("hex");

		[err, user] = await utils.to(User.updateOne({ _id: id }, { $set: { email: newEmail, isVerified: false } }));
		if (err || !user) throw new Error(ERROR_MESSAGE.userUpdate);

		[err, token] = await utils.to(Token.updateOne({ _userId: id }, { $set: { token: vToken } }));
		if (err || !token) throw new Error(ERROR_MESSAGE.saveError);

		let subject = "Account Verification Token for Maral",
			content = `Hello,\n\n Please verify your account by following the link: \n${process.env.BASEURL}/api/auth/confirmation/${vToken}`;
		if (await mailer(newEmail, subject, content)) throw new Error(ERROR_MESSAGE.sendMail);

		req.flash("success", ERROR_MESSAGE.updatedEmail);
		return res.status(200).redirect("/User");
	} catch (err) {
		console.log("ERROR PATCHING EMAIL:", err);
		req.flash("warning", err.message);
		return res.status(400).redirect("/User");
	}
});

router.post("/patch/password", limiter, vPassword, setUser, authUser, async (req, res) => {
	try {
		const vResult = validationResult(req);
		if (!vResult.isEmpty()) {
			vResult.errors.forEach(item => {
				req.flash("info", item.msg);
			});
			throw new Error(ERROR_MESSAGE.incorrectInput);
		}

		const id = req.user._id;
		const cpassword = req.body.cpassword;
		const password = req.body.password;

		let [err, user] = await utils.to(User.findById(id));
		if (err || !user) throw new Error(ERROR_MESSAGE.userNotFound);

		const validPw = await bcrypt.compare(cpassword, user.password);
		if (!validPw) throw new Error(ERROR_MESSAGE.invalidCredentials);

		const hashPw = await bcrypt.hash(password, 10);
		if (!hashPw) throw new Error(ERROR_MESSAGE.serverError);

		[err, user] = await utils.to(User.updateOne({ _id: id }, { $set: { password: hashPw } }));
		if (err || !user) throw new Error(ERROR_MESSAGE.userUpdate);

		req.flash("success", ERROR_MESSAGE.updatedPw);
		return res.status(200).redirect("/User");
	} catch (err) {
		console.log("ERROR PATCHING PASSWORD:", err);
		req.flash("warning", err.message);
		return res.status(400).redirect("/User");
	}
});

router.post("/patch/delivery-info", limiter, vDelivery, setUser, authUser, checkAddress, async (req, res) => {
	try {
		let err,
			result,
			infos,
			obj = req.address;
		const vResult = validationResult(req);
		if (!vResult.isEmpty()) {
			vResult.errors.forEach(item => {
				req.flash("info", item.msg);
			});
			throw new Error(ERROR_MESSAGE.incorrectInput);
		}

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

		req.flash("success", ERROR_MESSAGE.updatedDelivery);
		res.status(200).redirect("/User");
	} catch (err) {
		console.log("ERROR PATCHING PASSWORD:", err);
		req.flash("warning", err.message);
		return res.status(400).redirect("/User");
	}
});

router.get("/countryCode", setUser, async (req, res) => {
	try {
		const ip = "90.79.188.153";
		/* 
			(req.headers['x-forwarded-for'] || '').split(',').pop().trim() ||
			req.connection.remoteAddress || 
			req.socket.remoteAddress || 
			req.connection.socket.remoteAddress || 
		*/

		const IPINFO_TOKEN = "4c60ea37e18dd1";
		const ipinfo = new IPinfo(IPINFO_TOKEN);
		let countryCode = undefined;
		let err, result;

		if (req.user) [err, result] = await utils.to(DeliveryInfo.findOne({ _userId: req.user._id }));

		if (result) {
			countryCode = countryList.findByName(utils.toTitleCase(result.country));
			if (countryCode) countryCode = countryCode.code.iso2;
			else throw new Error(ERROR_MESSAGE.countryCode);
		} else {
			let response = await ipinfo.lookupIp(ip);

			countryCode = countryList.findByName(utils.toTitleCase(response.country));
			if (countryCode) countryCode = countryCode.code.iso2;
			else throw new Error(ERROR_MESSAGE.countryCode);

			return res.status(200).json({ error: false, countryCode: countryCode });
		}
		return res.status(200).json({ error: false, countryCode: countryCode });
	} catch (err) {
		console.log(err);
		return res.status(400).json({ error: true, message: err.message });
	}
});

module.exports = router;
