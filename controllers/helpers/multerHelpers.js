const multer = require("multer");
const utils = require("./utils");
const path = require("path");

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, "./public/img/upload/");
	},
	filename: function (req, file, cb) {
		cb(null, Date.now() + path.extname(file.originalname));
	}
});

const upload = multer({
	storage: storage,
	limits: {
		fileSize: 25000000
	},
	fileFilter: function (req, file, cb) {
		utils.sanitizeFile(file, cb);
	}
}).array("img");

module.exports = upload;
