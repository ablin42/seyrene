const multer = require("multer");
const utils = require("./utils");
const multerS3 = require("multer-s3");
const shortid = require("shortid");
const aws = require("aws-sdk");
aws.config.region = process.env.AWS_REGION;

const storage = multerS3({
	s3: new aws.S3({
		Bucket: process.env.S3_BUCKET,
		Expires: 60
	}),
	acl: "public-read",
	bucket: process.env.S3_BUCKET,
	contentType: multerS3.AUTO_CONTENT_TYPE,
	key: function (req, file, cb) {
		let ext = "." + file.mimetype.slice(6);
		cb(null, Date.now().toString() + "-" + shortid.generate() + ext);
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
