const { body } = require("express-validator");
const utils = require("../helpers/utils");
const { ERROR_MESSAGE } = require("../helpers/errorMessages");

module.exports.vName = [
	body("name")
		.trim()
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
	body("email")
		.trim()
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
	body("email")
		.trim()
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
	body("full_address")
		.trim()
		.stripLow()
		.not()
		.isEmpty()
		.withMessage(ERROR_MESSAGE.address)
		.isLength({ max: 300 })
		.withMessage("Input too long"),
	body("street_name")
		.trim()
		.stripLow()
		.not()
		.isEmpty()
		.withMessage(ERROR_MESSAGE.street)
		.isLength({ max: 300 })
		.withMessage("Input too long"),
	body("city")
		.trim()
		.stripLow()
		.not()
		.isEmpty()
		.withMessage(ERROR_MESSAGE.city)
		.isLength({ max: 300 })
		.withMessage("Input too long"),
	body("state")
		.trim()
		.stripLow()
		.not()
		.isEmpty()
		.withMessage(ERROR_MESSAGE.state)
		.isLength({ max: 300 })
		.withMessage("Input too long"),
	body("zipcode")
		.trim()
		.stripLow()
		.not()
		.isEmpty()
		.withMessage(ERROR_MESSAGE.zipcode)
		.isLength({ max: 300 })
		.withMessage("Input too long"),
	body("country")
		.trim()
		.stripLow()
		.not()
		.isEmpty()
		.withMessage(ERROR_MESSAGE.country)
		.isLength({ max: 300 })
		.withMessage("Input too long"),
	body("firstname")
		.trim()
		.stripLow()
		.isLength({ min: 2, max: 128 })
		.withMessage(ERROR_MESSAGE.firstname)
		.isLength({ max: 300 })
		.withMessage("Input too long"),
	body("lastname")
		.trim()
		.stripLow()
		.isLength({ min: 2, max: 128 })
		.withMessage(ERROR_MESSAGE.lastname)
		.isLength({ max: 300 })
		.withMessage("Input too long")
];
