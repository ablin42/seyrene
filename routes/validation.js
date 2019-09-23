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

module.exports.registerValidation = registerValidation;
module.exports.loginValidation = loginValidation;
module.exports.nameValidation = nameValidation;
module.exports.emailValidation = emailValidation;
module.exports.pwValidation = pwValidation;