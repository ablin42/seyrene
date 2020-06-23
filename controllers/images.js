const express = require("express");
const router = express.Router();
const fs = require("fs");
const sanitize = require("mongo-sanitize");

const { ROLE, setUser, authUser, authRole } = require("./helpers/verifySession");
const Image = require("../models/Image");
const utils = require("./helpers/utils");
const { ERROR_MESSAGE } = require("./helpers/errorMessages");

router.get("/:id", setUser, async (req, res) => {
	try {
		let id = sanitize(req.params.id);

		let [err, result] = await utils.to(Image.findById(id));
		if (err) throw new Error(ERROR_MESSAGE.fetchImg);
		if (result == null) throw new Error(ERROR_MESSAGE.noResult);

		fs.readFile(result.path, function (err, data) {
			if (err) return res.status(400).json({ error: true, message: ERROR_MESSAGE.readFile });
			let contentType = { "Content-Type": result.mimetype };

			res.writeHead(200, contentType);
			return res.status(200).end(data);
		});
	} catch (err) {
		console.log("IMAGE FETCH ERROR", err);
		return res.status(400).json({ error: true, message: err.message });
	}
});

router.get("/main/:itemType/:itemId", setUser, async (req, res) => {
	try {
		let id = sanitize(req.params.itemId),
			itemType = sanitize(req.params.itemType);

		let [err, result] = await utils.to(Image.findOne({ itemType: itemType, _itemId: id, isMain: true }));
		if (err) throw new Error(ERROR_MESSAGE.fetchImg);
		if (result == null) throw new Error(ERROR_MESSAGE.noResult);

		fs.readFile(result.path, function (err, data) {
			if (err) return res.status(400).json({ error: true, message: ERROR_MESSAGE.readFile });
			let contentType = { "Content-Type": result.mimetype };
			res.writeHead(200, contentType);
			res.status(200).end(data);
		});
	} catch (err) {
		console.log("IMAGE FETCH ERROR", err);
		return res.status(400).json(err.message);
	}
});

router.get("/select/:itemType/:itemId/:id", setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		let id = sanitize(req.params.id);
		let itemType = sanitize(req.params.itemType);
		let itemId = sanitize(req.params.itemId);

		//set old main to false, set new one to true
		let [err, result] = await utils.to(
			Image.updateMany({ _itemId: itemId, itemType: itemType, isMain: true }, { $set: { isMain: false } })
		);
		if (err) throw new Error(ERROR_MESSAGE.updateError);

		[err, result] = await utils.to(Image.findOneAndUpdate({ _id: id }, { $set: { isMain: true } }));
		if (err) throw new Error(ERROR_MESSAGE.updateError);

		return res.status(200).json({ err: false, message: "Nouvelle image principale définie" });
	} catch (err) {
		console.log("IMAGE SELECT MAIN ERROR", err);
		return res.status(400).json({ err: true, message: err.message });
	}
});

router.get("/delete/:id", setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		let id = sanitize(req.params.id);
		let err, find, result, deleted;

		[err, find] = await utils.to(Image.findOne({ _id: id }));
		if (err) throw new Error(ERROR_MESSAGE.noResult);

		[err, result] = await utils.to(Image.deleteOne({ _id: id, isMain: false }));
		if (err) throw new Error(ERROR_MESSAGE.delImg);
		if (result.n === 1) {
			fs.unlink(find.path, err => {
				if (err) throw new Error(ERROR_MESSAGE.delImg);
			});
		}

		if (result.n === 0) {
			if (find && find.itemType === "Blog") {
				// check later but i think this is never entered!!!!!!
				[err, deleted] = await utils.to(Image.deleteOne({ _id: id }));
				if (deleted.n === 1) {
					fs.unlink(find.path, err => {
						if (err) throw new Error(ERROR_MESSAGE.delImg);
					});
				}
				if (err) throw new Error(ERROR_MESSAGE.delImg);
			} else throw new Error(ERROR_MESSAGE.mainImgDel);
		}

		return res.status(200).json({ err: false, message: ERROR_MESSAGE.itemDeleted });
	} catch (err) {
		console.log("IMAGE DELETE ERROR", err);
		return res.status(400).json({ err: true, message: err.message });
	}
});

router.get("/:itemType/:itemId", setUser, async (req, res) => {
	try {
		let itemId = sanitize(req.params.itemId),
			itemType = sanitize(req.params.itemType);

		let [err, result] = await utils.to(Image.find({ itemType: itemType, _itemId: itemId }).sort({ isMain: -1 }));
		if (err) throw new Error(ERROR_MESSAGE.fetchImg);
		//if (result == null || result.length < 1)
		//  throw new Error(ERROR_MESSAGE.noResult);

		return res.status(200).json(result);
	} catch (err) {
		console.log("IMAGES FETCH ERROR", err);
		return res.status(200).json({ error: true, message: err.message });
	}
});

module.exports = router;
