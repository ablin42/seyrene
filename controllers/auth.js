const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const rp = require("request-promise");
const sanitize = require("mongo-sanitize");
const rateLimit = require("express-rate-limit");
const MongoStore = require("rate-limit-mongo");
const { validationResult } = require("express-validator");

const { vRegister, vLogin, vResend } = require("./validators/vAuth");
const mailer = require("./helpers/mailer");
const utils = require("./helpers/utils");
const User = require("../models/User");
const Token = require("../models/VerificationToken");
const { setUser, notLoggedUser, authUser, authToken } = require("./helpers/verifySession");
const { checkCaptcha } = require("./helpers/captcha");
const { ERROR_MESSAGE } = require("./helpers/errorMessages");
require("dotenv").config();

const limiter = rateLimit({
	store: new MongoStore({
		uri: process.env.DB_CONNECTION,
		collectionName: "authRateLimit",
		expireTimeMs: 15 * 60 * 1000
	}),
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 50, // limit each IP to 100 requests per windowMs
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

		const vResult = validationResult(req);
		if (!vResult.isEmpty()) {
			vResult.errors.forEach(item => {
				req.flash("info", item.msg);
			});
			throw new Error(ERROR_MESSAGE.incorrectInput);
		}

		// Hash and salt pw
		const hashPw = await bcrypt.hash(req.body.password, 10);
		if (!hashPw) throw new Error(ERROR_MESSAGE.serverError);

		// Create User and validationToken objects
		const user = new User({
			name: req.session.formData.name.toLowerCase(),
			email: req.session.formData.email,
			password: hashPw
		});

		const vToken = crypto.randomBytes(16).toString("hex");
		const validationToken = new Token({
			_userId: user._id,
			token: vToken
		});

		// Save User and validationToken to DB
		[err, result] = await utils.to(user.save());
		if (err) throw new Error(ERROR_MESSAGE.createAccount);

		[err, result] = await utils.to(validationToken.save());
		if (err) throw new Error(ERROR_MESSAGE.saveError);

		// Send account confirmation mail to user
		let subject = "Account Verification Token for Maral";
		let content = `Hello,\n\n Please verify your account by following the link: \n${process.env.BASEURL}/api/auth/confirmation/${vToken}`;
		if (await mailer(user.email, subject, content)) throw new Error(ERROR_MESSAGE.sendMail);

		return res.status(200).json({ error: false, message: ERROR_MESSAGE.accountCreated });
	} catch (err) {
		console.log("ERROR REGISTER:", err);
		return res.status(200).json({ error: true, message: err.message });
	}
});

router.post("/login", limiter, vLogin, checkCaptcha, setUser, notLoggedUser, async (req, res) => {
	try {
		req.session.formData = { email: req.body.email };

		const vResult = validationResult(req);
		if (!vResult.isEmpty()) {
			vResult.errors.forEach(item => {
				req.flash("info", item.msg);
			});
			throw new Error(ERROR_MESSAGE.incorrectInput);
		}

		// Check if email exists in DB
		let [err, user] = await utils.to(User.findOne({ email: req.body.email }));
		if (err) throw new Error(ERROR_MESSAGE.userNotFound);
		if (!user) throw new Error(ERROR_MESSAGE.invalidCredentials);

		// Check if pw matches
		const validPw = await bcrypt.compare(req.body.password, user.password);
		if (!validPw) throw new Error(ERROR_MESSAGE.invalidCredentials);

		// Check if user is verified
		if (!user.isVerified) {
			let options = {
				uri: `${process.env.BASEURL}/api/auth/resend`,
				method: "POST",
				headers: {
					"AUTH_TOKEN": process.env.ACCESS_TOKEN,
					"CSRF-Token": req.csrfToken(),
					"cookie": req.headers.cookie
				},
				body: { email: req.body.email },
				json: true
			};
			let response = await rp(options).catch(err => {
				throw new Error(ERROR_MESSAGE.serverError);
			});
			throw new Error(ERROR_MESSAGE.unverifiedAccount);
		}

		// Create session variable
		req.session._id = user._id;

		req.flash("success", ERROR_MESSAGE.loggedIn);
		return res.status(200).json({ error: false });
	} catch (err) {
		console.log("ERROR LOGIN:", err);
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
		console.log("ERROR LOGOUT:", err);
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

		// If we found a token, find a matching user
		[err, user] = await utils.to(User.findOne({ _id: token._userId }));
		if (err || !user) throw new Error(ERROR_MESSAGE.userNotFound);

		if (user.isVerified) throw new Error(ERROR_MESSAGE.alreadyVerified);

		// Verify and save the user
		user.isVerified = true;
		[err, user] = await utils.to(user.save());
		if (err) throw new Error(err.message);

		req.flash("success", ERROR_MESSAGE.verified);
		return res.status(200).redirect("/Account");
	} catch (err) {
		console.log("ERROR CONFIRMATION TOKEN:", err);
		req.flash("warning", err.message);
		return res.status(400).redirect("/Account");
	}
});

// Resend account confirmation token
router.post("/resend", limiter, vResend, authToken, setUser, notLoggedUser, async (req, res) => {
	try {
		const vResult = validationResult(req);
		if (!vResult.isEmpty()) {
			vResult.errors.forEach(item => {
				req.flash("info", item.msg);
			});
			throw new Error(ERROR_MESSAGE.incorrectInput);
		}

		let err, user, savedToken;
		const email = req.body.email;

		[err, user] = await utils.to(User.findOne({ email: email }));
		if (err || !user) throw new Error(ERROR_MESSAGE.userNotFound);
		if (user.isVerified) throw new Error(ERROR_MESSAGE.alreadyVerified);

		// Create a verification token, save it, and send email
		let vToken = crypto.randomBytes(16).toString("hex");
		let token = new Token({ _userId: user._id, token: vToken });

		// Save the token
		[err, savedToken] = await utils.to(token.save());
		if (err) throw new Error(ERROR_MESSAGE.saveError);

		let subject = "Account Verification Token for Maral";
		let content = `Hello,\n\n Please verify your account by clicking the link: \n${process.env.BASEURL}/api/auth/confirmation/${vToken}`;
		if (await mailer(user.email, subject, content)) throw new Error(ERROR_MESSAGE.sendMail);

		req.flash("info", `A verification email has been sent to ${user.email}`);
		return res.status(200).redirect("/Account");
	} catch (err) {
		console.log("ERROR SENDING TOKEN:", err);
		req.flash("warning", err.message);
		return res.status(400).redirect("/Account");
	}
});

module.exports = router;
