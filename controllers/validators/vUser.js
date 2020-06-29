const { body } = require("express-validator");
const utils = require("../helpers/utils");
const { ERROR_MESSAGE } = require("../helpers/errorMessages");

module.exports.vName = [
	body("name").trim().stripLow(),
	body("name")
		.isLength({ min: 4, max: 30 })
		.withMessage(ERROR_MESSAGE.nameLength)
		.matches(/^[a-z0-9 \-_àâçéèêëîïôûùüÿñæœ]+$/i)
		.withMessage(ERROR_MESSAGE.nameAlpha)
		.bail()
		.custom(value => {
			return utils.nameExist(value).then(user => {
				if (user) return Promise.reject(ERROR_MESSAGE.userNameTaken);
			});
		})
];

module.exports.vEmail = [
	body("email").trim().stripLow(),
	body("email")
		.isEmail()
		.withMessage(ERROR_MESSAGE.emailInvalid)
		.bail()
		.normalizeEmail()
		.isLength({ min: 3, max: 256 })
		.withMessage(ERROR_MESSAGE.emailLenght)
		.custom(value => {
			return utils.emailExist(value).then(email => {
				if (email) return Promise.reject(ERROR_MESSAGE.emailTaken);
			});
		})
];

module.exports.vPassword = [
	body("password")
		.isLength({ min: 8, max: 256 })
		.withMessage(ERROR_MESSAGE.pwLength)
		.matches(/^(((?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(.{8,})/)
		.withMessage(ERROR_MESSAGE.pwAlpha),
	body("password2").custom((value, { req }) => {
		if (value !== req.body.password) throw new Error(ERROR_MESSAGE.pwDontMatch);
		return true;
	})
];

module.exports.vLostPw = [
	body("email").trim().stripLow(),
	body("email")
		.isEmail()
		.withMessage(ERROR_MESSAGE.emailInvalid)
		.bail()
		.normalizeEmail()
		.isLength({ min: 3, max: 256 })
		.withMessage(ERROR_MESSAGE.emailLenght)
		.custom(value => {
			return utils.emailExist(value).then(email => {
				if (!email) return Promise.reject(ERROR_MESSAGE.lostpwEmail);
			});
		})
];

module.exports.vDelivery = [
	body("fulltext_address").trim().stripLow().isLength({ min: 1 }).withMessage(ERROR_MESSAGE.address),
	body("street_name").trim().stripLow().isLength({ min: 1 }).withMessage(ERROR_MESSAGE.street),
	body("city").trim().stripLow().isLength({ min: 1 }).withMessage(ERROR_MESSAGE.city),
	body("state").trim().stripLow().isLength({ min: 1 }).withMessage(ERROR_MESSAGE.state),
	body("postal_code").trim().stripLow().isLength({ min: 1 }).withMessage(ERROR_MESSAGE.zipcode),
	body("country").trim().stripLow().isLength({ min: 1 }).withMessage(ERROR_MESSAGE.country),
	body("firstname").trim().stripLow().isLength({ min: 2, max: 128 }).withMessage(ERROR_MESSAGE.firstname),
	body("lastname").trim().stripLow().isLength({ min: 2, max: 128 }).withMessage(ERROR_MESSAGE.lastname)
];
