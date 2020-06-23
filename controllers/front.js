const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sanitize = require("mongo-sanitize");

const Front = require("../models/Front");
const { ROLE, setUser, authUser, authRole } = require("./helpers/verifySession");
const gHelpers = require("./helpers/galleryHelpers");
const utils = require("./helpers/utils");
const { ERROR_MESSAGE } = require("./helpers/errorMessages");

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
		fileSize: 100000000
	},
	fileFilter: function (req, file, cb) {
		gHelpers.sanitizeFile(req, file, cb);
	}
}).single("img");

router.get("/", setUser, async (req, res) => {
	try {
		let [err, result] = await utils.to(Front.find());
		if (err) throw new Error(ERROR_MESSAGE.fetchError);

		return res.status(200).json({ error: false, data: result });
	} catch (err) {
		console.log("FETCHING FRONT ERROR:", err);
		return res.status(200).json({ error: true, message: err.message });
	}
});

router.post("/post", upload, setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		if (req.body.referenceId >= 0 && req.body.referenceId <= 4) {
			let front = { null: false, referenceId: req.body.referenceId };

			let [err, result] = await utils.to(Front.findOne({ referenceId: front.referenceId }));
			if (err) throw new Error(ERROR_MESSAGE.serverError);

			if (result === null) {
				let newFront = new Front(front);
				newFront.mimetype = req.file.mimetype;
				let oldpath = req.file.destination + req.file.filename;
				let newpath = req.file.destination + newFront._id + path.extname(req.file.originalname);
				fs.rename(oldpath, newpath, err => {
					if (err) throw new Error(err);
				});
				newFront.path = newpath;

				[err, result] = await utils.to(newFront.save());
				if (err) throw new Error(ERROR_MESSAGE.updateError);
			} else {
				let oldpath = req.file.destination + req.file.filename;
				let newpath = req.file.destination + result._id + path.extname(req.file.originalname);
				fs.rename(oldpath, newpath, err => {
					if (err) throw new Error(err);
				});
				[err, result] = await utils.to(
					Front.findOneAndUpdate(
						{ referenceId: front.referenceId },
						{ $set: { null: false, path: newpath, mimetype: req.file.mimetype } }
					)
				);
				if (err) throw new Error(ERROR_MESSAGE.updateError);
			}
			return res.status(200).json({ error: false, message: ERROR_MESSAGE.itemUploaded });
		} else throw new Error(ERROR_MESSAGE.incorrectInput);
	} catch (err) {
		console.log("POST FRONT ERROR", err);
		return res.status(400).json({ error: true, message: err.message });
	}
});

//delete item using its id
router.get("/delete/:id", setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		let id = sanitize(req.params.id);

		let [err, front] = await utils.to(Front.findOneAndUpdate({ referenceId: id }, { $set: { null: true } }));
		if (err) throw new Error(ERROR_MESSAGE.delImg);
		fs.unlink(front.path, err => {
			if (err) throw new Error(ERROR_MESSAGE.delImg);
		});
		return res.status(200).json({ error: false, message: ERROR_MESSAGE.itemDeleted });
	} catch (err) {
		console.log("DELETE FRONT ERROR", err);
		return res.status(400).json({ error: true, message: err.message });
	}
});

router.get("/image/:id", setUser, async (req, res) => {
	try {
		let id = sanitize(req.params.id);

		let [err, result] = await utils.to(Front.findOne({ _id: id }));
		if (err) throw new Error(ERROR_MESSAGE.fetchImg);

		fs.readFile(result.path, function (err, data) {
			if (err) throw new Error(ERROR_MESSAGE.readFile);
			let contentType = { "Content-Type": result.mimetype };

			res.writeHead(200, contentType);
			return res.status(200).end(data);
		});
	} catch (err) {
		console.log("FRONT IMAGE ERROR", err);
		return res.status(400).json(err.message);
	}
});

module.exports = router;
