const express = require("express");
const rp = require("request-promise");
const format = require("date-format");
const router = express.Router();
const sanitize = require("mongo-sanitize");

const {
	ROLE,
	setUser,
	notLoggedUser,
	authUser,
	authRole,
	setDelivery,
	isDelivery,
	setOrder,
	authGetOrder,
	checkBilling
} = require("./helpers/middlewares");
const utils = require("./helpers/utils");
const pHelpers = require("./helpers/pwintyHelpers");
const Blog = require("../models/Blog");
const Shop = require("../models/Shop");
const Order = require("../models/Order");
const Gallery = require("../models/Gallery");
const DeliveryInfo = require("../models/DeliveryInfo");
const PwToken = require("../models/PasswordToken");
const Cart = require("../models/Cart");
const { ERROR_MESSAGE } = require("./helpers/errorMessages");
const { fullLog, threatLog } = require("./helpers/log4");
require("dotenv").config();
const formatter = new Intl.NumberFormat("de-DE", {
	style: "currency",
	currency: "EUR"
});

const memjs = require("memjs");
let mc = memjs.Client.create(process.env.MEMCACHIER_SERVERS, {
	failover: true,
	timeout: 1,
	keepAlive: true
});

const cacheView = function (req, res, next) {
	if (req.session) return next();
	var view_key = "_view_cache_" + req.originalUrl || req.url;
	mc.get(view_key, function (err, val) {
		if (err == null && val != null) {
			res.send(val.toString("utf8"));
			return;
		}
		res.sendRes = res.send;
		res.send = function (body) {
			mc.set(view_key, body, { expires: 43200 }, function (err, val) {
				if (err) throw new Error(ERROR_MESSAGE.serverError);
			});
			res.sendRes(body);
		};
		next();
	});
};

/* MAIN ROUTES */
router.get("/", setUser, async (req, res) => {
	try {
		let obj = {
			active: "Home",
			headtitle: "Maral Abkarian Paintings | Home",
			description:
				"Maral Akbarian Art and Paintings. Discover my gallery and purchase original paintings or customize your copy.",
			csrfToken: req.csrfToken()
		};
		if (req.user) obj.user = req.user;

		let options = {
			method: "GET",
			uri: `${process.env.BASEURL}/api/front/`,
			headers: {
				ACCESS_TOKEN: process.env.ACCESS_TOKEN
			},
			json: true
		};
		let front = await rp(options);

		if (front.error === false) obj.front = front.data;
		else throw new Error(front.message);

		return res.status(200).render("home", obj);
	} catch (err) {
		threatLog.error("HOME ROUTE ERROR", err, req.headers, req.ipAddress);
		req.flash("warning", err.message);
		return res.status(400).render("home");
	}
});

router.get("/Galerie", setUser, cacheView, async (req, res) => {
	try {
		let obj = {
			active: "Galerie",
			headtitle: "Maral Abkarian Paintings | Art Gallery ",
			description: "Maral Akbarian Art and Paintings. Check out the gallery and purchase customizable copies!",
			csrfToken: req.csrfToken()
		};
		if (req.user) obj.user = req.user;

		let options = {
			method: "GET",
			uri: `${process.env.BASEURL}/api/gallery/`,
			json: true
		};
		let response = await rp(options);
		if (response.error === false) obj.galleries = response.galleries;
		else throw new Error(response.message);

		return res.status(200).render("Galerie", obj);
	} catch (err) {
		threatLog.error("GALLERY ROUTE ERROR", err, req.headers, req.ipAddress);
		req.flash("warning", err.message);
		return res.status(400).redirect("/");
	}
});

