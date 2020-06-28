const { body, sanitizeBody } = require("express-validator");

module.exports.vBlog = [
	sanitizeBody("title").trim().stripLow(),
	body("title")
		.isString()
		.isLength({ min: 1, max: 256 })
		.withMessage("Le titre ne doit pas être vide et doit faire 256 caractères maximum"),
	body("content").isString().trim().isLength({ min: 128 }).withMessage("Le contenu doit faire au minimum 128 caractères")
];
