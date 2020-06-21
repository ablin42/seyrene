const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const rp = require("request-promise");
const { validationResult } = require("express-validator");
const { vName, vEmail, vPassword, vLostPw, vDelivery } = require("./validators/vUser");
const countryList = require("country-list-js");
const IPinfo = require("node-ipinfo");

const mailer = require("./helpers/mailer");
const { setUser, authUser } = require("./helpers/verifySession");
const utils = require("./helpers/utils");
const User = require("../models/User");
const Token = require("../models/VerificationToken");
const PwToken = require("../models/PasswordToken");
const DeliveryInfo = require("../models/DeliveryInfo");
const { ERROR_MESSAGE } = require("./helpers/errorMessages");
require("dotenv").config();

const toTitleCase = phrase => {
	let arr = phrase.toLowerCase().split(" ");
	let parsed = [];

	arr.forEach(item => {
		let obj = item.charAt(0).toUpperCase() + item.slice(1);
		if (item === "and") obj = "and";
		parsed.push(obj);
	});

	return parsed.join(" ");
};

router.post("/lostpw", vLostPw, async (req, res) => {
	try {
		let err, user, pwToken, result;
		const vResult = validationResult(req);
		if (!vResult.isEmpty()) {
			vResult.errors.forEach(item => {
				req.flash("info", item.msg);
			});
			throw new Error(ERROR_MESSAGE.incorrectInput);
		}

		[err, user] = await utils.to(User.findOne({ email: req.body.email })); //sanitize
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

		req.flash("success", "An e-mail was sent to your address, please follow the link we sent you");
		return res.status(200).redirect("/");
	} catch (err) {
		console.log("ERROR LOSTPW:", err);
		req.flash("warning", err.message);
		return res.status(400).redirect("/Account");
	}
});

router.post("/resetpw", vPassword, async (req, res) => {
	try {
		let err, pwToken, user;
		const vResult = validationResult(req);
		if (!vResult.isEmpty()) {
			vResult.errors.forEach(item => {
				req.flash("info", item.msg);
			});
			throw new Error(ERROR_MESSAGE.incorrectInput);
		}

		// hash and salt pw
		const hashPw = await bcrypt.hash(req.body.password, 10);
		if (!hashPw) throw new Error(ERROR_MESSAGE.serverError);

		// check if token is valid
		[err, pwToken] = await utils.to(PwToken.findOne({ _id: req.body.tokenId, token: req.body.token }));
		if (err || pwToken === null) throw new Error(ERROR_MESSAGE.tokenNotFound);

		// update password and delete token
		[err, user] = await utils.to(User.updateOne({ _id: pwToken._userId }, { $set: { password: hashPw } }));
		if (err) throw new Error(ERROR_MESSAGE.userUpdate);
		[err, pwToken] = await utils.to(PwToken.deleteOne({ _id: req.body.tokenId }));
		if (err) throw new Error(ERROR_MESSAGE.serverError);

		req.flash("success", "Password successfully modified");
		return res.status(200).redirect("/Account");
	} catch (err) {
		console.log("ERROR RESETPW:", err);
		req.flash("warning", err.message);
		return res.status(400).redirect(`/Resetpw/${req.body.tokenId}/${req.body.token}`);
	}
});

router.post("/patch/name", vName, setUser, authUser, async (req, res) => {
	try {
		const vResult = validationResult(req);

		if (!vResult.isEmpty()) {
			vResult.errors.forEach(item => {
				req.flash("info", item.msg);
			});
			throw new Error(ERROR_MESSAGE.incorrectInput);
		}

		const name = req.body.name,
			id = req.user._id; //sanitize

		const nameExist = await utils.nameExist(name);
		if (nameExist) throw new Error(ERROR_MESSAGE.userNameTaken);

		let [err, user] = await utils.to(User.updateOne({ _id: id }, { $set: { name: name } }));
		if (err) throw new Error(ERROR_MESSAGE.userUpdate);

		req.flash("success", "Username successfully modified");
		return res.status(200).redirect("/User");
	} catch (err) {
		console.log("ERROR PATCHING NAME:", err);
		req.flash("warning", err.message);
		return res.status(400).redirect("/User");
	}
});

