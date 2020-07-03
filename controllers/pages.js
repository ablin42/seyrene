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
const stripePublic = process.env.STRIPE_PUBLIC;
const formatter = new Intl.NumberFormat("de-DE", {
	style: "currency",
	currency: "EUR"
});

/* MAIN ROUTES */
router.get("/", setUser, async (req, res) => {
	try {
		let obj = { active: "Home", csrfToken: req.csrfToken() };
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
		threatLog.error("HOME ROUTE ERROR", err, req.headers, req.ip);
		req.flash("warning", err.message);
		return res.status(400).render("home");
	}
});

router.get("/Galerie", setUser, async (req, res) => {
	try {
		let obj = { active: "Galerie", csrfToken: req.csrfToken() };
		if (req.user) obj.user = req.user;

		let options = {
			method: "GET",
			uri: `${process.env.BASEURL}/api/gallery/`,
			json: true
		};
		let response = await rp(options);
		if (response.error === false) obj.galleries = response.galleries;
		else throw new Error(response.message);

		return res.status(200).render("galerie", obj);
	} catch (err) {
		threatLog.error("GALLERY ROUTE ERROR", err, req.headers, req.ip);
		req.flash("warning", err.message);
		return res.status(400).redirect("/");
	}
});

router.get("/Galerie/Tags", setUser, async (req, res) => {
	try {
		let obj = { active: "Tags search", csrfToken: req.csrfToken() };
		if (req.user) obj.user = req.user;
		let url = `${process.env.BASEURL}/api/gallery/`;
		if (req.query.t) {
			url = `${process.env.BASEURL}/api/gallery/tags?t=${req.query.t}`;
			obj.tags = req.query.t;
		}

		let response = JSON.parse(await rp(url));
		if (response.error === false) obj.galleries = response.galleries;
		else throw new Error(response.message);

		return res.status(200).render("tags", obj);
	} catch (err) {
		let obj = { active: "Tags search" };
		if (req.query.t) {
			obj.error = true;
			obj.tags = req.query.t;
		}

		threatLog.error("GALLERY TAGS ROUTE ERROR", err, req.headers, req.ip);
		req.flash("warning", err.message);
		return res.status(400).render("tags", obj);
	}
});

router.get("/shopping-cart", setUser, authUser, setDelivery, isDelivery, async (req, res) => {
	try {
		let cart = new Cart(req.session.cart ? req.session.cart : {});
		let obj = {
			active: "Cart",
			stripePublicKey: stripePublic,
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

			if (item.attributes && item.attributes.isUnique) {
				itemObj = {
					item: item.attributes,
					qty: item.qty,
					price: formatter.format(item.price).substr(2),
					shortcontent: item.attributes.content.substr(0, 128),
					shorttitle: item.attributes.title.substr(0, 64),
					details: "Toile Unique"
				};
				obj.products.push(itemObj);
			} else {
				itemObj = pHelpers.formatPwintyItems(item);
				itemObj.forEach(pwintyItem => obj.products.push(pwintyItem));
			}
		});
		if (cart.generatePwintyArray().length > 0)
			obj.deliveryPrice = await pHelpers.getDeliveryPrice(req, cart, obj.delivery.country);

		return res.status(200).render("cart", obj);
	} catch (err) {
		threatLog.error("CART ERROR", err, req.headers, req.ip);
		req.flash("info", err.message);
		return res.status(400).redirect("/");
	}
});

router.get("/Billing", setUser, authUser, setDelivery, isDelivery, async (req, res) => {
	try {
		let obj = {
			active: "Billing",
			user: req.user,
			billing: {},
			csrfToken: req.csrfToken()
		};
		if (!req.session.cart || req.session.cart.totalPrice === 0) return res.status(400).redirect("/shopping-cart");
		if (req.session.billing) obj.billing = req.session.billing;

		return res.status(200).render("billing", obj);
	} catch (err) {
		threatLog.error("BILLING ROUTE ERROR", err, req.headers, req.ip);
		req.flash("warning", err.message);
		return res.status(400).redirect("/");
	}
});

