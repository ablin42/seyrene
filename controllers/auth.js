const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const request = require("request");
const { validationResult } = require("express-validator");
const { vRegister, vLogin } = require("./validators/vAuth");

const mailer = require("./helpers/mailer");
const utils = require("./helpers/utils");
const User = require("../models/User");
const Token = require("../models/VerificationToken");
const { setUser, notLoggedUser, authUser } = require("./helpers/verifySession");
const { checkCaptcha } = require("./helpers/captcha");
const { ERROR_MESSAGE } = require("./helpers/errorMessages");
require("dotenv").config();

router.post("/register", vRegister, setUser, checkCaptcha, notLoggedUser, async (req, res) => {
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
			throw new Error(ERROR_MESSAGE.incorrectForm);
		}

		// Hash and salt pw
		const hashPw = await bcrypt.hash(req.body.password, 10);
		if (!hashPw) throw new Error(ERROR_MESSAGE.encryptError);

		// Create User and validationToken objects
		const user = new User({
			name: req.session.formData.name,
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
		if (err) throw new Error(ERROR_MESSAGE.createToken);

		// Send account confirmation mail to user
		let subject = "Account Verification Token for Maral";
		let content = `Hello,\n\n Please verify your account by following the link: \n${process.env.BASEURL}/api/auth/confirmation/${vToken}`;
		if (await mailer(user.email, subject, content)) throw new Error(ERROR_MESSAGE.sendMail);

		//req.flash("success", "Account created successfully, please check your emails to confirm your account");
		return res
			.status(200)
			.json({ error: false, message: "Account created successfully, please check your emails to confirm your account" });
	} catch (err) {
		console.log("ERROR REGISTER:", err);
		//req.flash("warning", err.message);
		return res.status(200).json({ error: true, message: err.message });
	}
});

router.post("/login", vLogin, setUser, notLoggedUser, async (req, res) => {
	try {
		req.session.formData = { email: req.body.email };

		const vResult = validationResult(req);
		if (!vResult.isEmpty()) {
			vResult.errors.forEach(item => {
				req.flash("info", item.msg);
			});
			throw new Error(ERROR_MESSAGE.incorrectForm);
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
			request.post(`${process.env.BASEURL}/api/auth/resend`, { json: { email: req.body.email } }, err => {
				if (err) throw new Error(ERROR_MESSAGE.sendToken);
			});
			throw new Error(ERROR_MESSAGE.unverfiedAccount);
		}

		// Create session variable
		req.session._id = user._id;

		req.flash("success", "Logged in successfully!");
		return res.redirect("/");
	} catch (err) {
		console.log("ERROR LOGIN:", err);
		req.flash("warning", err.message);
		return res.status(400).redirect("/Account");
	}
});

router.get("/logout", setUser, authUser, (req, res) => {
	try {
		// might want to delete token idk
		// Kill session
		req.session.destroy(function (err) {
			if (err) throw new Error(ERROR_MESSAGE.logoutError);
		});

		return res.status(200).redirect("/");
	} catch (err) {
		console.log("ERROR LOGOUT:", err);
		req.flash("warning", err.message);
		return res.status(400).redirect("/");
	}
});

// Confirm account with token
router.get("/confirmation/:token", setUser, notLoggedUser, async (req, res) => {
	try {
		let err, token, user;
		const receivedToken = req.params.token; //sanitiwe

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

		req.flash("success", "Your account has been verified. Please log in.");
		return res.status(200).redirect("/Account");
	} catch (err) {
		console.log("ERROR CONFIRMATION TOKEN:", err);
		req.flash("warning", err.message);
		return res.status(400).redirect("/Account");
	}
});

// Resend account confirmation token
router.post("/resend", setUser, notLoggedUser, async (req, res) => {
	try {
		let err, user, savedToken;
		const email = req.body.email; //sanitize

		[err, user] = await utils.to(User.findOne({ email: email }));
		// Check if an user exist with this email and check if his account is verified
		if (err || !user) throw new Error(ERROR_MESSAGE.userNotFound);
		if (user.isVerified) throw new Error(ERROR_MESSAGE.alreadyVerified);

		// Create a verification token, save it, and send email
		let vToken = crypto.randomBytes(16).toString("hex");
		let token = new Token({ _userId: user._id, token: vToken });

		// Save the token
		[err, savedToken] = await utils.to(token.save());
		if (err) throw new Error(ERROR_MESSAGE.saveToken);

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
