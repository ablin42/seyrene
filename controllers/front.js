const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const sanitize = require("mongo-sanitize");

const Front = require("../models/Front");
const { ROLE, errorHandler, setUser, authUser, authRole, authToken } = require("./helpers/middlewares");
const utils = require("./helpers/utils");
const { ERROR_MESSAGE } = require("./helpers/errorMessages");
const upload = require("./helpers/multerHelpers");
const { fullLog, threatLog } = require("./helpers/log4");

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

router.get("/image/:id", async (req, res) => {
	try {
		let id = sanitize(req.params.id);

		let [err, result] = await utils.to(Front.findOne({ _id: id }));
		if (err) throw new Error(ERROR_MESSAGE.fetchImg);
		if (!result) throw new Error(ERROR_MESSAGE.noResult);

		fs.readFile(result.path, function (err, data) {
			if (err) throw new Error(ERROR_MESSAGE.readFile);
			let contentType = { "Content-Type": result.mimetype };

			res.writeHead(200, contentType);
			return res.status(200).end(data);
		});
	} catch (err) {
		threatLog.error("FRONT IMAGE ERROR", err, req.headers, req.ipAddress);
		return res.status(400).json(err.message);
	}
});

router.post("/post", upload, errorHandler, setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		if (req.body.referenceId >= 0 && req.body.referenceId <= 4) {
			let front = { null: false, referenceId: req.body.referenceId };

			let [err, result] = await utils.to(Front.findOne({ referenceId: front.referenceId }));
			if (err) throw new Error(ERROR_MESSAGE.serverError);

			if (result === null) {
				let newFront = new Front(front);
				newFront.mimetype = req.files[0].mimetype;
				let oldpath = req.files[0].destination + req.files[0].filename;
				let newpath = req.files[0].destination + newFront._id + path.extname(req.files[0].originalname);
				fs.rename(oldpath, newpath, err => {
					if (err) throw new Error(err);
				});
				newFront.path = newpath;

				[err, result] = await utils.to(newFront.save());
				if (err) throw new Error(ERROR_MESSAGE.updateError);
			} else {
				let oldpath = req.files[0].destination + req.files[0].filename;
				let newpath = req.files[0].destination + result._id + path.extname(req.files[0].originalname);
				fs.rename(oldpath, newpath, err => {
					if (err) throw new Error(err);
				});
				[err, result] = await utils.to(
					Front.findOneAndUpdate(
						{ referenceId: front.referenceId },
						{ $set: { null: false, path: newpath, mimetype: req.files[0].mimetype } }
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
		fs.unlink(front.path, err => {
			if (err) throw new Error(ERROR_MESSAGE.delImg);
		});

		fullLog.info(`Front deleted: ${id}`);
		return res.status(200).json({ error: false, message: ERROR_MESSAGE.itemDeleted });
	} catch (err) {
		threatLog.error("DELETE FRONT ERROR", err, req.headers, req.ipAddress);
		return res.status(400).json({ error: true, message: err.message });
	}
});

/* BIO */
router.post("/bio", upload, errorHandler, setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		let oldpath = req.files[0].destination + req.files[0].filename;
		let newpath = req.files[0].destination + "biopic.png";

		fs.rename(oldpath, newpath, err => {
			if (err) throw new Error(err);
		});

		fullLog.info("Bio image updated");
		return res.status(200).json({ error: false, message: "Image biographique modifiée" });
	} catch (err) {
		threatLog.error("BIO IMG UPDATE ERROR", err, req.headers, req.ipAddress);
		return res.status(400).json({ error: true, message: err.message });
	}
});

module.exports = router;
