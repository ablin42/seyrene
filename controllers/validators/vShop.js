const { body, sanitizeBody } = require("express-validator");

module.exports.vShop = [
	sanitizeBody("title", "content", "price").trim().stripLow(),
	body("title").isLength({ min: 1, max: 256 }).withMessage("Title must be 256 characters max and not empty"),
	body("content").trim().isLength({ min: 1, max: 2048 }).withMessage("Content must be 2048 characters max and not empty"),
	body("price").isLength({ min: 1 }).withMessage("Price can't be empty").isDecimal().withMessage("Price has to be a number"),
	body("isUnique").isBoolean().withMessage("Checkbox has to be a boolean")
];
