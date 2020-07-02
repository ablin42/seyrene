const { body } = require("express-validator");
const { ERROR_MESSAGE } = require("../helpers/errorMessages");

module.exports.vContact = [
	body("name")
		.trim()
		.isLength({ min: 4, max: 30 })
		.withMessage(ERROR_MESSAGE.nameLength)
		.matches(/^[a-z0-9 \-_àâçéèêëîïôûùüÿñæœ]+$/i)
		.withMessage(ERROR_MESSAGE.nameAlpha),
	body("email")
		.trim()
		.isEmail()
		.withMessage(ERROR_MESSAGE.emailInvalid)
		.bail()
		.normalizeEmail()
		.isLength({ min: 3, max: 256 })
		.withMessage(ERROR_MESSAGE.emailLenght),
	body("title").trim().isLength({ min: 10, max: 256 }).withMessage(ERROR_MESSAGE.titleContact),
	body("content").trim().isLength({ min: 64, max: 2048 }).withMessage(ERROR_MESSAGE.contentContact)
];
