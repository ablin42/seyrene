const express = require("express");
const rp = require("request-promise");
const format = require("date-format");
const country = require("country-list-js");
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
} = require("./helpers/verifySession");
const utils = require("./helpers/utils");
const Blog = require("../models/Blog");
const Shop = require("../models/Shop");
const Order = require("../models/Order");
const Gallery = require("../models/Gallery");
const DeliveryInfo = require("../models/DeliveryInfo");
const PwToken = require("../models/PasswordToken");
const Cart = require("../models/Cart");
const { ERROR_MESSAGE } = require("./helpers/errorMessages");
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
		console.log("HOME ROUTE ERROR", err.message);
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
		console.log("GALLERY ROUTE ERROR", err);
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

		console.log("GALLERY TAGS ROUTE ERROR", err);
		req.flash("warning", err.message);
		return res.status(400).render("tags", obj);
	}
});

router.get("/shopping-cart", setUser, authUser, setDelivery, isDelivery, async (req, res) => {
	try {
		let obj = {
			active: "Cart",
			stripePublicKey: stripePublic,
			products: [],
			totalPrice: 0,
			totalQty: 0,
			user: req.user,
			delivery: req.delivery,
			csrfToken: req.csrfToken()
		};

		if (req.session.cart) {
			let cart = new Cart(req.session.cart);
			let itemArr = cart.generateArray();
			obj.totalPrice = formatter.format(cart.price.totalIncludingTax).substr(2);
			obj.totalQty = cart.totalQty;

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
					item.elements.forEach(element => {
						if (element.attributes !== undefined) {
							itemObj = {
								item: item.attributes,
								attributes: element.attributes,
								stringifiedAttributes: JSON.stringify(element.attributes),
								qty: element.qty,
								unitPrice: item.unitPrice,
								price: formatter.format(item.unitPrice * element.qty).substr(2),
								shortcontent: item.attributes.content.substr(0, 128),
								shorttitle: item.attributes.title.substr(0, 64),
								details: ""
							};

							let details = "";
							Object.keys(element.attributes).forEach(attribute => {
								details +=
									attribute.charAt(0).toUpperCase() +
									attribute.slice(1) +
									": " +
									element.attributes[attribute].charAt(0).toUpperCase() +
									element.attributes[attribute].slice(1) +
									" / ";
							});
							itemObj.details = details.substr(0, details.length - 3);

							obj.products.push(itemObj);
						}
					});
				}
			});

			if (cart.generatePwintyArray().length > 0) {
				let countryCode = country.findByName(utils.toTitleCase(obj.delivery.country));
				if (countryCode) countryCode = countryCode.code.iso2;
				else throw new Error(ERROR_MESSAGE.countryCode);

				let options = {
					uri: `${process.env.BASEURL}/api/pwinty/pricing/${countryCode}`,
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"Accept": "application/json",
						"CSRF-Token": req.csrfToken(),
						"cookie": req.headers.cookie
					},
					body: { items: cart.generatePwintyArray() },
					json: true
				};

				let result = await rp(options);
				if (result.error === true || result.response.length <= 0) throw new Error(ERROR_MESSAGE.noShipment);

				obj.deliveryPrice = result;
			}
		}
		return res.status(200).render("cart", obj);
	} catch (err) {
		console.log("CART ERROR", err);
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
		if (!req.session.cart) return res.status(400).redirect("/shopping-cart");
		if (req.session.cart.totalPrice === 0) return res.status(400).redirect("/shopping-cart");
		if (req.session.billing) obj.billing = req.session.billing;

		console.log(obj.billing);
		return res.status(200).render("billing", obj);
	} catch (err) {
		console.log("BILLING ROUTE ERROR", err);
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

		console.log(obj.billing);
		if (!req.session.cart) return res.status(400).redirect("/shopping-cart");
		let cart = new Cart(req.session.cart);

		if (cart.totalPrice === 0) return res.status(400).redirect("/shopping-cart");
		obj.totalPrice = formatter.format(cart.price.totalIncludingTax).substr(2);

		return res.status(200).render("payment", obj);
	} catch (err) {
		console.log("PAYMENT ROUTE ERROR", err);
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

		if (orders != null) {
			orders.forEach((order, index) => {
				orders[index].price = formatter.format(order.price).substr(2);
				orders[index].date_f = format.asString("dd/MM/yyyy", new Date(order.date));
			});
			obj.orders = orders;
		}

		return res.status(200).render("user", obj);
	} catch (err) {
		console.log("USER ROUTE ERROR", err);
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
		console.log("ABOUT ROUTE ERROR", err);
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
		console.log("ACCOUNT ROUTE ERROR", err);
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
		console.log("SHOP ROUTE ERROR", err);
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
		console.log("RESETPW ROUTE ERROR", err);
		req.flash("warning", err.message);
		return res.status(200).redirect("/Account");
	}
});

/* END MAIN ROUTES */
/* SINGLE ITEM ROUTES */

