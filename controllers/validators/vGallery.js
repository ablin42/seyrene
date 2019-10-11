const {body, sanitizeBody} = require('express-validator');

module.exports.vGallery = [
    sanitizeBody('title').trim().stripLow(),
    body('title')
    .isLength({ min: 1, max: 256}).withMessage("Title must be 256 characters max and not empty"),
    body('content')
    .isLength({ min: 1, max: 2048}).withMessage("Content must be 2048 characters max and not empty"),
    //body('tags')
];

/*

const galleryValidation = (data) => {
    const schema = Joi.object({
            title: Joi.string()
                    .min(1)
                    .max(256)
                    .required()
                    .error(new Error('Title must contain between 1 and 256 characters')),
            content: Joi.string()
                    .min(1)
                    .max(2048)
                    .required()
                    .error(new Error('Content must contain between 1 and 2048 characters')),
            tags: Joi.array()
                    .items(Joi.string())//image
                    .max(64)
                    .unique()
                    .error(new Error('Tags must be an array of unique elements, 64 max'))
    });
    return schema.validate(data);
}*/