router.get("/Galerie/Tags", setUser, async (req, res) => {
	try {
		let obj = {
			active: "Galerie",
			headtitle: "Maral Abkarian Paintings | Art Gallery Tags",
			description: "Maral Akbarian Art and Paintings. Find paintings using key words and purchase customizable copies!",
			csrfToken: req.csrfToken()
		};
		if (req.user) obj.user = req.user;
		let url = `${process.env.BASEURL}/api/gallery/`;
		if (req.query.t) {
			url = `${process.env.BASEURL}/api/gallery/tags?t=${req.query.t}`;
			obj.tags = req.query.t;
		}

		let response = JSON.parse(await rp(url));
		if (response.error === false) obj.galleries = response.galleries;
		else throw new Error(response.message);

		return res.status(200).render("Tags", obj);
	} catch (err) {
		let obj = {
			headtitle: "Maral Abkarian Paintings | Art Gallery Tags",
			description: "Maral Akbarian Art and Paintings. Find paintings using key words and purchase customizable copies!"
		};
		if (req.query.t) {
			obj.error = true;
			obj.tags = req.query.t;
		}

		threatLog.error("GALLERY TAGS ROUTE ERROR", err, req.headers, req.ipAddress);
		req.flash("warning", err.message);
		return res.status(400).render("Tags", obj);
	}
});

router.get("/shopping-cart", setUser, authUser, setDelivery, isDelivery, async (req, res) => {
	try {
		let cart = new Cart(req.session.cart ? req.session.cart : {});
		let obj = {
			active: "Cart",
			headtitle: "Maral Abkarian Paintings | Cart",
			description: "Maral Akbarian Art and Paintings. Verify your cart and proceed to checkout to buy beautiful paintings",
			products: [],
			totalPrice: formatter.format(cart.price.totalIncludingTax).substr(2),
			totalQty: cart.totalQty,
			user: req.user,
			delivery: req.delivery,
			csrfToken: req.csrfToken()
		};
		let itemArr = cart.generateArray();

		itemArr.forEach(item => {
			let itemObj;

			if (item.attributes && item.isUnique) {
				itemObj = {
					isUnique: true,
					item: item.attributes,
					qty: item.qty,
					price: formatter.format(item.price).substr(2),
					shortcontent: item.attributes.content.substr(0, 128),
					shorttitle: item.attributes.title.substr(0, 64),
					details: "Unique Painting"
				};
				obj.products.push(itemObj);
			} else {
				itemObj = pHelpers.formatPwintyItems(item);
				itemObj.forEach(pwintyItem => obj.products.push(pwintyItem));
			}
		});
		if (cart.generatePwintyArray().length > 0)
			obj.deliveryPrice = await pHelpers.getDeliveryPrice(req, cart, obj.delivery.isoCode);

		return res.status(200).render("Cart", obj);
	} catch (err) {
		threatLog.error("CART ERROR", err, req.headers, req.ipAddress);
		req.flash("info", err.message);
		return res.status(400).redirect("/");
	}
});

router.get("/Billing", setUser, authUser, setDelivery, isDelivery, async (req, res) => {
	try {
		let obj = {
			headtitle: "Maral Abkarian Paintings | Add Billing",
			description: "Maral Akbarian Art and Paintings. Add your billing information to buy beautiful paintings!",
			user: req.user,
			billing: {},
			csrfToken: req.csrfToken()
		};
		if (!req.session.cart || req.session.cart.totalPrice === 0) return res.status(400).redirect("/shopping-cart");
		if (req.session.billing) obj.billing = req.session.billing;

		return res.status(200).render("Billing", obj);
	} catch (err) {
		threatLog.error("BILLING ROUTE ERROR", err, req.headers, req.ipAddress);
		req.flash("warning", err.message);
		return res.status(400).redirect("/");
	}
});

router.get("/Payment", setUser, authUser, setDelivery, isDelivery, checkBilling, async (req, res) => {
	try {
		let obj = {
			headtitle: "Maral Abkarian Paintings | Payment",
			description: "Maral Akbarian Art and Paintings. The last step needed to obtain these incredible art pieces.",
			stripePublicKey: process.env.STRIPE_PUBLIC,
			totalPrice: 0,
			user: req.user,
			billing: JSON.stringify(req.session.billing),
			csrfToken: req.csrfToken()
		};

		if (!req.session.cart || req.session.cart.totalPrice === 0) return res.status(400).redirect("/shopping-cart");
		let cart = new Cart(req.session.cart);

		obj.totalPrice = formatter.format(cart.price.totalIncludingTax).substr(2);

		return res.status(200).render("Payment", obj);
	} catch (err) {
		threatLog.error("PAYMENT ROUTE ERROR", err, req.headers, req.ipAddress);
		req.flash("warning", err.message);
		return res.status(400).redirect("/shopping-cart");
	}
});

