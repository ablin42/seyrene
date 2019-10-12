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
        try {
            if (err instanceof multer.MulterError) {
                throw new Error(err.message)
            } else if (err) {
                throw new Error(err)
            }
            else 
                return {err: false};
        } catch (err) {throw new Error(err.message)}
    },
    parseTags: function (tags) {
        try {
            if (tags != undefined) {
                var parsed = JSON.parse(tags);
                trimmed = parsed.map((item) => {
                    return item = item.trim();
                })
                return trimmed;
            }
        else 
            return [];
        } catch (err) {throw new Error("An error occured while parsing your tags, please try again")}
       
    },
    validationCheck: async function (obj) {
        try {
            const {error} = await galleryValidation(obj);
            if (error) 
                throw new Error(error.message);
            return {err: false}
        } catch (err) {
            throw new Error(err.message);
        }
    },
    imgEncode: async function (file) {
        try {
            if (file != undefined) {
                encode_image = file.buffer.toString('base64');
                buffer = Buffer.from(encode_image, 'base64');
                type = imageType(buffer);
                if (type != null) {
                    let imgInfo = {
                            data: buffer,
                            contentType: file.mimetype
                        }
                    return imgInfo;
                } else 
                    throw new Error("Something went wrong while encoding your file");
            } else
                throw new Error("You did not upload an image!");
        } catch (err) {
            throw new Error(err.message);
        }
    }
}


