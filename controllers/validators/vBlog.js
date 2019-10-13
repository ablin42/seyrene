const {body, sanitizeBody} = require('express-validator');

module.exports.vBlog = [
    sanitizeBody('title').trim().stripLow(),
    body('title')
    .isLength({ min: 4, max: 256}).withMessage('Title must contain between 4 and 256 characters'),
    body('content')
    .trim()
    .isLength({ min: 128, max: 4096}).withMessage('Content must contain between 128 and 4096 characters')
];