const express = require("express");
const router = express.Router();
const multer = require("multer");
const { validationResult } = require("express-validator");
const { vShop } = require("./validators/vShop");
const sanitize = require("mongo-sanitize");
const path = require("path");
const fs = require("fs");
const rp = require("request-promise");

const Shop = require("../models/Shop");
const Image = require("../models/Image");
const { ROLE, setUser, authUser, authRole } = require("./helpers/verifySession");
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
		utils.sanitizeFile(req, file, cb);
	}
}).array("img");

const formatter = new Intl.NumberFormat("de-DE", {
	style: "currency",
	currency: "EUR"
});

async function parsePrice(shopItems) {
	//move somewhere
	let arr = [];
	for (let i = 0; i < shopItems.length; i++) {
		let obj = {
			_id: shopItems[i]._id,
			title: shopItems[i].title,
			content: shopItems[i].content,
			shortcontent: shopItems[i].content.substr(0, 256),
			shorttitle: shopItems[i].title.substr(0, 100),
			price: formatter.format(shopItems[i].price).substr(2),
			isUnique: shopItems[i].isUnique,
			date: shopItems[i].date,
			createdAt: shopItems[i].createdAt,
			updatedAt: shopItems[i].updatedAt,
			mainImgId: "",
			__v: shopItems[i].__v
		};

		let [err, img] = await utils.to(Image.findOne({ _itemId: shopItems[i]._id, itemType: "Shop", isMain: true }));
		if (err || img == null) throw new Error(`An error occurred while fetching the shop images ${shopItems[i]._id}`);

		obj.mainImgId = img._id;
		arr.push(obj);
	}
	return arr;
}

router.get("/", setUser, async (req, res) => {
	try {
		const options = {
			page: parseInt(req.query.page, 10) || 1,
			limit: 3,
			sort: { date: -1 }
		};

		let [err, result] = await utils.to(Shop.paginate({ isUnique: true, soldOut: false }, options));
		if (err || !result) throw new Error(ERROR_MESSAGE.fetchError);
		let shopItems = result.docs; //probably can remove img since we use id and api to load it

		let ress = await parsePrice(shopItems);
		return res.status(200).json(ress);
	} catch (err) {
		console.log("FETCHING SHOP ERROR:", err);
		return res.status(200).json({ error: true, message: err.message });
	}
});

router.post("/post", upload, vShop, setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		let err, result, savedImage;
		const vResult = validationResult(req);
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
			isUnique: true,
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
				mimetype: req.files[i].mimetype
			});
			let oldpath = req.files[i].destination + req.files[i].filename;
			let newpath = req.files[i].destination + image._id + path.extname(req.files[i].originalname);
			fs.rename(oldpath, newpath, err => {
				if (err) throw new Error(err);
			});
			image.path = newpath;
			[err, savedImage] = await utils.to(image.save());
			if (err) throw new Error(ERROR_MESSAGE.updateError);
		}

		req.flash("success", ERROR_MESSAGE.itemUploadedSelectMain); //double
		return res.status(200).json({ url: `/Admin/Shop/Patch/${result._id}`, message: ERROR_MESSAGE.itemUploadedSelectMain }); //double
	} catch (err) {
		//double
		console.log("POST SHOP ERROR", err);
		return res.status(400).json({ url: "/", message: err.message, err: true });
	}
});

router.post("/patch/:id", upload, vShop, setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
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
			isUnique: true,
			price: formattedPrice
		};

		[err, result] = await utils.to(Shop.updateOne({ _id: id }, { $set: obj }));
		if (err) throw new Error(ERROR_MESSAGE.updateError);

		for (let i = 0; i < req.files.length; i++) {
			let image = new Image({
				_itemId: id,
				itemType: "Shop",
				isMain: false,
				mimetype: req.files[i].mimetype
			});
			let oldpath = req.files[i].destination + req.files[i].filename;
			let newpath = req.files[i].destination + image._id + path.extname(req.files[i].originalname);
			fs.rename(oldpath, newpath, err => {
				if (err) throw new Error(err);
			});
			image.path = newpath;
			[err, savedImage] = await utils.to(image.save());
			if (err) throw new Error(ERROR_MESSAGE.updateError);
		}

		req.flash("success", ERROR_MESSAGE.itemUploaded); //double
		return res.status(200).json({ url: "/Shop", message: ERROR_MESSAGE.itemUploaded }); //double
	} catch (err) {
		console.log("PATCH SHOP ERROR", err);
		return res.status(400).json({ url: "/", message: err.message, err: true });
	}
});

router.get("/delete/:id", setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		let id = sanitize(req.params.id);

		let [err, shop] = await utils.to(Shop.deleteOne({ _id: id }));
		if (err) throw new Error(ERROR_MESSAGE.delError);

		rp(`${process.env.BASEURL}/api/image/Shop/${id}`)
			.then(async response => {
				let parsed = JSON.parse(response);
				for (let i = 0; i < parsed.length; i++) {
					fs.unlink(parsed[i].path, err => {
						if (err) throw new Error(ERROR_MESSAGE.delImg);
					});
					await Image.deleteOne({ _id: parsed[i]._id });
				}
			})
			.catch(err => {
				throw new Error(ERROR_MESSAGE.fetchImg);
			});

		req.flash("success", ERROR_MESSAGE.itemDeleted);
		return res.status(200).redirect("/Shop");
	} catch (err) {
		console.log("DELETE SHOP ERROR", err);
		req.flash("warning", err.message);
		return res.status(400).redirect("/Shop");
	}
});

router.get("/single/:id", setUser, async (req, res) => {
	try {
		let id = sanitize(req.params.id);

		let [err, result] = await utils.to(Shop.findById(id));
		if (err || result === null) throw new Error(ERROR_MESSAGE.fetchImg);

		result.img = undefined;
		return res.status(200).json(result);
	} catch (err) {
		console.log("SHOP SINGLE ERROR", err);
		return res.status(200).json({ error: true, message: err.message });
	}
});

module.exports = router;