router.post("/patch/email", vEmail, setUser, authUser, async (req, res) => {
	try {
		let err, user, token;
		const vResult = validationResult(req);
		if (!vResult.isEmpty()) {
			vResult.errors.forEach(item => {
				req.flash("info", item.msg);
			});
			throw new Error(ERROR_MESSAGE.incorrectInput);
		}

		const newEmail = req.body.email, //sanitize
			id = req.user._id,
			vToken = crypto.randomBytes(16).toString("hex");

		const emailExist = await utils.emailExist(newEmail);
		if (emailExist) throw new Error(ERROR_MESSAGE.emailTaken);

		[err, user] = await utils.to(User.updateOne({ _id: id }, { $set: { email: newEmail, isVerified: false } }));
		if (err) throw new Error(ERROR_MESSAGE.userUpdate);

		[err, token] = await utils.to(Token.updateOne({ _userId: id }, { $set: { token: vToken } }));
		if (err) throw new Error(ERROR_MESSAGE.saveError);

		//send mail
		let subject = "Account Verification Token for Maral",
			content = `Hello,\n\n Please verify your account by following the link: \n${process.env.BASEURL}/api/auth/confirmation/${vToken}`;
		if (await mailer(newEmail, subject, content)) throw new Error(ERROR_MESSAGE.sendMail);

		req.flash("success", "Email successfully modified, please confirm your new e-mail by clicking on the link we sent you");
		return res.status(200).redirect("/User");
	} catch (err) {
		console.log("ERROR PATCHING EMAIL:", err);
		req.flash("warning", err.message);
		return res.status(400).redirect("/User");
	}
});

router.post("/patch/password", vPassword, setUser, authUser, async (req, res) => {
	try {
		const vResult = validationResult(req);
		if (!vResult.isEmpty()) {
			vResult.errors.forEach(item => {
				req.flash("info", item.msg);
			});
			throw new Error(ERROR_MESSAGE.incorrectInput);
		}

		const id = req.user._id,
			cpassword = req.body.cpassword,
			password = req.body.password;

		let [err, user] = await utils.to(User.findById(id));
		if (err) throw new Error(ERROR_MESSAGE.userNotFound);

		const validPw = await bcrypt.compare(cpassword, user.password);
		if (!validPw) throw new Error(ERROR_MESSAGE.invalidCredentials);

		// Hash and salt pw
		const hashPw = await bcrypt.hash(password, 10);
		if (!hashPw) throw new Error(ERROR_MESSAGE.serverError);

		[err, user] = await utils.to(User.updateOne({ _id: id }, { $set: { password: hashPw } }));
		if (err) throw new Error(ERROR_MESSAGE.userUpdate);

		req.flash("success", "Password successfully modified");
		return res.status(200).redirect("/User");
	} catch (err) {
		console.log("ERROR PATCHING PASSWORD:", err);
		req.flash("warning", err.message);
		return res.status(400).redirect("/User");
	}
});

