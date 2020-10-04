const express = require("express");
const router = express.Router();
const { vShop } = require("./validators/vShop");
const sanitize = require("mongo-sanitize");
const fs = require("fs");
const rp = require("request-promise");

const Shop = require("../models/Shop");
const Image = require("../models/Image");
const { ROLE, errorHandler, setUser, authUser, authRole, authToken, setShop } = require("./helpers/middlewares");
const utils = require("./helpers/utils");
const sHelpers = require("./helpers/shopHelpers");
const upload = require("./helpers/multerHelpers");
const { ERROR_MESSAGE } = require("./helpers/errorMessages");
const { fullLog, threatLog } = require("./helpers/log4");
const aws = require("aws-sdk");
aws.config.region = process.env.AWS_REGION;
require("dotenv").config();

const memjs = require("memjs");
let mc = memjs.Client.create(process.env.MEMCACHIER_SERVERS, {
	failover: true,
	timeout: 1,
	keepAlive: true
});

router.get("/", async (req, res) => {
	try {
		const options = {
			page: parseInt(req.query.page, 10) || 1,
			limit: 3,
			sort: { date: -1 }
		};
		let shop;
		let shop_key = "shop." + JSON.stringify(options);

		if (process.env.MEMJS === "true") {
			mc.get(shop_key, async function (err, val) {
				if (err == null && val != null) shop = JSON.parse(val.toString());
				else {
					let [err, result] = await utils.to(Shop.paginate({ soldOut: false }, options));
					if (err || !result) throw new Error(ERROR_MESSAGE.fetchError);

					let shopItems = result.docs;
					shop = await sHelpers.parse(shopItems);

					mc.set(shop_key, "" + JSON.stringify(shop), { expires: 21600 }, function (err, val) {
						if (err) throw new Error(ERROR_MESSAGE.serverError);
					});
				}
				return res.status(200).json({ error: false, shop: shop });
			});
		} else {
			let [err, result] = await utils.to(Shop.paginate({ soldOut: false }, options));
			if (err || !result) throw new Error(ERROR_MESSAGE.fetchError);

			let shopItems = result.docs;
			shop = await sHelpers.parse(shopItems);

			return res.status(200).json({ error: false, shop: shop });
		}
	} catch (err) {
		threatLog.error("FETCHING SHOP ERROR:", err, req.headers, req.ipAddress);
		return res.status(200).json({ error: true, message: err.message });
	}
});

router.get("/single/:id", authToken, async (req, res) => {
	try {
		let id = sanitize(req.params.id);

		let [err, result] = await utils.to(Shop.findById(id));
		if (err) throw new Error(ERROR_MESSAGE.fetchError);
		if (!result) throw new Error(ERROR_MESSAGE.noResult);

		return res.status(200).json({ error: false, shop: result });
	} catch (err) {
		threatLog.error("SHOP SINGLE ERROR", err, req.headers, req.ipAddress);
		return res.status(200).json({ error: true, message: err.message });
	}
});

router.post("/post", upload, errorHandler, vShop, setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		await utils.checkValidity(req);
		const obj = {
			title: req.body.title,
			content: req.body.content,
			price: req.body.price
		};
		let imgData = await utils.parseImgData(req.files);

		const shop = new Shop(obj);
		let [err, result] = await utils.to(shop.save());
		if (err) throw new Error(ERROR_MESSAGE.saveError);

		err = await utils.saveImages(imgData, result._id, "Shop", "save");
		if (err) throw new Error(err);

		fullLog.info(`Shop posted: ${shop._id}`);
		req.flash("success", ERROR_MESSAGE.itemUploadedSelectMain);
		return res.status(200).json({ err: false, url: `/Shop/${result._id}` });
	} catch (err) {
		threatLog.error("POST SHOP ERROR", err, req.headers, req.ipAddress);
		return res.status(400).json({ url: "/", message: err.message, err: true });
	}
});

router.post("/patch/:id", upload, errorHandler, vShop, setShop, setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		await utils.checkValidity(req);
		let id = sanitize(req.params.id);
		const obj = {
			title: req.body.title,
			content: req.body.content,
			price: req.body.price
		};
		let imgData = await utils.parseImgData(req.files);

		let [err, result] = await utils.to(Shop.updateOne({ _id: id }, { $set: obj }));
		if (err) throw new Error(ERROR_MESSAGE.updateError);

		err = await utils.saveImages(imgData, id, "Shop", "patch");
		if (err) throw new Error(err);

		fullLog.info(`Shop patched: ${id}`);
		req.flash("success", ERROR_MESSAGE.itemUploaded);
		return res.status(200).json({ err: false, url: "/Shop" });
	} catch (err) {
		threatLog.error("PATCH SHOP ERROR", err, req.headers, req.ipAddress);
		return res.status(400).json({ url: "/", message: err.message, err: true });
	}
});

router.post("/delete/:id", setShop, setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		let id = sanitize(req.params.id);
		let err, shop;

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

		for (let i = 0; i < response.images.length; i++) {
			let s3 = new aws.S3();
			let params = { Bucket: process.env.S3_BUCKET, Key: response.images[i].key };
			s3.deleteObject(params, function (err, data) {
				if (err) throw new Error(ERROR_MESSAGE.delImg);
			});
			await Image.deleteOne({ _id: response.images[parseInt(i)]._id });
		}

		fullLog.info(`Shop deleted: ${id}`);
		req.flash("success", ERROR_MESSAGE.itemDeleted);
		return res.status(200).redirect("/Shop");
	} catch (err) {
		threatLog.error("DELETE SHOP ERROR", err, req.headers, req.ipAddress);
		req.flash("warning", err.message);
		return res.status(400).redirect("/Shop");
	}
});

module.exports = router;