router.get("/Order/:id", setUser, authUser, setOrder, authGetOrder, async (req, res) => {
	try {
		let obj = { active: "Order recap", csrfToken: req.csrfToken(), user: req.user, order: req.order };

		obj.deliveryPriceFormatted = formatter.format(obj.order.deliveryPrice).substr(2);
		obj.products = [];
		obj.order.items.forEach(item => {
			let items;
			if (item.attributes.isUnique) {
				items = {
					item: item.attributes,
					qty: item.qty,
					price: item.price,
					shortcontent: item.attributes.content.substr(0, 128),
					shorttitle: item.attributes.title.substr(0, 64),
					details: "Toile Unique"
				};
				obj.products.push(items);
			} else {
				item.elements.forEach(element => {
					if (element.attributes !== undefined) {
						items = {
							item: item.attributes,
							attributes: element.attributes,
							stringifiedAttributes: JSON.stringify(element.attributes),
							qty: element.qty,
							unitPrice: item.unitPrice,
							price: formatter.format(item.unitPrice * element.qty).substr(2),
							shortcontent: item.attributes.content.substr(0, 128),
							shorttitle: item.attributes.title.substr(0, 64),
							details: ""
						};
						let details = "";
						Object.keys(element.attributes).forEach(attribute => {
							details +=
								attribute.charAt(0).toUpperCase() +
								attribute.slice(1) +
								": " +
								element.attributes[attribute].charAt(0).toUpperCase() +
								element.attributes[attribute].slice(1) +
								" / ";
						});
						items.details = details.substr(0, details.length - 3);
						obj.products.push(items);
					}
				});
			}
		});

		return res.status(200).render("single/order-recap", obj);
	} catch (err) {
		console.log("ORDER RECAP ROUTE ERROR", err);
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
		console.log("GALLERY SINGLE ROUTE ERROR", err);
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
		console.log("CATALOG ROUTE ERROR", err);
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
		console.log("CGU ROUTE ERROR", err);
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
		console.log("SHOP SINGLE ROUTE ERROR", err);
		req.flash("warning", err.message);
		return res.status(400).redirect("/Shop");
	}
});

router.get("/Blog/:id", setUser, async (req, res) => {
	try {
		let obj = { active: "Blog", csrfToken: req.csrfToken() };
		const blogId = sanitize(req.params.id);
		if (typeof blogId !== "string") throw new Error(ERROR_MESSAGE.fetchError);
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
		console.log("BLOG ROUTE ERROR");
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
		console.log("ADMIN ROUTE ERROR", err);
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
		console.log("ADMIN FRONT ERROR", err);
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
		console.log("ADMIN ROUTE ERROR", err);
		req.flash("warning", err.message);
		return res.status(400).redirect("/Admin");
	}
});

router.get("/Admin/Order/:id", setUser, authUser, authRole(ROLE.ADMIN), setOrder, authGetOrder, async (req, res) => {
	try {
		let obj = { active: "Order recap", user: req.user, order: req.order, csrfToken: req.csrfToken() };

		obj.deliveryPriceFormatted = formatter.format(obj.order.deliveryPrice).substr(2);
		obj.products = [];
		obj.order.items.forEach(item => {
			let items;
			if (item.attributes.isUnique) {
				items = {
					item: item.attributes,
					qty: item.qty,
					price: item.price,
					shortcontent: item.attributes.content.substr(0, 128),
					shorttitle: item.attributes.title.substr(0, 64),
					details: "Toile Unique"
				};
				obj.products.push(items);
			} else {
				item.elements.forEach(element => {
					if (element.attributes !== undefined) {
						items = {
							item: item.attributes,
							attributes: element.attributes,
							stringifiedAttributes: JSON.stringify(element.attributes),
							qty: element.qty,
							unitPrice: item.unitPrice,
							price: formatter.format(item.unitPrice * element.qty).substr(2),
							shortcontent: item.attributes.content.substr(0, 128),
							shorttitle: item.attributes.title.substr(0, 64),
							details: ""
						};
						let details = "";
						Object.keys(element.attributes).forEach(attribute => {
							details +=
								attribute.charAt(0).toUpperCase() +
								attribute.slice(1) +
								": " +
								element.attributes[attribute].charAt(0).toUpperCase() +
								element.attributes[attribute].slice(1) +
								" / ";
						});
						items.details = details.substr(0, details.length - 3);
						obj.products.push(items);
					}
				});
			}
		});

		return res.status(200).render("restricted/order-manage", obj);
	} catch (err) {
		console.log("ORDER RECAP ROUTE ERROR", err);
		req.flash("warning", err.message);
		return res.status(400).redirect("/");
	}
});

router.get("/Admin/Galerie/Post", setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		let obj = { active: "Post a gallery item", user: req.user, csrfToken: req.csrfToken() };

		return res.status(200).render("restricted/gallery-post", obj);
	} catch (err) {
		console.log("GALLERY POST ROUTE ERROR", err);
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
		console.log("GALLERY PATCH ROUTE ERROR", err);
		req.flash("warning", err.message);
		return res.status(400).redirect("/Galerie");
	}
});

router.get("/Admin/Shop/Post", setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
	try {
		let obj = { active: "Post a shop item", user: req.user, csrfToken: req.csrfToken() };

		return res.status(200).render("restricted/shop-post", obj);
	} catch (err) {
		console.log("SHOP POST ROUTE ERROR", err);
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
			uri: `${process.env.BASEURL}/api/image/Shop/${id}`,
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
		console.log("SHOP PATCH ROUTE ERROR", err);
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
		console.log("BLOG POST ROUTE ERROR", err);
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
		if (typeof blogId !== "string") throw new Error(ERROR_MESSAGE.fetchError);

		let [err, blog] = await utils.to(Blog.findOne({ _id: blogId }));
		if (err || !blog) throw new Error(ERROR_MESSAGE.fetchError);
		obj.blog = blog;

		return res.status(200).render("restricted/blog-patch", obj);
	} catch (err) {
		console.log("BLOG PATCH ROUTE ERROR", err);
		req.flash("warning", err.message);
		return res.status(200).redirect("/");
	}
});

module.exports = router;