router.get("/User", setUser, authUser, async (req, res) => {
	try {
		let err, result, orders;
		let obj = {
			active: "User",
			headtitle: "Maral Abkarian Paintings | User",
			description:
				"Maral Akbarian Art and Paintings. Update your delivery informations, account informations and check your order history",
			csrfToken: req.csrfToken(),
			user: req.user,
			delivery: false
		};

		[err, result] = await utils.to(DeliveryInfo.findOne({ _userId: req.user._id }));
		if (err) throw new Error(ERROR_MESSAGE.deliveryAddressNotFound);
		obj.delivery = result;
		if (!result) obj.delivery = [];

		[err, orders] = await utils.to(Order.find({ _userId: req.user._id }, {}, { sort: { date: -1 } }));
		if (err) throw new Error(ERROR_MESSAGE.fetchError);

		if (orders) {
			orders.forEach((order, index) => {
				orders[parseInt(index)].price = formatter.format(order.price).substr(2);
				orders[parseInt(index)].date_f = format.asString("dd/MM/yyyy", new Date(order.date));
			});
			obj.orders = orders;
		}

		let options = {
			method: "GET",
			uri: `${process.env.BASEURL}/api/pwinty/countries`,
			headers: {
				ACCESS_TOKEN: process.env.ACCESS_TOKEN
			},
			json: true
		};

		let response = await rp(options);
		if (response.error === false) obj.countries = response.response.data;
		else throw new Error(response.message);

		return res.status(200).render("User", obj);
	} catch (err) {
		threatLog.error("USER ROUTE ERROR", err, req.headers, req.ipAddress);
		req.flash("warning", err.message);
		res.status(400).redirect("/Login");
	}
});

router.get("/Blog", setUser, async (req, res) => {
	try {
		let obj = {
			active: "Blog",
			headtitle: "Maral Abkarian Paintings | Blog List",
			description:
				"Maral Akbarian Art and Paintings. Check out my biography to know me better and my blog where I talk about my art.. You can contact me aswell.",
			csrfToken: req.csrfToken()
		};
		if (req.user) obj.user = req.user;
		if (req.session.formData) {
			obj.formData = req.session.formData;
			req.session.formData = undefined;
		}

		let response = JSON.parse(await rp(`${process.env.BASEURL}/api/blog/`));
		if (response.error === false) obj.blogs = response.blogs;
		else throw new Error(response.message);

		return res.status(200).render("About", obj);
	} catch (err) {
		threatLog.error("ABOUT ROUTE ERROR", err, req.headers, req.ipAddress);
		req.flash("warning", ERROR_MESSAGE.serverError);
		return res.status(400).redirect("/");
	}
});

router.get("/Login", setUser, notLoggedUser, cacheView, async (req, res) => {
	try {
		let obj = {
			active: "Account",
			headtitle: "Maral Abkarian Paintings | Register - Log In",
			description: "Maral Akbarian Art and Paintings. Create an account and log in to buy any paintings you want!",
			csrfToken: req.csrfToken()
		};
		if (req.session.formData) {
			obj.formData = req.session.formData;
			req.session.formData = undefined;
		}

		return res.status(200).render("Account", obj);
	} catch (err) {
		threatLog.error("ACCOUNT ROUTE ERROR", err, req.headers, req.ipAddress);
		req.flash("warning", ERROR_MESSAGE.serverError);
		return res.status(400).redirect("/");
	}
});

router.get("/Shop", setUser, async (req, res) => {
	try {
		let obj = {
			active: "Shop",
			headtitle: "Maral Abkarian Paintings | Buy Unique",
			description:
				"Maral Akbarian Art and Paintings. UNIQUE paintings only. All of the paintings presented here are made by myself only once",
			csrfToken: req.csrfToken()
		};
		if (req.user) obj.user = req.user;

		let response = JSON.parse(await rp(`${process.env.BASEURL}/api/shop/`));
		if (response.error === false) obj.original = response.shop;
		else throw new Error(response.message);

		return res.status(200).render("Shop", obj);
	} catch (err) {
		threatLog.error("SHOP ROUTE ERROR", err, req.headers, req.ipAddress);
		req.flash("warning", err.message);
		return res.status(400).redirect("/");
	}
});

