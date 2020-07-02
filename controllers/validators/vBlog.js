const { body } = require("express-validator");

module.exports.vBlog = [
	body("title")
		.trim()
		.not()
		.isEmpty()
		.withMessage("Le titre ne peut pas être vide")
		.isLength({ max: 256 })
		.withMessage("Le titre ne doit pas être vide et doit faire 256 caractères maximum"),
	body("content")
		.trim()
		.not()
		.isEmpty()
		.withMessage("Le contenu ne peut pas être vide")
		.isLength({ min: 128 })
		.withMessage("Le contenu doit faire au minimum 128 caractères")
];
