const { body, sanitizeBody } = require("express-validator");

module.exports.vContact = [
	sanitizeBody("name", "email", "title").trim().stripLow(),
	body("name")
		.isLength({ min: 4, max: 30 })
		.withMessage("Userame must contain between 4 and 30 characters")
		.matches(/^[a-z0-9 \-_àâçéèêëîïôûùüÿñæœ]+$/i)
		.withMessage("Userame must be alphanumeric"),
	body("email")
		.isEmail()
		.withMessage("Email must be valid")
		.bail()
		.isLength({ min: 3, max: 256 })
		.withMessage("Email must be 256 characters max"),
	body("title").isLength({ min: 10, max: 256 }).withMessage("Title must contain between 10 and 256 characters"),
	body("content").trim().isLength({ min: 64, max: 2048 }).withMessage("Content must contain between 64 and 2048 characters")
];
