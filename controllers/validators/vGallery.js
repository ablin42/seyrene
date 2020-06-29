const { body } = require("express-validator");

module.exports.vGallery = [
	body("title", "content").trim().stripLow(),
	body("title").isLength({ min: 1, max: 256 }).withMessage("Le titre ne doit pas être vide et doit faire 256 caractères maximum"),
	body("content")
		.trim()
		.isLength({ min: 1, max: 2048 })
		.withMessage("Le contenu ne doit pas être vide et doit faire 2048 caractères maximum")
];
