const { body, sanitizeBody } = require("express-validator");
const utils = require("../helpers/utils");

module.exports.vName = [
	sanitizeBody("name").trim().stripLow(),
	body("name")
		.isLength({ min: 4, max: 30 })
		.withMessage("Userame must contain between 4 and 30 characters")
		.matches(/^[a-z0-9 \-_àâçéèêëîïôûùüÿñæœ]+$/i)
		.withMessage("Userame must be alphanumeric")
		.bail()
		.custom(value => {
			return utils.nameExist(value).then(user => {
				if (user) return Promise.reject("An account already exist with this username");
			});
		})
];

module.exports.vEmail = [
	sanitizeBody("email").trim().stripLow(),
	body("email")
		.isEmail()
		.withMessage("Email must be valid")
		.bail()
		.isLength({ min: 3, max: 256 })
		.withMessage("Email must be 256 characters max")
		.custom(value => {
			return utils.emailExist(value).then(email => {
				if (email) return Promise.reject("An account already exist with this e-mail");
			});
		})
];

module.exports.vPassword = [
	body("password")
		.isLength({ min: 8, max: 256 })
		.withMessage("Password must contain between 8 and 256 characters")
		.matches(/^(((?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(.{8,})/)
		.withMessage("Password must be atleast alphanumeric"),
	body("password2").custom((value, { req }) => {
		if (value !== req.body.password) throw new Error("Password confirmation does not match password");
		return true;
	})
];

module.exports.vLostPw = [
	sanitizeBody("email").trim().stripLow(),
	body("email")
		.isEmail()
		.withMessage("Email must be valid")
		.bail()
		.isLength({ min: 3, max: 256 })
		.withMessage("Email must be 256 characters max")
		.custom(value => {
			return utils.emailExist(value).then(email => {
				if (!email) return Promise.reject("No account is registered with this e-mail address");
			});
		})
];

module.exports.vDelivery = [
	//removed street nb
	//phone and full name
	body("fulltext_address").trim().stripLow().isLength({ min: 1 }).withMessage("Address cannot be empty!"),
	body("street_name").trim().stripLow().isLength({ min: 1 }).withMessage("Street name cannot be empty!"),
	body("city").trim().stripLow().isLength({ min: 1 }).withMessage("City cannot be empty!"),
	body("state").trim().stripLow().isLength({ min: 1 }).withMessage("State cannot be empty!"),
	body("postal_code").trim().stripLow().isLength({ min: 1 }).withMessage("Postal code cannot be empty!"),
	body("country").trim().stripLow().isLength({ min: 1 }).withMessage("Country cannot be empty!"),
	body("firstname")
		.trim()
		.stripLow()
		.isLength({ min: 2, max: 128 })
		.withMessage("First Name must contain between 8 and 256 characters"),
	body("lastname")
		.trim()
		.stripLow()
		.isLength({ min: 2, max: 128 })
		.withMessage("Last Name must contain between 8 and 256 characters")
	// body('street_number').isNumeric().withMessage("Street number can only contain numbers")
	//.isLength({min: 1}).withMessage("Street number cannot be empty!"),
];
