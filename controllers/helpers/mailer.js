const nodemailer = require("nodemailer");
require("dotenv/config");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;

const { fullLog, threatLog } = require("./log4");

module.exports = async function sendValidationMail(email, subject, text) {
	const oauth2Client = new OAuth2(
		process.env.CLIENT_ID_OAUTH,
		process.env.CLIENT_SECRET_OAUTH, // Client Secret
		"https://developers.google.com/oauthplayground" // Redirect URL
	);

	oauth2Client.setCredentials({
		refresh_token: process.env.REFRESH_TOKEN
	});
	const accessToken = oauth2Client.getAccessToken();

	let transporter = nodemailer.createTransport({
		service: "gmail",
		auth: {
			type: "OAuth2",
			user: process.env.SERVER_EMAIL,
			clientId: process.env.CLIENT_ID_OAUTH,
			clientSecret: process.env.CLIENT_SECRET_OAUTH,
			refreshToken: process.env.REFRESH_TOKEN,
			accessToken: accessToken
			/*user: process.env.SERVER_EMAIL,
			pass: process.env.SERVER_EMAILPW*/
		}
	});

	let mailOptions = {
		from: process.env.SERVER_EMAIL,
		to: email,
		subject: subject,
		text: text
	};

	transporter.sendMail(mailOptions, err => {
		if (err) {
			fullLog.info("MAILING ERROR:", err, mailOptions.to, mailOptions.subject);
			return true;
		} else fullLog.info("MAIL SENT SUCCESSFULLY");
	});

	return false;
};
