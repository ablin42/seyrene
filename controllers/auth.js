const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const rp = require("request-promise");
const sanitize = require("mongo-sanitize");
const rateLimit = require("express-rate-limit");
const MongoStore = require("rate-limit-mongo");

const { vRegister, vLogin, vResend } = require("./validators/vAuth");
const mailer = require("./helpers/mailer");
const utils = require("./helpers/utils");
const User = require("../models/User");
const CookieAccept = require("../models/CookieAccept");
const Token = require("../models/VerificationToken");
const { setUser, notLoggedUser, authUser, authToken } = require("./helpers/middlewares");
const { checkCaptcha } = require("./helpers/captcha");
const { ERROR_MESSAGE } = require("./helpers/errorMessages");
const { fullLog, threatLog } = require("./helpers/log4");
require("dotenv").config();

const limiter = rateLimit({
	store: new MongoStore({
		uri: process.env.DB_CONNECTION,
		collectionName: "authRateLimit",
		expireTimeMs: 15 * 60 * 1000
	}),
	windowMs: 15 * 60 * 1000,
	max: 50,
	handler: function (req, res) {
		res.status(200).json({ error: true, message: "Too many requests, please try again later" });
	}
});

router.post("/register", limiter, vRegister, checkCaptcha, setUser, notLoggedUser, async (req, res) => {
	try {
		let err, result;
		req.session.formData = {
			name: req.body.name,
			email: req.body.email
		};
		await utils.checkValidity(req);

		const hashPw = await bcrypt.hash(req.body.password, 10);
		if (!hashPw) throw new Error(ERROR_MESSAGE.serverError);

		const user = new User({
			name: req.session.formData.name.toLowerCase(),
			email: req.session.formData.email,
			password: hashPw,
			accepted_tos: true
		});

		const vToken = crypto.randomBytes(16).toString("hex");
		const validationToken = new Token({
			_userId: user._id,
			token: vToken
		});

		[err, result] = await utils.to(user.save());
		if (err) throw new Error(ERROR_MESSAGE.createAccount);

		[err, result] = await utils.to(validationToken.save());
		if (err) throw new Error(ERROR_MESSAGE.saveError);

		let subject = "Account Verification Token for Maral";
		let content = "Hello, Please verify your account by following the link below ";
		if (await mailer(user.email, subject, content, `${process.env.BASEURL}/api/auth/confirmation/${vToken}`))
			throw new Error(ERROR_MESSAGE.sendMail);

		fullLog.info(`Account created: ${user._id}`);
		return res.status(200).json({ error: false, message: ERROR_MESSAGE.accountCreated });
	} catch (err) {
		threatLog.error("ERROR REGISTER:", err, req.headers, req.ipAddress);
		return res.status(200).json({ error: true, message: err.message });
	}
});

router.post("/login", limiter, vLogin, checkCaptcha, setUser, notLoggedUser, async (req, res) => {
	try {
		req.session.formData = { email: req.body.email };

		await utils.checkValidity(req);

		let [err, user] = await utils.to(User.findOne({ email: req.body.email }));
		if (err) throw new Error(ERROR_MESSAGE.serverError);
		if (!user) throw new Error(ERROR_MESSAGE.invalidCredentials);

		const validPw = await bcrypt.compare(req.body.password, user.password);
		if (!validPw) throw new Error(ERROR_MESSAGE.invalidCredentials);

		if (!user.isVerified) {
			let options = {
				uri: `${process.env.BASEURL}/api/auth/resend`,
				method: "POST",
				headers: {
					"ACCESS_TOKEN": process.env.ACCESS_TOKEN,
					"CSRF-Token": req.csrfToken(),
					"cookie": req.headers.cookie
				},
				body: { email: req.body.email },
				json: true
			};
			let response = await rp(options);
			if (response.error === true) throw new Error(response.message);

			throw new Error(ERROR_MESSAGE.unverifiedAccount);
		}

		// Create session variable
		req.session._id = user._id;

		fullLog.info(`User log in: ${user._id}`);
		req.flash("success", ERROR_MESSAGE.loggedIn);
		return res.status(200).json({ error: false });
	} catch (err) {
		threatLog.error("ERROR LOGIN:", err, req.headers, req.ipAddress);
		return res.status(200).json({ error: true, message: err.message });
	}
});

