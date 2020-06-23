const { body, sanitizeBody } = require("express-validator");

module.exports.vBlog = [
	sanitizeBody("title").trim().stripLow(),
	body("title").isString().isLength({ min: 4, max: 256 }).withMessage("Title must contain between 4 and 256 characters"),
	body("content").isString().trim().isLength({ min: 128 }).withMessage("Content must contain minimum 128 characters")
];
