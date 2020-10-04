const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const sanitize = require("mongo-sanitize");
const mime = require("mime-types");
const aws = require("aws-sdk");
aws.config.region = process.env.AWS_REGION;

const Front = require("../models/Front");
const { ROLE, errorHandler, setUser, authUser, authRole, authToken } = require("./helpers/middlewares");
const utils = require("./helpers/utils");
const { ERROR_MESSAGE } = require("./helpers/errorMessages");
const upload = require("./helpers/multerHelpers");
const { fullLog, threatLog } = require("./helpers/log4");
require("dotenv").config();

router.get("/", authToken, async (req, res) => {
	try {
		let [err, result] = await utils.to(Front.find());
		if (err) throw new Error(ERROR_MESSAGE.fetchError);

		return res.status(200).json({ error: false, data: result });
	} catch (err) {
		threatLog.error("FETCHING FRONT ERROR:", err, req.headers, req.ipAddress);
		return res.status(200).json({ error: true, message: err.message });
	}
});

router.post("/post", upload, errorHandler, setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		if (req.body.referenceId >= 0 && req.body.referenceId <= 4) {
			let imgData = await utils.parseImgData(req.files);
			let mimetype = mime.lookup(imgData[0].path);
			let path = imgData[0].path;
			let key = imgData[0].key;
			let front = {
				null: false,
				referenceId: req.body.referenceId,
				mimetype: mimetype,
				path: path,
				key: key
			};

			let [err, result] = await utils.to(Front.findOne({ referenceId: front.referenceId }));
			if (err) throw new Error(ERROR_MESSAGE.serverError);

			if (result === null) {
				let newFront = new Front(front);

				[err, result] = await utils.to(newFront.save());
				if (err) throw new Error(ERROR_MESSAGE.updateError);
			} else {
				[err, result] = await utils.to(
					Front.findOneAndUpdate(
						{ referenceId: front.referenceId },
						{ $set: { null: false, path: path, mimetype: mimetype, key: key } }
					)
				);
				if (err) throw new Error(ERROR_MESSAGE.updateError);
			}
			fullLog.info(`Front posted: ${req.body.referenceId}`);
			return res.status(200).json({ error: false, message: ERROR_MESSAGE.itemUploaded });
		} else throw new Error(ERROR_MESSAGE.incorrectInput);
	} catch (err) {
		threatLog.error("POST FRONT ERROR", err, req.headers, req.ipAddress);
		return res.status(400).json({ error: true, message: err.message });
	}
});

router.post("/delete/:id", setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		let id = sanitize(req.params.id);

		let [err, front] = await utils.to(Front.findOneAndUpdate({ referenceId: id }, { $set: { null: true } }));
		if (err) throw new Error(ERROR_MESSAGE.delImg);

		let s3 = new aws.S3();
		let params = { Bucket: process.env.S3_BUCKET, Key: front.key };
		s3.deleteObject(params, function (err, data) {
			if (err) throw new Error(ERROR_MESSAGE.delImg);
		});

		fullLog.info(`Front deleted: ${id}`);
		return res.status(200).json({ error: false, message: ERROR_MESSAGE.itemDeleted });
	} catch (err) {
		threatLog.error("DELETE FRONT ERROR", err, req.headers, req.ipAddress);
		return res.status(400).json({ error: true, message: err.message });
	}
});

const Image = require("../models/Image");

/* BIO */
router.post("/bio", upload, errorHandler, setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		let imgData = await utils.parseImgData(req.files);
		let path = imgData[0].path,
			mimetype = mime.lookup(imgData[0].path),
			key = imgData[0].key;

		let [err, savedImage] = await utils.to(
			Image.findOneAndUpdate(
				{ itemType: "biopic", isMain: true, _itemId: "biopic" },
				{ $set: { path: path, mimetype: mimetype, key: key, itemType: "biopic", isMain: true, _itemId: "biopic" } },
				{ upsert: true }
			)
		);
		if (err || !savedImage) return ERROR_MESSAGE.saveError;
		let s3 = new aws.S3();
		let params = { Bucket: process.env.S3_BUCKET, Key: savedImage.key };
		s3.deleteObject(params, function (err, data) {
			if (err) throw new Error(ERROR_MESSAGE.delImg);
		});

		fullLog.info("Bio image updated");
		return res.status(200).json({ error: false, message: "Image biographique modifiée" });
	} catch (err) {
		threatLog.error("BIO IMG UPDATE ERROR", err, req.headers, req.ipAddress);
		return res.status(400).json({ error: true, message: err.message });
	}
});

module.exports = router;