router.get("/logout", limiter, setUser, authUser, (req, res) => {
	try {
		req.session.destroy(function (err) {
			if (err) throw new Error(ERROR_MESSAGE.serverError);
		});

		return res.status(200).redirect("/");
	} catch (err) {
		threatLog.error("ERROR LOGOUT:", err, req.headers, req.ipAddress);
		req.flash("warning", err.message);
		return res.status(400).redirect("/");
	}
});

// Confirm account with token
router.get("/confirmation/:token", limiter, setUser, async (req, res) => {
	try {
		let err, token, user;
		const receivedToken = sanitize(req.params.token);
		if (typeof receivedToken !== "string") throw new Error(ERROR_MESSAGE.tokenNotFound);

		[err, token] = await utils.to(Token.findOne({ token: receivedToken }));
		if (err || !token) throw new Error(ERROR_MESSAGE.tokenNotFound);

		[err, user] = await utils.to(User.findOne({ _id: token._userId }));
		if (err || !user) throw new Error(ERROR_MESSAGE.userNotFound);

		if (user.isVerified) throw new Error(ERROR_MESSAGE.alreadyVerified);

		user.isVerified = true;
		[err, user] = await utils.to(user.save());
		if (err) throw new Error(err.message);

		fullLog.info(`Account verified: ${user._id}`);
		req.flash("success", ERROR_MESSAGE.verified);
		return res.status(200).redirect("/Account");
	} catch (err) {
		threatLog.error("ERROR CONFIRMATION TOKEN:", err, req.headers, req.ipAddress);
		req.flash("warning", err.message);
		return res.status(400).redirect("/Account");
	}
});

// Resend account confirmation token
router.post("/resend", limiter, vResend, authToken, setUser, notLoggedUser, async (req, res) => {
	try {
		await utils.checkValidity(req);

		let err, user, savedToken;
		const email = req.body.email;

		[err, user] = await utils.to(User.findOne({ email: email }));
		if (err || !user) throw new Error(ERROR_MESSAGE.userNotFound);
		if (user.isVerified) throw new Error(ERROR_MESSAGE.alreadyVerified);

		let vToken = crypto.randomBytes(16).toString("hex");
		let token = new Token({ _userId: user._id, token: vToken });

		[err, savedToken] = await utils.to(token.save());
		if (err) throw new Error(ERROR_MESSAGE.saveError);

		let subject = "Account Verification Token for Maral";
		let content = "Hello, Please verify your account by clicking the link below ";
		if (await mailer(user.email, subject, content, `${process.env.BASEURL}/api/auth/confirmation/${vToken}`))
			throw new Error(ERROR_MESSAGE.sendMail);

		req.flash("info", `A verification email has been sent to ${user.email}`);
		return res.status(200).json({ error: false });
	} catch (err) {
		threatLog.error("ERROR SENDING TOKEN:", err, req.headers, req.ipAddress);
		req.flash("warning", err.message);
		return res.status(200).json({ error: true, message: err.message });
	}
});

router.get("/cookies/accept", setUser, async (req, res) => {
	try {
		let entry = new CookieAccept({ ip: req.ip });
		let [err, result] = await utils.to(entry.save());
		if (err || !result) throw new Error(ERROR_MESSAGE.serverError);

		return res.status(200).json({ error: false });
	} catch (err) {
		threatLog.error("ERROR ACCEPTING COOKIES:", err, req.headers, req.ipAddress);
		return res.status(400).json({ error: true, message: err.message });
	}
});

module.exports = router;
