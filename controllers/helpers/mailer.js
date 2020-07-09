const nodemailer = require("nodemailer");
require("dotenv/config");
const { fullLog, threatLog } = require("./log4");

module.exports = async function sendValidationMail(email, subject, text) {
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

	console.log(mailOptions, process.env.SERVER_EMAIL, process.env.SERVER_EMAILPW);

	transporter.sendMail(mailOptions, err => {
		if (err) {
			fullLog.info("MAILING ERROR:", err, mailOptions.to, mailOptions.subject);
			return true;
		} else fullLog.info("MAIL SENT SUCCESSFULLY");
	});

	return false;
};
