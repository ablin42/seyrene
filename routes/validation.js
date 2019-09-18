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

module.exports.registerValidation = registerValidation;
module.exports.loginValidation = loginValidation;