router.get("/Payment", setUser, authUser, setDelivery, isDelivery, checkBilling, async (req, res) => {
	try {
		let obj = {
			active: "Payment",
			stripePublicKey: stripePublic,
			totalPrice: 0,
			user: req.user,
			billing: req.session.billing,
			csrfToken: req.csrfToken()
		};

		if (!req.session.cart || req.session.cart.totalPrice === 0) return res.status(400).redirect("/shopping-cart");
		let cart = new Cart(req.session.cart);

		obj.totalPrice = formatter.format(cart.price.totalIncludingTax).substr(2);

		return res.status(200).render("payment", obj);
	} catch (err) {
		threatLog.error("PAYMENT ROUTE ERROR", err, req.headers, req.ip);
		req.flash("warning", err.message);
		return res.status(400).redirect("/shopping-cart");
	}
});

router.get("/User", setUser, authUser, async (req, res) => {
	try {
		let err, result, orders;
		let obj = { active: "User", csrfToken: req.csrfToken(), user: req.user, delivery: false };

		[err, result] = await utils.to(DeliveryInfo.findOne({ _userId: req.user._id }));
		if (err || !result) throw new Error(ERROR_MESSAGE.deliveryAddressNotFound);
		obj.delivery = result;

		[err, orders] = await utils.to(Order.find({ _userId: req.user._id }, {}, { sort: { date: -1 } }));
		if (err) throw new Error(ERROR_MESSAGE.fetchError);

		if (orders) {
			orders.forEach((order, index) => {
				orders[parseInt(index)].price = formatter.format(order.price).substr(2);
				orders[parseInt(index)].date_f = format.asString("dd/MM/yyyy", new Date(order.date));
			});
			obj.orders = orders;
		}

		return res.status(200).render("user", obj);
	} catch (err) {
		threatLog.error("USER ROUTE ERROR", err, req.headers, req.ip);
		req.flash("warning", err.message);
		res.status(400).redirect("/Account");
	}
});

router.get("/About", setUser, async (req, res) => {
	try {
		let obj = { active: "About", csrfToken: req.csrfToken() };
		if (req.user) obj.user = req.user;
		if (req.session.formData) {
			obj.formData = req.session.formData;
			req.session.formData = undefined;
		}

		let response = JSON.parse(await rp(`${process.env.BASEURL}/api/blog/`));
		if (response.error === false) obj.blogs = response.blogs;
		else throw new Error(response.message);

		return res.status(200).render("about", obj);
	} catch (err) {
		threatLog.error("ABOUT ROUTE ERROR", err, req.headers, req.ip);
		req.flash("warning", ERROR_MESSAGE.serverError);
		return res.status(400).redirect("/");
	}
});

router.get("/Account", setUser, notLoggedUser, async (req, res) => {
	try {
		let obj = { active: "Account", csrfToken: req.csrfToken() };
		if (req.session.formData) {
			obj.formData = req.session.formData;
			req.session.formData = undefined;
		}

		return res.status(200).render("account", obj);
	} catch (err) {
		threatLog.error("ACCOUNT ROUTE ERROR", err, req.headers, req.ip);
		req.flash("warning", ERROR_MESSAGE.serverError);
		return res.status(400).redirect("/");
	}
});

router.get("/Shop", setUser, async (req, res) => {
	try {
		let obj = { active: "Shop", csrfToken: req.csrfToken() };
		if (req.user) obj.user = req.user;

		let response = JSON.parse(await rp(`${process.env.BASEURL}/api/shop/`));
		if (response.error === false) obj.original = response.shop;
		else throw new Error(response.message);

		return res.status(200).render("shop", obj);
	} catch (err) {
		threatLog.error("SHOP ROUTE ERROR", err, req.headers, req.ip);
		req.flash("warning", err.message);
		return res.status(400).redirect("/");
	}
});

router.get("/Resetpw/:tokenId/:token", setUser, notLoggedUser, async (req, res) => {
	try {
		let obj = {
			active: "Reset password",
			tokenId: sanitize(req.params.tokenId),
			token: sanitize(req.params.token),
			csrfToken: req.csrfToken()
		};

		let [err, pwToken] = await utils.to(PwToken.findOne({ _id: obj.tokenId, token: obj.token }));
		if (err || !pwToken) throw new Error(ERROR_MESSAGE.tokenNotFound);

		return res.status(200).render("Resetpw", obj);
	} catch (err) {
		threatLog.error("RESETPW ROUTE ERROR", err, req.headers, req.ip);
		req.flash("warning", err.message);
		return res.status(200).redirect("/Account");
	}
});

/* END MAIN ROUTES */
/* SINGLE ITEM ROUTES */