router.post("/patch/delivery-info", vDelivery, setUser, authUser, async (req, res) => {
	try {
		const vResult = validationResult(req);
		if (!vResult.isEmpty()) {
			vResult.errors.forEach(item => {
				req.flash("info", item.msg);
			});
			throw new Error(ERROR_MESSAGE.incorrectInput);
		}

		let apiKey = "AIzaSyBluorKuf7tdOULcDK08oZ-98Vw7_12TMI";
		let encoded_address = encodeURI(req.body.fulltext_address);
		let street_name = req.body.street_name.replace(/[0-9]/g, "").trim();
		let street_number = parseInt(req.body.street_name);
		if (Number.isNaN(street_number)) throw new Error(ERROR_MESSAGE.noStreetNb);

		console.log(encoded_address, street_number, street_name);
		let options = {
			uri: `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encoded_address}&inputtype=textquery&key=${apiKey}`,
			json: true
		};
		rp(options).then(async data => {
			try {
				if (data.status != "OK") {
					throw new Error(ERROR_MESSAGE.deliveryAddressNotFound);
				} else {
					let err, result, infos;

					[err, infos] = await utils.to(DeliveryInfo.findOne({ _userId: req.user._id }));
					if (err || !infos) throw new Error(ERROR_MESSAGE.deliveryAddressNotFound);

					if (infos === null) {
						let info = new DeliveryInfo({
							_userId: req.user._id,
							firstname: req.body.firstname,
							lastname: req.body.lastname,
							full_address: req.body.fulltext_address,
							full_street: req.body.street_name,
							country: req.body.country,
							street_name: street_name,
							street_number: street_number,
							city: req.body.city,
							state: req.body.state,
							zipcode: req.body.postal_code,
							instructions: req.body.instructions
						});
						// Save info to DB if no entry exist yet
						[err, result] = await utils.to(info.save());
						if (err) throw new Error(ERROR_MESSAGE.updateError);
					} else {
						let obj = {
							firstname: req.body.firstname,
							lastname: req.body.lastname,
							full_address: req.body.fulltext_address,
							full_street: req.body.street_name,
							country: req.body.country,
							street_name: street_name,
							street_number: street_number,
							city: req.body.city,
							state: req.body.state,
							zipcode: req.body.postal_code,
							instructions: req.body.instructions
						};
						// Update if user already has an entry in DB
						[err, result] = await utils.to(DeliveryInfo.updateOne({ _userId: req.user._id }, { $set: obj }));
						if (err || !result) throw new Error(ERROR_MESSAGE.deliveryAddressNotFound);
					}

					req.flash("success", "Delivery informations successfully updated");
					res.status(200).redirect("/User");
				}
			} catch (err) {
				console.log(err);
			}
		});
		console.log(req.body);
	} catch (err) {
		console.log("ERROR PATCHING PASSWORD:", err);
		req.flash("warning", err.message);
		return res.status(400).redirect("/User");
	}
});

router.get("/countryCode", setUser, async (req, res) => {
	try {
		const ip =
			"90.79.188.153"; /* (req.headers['x-forwarded-for'] || '').split(',').pop().trim() || 
  req.connection.remoteAddress || 
  req.socket.remoteAddress || 
  req.connection.socket.remoteAddress || */

		const IPINFO_TOKEN = "4c60ea37e18dd1";
		const ipinfo = new IPinfo(IPINFO_TOKEN);
		let country = "";
		let countryCode = "";

		if (req.user) {
			let [err, result] = await utils.to(DeliveryInfo.findOne({ _userId: req.user._id }));
			if (err || result === null) {
				ipinfo.lookupIp(ip).then(response => {
					countryCode = countryList.findByName(toTitleCase(response.country));
					if (countryCode) countryCode = countryCode.code.iso2;
					else throw new Error(ERROR_MESSAGE.countryCode);
					return res.status(200).json({ error: false, countryCode: countryCode });
				});
			} else {
				country = result.country;
				countryCode = countryList.findByName(toTitleCase(country));
				if (countryCode) countryCode = countryCode.code.iso2;
				else throw new Error(ERROR_MESSAGE.countryCode);

				return res.status(200).json({ error: false, countryCode: countryCode });
			}
		} else {
			ipinfo.lookupIp(ip).then(response => {
				countryCode = countryList.findByName(toTitleCase(response.country));
				if (countryCode) countryCode = countryCode.code.iso2;
				else throw new Error(ERROR_MESSAGE.countryCode);
				return res.status(200).json({ error: false, countryCode: countryCode });
			});
		}
	} catch (err) {
		console.log(err);
		return res.status(400).json({ error: true, message: err.message });
	}
});

module.exports = router;
