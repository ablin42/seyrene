const express = require("express");
const router = express.Router();
const multer = require("multer");
const { validationResult } = require("express-validator");
const { vGallery } = require("./validators/vGallery");
const path = require("path");
const fs = require("fs");
const rp = require("request-promise");

const Gallery = require("../models/Gallery");
const Image = require("../models/Image");
const { ROLE, setUser, authUser, authRole } = require("./helpers/verifySession");
const gHelpers = require("./helpers/galleryHelpers");
const utils = require("./helpers/utils");
const { ERROR_MESSAGE } = require("./helpers/errorMessages");
require("dotenv").config();

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
}).array("img");

async function fetchMainImg(galleries) {
	let arr = [];
	for (let i = 0; i < galleries.length; i++) {
		let obj = {
			_id: galleries[i]._id,
			title: galleries[i].title,
			content: galleries[i].content,
			shortcontent: galleries[i].content.substr(0, 128),
			shorttitle: galleries[i].title.substr(0, 64),
			date: galleries[i].date,
			createdAt: galleries[i].createdAt,
			updatedAt: galleries[i].updatedAt,
			tags: galleries[i].tags,
			mainImgId: "",
			__v: galleries[i].__v
		};
		let [err, img] = await utils.to(Image.findOne({ _itemId: galleries[i]._id, itemType: "Gallery", isMain: true }));
		if (err || img == null) throw new Error(ERROR_MESSAGE.fetchImg);
		obj.mainImgId = img._id;
		arr.push(obj);
	}
	return arr;
}

router.get("/", setUser, async (req, res) => {
	try {
		const options = {
			page: parseInt(req.query.page, 10) || 1,
			limit: 6,
			sort: { date: -1 }
		};
		let [err, result] = await utils.to(Gallery.paginate({}, options));
		if (err) throw new Error(ERROR_MESSAGE.fetchError);

		let galleries = result.docs;
		galleries = await fetchMainImg(galleries);

		return res.status(200).json(galleries);
	} catch (err) {
		console.log("FETCHING GALLERIES ERROR:", err);
		return res.status(200).json({ error: true, message: err.message });
	}
});

router.get("/Tags", setUser, async (req, res) => {
	try {
		const options = {
			page: parseInt(req.query.page, 10) || 1,
			limit: 6,
			sort: { date: -1 }
		};
		console.log("this is to make sure i notice if there is a problem with tags parameter");

		if (req.query.t) var tagsArr = req.query.t.split(","); //sanitize

		let [err, result] = await utils.to(Gallery.paginate({ tags: { $all: tagsArr } }, options));
		if (err) throw new Error(ERROR_MESSAGE.fetchError);

		let galleries = result.docs;
		if (galleries.length == 0) throw new Error(ERROR_MESSAGE.noResult);

		galleries = await fetchMainImg(galleries);
		console.log(galleries);
		return res.status(200).json(galleries);
	} catch (err) {
		console.log("FETCHING GALLERIES BY TAGS ERROR:", err);
		return res.status(200).json({ error: true, message: err.message });
	}
});

//sanitize input
router.post("/post", upload, vGallery, setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		let err, result, savedImage;
		const vResult = validationResult(req);
		if (!vResult.isEmpty()) {
			vResult.errors.forEach(item => {
				throw new Error(item.msg);
			});
		}
		const obj = { title: req.body.title, content: req.body.content }; // need to sanitize data

		obj.tags = gHelpers.parseTags(req.body.tags);

		const gallery = new Gallery(obj);
		[err, result] = await utils.to(gallery.save(ERROR_MESSAGE.saveError));
		if (err) throw new Error();

		for (let i = 0; i < req.files.length; i++) {
			let isMain = false;
			if (i === 0) isMain = true;
			let image = new Image({
				_itemId: result._id,
				itemType: "Gallery",
				isMain: isMain,
				mimetype: req.files[i].mimetype
			});
			let oldpath = req.files[i].destination + req.files[i].filename;
			let newpath = req.files[i].destination + image._id + path.extname(req.files[i].originalname);
			fs.rename(oldpath, newpath, err => {
				if (err) throw new Error(err);
			});
			image.path = newpath;
			[err, savedImage] = await utils.to(image.save());
			if (err) throw new Error(ERROR_MESSAGE.saveError);
		}

		req.flash("success", ERROR_MESSAGE.itemUploadedSelectMain); //zda
		return res.status(200).json({
			url: `/Admin/Galerie/Patch/${result._id}`,
			message: ERROR_MESSAGE.itemUploadedSelectMain //zda
		});
	} catch (err) {
		console.log("POST GALLERY ERROR", err);
		return res.status(400).json({ url: "/", message: err.message, err: true });
	}
});

//sanitize :id (and input)
router.post("/patch/:id", upload, vGallery, setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		let err, savedImage, result;
		const vResult = validationResult(req);
		if (!vResult.isEmpty()) {
			vResult.errors.forEach(item => {
				throw new Error(item.msg);
			});
		}
		let id = req.params.id;
		const obj = { title: req.body.title, content: req.body.content }; // need to sanitize data
		obj.tags = gHelpers.parseTags(req.body.tags);

		for (let i = 0; i < req.files.length; i++) {
			let image = new Image({
				_itemId: id,
				itemType: "Gallery",
				isMain: false,
				mimetype: req.files[i].mimetype
			});
			let oldpath = req.files[i].destination + req.files[i].filename;
			let newpath = req.files[i].destination + image._id + path.extname(req.files[i].originalname);
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
		return res.status(200).json({ url: "/Galerie", message: ERROR_MESSAGE.itemUploaded });
	} catch (err) {
		console.log("PATCH GALLERY ERROR", err);
		return res.status(400).json({ url: "/", message: err.message, err: true });
	}
});

//delete item using its id + sanitize :id
router.get("/delete/:id", setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		let id = req.params.id; //sanitize

		let [err, gallery] = await utils.to(Gallery.deleteOne({ _id: id }));
		if (err) throw new Error(ERROR_MESSAGE.delError);

		rp(`${process.env.BASEURL}/api/image/Gallery/${id}`)
			.then(async response => {
				let parsed = JSON.parse(response);
				for (let i = 0; i < parsed.length; i++) {
					fs.unlink(parsed[i].path, err => {
						if (err) throw new Error(ERROR_MESSAGE.deleteImg);
					});
					await Image.deleteOne({ _id: parsed[i]._id });
				}
			})
			.catch(err => {
				throw new Error(ERROR_MESSAGE.fetchImg);
			});

		req.flash("success", ERROR_MESSAGE.itemDeleted);
		return res.status(200).redirect("/Galerie");
	} catch (err) {
		console.log("DELETE GALLERY ERROR", err);
		req.flash("warning", err.message);
		return res.status(400).redirect("/Galerie/");
	}
});

//sanitize :id
router.get("/single/:id", setUser, async (req, res) => {
	try {
		let id = req.params.id;

		let [err, result] = await utils.to(Gallery.findById(id));
		if (err || result === null) throw new Error(ERROR_MESSAGE.fetchError);

		return res.status(200).json(result);
	} catch (err) {
		console.log("GALLERY SINGLE ERROR", err);
		return res.status(200).json({ error: true, message: err.message });
	}
});

module.exports = router;
