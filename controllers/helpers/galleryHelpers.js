const multer = require("multer");
const imageType = require("image-type");
const { ERROR_MESSAGE } = require("./errorMessages");

module.exports = {
	sanitizeFile: function (req, file, cb) {
		console.log("IN HELPER");
		let fileExts = ["png", "jpg", "jpeg", "gif"];
		let isAllowedExt = fileExts.includes(file.originalname.split(".")[1].toLowerCase());
		let isAllowedMimeType = file.mimetype.startsWith("image/");

		if (isAllowedExt && isAllowedMimeType) return cb(null, true);
		else cb("Error: File type not allowed!");
	},
	multerErr: function (err) {
		try {
			if (err instanceof multer.MulterError) {
				throw new Error(err.message);
			} else if (err) {
				throw new Error(err);
			} else return { err: false };
		} catch (err) {
			throw new Error(err.message);
		}
	},
	parseTags: function (tags) {
		try {
			if (tags != undefined) {
				let parsed = JSON.parse(tags);
				let trimmed = parsed.map(item => {
					return (item = item.trim());
				});

				return trimmed;
			} else return [];
		} catch (err) {
			throw new Error(ERROR_MESSAGE.parseTags);
		}
	}
	/*imgEncode: async function (file) {
		try {
			if (file != undefined) {
				let encode_image = file.buffer.toString("base64");
				let buffer = Buffer.from(encode_image, "base64");
				let type = imageType(buffer);
				if (type != null) {
					let imgInfo = {
						data: buffer,
						contentType: file.mimetype
					};

					return imgInfo;
				} else throw new Error("Something went wrong while encoding your file");
			} else throw new Error("You did not upload an image!");
		} catch (err) {
			throw new Error(err.message);
		}
	}*/
};