router.get("/Resetpw/:tokenId/:token", setUser, notLoggedUser, async (req, res) => {
	try {
		let obj = {
			headtitle: "Maral Abkarian Paintings | Reset password",
			description: "Maral Akbarian Art and Paintings. Reset your password here, just in case you lost it",
			tokenId: sanitize(req.params.tokenId),
			token: sanitize(req.params.token),
			csrfToken: req.csrfToken()
		};

		let [err, pwToken] = await utils.to(PwToken.findOne({ _id: obj.tokenId, token: obj.token }));
		if (err || !pwToken) throw new Error(ERROR_MESSAGE.tokenNotFound);

		return res.status(200).render("Resetpw", obj);
	} catch (err) {
		threatLog.error("RESETPW ROUTE ERROR", err, req.headers, req.ipAddress);
		req.flash("warning", err.message);
		return res.status(200).redirect("/Login");
	}
});

/* END MAIN ROUTES */
/* SINGLE ITEM ROUTES */

router.get("/Order/:id", setUser, authUser, setOrder, authGetOrder, async (req, res) => {
	try {
		let obj = {
			headtitle: "Maral Abkarian Paintings | Your Order",
			description: "Maral Akbarian Art and Paintings. Check out the paintings you purchased and the status of your order!",
			csrfToken: req.csrfToken(),
			products: [],
			user: req.user,
			order: req.order,
			deliveryPriceFormatted: formatter.format(req.order.deliveryPrice).substr(2)
		};

		obj.order.items.forEach(item => {
			let itemObj;
			if (item.attributes && item.isUnique) {
				itemObj = {
					isUnique: true,
					item: item.attributes,
					qty: item.qty,
					price: item.price,
					shortcontent: item.attributes.content.substr(0, 128),
					shorttitle: item.attributes.title.substr(0, 64),
					details: "Unique Painting"
				};
				obj.products.push(itemObj);
			} else {
				itemObj = pHelpers.formatPwintyItems(item);
				itemObj.forEach(pwintyItem => obj.products.push(pwintyItem));
			}
		});

		return res.status(200).render("single/Order-recap", obj);
	} catch (err) {
		threatLog.error("ORDER RECAP ROUTE ERROR", err, req.headers, req.ipAddress);
		req.flash("warning", err.message);
		return res.status(400).redirect("/");
	}
});

router.get("/Galerie/:id", setUser, async (req, res) => {
	try {
		let id = sanitize(req.params.id);
		let obj = {
			headtitle: "Maral Abkarian Paintings | Customize Copy",
			description: "Maral Akbarian Art and Paintings. Check out this beautiful painting and buy customizable copies if you want!",
			csrfToken: req.csrfToken()
		};
		if (req.user) obj.user = req.user;

		let options = {
			method: "GET",
			uri: `${process.env.BASEURL}/api/gallery/single/${id}`,
			headers: {
				ACCESS_TOKEN: process.env.ACCESS_TOKEN
			},
			json: true
		};

		let response = await rp(options);
		if (response.error === false) obj.gallery = response.gallery;
		else throw new Error(response.message);

		options.uri = `${process.env.BASEURL}/api/image/Gallery/${id}`;
		response = await rp(options);
		if (response.error === false) obj.images = response.images;
		else throw new Error(response.message);

		return res.status(200).render("single/Galerie-single", obj);
	} catch (err) {
		threatLog.error("GALLERY SINGLE ROUTE ERROR", err, req.headers, req.ipAddress);
		req.flash("warning", err.message);
		return res.status(400).redirect("/Galerie");
	}
});

router.get("/Catalog", setUser, cacheView, async (req, res) => {
	try {
		let obj = {
			active: "Catalog",
			headtitle: "Maral Abkarian Paintings | Catalog Frames & Paper",
			description:
				"Maral Akbarian Art and Paintings. The catalog that references our attributes to customize the copy of the painting you want!",
			csrfToken: req.csrfToken()
		};
		if (req.user) obj.user = req.user;

		return res.status(200).render("Catalog", obj);
	} catch (err) {
		threatLog.error("CATALOG ROUTE ERROR", err, req.headers, req.ipAddress);
		req.flash("warning", err.message);
		return res.status(400).redirect("/Galerie");
	}
});

