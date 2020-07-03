const express = require("express");
const router = express.Router();
const { vGallery } = require("./validators/vGallery");
const fs = require("fs");
const rp = require("request-promise");
const sanitize = require("mongo-sanitize");

const Gallery = require("../models/Gallery");
const Image = require("../models/Image");
const { ROLE, errorHandler, setUser, authUser, authRole, authToken, setGallery } = require("./helpers/middlewares");
const gHelpers = require("./helpers/galleryHelpers");
const utils = require("./helpers/utils");
const upload = require("./helpers/multerHelpers");
const { ERROR_MESSAGE } = require("./helpers/errorMessages");
const { fullLog, threatLog } = require("./helpers/log4");
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
		threatLog.error("FETCHING GALLERIES ERROR:", err, req.headers, req.ip);
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
		threatLog.error("FETCHING GALLERIES BY TAGS ERROR:", err, req.headers, req.ip);
		return res.status(200).json({ error: true, message: err.message });
	}
});

router.get("/single/:id", authToken, async (req, res) => {
	try {
		let id = sanitize(req.params.id);

		let [err, result] = await utils.to(Gallery.findById(id));
		if (err) throw new Error(ERROR_MESSAGE.fetchError);
		if (!result) throw new Error(ERROR_MESSAGE.noResult);

		return res.status(200).json({ error: false, gallery: result });
	} catch (err) {
		threatLog.error("GALLERY SINGLE ERROR", err, req.headers, req.ip);
		return res.status(200).json({ error: true, message: err.message });
	}
});

router.post("/post", upload, errorHandler, vGallery, setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		await utils.checkValidity(req);
		const obj = { title: req.body.title, content: req.body.content };
		obj.tags = gHelpers.parseTags(req.body.tags);

		const gallery = new Gallery(obj);
		let [err, result] = await utils.to(gallery.save());
		if (err) throw new Error(ERROR_MESSAGE.saveError);

		err = await utils.uploadImages(req.files, result._id, "Gallery", "save");
		if (err) throw new Error(err);

		fullLog.info(`Gallery posted: ${gallery._id}`);
		req.flash("success", ERROR_MESSAGE.itemUploadedSelectMain);
		return res.status(200).json({ url: `/Galerie/${result._id}` });
	} catch (err) {
		threatLog.error("POST GALLERY ERROR", err, req.headers, req.ip);
		return res.status(400).json({ url: "/", message: err.message, err: true });
	}
});

router.post(
	"/patch/:id",
	upload,
	errorHandler,
	vGallery,
	setGallery,
	setUser,
	authUser,
	authRole(ROLE.ADMIN),
	async (req, res) => {
		try {
			await utils.checkValidity(req);
			let id = sanitize(req.params.id);
			const obj = { title: req.body.title, content: req.body.content };
			obj.tags = gHelpers.parseTags(req.body.tags);

			let [err, result] = await utils.to(Gallery.updateOne({ _id: id }, { $set: obj }));
			if (err) throw new Error(ERROR_MESSAGE.updateError);
			if (!result) throw new Error(ERROR_MESSAGE.noResult);

			err = await utils.uploadImages(req.files, id, "Gallery", "patch");
			if (err) throw new Error(err);

			fullLog.info(`Gallery patched: ${id}`);
			req.flash("success", ERROR_MESSAGE.itemUploaded);
			return res.status(200).json({ url: "/Galerie" });
		} catch (err) {
			threatLog.error("PATCH GALLERY ERROR", err, req.headers, req.ip);
			return res.status(400).json({ url: "/Galerie", message: err.message, err: true });
		}
	}
);

router.post("/delete/:id", setGallery, setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		let id = sanitize(req.params.id);

		let [err, gallery] = await utils.to(Gallery.deleteOne({ _id: id }));
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

		fullLog.info(`Gallery deleted: ${id}`);
		req.flash("success", ERROR_MESSAGE.itemDeleted);
		return res.status(200).redirect("/Galerie");
	} catch (err) {
		threatLog.error("DELETE GALLERY ERROR", err, req.headers, req.ip);
		req.flash("warning", err.message);
		return res.status(400).redirect("/Galerie");
	}
});

module.exports = router;
