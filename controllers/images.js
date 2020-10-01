const express = require("express");
const router = express.Router();
const fs = require("fs");
const sanitize = require("mongo-sanitize");

const { ROLE, setUser, authUser, authRole, authToken } = require("./helpers/middlewares");
const Image = require("../models/Image");
const utils = require("./helpers/utils");
const { ERROR_MESSAGE } = require("./helpers/errorMessages");
const { fullLog, threatLog } = require("./helpers/log4");
const aws = require("aws-sdk");
aws.config.region = "eu-west-3";
/*
router.get("/sign-s3", (req, res) => {
	try {
		const s3 = new aws.S3();
		const fileName = req.query["file-name"];
		const fileType = req.query["file-type"];
		const s3Params = {
			Bucket: process.env.S3_BUCKET,
			Key: fileName,
			Expires: 60,
			ContentType: fileType,
			ACL: "public-read"
		};

		s3.getSignedUrl("putObject", s3Params, (err, data) => {
			if (err) throw new Error("An error occured while signing the file!");
			const returnData = {
				signedRequest: data,
				url: `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${fileName}`
			};

			return res.status(200).json({ error: false, data: returnData });
		});
	} catch (err) {
		threatLog.error("SIGN S3 ERROR:", err, req.headers, req.ipAddress);
		return res.status(200).json({ error: true, message: err.message });
	}
});*/

router.get("/:id", async (req, res) => {
	try {
		let id = sanitize(req.params.id);

		let [err, result] = await utils.to(Image.findById(id));
		if (err) throw new Error(ERROR_MESSAGE.fetchImg);
		if (!result) throw new Error(ERROR_MESSAGE.noResult);

		fs.readFile(result.path, function (err, data) {
			if (err) return res.status(400).json({ error: true, message: ERROR_MESSAGE.readFile });
			let contentType = { "Content-Type": result.mimetype };

			res.writeHead(200, contentType);
			return res.status(200).end(data);
		});
	} catch (err) {
		threatLog.error("IMAGE FETCH ERROR", err, req.headers, req.ipAddress);
		return res.status(400).json({ error: true, message: err.message });
	}
});

router.get("/main/:itemType/:itemId", async (req, res) => {
	try {
		let id = sanitize(req.params.itemId),
			itemType = sanitize(req.params.itemType);

		let [err, result] = await utils.to(Image.findOne({ itemType: itemType, _itemId: id, isMain: true }));
		if (err) throw new Error(ERROR_MESSAGE.fetchImg);
		if (!result) throw new Error(ERROR_MESSAGE.noResult);

		fs.readFile(result.path, function (err, data) {
			if (err) return res.status(400).json({ error: true, message: ERROR_MESSAGE.readFile });
			let contentType = { "Content-Type": result.mimetype };

			res.writeHead(200, contentType);
			return res.status(200).end(data);
		});
	} catch (err) {
		threatLog.error("IMAGE FETCH ERROR", err, req.headers, req.ipAddress);
		return res.status(400).json(err.message);
	}
});

router.post("/select/:itemType/:itemId/:id", setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		let id = sanitize(req.params.id);
		let itemType = sanitize(req.params.itemType);
		let itemId = sanitize(req.params.itemId);

		let [err, result] = await utils.to(
			Image.updateMany({ _itemId: itemId, itemType: itemType, isMain: true }, { $set: { isMain: false } })
		);
		if (err) throw new Error(ERROR_MESSAGE.updateError);

		[err, result] = await utils.to(
			Image.findOneAndUpdate({ _id: id, _itemId: itemId, itemType: itemType }, { $set: { isMain: true } })
		);
		if (err || !result) throw new Error(ERROR_MESSAGE.updateError);

		fullLog.info(`Main image selected: ${itemType}/${itemId}/${id}`);
		return res.status(200).json({ err: false, message: "Nouvelle image principale définie" });
	} catch (err) {
		threatLog.error("IMAGE SELECT MAIN ERROR", err, req.headers, req.ipAddress);
		return res.status(400).json({ err: true, message: err.message });
	}
});

router.post("/delete/:id", setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		let id = sanitize(req.params.id);
		let err, find, result;

		[err, find] = await utils.to(Image.findOne({ _id: id }));
		if (err || !find) throw new Error(ERROR_MESSAGE.noResult);
		if (find.isMain === true) throw new Error(ERROR_MESSAGE.mainImgDel);

		[err, result] = await utils.to(Image.deleteOne({ _id: id }));
		if (err || !result) throw new Error(ERROR_MESSAGE.delImg);
		fs.unlink(find.path, err => {
			if (err) throw new Error(ERROR_MESSAGE.delImg);
		});

		fullLog.info(`Image deleted: ${id}`);
		return res.status(200).json({ err: false, message: ERROR_MESSAGE.itemDeleted });
	} catch (err) {
		threatLog.error("IMAGE DELETE ERROR", err, req.headers, req.ipAddress);
		return res.status(400).json({ err: true, message: err.message });
	}
});

router.get("/:itemType/:itemId", authToken, async (req, res) => {
	try {
		let itemId = sanitize(req.params.itemId),
			itemType = sanitize(req.params.itemType);

		let [err, result] = await utils.to(Image.find({ itemType: itemType, _itemId: itemId }).sort({ isMain: -1 }));
		if (err) throw new Error(ERROR_MESSAGE.fetchImg);

		return res.status(200).json({ error: false, images: result });
	} catch (err) {
		threatLog.error("IMAGES FETCH ERROR", err, req.headers, req.ipAddress);
		return res.status(200).json({ error: true, message: err.message });
	}
});

module.exports = router;