router.get("/legals", setUser, cacheView, async (req, res) => {
	try {
		let obj = {
			headtitle: "Maral Abkarian Paintings | Legals",
			description: "Maral Akbarian Art and Paintings. Legals informations, RGPD, terms of sale.",
			csrfToken: req.csrfToken()
		};
		if (req.user) obj.user = req.user;

		return res.status(200).render("legals", obj);
	} catch (err) {
		threatLog.error("LEGALS ROUTE ERROR", err, req.headers, req.ipAddress);
		req.flash("warning", err.message);
		return res.status(400).redirect("/Galerie");
	}
});

router.get("/Shop/:id", setUser, async (req, res) => {
	try {
		let id = sanitize(req.params.id);
		let obj = {
			headtitle: "Maral Abkarian Paintings | Buy this painting!",
			description: "Maral Akbarian Art and Paintings. A beautiful and unique painting waiting for its buyer",
			csrfToken: req.csrfToken()
		};
		if (req.user) obj.user = req.user;

		let options = {
			method: "GET",
			uri: `${process.env.BASEURL}/api/shop/single/${id}`,
			headers: {
				ACCESS_TOKEN: process.env.ACCESS_TOKEN
			},
			json: true
		};
		response = await rp(options);

		if (response.error === false) obj.shop = response.shop;
		else throw new Error(response.message);
		obj.shop.price = formatter.format(obj.shop.price).substr(2);

		options.uri = `${process.env.BASEURL}/api/image/Shop/${id}`;
		response = await rp(options);
		if (response.error === false) obj.img = response.images;
		else throw new Error(response.message);

		return res.status(200).render("single/Shop-single", obj);
	} catch (err) {
		threatLog.error("SHOP SINGLE ROUTE ERROR", err, req.headers, req.ipAddress);
		req.flash("warning", err.message);
		return res.status(400).redirect("/Shop");
	}
});

router.get("/Blog/:id", setUser, async (req, res) => {
	try {
		let obj = {
			headtitle: "Maral Abkarian Paintings | Blog ticket",
			description: "Maral Akbarian Art and Paintings. One of my blog tickets about art..",
			csrfToken: req.csrfToken()
		};
		const blogId = sanitize(req.params.id);
		if (req.user) obj.user = req.user;

		let options = {
			method: "GET",
			uri: `${process.env.BASEURL}/api/blog/single/${blogId}`,
			headers: {
				ACCESS_TOKEN: process.env.ACCESS_TOKEN
			},
			json: true
		};
		response = await rp(options);

		if (response.error === false) obj.blog = response.blog;
		else throw new Error(response.message);

		return res.status(200).render("single/Blog-single", obj);
	} catch (err) {
		threatLog.error("BLOG ROUTE ERROR", err, req.headers, req.ipAddress);
		req.flash("warning", err.message);
		return res.status(200).redirect("/Blog");
	}
});

/* END SINGLE */
/* ADMIN ROUTES */

router.get("/Admin", setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		let obj = {
			active: "Admin",
			headtitle: "Maral Abkarian Paintings | Admin",
			description: "Maral Akbarian Art and Paintings",
			user: req.user,
			csrfToken: req.csrfToken()
		};

		return res.status(200).render("restricted/Admin", obj);
	} catch (err) {
		threatLog.error("ADMIN ROUTE ERROR", err, req.headers, req.ipAddress);
		req.flash("warning", err.message);
		return res.status(400).redirect("/");
	}
});

router.get("/Admin/Front", setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		let obj = {
			active: "Admin",
			headtitle: "Maral Abkarian Paintings | Update Homepage",
			description: "Maral Akbarian Art and Paintings",
			user: req.user,
			csrfToken: req.csrfToken()
		};

		let options = {
			method: "GET",
			uri: `${process.env.BASEURL}/api/front/`,
			headers: {
				ACCESS_TOKEN: process.env.ACCESS_TOKEN
			},
			json: true
		};
		response = await rp(options);

		if (response.error === false) obj.front = response.data;
		else throw new Error(response.message);
		if (response.data.length <= 0) obj.front = undefined;

		return res.status(200).render("restricted/Front-post", obj);
	} catch (err) {
		threatLog.error("ADMIN FRONT ERROR", err, req.headers, req.ipAddress);
		req.flash("warning", err.message);
		return res.status(400).redirect("/");
	}
});

