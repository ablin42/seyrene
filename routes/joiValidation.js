const Joi = require('@hapi/joi');

const registerValidation = (data) => {
    const schema = Joi.object({
        name: Joi.string()
                .min(4)
                .max(30)
                .required(),
        email: Joi.string()
                .min(3)
                .max(255)
                .required()
                .email(),
        password: Joi.string()
                .min(6)
                .max(1024)
                .required(),
        password2: Joi.ref('password')
    });
    return schema.validate(data);
}

const loginValidation = (data) => {
        const schema = Joi.object({
        email: Joi.string()
                .required()
                .email(),
        password: Joi.string()
                .required(),
    });
    return schema.validate(data);
}

const nameValidation = (data) => {
        const schema = Joi.object({
                name: Joi.string()
                        .min(4)
                        .max(30)
                        .required()
        });
        return schema.validate(data);
}

const emailValidation = (data) => {
        const schema = Joi.object({
                email: Joi.string()
                        .min(3)
                        .max(255)
                        .required()
                        .email()
        });
        return schema.validate(data);
}

const pwValidation = (data) => {
        const schema = Joi.object({
                cpassword: Joi.string().required(),
                password: Joi.string()
                        .min(6)
                        .max(1024)
                        .required(),
                password2: Joi.ref('password')
        });
        return schema.validate(data);
}

const blogValidation = (data) => {
        const schema = Joi.object({
                authorId: Joi.string().required(),
                title: Joi.string()
                        .min(6)
                        .max(128)
                        .required(),
                content: Joi.string()
                        .required(),
        });
        return schema.validate(data);
}

const contactValidation = (data) => {
        const schema = Joi.object({
                name: Joi.string()
                        .min(4)
                        .max(30)
                        .required(),
                email: Joi.string()
                        .min(3)
                        .max(255)
                        .required()
                        .email(),
                title: Joi.string()
                        .min(10)
                        .max(255)
                        .required(),
                content: Joi.string()
                        .min(100)
                        .max(1028)
                        .required()
        });
        return schema.validate(data);
}

const galleryValidation = (data) => {
        const schema = Joi.object({
                title: Joi.string()
                        .required(),
                content: Joi.string()
                        .required(),
                imgPath: Joi.string(),
                tags: Joi.array()
        });
        return schema.validate(data);
}
   
module.exports.registerValidation = registerValidation;
module.exports.loginValidation = loginValidation;
module.exports.nameValidation = nameValidation;
module.exports.emailValidation = emailValidation;
module.exports.pwValidation = pwValidation;
module.exports.blogValidation = blogValidation;
module.exports.contactValidation = contactValidation;
module.exports.galleryValidation = galleryValidation;