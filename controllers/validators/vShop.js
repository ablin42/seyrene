const { body, sanitizeBody } = require("express-validator");

module.exports.vShop = [
	sanitizeBody("title", "content", "price").trim().stripLow(),
	body("title").isLength({ min: 1, max: 256 }).withMessage("Le titre ne doit pas être vide et doit faire 256 caractères maximum"),
	body("content")
		.trim()
		.isLength({ min: 1, max: 2048 })
		.withMessage("Le contenu ne doit pas être vide et doit faire 2048 caractères maximum"),
	body("price")
		.isLength({ min: 1 })
		.withMessage("Le prix ne peut être vide")
		.isDecimal()
		.withMessage("Le prix doit être un nombre")
];