router.get("/Order/:id", setUser, authUser, setOrder, authGetOrder, async (req, res) => {
	try {
		let obj = {
			active: "Order recap",
			csrfToken: req.csrfToken(),
			products: [],
			user: req.user,
			order: req.order,
			deliveryPriceFormatted: formatter.format(req.order.deliveryPrice).substr(2)
		};

		obj.order.items.forEach(item => {
			let itemObj;
			if (item.attributes && item.attributes.isUnique) {
				itemObj = {
					item: item.attributes,
					qty: item.qty,
					price: item.price,
					shortcontent: item.attributes.content.substr(0, 128),
					shorttitle: item.attributes.title.substr(0, 64),
					details: "Toile Unique"
				};
				obj.products.push(itemObj);
			} else {
				itemObj = pHelpers.formatPwintyItems(item);
				itemObj.forEach(pwintyItem => obj.products.push(pwintyItem));
			}
		});

		return res.status(200).render("single/order-recap", obj);
	} catch (err) {
		threatLog.error("ORDER RECAP ROUTE ERROR", err, req.headers, req.ip);
		req.flash("warning", err.message);
		return res.status(400).redirect("/");
	}
});

router.get("/Galerie/:id", setUser, async (req, res) => {
	try {
		let id = sanitize(req.params.id);
		let obj = { active: "Galerie", csrfToken: req.csrfToken() };
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

		return res.status(200).render("single/galerie-single", obj);
	} catch (err) {
		threatLog.error("GALLERY SINGLE ROUTE ERROR", err, req.headers, req.ip);
		req.flash("warning", err.message);
		return res.status(400).redirect("/Galerie");
	}
});

router.get("/Catalog", setUser, async (req, res) => {
	try {
		let obj = { active: "Catalog", csrfToken: req.csrfToken() };
		if (req.user) obj.user = req.user;

		return res.status(200).render("catalog", obj);
	} catch (err) {
		threatLog.error("CATALOG ROUTE ERROR", err, req.headers, req.ip);
		req.flash("warning", err.message);
		return res.status(400).redirect("/Galerie");
	}
});

router.get("/CGU", setUser, async (req, res) => {
	try {
		let obj = { active: "CGU", csrfToken: req.csrfToken() };
		if (req.user) obj.user = req.user;

		return res.status(200).render("cgu", obj);
	} catch (err) {
		threatLog.error("CGU ROUTE ERROR", err, req.headers, req.ip);
		req.flash("warning", err.message);
		return res.status(400).redirect("/Galerie");
	}
});

router.get("/Shop/:id", setUser, async (req, res) => {
	try {
		let id = sanitize(req.params.id);
		let obj = { active: "Shop", csrfToken: req.csrfToken() };
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

		return res.status(200).render("single/shop-single", obj);
	} catch (err) {
		threatLog.error("SHOP SINGLE ROUTE ERROR", err, req.headers, req.ip);
		req.flash("warning", err.message);
		return res.status(400).redirect("/Shop");
	}
});

router.get("/Blog/:id", setUser, async (req, res) => {
	try {
		let obj = { active: "Blog", csrfToken: req.csrfToken() };
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

		return res.status(200).render("single/blog-single", obj);
	} catch (err) {
		threatLog.error("BLOG ROUTE ERROR", err, req.headers, req.ip);
		req.flash("warning", err.message);
		return res.status(200).redirect("/About");
	}
});

/* END SINGLE */
/* ADMIN ROUTES */

router.get("/Admin", setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		let obj = { active: "Admin", user: req.user, csrfToken: req.csrfToken() };

		return res.status(200).render("restricted/admin", obj);
	} catch (err) {
		threatLog.error("ADMIN ROUTE ERROR", err, req.headers, req.ip);
		req.flash("warning", err.message);
		return res.status(400).redirect("/");
	}
});

router.get("/Admin/Front", setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		let obj = { active: "Update Homepage", user: req.user, csrfToken: req.csrfToken() };

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

		return res.status(200).render("restricted/front-post", obj);
	} catch (err) {
		threatLog.error("ADMIN FRONT ERROR", err, req.headers, req.ip);
		req.flash("warning", err.message);
		return res.status(400).redirect("/");
	}
});

router.get("/Admin/Orders", setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		let obj = { active: "Admin Orders", user: req.user, csrfToken: req.csrfToken() };

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

		return res.status(200).render("restricted/orders", obj);
	} catch (err) {
		threatLog.error("ADMIN ROUTE ERROR", err, req.headers, req.ip);
		req.flash("warning", err.message);
		return res.status(400).redirect("/Admin");
	}
});