router.get("/Admin/Bio", setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		let obj = {
			active: "Admin",
			headtitle: "Maral Abkarian Paintings | Biography Image",
			description: "Maral Akbarian Art and Paintings",
			user: req.user,
			csrfToken: req.csrfToken()
		};

		return res.status(200).render("restricted/Bio", obj);
	} catch (err) {
		threatLog.error("BIO EDIT ROUTE ERROR", err, req.headers, req.ipAddress);
		req.flash("warning", err.message);
		return res.status(400).redirect("/Shop");
	}
});

router.get("/Admin/Orders", setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		let obj = {
			active: "Admin",
			headtitle: "Maral Abkarian Paintings | Admin Orders",
			description: "Maral Akbarian Art and Paintings",
			user: req.user,
			csrfToken: req.csrfToken()
		};

		let options = {
			method: "GET",
			uri: `${process.env.BASEURL}/api/order/`,
			headers: {
				cookie: req.headers.cookie
			},
			json: true
		};

		let result = await rp(options);
		if (result.error === false) obj.all = result.orders;
		else throw new Error(result.message);

		options.uri = `${process.env.BASEURL}/api/order?tab=approval`;
		result = await rp(options);
		if (result.error === false) obj.approval = result.orders;
		else throw new Error(result.message);

		return res.status(200).render("restricted/Orders", obj);
	} catch (err) {
		threatLog.error("ADMIN ROUTE ERROR", err, req.headers, req.ipAddress);
		req.flash("warning", err.message);
		return res.status(400).redirect("/Admin");
	}
});

router.get("/Admin/Order/:id", setUser, authUser, authRole(ROLE.ADMIN), setOrder, authGetOrder, async (req, res) => {
	try {
		let obj = {
			active: "Admin",
			headtitle: "Maral Abkarian Paintings | Order Manage",
			description: "Maral Akbarian Art and Paintings",
			products: [],
			user: req.user,
			order: req.order,
			csrfToken: req.csrfToken(),
			deliveryPriceFormatted: formatter.format(req.order.deliveryPrice).substr(2)
		};

		obj.order.items.forEach(item => {
			let itemObj;
			if (item.attributes && item.isUnique) {
				itemObj = {
					isUnique: true,
					item: item.attributes,
					qty: item.qty,
					price: item.price,
					shortcontent: item.attributes.content.substr(0, 128),
					shorttitle: item.attributes.title.substr(0, 64),
					details: "Unique Painting"
				};
				obj.products.push(itemObj);
			} else {
				itemObj = pHelpers.formatPwintyItems(item);
				itemObj.forEach(pwintyItem => obj.products.push(pwintyItem));
			}
		});

		return res.status(200).render("restricted/Order-manage", obj);
	} catch (err) {
		threatLog.error("ORDER RECAP ROUTE ERROR", err, req.headers, req.ipAddress);
		req.flash("warning", err.message);
		return res.status(400).redirect("/");
	}
});

router.get("/Admin/Galerie/Post", setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		let obj = {
			active: "Admin",
			headtitle: "Maral Abkarian Paintings | Post a gallery item",
			description: "Maral Akbarian Art and Paintings",
			user: req.user,
			csrfToken: req.csrfToken()
		};

		return res.status(200).render("restricted/Gallery-post", obj);
	} catch (err) {
		threatLog.error("GALLERY POST ROUTE ERROR", err, req.headers, req.ipAddress);
		req.flash("warning", err.message);
		return res.status(400).redirect("/Galerie");
	}
});

