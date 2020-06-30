const express = require("express");
const router = express.Router();
const { validationResult } = require("express-validator");
const { vShop } = require("./validators/vShop");
const sanitize = require("mongo-sanitize");
const path = require("path");
const fs = require("fs");
const rp = require("request-promise");

const Shop = require("../models/Shop");
const Image = require("../models/Image");
const { ROLE, setUser, authUser, authRole, authToken } = require("./helpers/verifySession");
const utils = require("./helpers/utils");
const sHelpers = require("./helpers/shopHelpers");
const upload = require("./helpers/multerHelpers");
const { ERROR_MESSAGE } = require("./helpers/errorMessages");
const { fullLog, threatLog } = require("./helpers/log4");
require("dotenv").config();

router.get("/", async (req, res) => {
	try {
		const options = {
			page: parseInt(req.query.page, 10) || 1,
			limit: 3,
			sort: { date: -1 }
		};

		let [err, result] = await utils.to(Shop.paginate({ soldOut: false }, options));
		if (err || !result) throw new Error(ERROR_MESSAGE.fetchError);
		let shopItems = result.docs;

		let shop = await sHelpers.parse(shopItems);
		return res.status(200).json({ error: false, shop: shop });
	} catch (err) {
		threatLog.error("FETCHING SHOP ERROR:", err, req.headers, req.ip);
		return res.status(200).json({ error: true, message: err.message });
	}
});

router.get("/single/:id", authToken, async (req, res) => {
	try {
		let id = sanitize(req.params.id);

		let [err, result] = await utils.to(Shop.findById(id));
		if (err || result === null) throw new Error(ERROR_MESSAGE.fetchImg);

		return res.status(200).json({ error: false, shop: result });
	} catch (err) {
		threatLog.error("SHOP SINGLE ERROR", err, req.headers, req.ip);
		return res.status(200).json({ error: true, message: err.message });
	}
});

router.post("/post", vShop, setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	upload(req, res, async function (err) {
		try {
			if (err) {
				let errMsg = err;
				if (err.message) errMsg = err.message;
				return res.status(400).json({ url: "/", message: errMsg, err: true });
			} else {
				let err, result, savedImage;
				const vResult = validationResult(req.body);
				if (!vResult.isEmpty()) {
					vResult.errors.forEach(item => {
						throw new Error(item.msg);
					});
				}

				let price = parseFloat(req.body.price);
				if (isNaN(price)) throw new Error(ERROR_MESSAGE.incorrectInput);
				let formattedPrice = price.toFixed(2);

				const obj = {
					title: req.body.title,
					content: req.body.content,
					price: formattedPrice
				};

				const shop = new Shop(obj);
				[err, result] = await utils.to(shop.save());
				if (err) throw new Error(ERROR_MESSAGE.saveError);

				for (let i = 0; i < req.files.length; i++) {
					let isMain = false;
					if (i === 0) isMain = true;

					let image = new Image({
						_itemId: result._id,
						itemType: "Shop",
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
					if (err) throw new Error(ERROR_MESSAGE.updateError);
				}

				fullLog.info(`Shop posted: ${shop._id}`);
				req.flash("success", ERROR_MESSAGE.itemUploadedSelectMain);
				return res.status(200).json({ err: false, url: `/Shop/${result._id}` });
			}
		} catch (err) {
			threatLog.error("POST SHOP ERROR", err, req.headers, req.ip);
			return res.status(400).json({ url: "/", message: err.message, err: true });
		}
	});
});

router.post("/patch/:id", vShop, setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
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

				let id = sanitize(req.params.id);
				let price = parseFloat(req.body.price);
				if (isNaN(price)) throw new Error(ERROR_MESSAGE.incorrectInput);
				let formattedPrice = price.toFixed(2);

				const obj = {
					title: req.body.title,
					content: req.body.content,
					price: formattedPrice
				};

				[err, result] = await utils.to(Shop.findOne({ _id: id }));
				if (err || !result) throw new Error(ERROR_MESSAGE.fetchError);

				[err, result] = await utils.to(Shop.updateOne({ _id: id }, { $set: obj }));
				if (err) throw new Error(ERROR_MESSAGE.updateError);

				for (let i = 0; i < req.files.length; i++) {
					let image = new Image({
						_itemId: id,
						itemType: "Shop",
						isMain: false,
						mimetype: req.files[parseInt(i)].mimetype
					});
					let oldpath = req.files[parseInt(i)].destination + req.files[parseInt(i)].filename;
					let newpath = req.files[parseInt(i)].destination + image._id + path.extname(req.files[parseInt(i)].originalname);
					fs.rename(oldpath, newpath, err => {
						if (err) throw new Error(err);
					});
					image.path = newpath;
					[err, savedImage] = await utils.to(image.save());
					if (err) throw new Error(ERROR_MESSAGE.updateError);
				}

				fullLog.info(`Shop patched: ${id}`);
				req.flash("success", ERROR_MESSAGE.itemUploaded);
				return res.status(200).json({ err: false, url: "/Shop" });
			}
		} catch (err) {
			threatLog.error("PATCH SHOP ERROR", err, req.headers, req.ip);
			return res.status(400).json({ url: "/", message: err.message, err: true });
		}
	});
});

router.post("/delete/:id", setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		let id = sanitize(req.params.id);
		let err, shop;

		[err, shop] = await utils.to(Shop.findOne({ _id: id }));
		if (err || !shop) throw new Error(ERROR_MESSAGE.fetchError);

		[err, shop] = await utils.to(Shop.deleteOne({ _id: id }));
		if (err) throw new Error(ERROR_MESSAGE.delError);

		let options = {
			method: "GET",
			uri: `${process.env.BASEURL}/api/image/Shop/${id}`,
			json: true,
			headers: {
				ACCESS_TOKEN: process.env.ACCESS_TOKEN
			}
		};
		let response = await rp(options);
		if (response.error === true) throw new Error(ERROR_MESSAGE.fetchImg);

		if (response.error === false) {
			for (let i = 0; i < response.images.length; i++) {
				fs.unlink(response.images[parseInt(i)].path, err => {
					if (err) throw new Error(ERROR_MESSAGE.deleteImg);
				});
				await Image.deleteOne({ _id: response.images[parseInt(i)]._id });
			}
		}

		fullLog.info(`Shop deleted: ${id}`);
		req.flash("success", ERROR_MESSAGE.itemDeleted);
		return res.status(200).redirect("/Shop");
	} catch (err) {
		threatLog.error("DELETE SHOP ERROR", err, req.headers, req.ip);
		req.flash("warning", err.message);
		return res.status(400).redirect("/Shop");
	}
});

module.exports = router;
