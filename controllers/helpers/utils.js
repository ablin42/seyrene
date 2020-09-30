const pe = require("parse-error");
const path = require("path");
const fs = require("fs");
const User = require("../../models/User");
const Image = require("../../models/Image");
const ERROR_MESSAGE = require("./errorMessages");
const { validationResult } = require("express-validator");
const mime = require("mime-types");

module.exports = {
	emailExist: async function emailExist(email) {
		if (await User.findOne({ email: email })) return true;

		return false;
	},
	nameExist: async function (name) {
		if (await User.findOne({ name: name.toLowerCase() })) return true;

		return false;
	},
	to: function (promise) {
		return promise
			.then(data => {
				return [null, data];
			})
			.catch(err => [pe(err)]);
	},
	sanitizeFile: async function (file, cb) {
		let fileExts = ["png", "jpg", "jpeg", "gif"];
		let isAllowedExt = fileExts.includes(file.originalname.split(".")[1].toLowerCase());
		let isAllowedMimeType = file.mimetype.startsWith("image/");

		if (isAllowedExt && isAllowedMimeType) return cb(null, true);
		else cb("File type not allowed");
	},
	toTitleCase: function (phrase) {
		let arr = phrase.toLowerCase().split(" ");
		let parsed = [];

		arr.forEach(item => {
			let obj = item.charAt(0).toUpperCase() + item.slice(1);
			if (item === "and") obj = "and";
			parsed.push(obj);
		});

		return parsed.join(" ");
	},
	uploadImages: async function (files, itemId, itemType, operation = "save") {
		for (let i = 0; i < files.length; i++) {
			let isMain = false;
			if (i === 0 && operation === "save") isMain = true;

			let image = new Image({
				_itemId: itemId,
				itemType: itemType,
				isMain: isMain,
				mimetype: files[parseInt(i)].mimetype
			});

			let oldpath = files[parseInt(i)].destination + files[parseInt(i)].filename;
			let newpath = files[parseInt(i)].destination + image._id + path.extname(files[parseInt(i)].originalname);
			image.path = newpath;

			fs.rename(oldpath, newpath, err => {
				if (err) return err;
			});

			[err, savedImage] = await this.to(image.save());
			if (err || !savedImage) return ERROR_MESSAGE.saveError;
		}
	},
	saveImages: async function (imgUrl, itemId, itemType, operation = "save") {
		for (let i = 0; i < imgUrl.length; i++) {
			let isMain = false;
			if (i === 0 && operation === "save") isMain = true;

			let image = new Image({
				_itemId: itemId,
				itemType: itemType,
				isMain: isMain,
				path: imgUrl[i],
				mimetype: mime.lookup(imgUrl[i])
			});

			[err, savedImage] = await this.to(image.save());
			if (err || !savedImage) return ERROR_MESSAGE.saveError;
		}
	},
	checkValidity: async function (req) {
		const vResult = validationResult(req);
		if (!vResult.isEmpty()) {
			vResult.errors.forEach(item => {
				throw new Error(item.msg);
			});
		}

		return;
	},
	parseImgUrl: async function (imgUrl) {
		let arr = imgUrl.split(";");
		arr.pop();

		return arr;
	}
};
