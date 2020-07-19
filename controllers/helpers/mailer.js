const nodemailer = require("nodemailer");
require("dotenv/config");

const { fullLog, threatLog } = require("./log4");

module.exports = async function sendValidationMail(email, subject, text, url = `${process.env.BASEURL}`) {
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

	if (email !== process.env.EMAIL) {
		mailOptions.html = `
				<div class="container" style="position: sticky; 	max-width: 1340px !important;
						margin: 1em auto;
						flex: 1;
						padding: 15px;
						width: 100%;
						margin: auto;">
					<div class="resetpw form-slider" id="resetpw" style="text-align: center;	background: #eeecec;
						height: auto;
						padding: 30px;
						 position: relative;
						box-shadow: none;">
						<h1 style=" 
						color: #0a3d62;
						font-weight: bold;
						font-size: 55px;
						text-align: center
					">${subject}</h1>
						<div id="alert" style="	position: relative;
						padding: 0.75rem 0;
						border: 1px solid transparent;
						border-radius: 0.25rem;
						width: 50%;
						margin: auto;
							font-size: 22px;
							color: #142837;
						background-color: #68adde;
						border-color: #142837;
						margin-bottom: 30px;" role="alert">
							${text}
						</div>

						<a href="${url}"  style="display: block;
						width: 100%;
						height: 50px;
						line-height: 50px;
						border: none;
						background: linear-gradient(160deg, #0d5a91, #0070c1);
						background-size: 200%;
						color: #eeecec;
						outline: none;
						cursor: pointer;
						transition: 0.5s;
						width: 50%;
						margin: auto;
						margin-bottom: 40px;
						text-decoration: none;
						font-size: 28px;" >CLICK HERE!</a>
					</div>
				</div>
		`;
	}

	transporter.sendMail(mailOptions, err => {
		if (err) {
			fullLog.info("MAILING ERROR:", err, mailOptions.to, mailOptions.subject);
			return true;
		} else fullLog.info("MAIL SENT SUCCESSFULLY");
	});

	return false;
};
