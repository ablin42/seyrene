const { body } = require("express-validator");

module.exports.vGallery = [
	body("title")
		.trim()
		.not()
		.isEmpty()
		.withMessage("Le titre ne peut pas être vide")
		.isLength({ max: 256 })
		.withMessage("Le titre doit faire 256 caractères maximum"),
	body("content")
		.trim()
		.not()
		.isEmpty()
		.withMessage("La description ne peut pas être vide")
		.isLength({ max: 4096 })
		.withMessage("La description doit faire 4096 caractères maximum")
];
