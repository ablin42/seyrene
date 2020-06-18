const {body, sanitizeBody} = require("express-validator");
const utils = require("../helpers/utils");

module.exports.vRegister = [
	sanitizeBody("name", "email").trim().stripLow(),
	body("name")
		.isLength({ min: 4, max: 30}).withMessage("Userame must contain between 4 and 30 characters")
		.matches(/^[a-z0-9 \-_àâçéèêëîïôûùüÿñæœ]+$/i).withMessage("Userame must be alphanumeric")
		.custom(value => {
			return utils.nameExist(value).then(user => {
				if (user) 
					return Promise.reject("An account already exist with this username");
			});
		}),
	body("email")
		.isEmail().withMessage("Email must be valid")
		.bail()
		.isLength({ min: 3, max: 256 }).withMessage("Email must be 256 characters max")
		.custom(value => {
			return utils.emailExist(value).then(email => {
				if (email) 
					return Promise.reject("An account already exist with this e-mail");
			});
		}),
	body("password")
		.isLength({ min: 8, max: 256 }).withMessage("Password must contain between 8 and 256 characters")
		.matches(/^(((?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(.{8,})/).withMessage("Password must be atleast alphanumeric"),
	body("password2")
		.custom((value, { req }) => {
			if (value !== req.body.password) 
				throw new Error("Password confirmation does not match password");
			return true;
		})
];

module.exports.vLogin = [
	sanitizeBody("email").trim().stripLow(),
	body("email")
		.isEmail().withMessage("Email must be valid")
		.bail()
		.custom(value => {
			return utils.emailExist(value).then(email => {
				if (!email) 
					return Promise.reject("Invalid credentials");
			});
		}),
	body("password")
		.isLength({ min: 1, max: 256}).withMessage("Password must be 256 characters max and not empty")
];