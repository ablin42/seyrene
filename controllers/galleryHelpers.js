const multer = require('multer');
const imageType = require('image-type');
const {galleryValidation} = require('./joiValidation');

module.exports = {
    sanitizeFile: function (req, file, cb) {
        let fileExts = ['png', 'jpg', 'jpeg', 'gif'];
        let isAllowedExt = fileExts.includes(file.originalname.split('.')[1].toLowerCase());
        let isAllowedMimeType = file.mimetype.startsWith("image/");
    
        if(isAllowedExt && isAllowedMimeType)
            return cb(null, true);
        else 
            cb('Error: File type not allowed!');
    }, 
    multerErr: function (err) {
        if (err instanceof multer.MulterError) {
            console.log("MULTER ERROR", err);
            return {url: "/Galerie/Post", msg: err.message, err: true};
        } else if (err) {
            console.log(err)
            return {url: "/Galerie/Post", msg: err, err: true};
        }
        else 
            return {err: false};
    },
    parseTags: function (tags) {
        if (tags != undefined) {
            try {
                return JSON.parse(tags);
            } catch (err) {
                console.log("TAGS ERROR - Could not be parsed:", err);
                return {url: "/Galerie/Post", msg: "Tags not properly formated, please try again", err: true};
            }
        } else {
            return [];
        }
    },
    validationCheck: async function (obj) {
        try {
            const {error} = await galleryValidation(obj);
            if (error) 
                return {url: "/Galerie/Post", msg: error.message, err: true};
            return {err: false}
        } catch (err) {
            console.log("VALIDATION ERROR:", err);
            return {url: "/Galerie/Post", msg: "Something went wrong while validating your data", err: true};
        }
    },
    imgEncode: async function (file) {
        if (file != undefined) {
            try {
                encode_image = file.buffer.toString('base64');
                buffer = Buffer.from(encode_image, 'base64');
                type = imageType(buffer);
                if (type != null) {
                    let imgInfo = {
                        data:  buffer,
                        contentType: file.mimetype
                    }
                    return imgInfo;
                } else 
                    throw new Error('Buffer shows that this file is not actually an image!');
            } catch (err) {
                console.log("IMG ERROR:", err);
                return {url: "/Galerie/Post", msg: "Something went wrong while encoding your file", err: true};
            }
        } else
            return {url: "/Galerie/Post", msg: "You did not upload an image", err: true};
    }
}


