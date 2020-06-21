const rp = require("request-promise");
const { ERROR_MESSAGE } = require("./errorMessages");

async function checkCaptcha(req, res, next) {
	const captcha = req.body.captcha;

	if (!captcha) return res.status(200).json({ error: true, message: ERROR_MESSAGE.failedCaptcha });

	const secretKey = "6Ld8MaUZAAAAAJOHua_oEH4mVX0P2ATrfacoxIgM";
	const verifyUrl = `https://google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${req.body.captcha}&remoteip=${req.connection.remoteAddress}`;

	rp(verifyUrl, (err, response, body) => {
		body = JSON.parse(body);

		if (body.success && !body.success) return res.status(200).json({ error: true, message: ERROR_MESSAGE.failedCaptcha });

		next();
	});
}

module.exports = {
	checkCaptcha
};
