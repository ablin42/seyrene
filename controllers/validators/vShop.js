const { body } = require("express-validator");

module.exports.vShop = [
	body("title")
		.trim()
		.not()
		.isEmpty()
		.withMessage("Le titre ne peut pas être vide")
		.isLength({ min: 4, max: 256 })
		.withMessage("Le titre doit faire 256 caractères maximum"),
	body("content")
		.trim()
		.not()
		.isEmpty()
		.withMessage("La description ne peut pas être vide")
		.isLength({ max: 2048 })
		.withMessage("La description doit faire 2048 caractères maximum"),
	body("price")
		.toFloat()
		.trim()
		.not()
		.isEmpty()
		.withMessage("Le prix ne peut pas être vide")
		.isCurrency({
			require_symbol: false,
			allow_negatives: false,
			parens_for_negatives: false,
			negative_sign_before_digits: false,
			negative_sign_after_digits: false,
			allow_negative_sign_placeholder: false,
			thousands_separator: ",",
			decimal_separator: ".",
			allow_decimal: true,
			require_decimal: false,
			digits_after_decimal: [2],
			allow_space_after_digits: false
		})
		.withMessage("Le prix doit être un nombre positif")
];
