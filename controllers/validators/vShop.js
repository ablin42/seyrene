const {body, sanitizeBody} = require('express-validator');

module.exports.vShop = [
        sanitizeBody('title', 'content').trim().stripLow(),
        body('title')
        .isLength({ min: 1, max: 256}).withMessage("Title must be 256 characters max and not empty"),
        body('content')
        .trim()
        .isLength({ min: 1, max: 2048}).withMessage("Content must be 2048 characters max and not empty"),
];