router.get("/Admin/Order/:id", setUser, authUser, authRole(ROLE.ADMIN), setOrder, authGetOrder, async (req, res) => {
	try {
		let obj = {
			active: "Order Manage",
			products: [],
			user: req.user,
			order: req.order,
			csrfToken: req.csrfToken(),
			deliveryPriceFormatted: formatter.format(req.order.deliveryPrice).substr(2)
		};

		obj.order.items.forEach(item => {
			let itemObj;
			if (item.attributes && item.attributes.isUnique) {
				itemObj = {
					item: item.attributes,
					qty: item.qty,
					price: item.price,
					shortcontent: item.attributes.content.substr(0, 128),
					shorttitle: item.attributes.title.substr(0, 64),
					details: "Toile Unique"
				};
				obj.products.push(itemObj);
			} else {
				itemObj = pHelpers.formatPwintyItems(item);
				itemObj.forEach(pwintyItem => obj.products.push(pwintyItem));
			}
		});

		return res.status(200).render("restricted/order-manage", obj);
	} catch (err) {
		threatLog.error("ORDER RECAP ROUTE ERROR", err, req.headers, req.ip);
		req.flash("warning", err.message);
		return res.status(400).redirect("/");
	}
});

router.get("/Admin/Galerie/Post", setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		let obj = { active: "Post a gallery item", user: req.user, csrfToken: req.csrfToken() };

		return res.status(200).render("restricted/gallery-post", obj);
	} catch (err) {
		threatLog.error("GALLERY POST ROUTE ERROR", err, req.headers, req.ip);
		req.flash("warning", err.message);
		return res.status(400).redirect("/Galerie");
	}
});

router.get("/Admin/Galerie/Patch/:galleryId", setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		let obj = { active: "Edit a gallery item", csrfToken: req.csrfToken() };
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

		return res.status(200).render("restricted/gallery-patch", obj);
	} catch (err) {
		threatLog.error("GALLERY PATCH ROUTE ERROR", err, req.headers, req.ip);
		req.flash("warning", err.message);
		return res.status(400).redirect("/Galerie");
	}
});

router.get("/Admin/Shop/Post", setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		let obj = { active: "Post a shop item", user: req.user, csrfToken: req.csrfToken() };

		return res.status(200).render("restricted/shop-post", obj);
	} catch (err) {
		threatLog.error("SHOP POST ROUTE ERROR", err, req.headers, req.ip);
		req.flash("warning", err.message);
		return res.status(400).redirect("/Shop");
	}
});

router.get("/Admin/Shop/Patch/:shopId", setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		let obj = { active: "Edit a shop item", user: req.user, csrfToken: req.csrfToken() };
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

		return res.status(200).render("restricted/shop-patch", obj);
	} catch (err) {
		threatLog.error("SHOP PATCH ROUTE ERROR", err, req.headers, req.ip);
		req.flash("warning", err.message);
		return res.status(400).redirect("/Shop");
	}
});

router.get("/Admin/Blog/Post", setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		let obj = { active: "Post a blog", user: req.user, csrfToken: req.csrfToken() };

		if (req.session.formData) {
			obj.formData = req.session.formData;
			req.session.formData = undefined;
		}

		return res.status(200).render("restricted/blog-post", obj);
	} catch (err) {
		threatLog.error("BLOG POST ROUTE ERROR", err, req.headers, req.ip);
		req.flash("warning", err.message);
		return res.status(200).redirect("/restricted/blog-post");
	}
});

router.get("/Admin/Blog/Patch/:blogId", setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		let obj = { active: "Edit a blog", user: req.user, csrfToken: req.csrfToken() };
		if (req.session.formData) {
			obj.formData = req.session.formData;
			req.session.formData = undefined;
		}
		const blogId = sanitize(req.params.blogId);

		let [err, blog] = await utils.to(Blog.findOne({ _id: blogId }));
		if (err || !blog) throw new Error(ERROR_MESSAGE.fetchError);
		obj.blog = blog;

		return res.status(200).render("restricted/blog-patch", obj);
	} catch (err) {
		threatLog.error("BLOG PATCH ROUTE ERROR", err, req.headers, req.ip);
		req.flash("warning", err.message);
		return res.status(200).redirect("/");
	}
});

module.exports = router;
