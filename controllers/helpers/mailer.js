const nodemailer = require("nodemailer");
require("dotenv/config");

module.exports =  async function sendValidationMail(email, subject, text) {
	let transporter = nodemailer.createTransport({
		service: "gmail",
		auth: {
			user: process.env.SERVER_EMAIL,
			pass: process.env.SERVER_EMAILPW
		}
	});

	let mailOptions = {
		from: process.env.SERVER_EMAIL,
		to: email,
		subject: subject,
		text: text
	};

	transporter.sendMail(mailOptions, (err) => {
		if (err) {
			console.log("MAILING ERROR:", err);
			return true;
		} else {
			console.log("MAIL SENT SUCCESSFULLY");
		}
	});

	return false;
};