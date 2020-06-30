const express = require("express");
const router = express.Router();
const { validationResult } = require("express-validator");
const { vContact } = require("./validators/vContact");
const rateLimit = require("express-rate-limit");
const MongoStore = require("rate-limit-mongo");

const { setUser } = require("./helpers/verifySession");
const { checkCaptcha } = require("./helpers/captcha");
const { ERROR_MESSAGE } = require("./helpers/errorMessages");
const mailer = require("./helpers/mailer");
require("dotenv").config();
const { fullLog, threatLog } = require("./helpers/log4");

const limiter = rateLimit({
	store: new MongoStore({
		uri: process.env.DB_CONNECTION,
		collectionName: "contactRateLimit",
		expireTimeMs: 15 * 60 * 1000
	}),
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 20, // limit each IP to 100 requests per windowMs
	handler: function (req, res) {
		res.status(200).json({ error: true, message: "Too many requests, please try again later" });
	}
});

// Send us a mail
router.post("/", limiter, vContact, setUser, checkCaptcha, async (req, res) => {
	try {
		const subject = `FROM ${req.body.name}, [${req.body.email}] - ${req.body.title}`;
		const content = req.body.content;
		const formData = {
			name: req.body.name,
			email: req.body.email,
			subject: req.body.title,
			content: content
		};
		req.session.formData = formData;

		const vResult = validationResult(req);
		if (!vResult.isEmpty()) {
			vResult.errors.forEach(item => {
				req.flash("info", item.msg);
			});
			throw new Error(ERROR_MESSAGE.incorrectInput);
		}

		//maral.canvas@gmail.com
		if (await mailer("ablin@byom.de", subject, content)) throw new Error(ERROR_MESSAGE.sendMail);

		fullLog.info(`Contact mail sent: ${formData.email}`);
		return res.status(200).json({ error: false, message: ERROR_MESSAGE.sentEmail });
	} catch (err) {
		threatLog.error("ERROR CONTACT:", err, req.headers, req.ip);
		return res.status(200).json({ error: true, message: err.message });
	}
});

module.exports = router;
