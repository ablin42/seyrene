const express = require("express");
const router = express.Router();
const { validationResult } = require("express-validator");
const { vGallery } = require("./validators/vGallery");
const path = require("path");
const fs = require("fs");
const rp = require("request-promise");
const sanitize = require("mongo-sanitize");

const Gallery = require("../models/Gallery");
const Image = require("../models/Image");
const { ROLE, setUser, authUser, authRole, authToken } = require("./helpers/verifySession");
const gHelpers = require("./helpers/galleryHelpers");
const utils = require("./helpers/utils");
const upload = require("./helpers/multerHelpers");
const { ERROR_MESSAGE } = require("./helpers/errorMessages");
require("dotenv").config();

router.get("/", async (req, res) => {
	try {
		const options = {
			page: parseInt(req.query.page, 10) || 1,
			limit: 6,
			sort: { date: -1 }
		};
		let [err, result] = await utils.to(Gallery.paginate({}, options));
		if (err) throw new Error(ERROR_MESSAGE.fetchError);

		let galleries = result.docs;
		if (galleries.length == 0) throw new Error(ERROR_MESSAGE.noResult);
		galleries = await gHelpers.fetchMainImg(galleries);

		return res.status(200).json({ error: false, galleries: galleries });
	} catch (err) {
		console.log("FETCHING GALLERIES ERROR:", err);
		return res.status(200).json({ error: true, message: err.message });
	}
});

router.get("/Tags", async (req, res) => {
	try {
		const options = {
			page: parseInt(req.query.page, 10) || 1,
			limit: 6,
			sort: { date: -1 }
		};
		if (req.query.t) var tagsArr = req.query.t.split(",");

		let [err, result] = await utils.to(Gallery.paginate({ tags: { $all: tagsArr } }, options));
		if (err) throw new Error(ERROR_MESSAGE.fetchError);

		let galleries = result.docs;
		if (galleries.length == 0) throw new Error(ERROR_MESSAGE.noResult);

		galleries = await gHelpers.fetchMainImg(galleries);
		return res.status(200).json({ error: false, galleries: galleries });
	} catch (err) {
		console.log("FETCHING GALLERIES BY TAGS ERROR:", err);
		return res.status(200).json({ error: true, message: err.message });
	}
});

router.get("/single/:id", authToken, async (req, res) => {
	try {
		let id = sanitize(req.params.id);

		let [err, result] = await utils.to(Gallery.findById(id));
		if (err || result === null) throw new Error(ERROR_MESSAGE.fetchError);

		return res.status(200).json({ error: false, gallery: result });
	} catch (err) {
		console.log("GALLERY SINGLE ERROR", err);
		return res.status(200).json({ error: true, message: err.message });
	}
});

router.post("/post", vGallery, setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	upload(req, res, async function (err) {
		try {
			if (err) {
				let errMsg = err;
				if (err.message) errMsg = err.message;
				return res.status(400).json({ url: "/", message: errMsg, err: true });
			} else {
				let err, result, savedImage;
				const vResult = validationResult(req);
				if (!vResult.isEmpty()) {
					vResult.errors.forEach(item => {
						throw new Error(item.msg);
					});
				}
				const obj = { title: req.body.title, content: req.body.content };
				obj.tags = gHelpers.parseTags(req.body.tags);

				const gallery = new Gallery(obj);
				[err, result] = await utils.to(gallery.save());
				if (err) throw new Error(ERROR_MESSAGE.saveError);

				for (let i = 0; i < req.files.length; i++) {
					let isMain = false;
					if (i === 0) isMain = true;
					let image = new Image({
						_itemId: result._id,
						itemType: "Gallery",
						isMain: isMain,
						mimetype: req.files[parseInt(i)].mimetype
					});
					let oldpath = req.files[parseInt(i)].destination + req.files[parseInt(i)].filename;
					let newpath = req.files[parseInt(i)].destination + image._id + path.extname(req.files[parseInt(i)].originalname);
					fs.rename(oldpath, newpath, err => {
						if (err) throw new Error(err);
					});
					image.path = newpath;
					[err, savedImage] = await utils.to(image.save());
					if (err) throw new Error(ERROR_MESSAGE.saveError);
				}

				req.flash("success", ERROR_MESSAGE.itemUploadedSelectMain);
				return res.status(200).json({ url: `/Galerie/${result._id}` });
			}
		} catch (err) {
			console.log("POST GALLERY ERROR", err);
			return res.status(400).json({ url: "/", message: err.message, err: true });
		}
	});
});

router.post("/patch/:id", vGallery, setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	upload(req, res, async function (err) {
		try {
			if (err) {
				let errMsg = err;
				if (err.message) errMsg = err.message;
				return res.status(400).json({ url: "/", message: errMsg, err: true });
			} else {
				let err, savedImage, result;
				const vResult = validationResult(req);
				if (!vResult.isEmpty()) {
					vResult.errors.forEach(item => {
						throw new Error(item.msg);
					});
				}
				let id = sanitize(req.params.id);
				const obj = { title: req.body.title, content: req.body.content };
				obj.tags = gHelpers.parseTags(req.body.tags);

				for (let i = 0; i < req.files.length; i++) {
					let image = new Image({
						_itemId: id,
						itemType: "Gallery",
						isMain: false,
						mimetype: req.files[parseInt(i)].mimetype
					});
					let oldpath = req.files[parseInt(i)].destination + req.files[parseInt(i)].filename;
					let newpath = req.files[parseInt(i)].destination + image._id + path.extname(req.files[parseInt(i)].originalname);
					image.path = newpath;
					fs.rename(oldpath, newpath, err => {
						if (err) throw new Error(err);
					});

					[err, savedImage] = await utils.to(image.save());
					if (err) throw new Error(ERROR_MESSAGE.updateError);
				}

				[err, result] = await utils.to(Gallery.updateOne({ _id: id }, { $set: obj }));
				if (err) throw new Error(ERROR_MESSAGE.updateError);

				req.flash("success", ERROR_MESSAGE.itemUploaded);
				return res.status(200).json({ url: "/Galerie" });
			}
		} catch (err) {
			console.log("PATCH GALLERY ERROR", err);
			return res.status(400).json({ url: "/", message: err.message, err: true });
		}
	});
});

router.post("/delete/:id", setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		let id = sanitize(req.params.id);
		let err, gallery;

		[err, gallery] = await utils.to(Gallery.findOne({ _id: id }));
		if (err || !gallery) throw new Error(ERROR_MESSAGE.fetchError);

		[err, gallery] = await utils.to(Gallery.deleteOne({ _id: id }));
		if (err) throw new Error(ERROR_MESSAGE.delError);

		let options = {
			method: "GET",
			uri: `${process.env.BASEURL}/api/image/Gallery/${id}`,
			json: true,
			headers: {
				ACCESS_TOKEN: process.env.ACCESS_TOKEN
			}
		};
		let response = await rp(options);
		if (response.error === true) throw new Error(ERROR_MESSAGE.fetchImg);

		for (let i = 0; i < response.images.length; i++) {
			fs.unlink(response.images[parseInt(i)].path, err => {
				if (err) throw new Error(ERROR_MESSAGE.deleteImg);
			});
			await Image.deleteOne({ _id: response.images[parseInt(i)]._id });
		}

		req.flash("success", ERROR_MESSAGE.itemDeleted);
		return res.status(200).redirect("/Galerie");
	} catch (err) {
		console.log("DELETE GALLERY ERROR", err);
		req.flash("warning", err.message);
		return res.status(400).redirect("/Galerie");
	}
});

module.exports = router;