router.get("/Admin/Galerie/Patch/:galleryId", setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		let obj = {
			active: "Admin",
			headtitle: "Edit a gallery item",
			description: "Maral Akbarian Art and Paintings",
			csrfToken: req.csrfToken()
		};
		const galleryId = sanitize(req.params.galleryId);

		let [err, result] = await utils.to(Gallery.findOne({ _id: galleryId }));
		if (err || !result) throw new Error(ERROR_MESSAGE.fetchError);
		obj.gallery = result;

		let options = {
			method: "GET",
			uri: `${process.env.BASEURL}/api/image/Gallery/${galleryId}`,
			headers: {
				ACCESS_TOKEN: process.env.ACCESS_TOKEN
			},
			json: true
		};
		let response = await rp(options);
		if (response.error === false) obj.images = response.images;
		else throw new Error(response.message);

		return res.status(200).render("restricted/Gallery-patch", obj);
	} catch (err) {
		threatLog.error("GALLERY PATCH ROUTE ERROR", err, req.headers, req.ipAddress);
		req.flash("warning", err.message);
		return res.status(400).redirect("/Galerie");
	}
});

router.get("/Admin/Shop/Post", setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		let obj = {
			active: "Admin",
			headtitle: "Maral Abkarian Paintings | Post a shop item",
			description: "Maral Akbarian Art and Paintings",
			user: req.user,
			csrfToken: req.csrfToken()
		};

		return res.status(200).render("restricted/Shop-post", obj);
	} catch (err) {
		threatLog.error("SHOP POST ROUTE ERROR", err, req.headers, req.ipAddress);
		req.flash("warning", err.message);
		return res.status(400).redirect("/Shop");
	}
});

router.get("/Admin/Shop/Patch/:shopId", setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		let obj = {
			active: "Admin",
			headtitle: "Maral Abkarian Paintings | Edit a shop item",
			description: "Maral Akbarian Art and Paintings",
			user: req.user,
			csrfToken: req.csrfToken()
		};
		const shopId = sanitize(req.params.shopId);

		let [err, result] = await utils.to(Shop.findOne({ _id: shopId }));
		if (err || !result) throw new Error(ERROR_MESSAGE.fetchError);
		obj.shop = result;

		let options = {
			method: "GET",
			uri: `${process.env.BASEURL}/api/image/Shop/${shopId}`,
			headers: {
				ACCESS_TOKEN: process.env.ACCESS_TOKEN
			},
			json: true
		};
		let response = await rp(options);
		if (response.error === false) obj.img = response.images;
		else throw new Error(response.message);

		return res.status(200).render("restricted/Shop-patch", obj);
	} catch (err) {
		threatLog.error("SHOP PATCH ROUTE ERROR", err, req.headers, req.ipAddress);
		req.flash("warning", err.message);
		return res.status(400).redirect("/Shop");
	}
});

router.get("/Admin/Blog/Post", setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		let obj = {
			active: "Admin",
			headtitle: "Maral Abkarian Paintings | Post a blog",
			description: "Maral Akbarian Art and Paintings",
			user: req.user,
			csrfToken: req.csrfToken()
		};

		if (req.session.formData) {
			obj.formData = req.session.formData;
			req.session.formData = undefined;
		}

		return res.status(200).render("restricted/Blog-post", obj);
	} catch (err) {
		threatLog.error("BLOG POST ROUTE ERROR", err, req.headers, req.ipAddress);
		req.flash("warning", err.message);
		return res.status(200).redirect("/restricted/Blog-post");
	}
});

router.get("/Admin/Blog/Patch/:blogId", setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		let obj = {
			active: "Admin",
			headtitle: "Maral Abkarian Paintings | Edit a blog",
			description: "Maral Akbarian Art and Paintings",
			user: req.user,
			csrfToken: req.csrfToken()
		};
		if (req.session.formData) {
			obj.formData = req.session.formData;
			req.session.formData = undefined;
		}
		const blogId = sanitize(req.params.blogId);

		let [err, blog] = await utils.to(Blog.findOne({ _id: blogId }));
		if (err || !blog) throw new Error(ERROR_MESSAGE.fetchError);
		obj.blog = blog;

		return res.status(200).render("restricted/Blog-patch", obj);
	} catch (err) {
		threatLog.error("BLOG PATCH ROUTE ERROR", err, req.headers, req.ipAddress);
		req.flash("warning", err.message);
		return res.status(200).redirect("/");
	}
});

module.exports = router;
