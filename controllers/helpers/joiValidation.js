const Joi = require('@hapi/joi');

const registerValidation = (data) => {
    const schema = Joi.object({
        name: Joi.string()
                .alphanum()
                .min(4)
                .max(30)
                .required()
                .error(new Error('Userame must contain between 4 and 30 characters, alphanumeric')),
        email: Joi.string()
                .min(3)
                .max(256)
                .required()
                .email()
                .error(new Error('Email must contain between 3 and 256 characters, with a valid format')),
        password: Joi.string()
                .min(8)
                .max(256)
                .pattern(/^(((?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(.{8,})/)
                .required()
                .error(new Error('Password must contain between 8 and 256 characters and has to be atleast alphanumeric')),
        password2: Joi.ref('password')
                //.error(new Error('Passwords not matching'))
    });
    return schema.validate(data);
}

const loginValidation = (data) => {
        const schema = Joi.object({
        email: Joi.string()
                .required()
                .min(1)
                .max(256)
                .email()
                .error(new Error('Email must contain between 1 and 256 characters, with a valid format')),
        password: Joi.string()
                .min(1)
                .max(256)
                .required()
                .error(new Error('Password must contain between 1 and 256')),
    });
    return schema.validate(data);
}

const nameValidation = (data) => {
        const schema = Joi.object({
                name: Joi.string()
                        .alphanum()
                        .min(4)
                        .max(30)
                        .required()
                        .error(new Error('Userame must contain between 4 and 30 characters, alphanumeric'))
        });
        return schema.validate(data);
}

const emailValidation = (data) => {
        const schema = Joi.object({
                email: Joi.string()
                        .email()
                        .min(3)
                        .max(256)
                        .required()
                        .error(new Error('Email must contain between 3 and 256 characters, with a valid format'))
        });
        return schema.validate(data);
}

const pwValidation = (data) => {
        const schema = Joi.object({
                cpassword: Joi.string()
                        .min(1)
                        .max(256)
                        .required()
                        .error(new Error('Current password is required')),
                password: Joi.string()
                        .min(8)
                        .max(256)
                        .pattern(/^(((?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(.{8,})/)
                        .required()
                        .error(new Error('Password must contain between 8 and 256 characters and has to be atleast alphanumeric')),
                password2: Joi.ref('password')
                        .error(new Error('Passwords not matching'))
        });
        return schema.validate(data);
}

const blogValidation = (data) => {
        const schema = Joi.object({
                authorId: Joi.string()
                        .min(1)
                        .max(256)
                        .required()
                        .error(new Error("An error occured, make sure you're logged in")),
                title: Joi.string()
                        .min(4)
                        .max(256)
                        .required()
                        .error(new Error('Title must contain between 4 and 256 characters')),
                content: Joi.string()
                        .min(128)
                        .max(4096)
                        .required()
                        .error(new Error('Content must contain between 128 and 4096 characters')),
        });
        return schema.validate(data);
}

const contactValidation = (data) => {
        const schema = Joi.object({
                name: Joi.string()
                        .alphanum()
                        .min(4)
                        .max(30)
                        .required()
                        .error(new Error('Userame must contain between 4 and 30 characters, alphanumeric')),
                email: Joi.string()
                        .min(3)
                        .max(256)
                        .required()
                        .email()
                        .error(new Error('Email must contain between 3 and 256 characters, with a valid format')),
                title: Joi.string()
                        .min(10)
                        .max(256)
                        .required()
                        .error(new Error('Title must contain between 10 and 256 characters')),
                content: Joi.string()
                        .min(64)
                        .max(2048)
                        .required()
                        .error(new Error('Content must contain between 64 and 2048 characters'))
        });
        return schema.validate(data);
}

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
}
   
module.exports.registerValidation = registerValidation;
module.exports.loginValidation = loginValidation;
module.exports.nameValidation = nameValidation;
module.exports.emailValidation = emailValidation;
module.exports.pwValidation = pwValidation;
module.exports.blogValidation = blogValidation;
module.exports.contactValidation = contactValidation;
module.exports.galleryValidation = galleryValidation;