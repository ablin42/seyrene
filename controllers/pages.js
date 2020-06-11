const express = require("express");
const path = require("path");
const rp = require("request-promise");
const format = require("date-format");
const { getCode, getName } = require('country-list');

const { ROLE, setUser, authUser, authRole, setOrder, authGetOrder } = require("./helpers/verifySession");
const utils = require("./helpers/utils");
const Blog = require("../models/Blog");
const User = require("../models/User");
const Shop = require("../models/Shop");
const Order = require("../models/Order");
const Gallery = require("../models/Gallery");
const DeliveryInfo = require("../models/DeliveryInfo");
const PwToken = require("../models/PasswordToken");
const Cart = require("../models/Cart");
require("dotenv/config");

//var formatter = new Intl.NumberFormat();
var formatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR"
});
const stripeSecret = process.env.STRIPE_SECRET;
const stripePublic = process.env.STRIPE_PUBLIC;

const router = express.Router();

/* MAIN ROUTES */

router.get("/", setUser, async (req, res) => {
try {
  let obj = { active: "Home" }; //{root: path.join(__dirname, '/pages/')};

  if (req.user) 
    obj.user = req.user

  obj.front = JSON.parse(await rp("http://127.0.0.1:8089/api/front/"));
  if (obj.front.length <= 0) 
    obj.front = undefined;
   
  return res.status(200).render("home", obj);
} catch (err) {
  console.log("HOME ROUTE ERROR", err);
  return res.status(400).render("home");
}});

router.get("/Galerie", setUser, async (req, res) => {
try {
  let obj = {
    active: "Galerie",
    root: path.join(__dirname, "/pages/")
  };

  if (req.user) 
    obj.user = req.user;

  obj.galleries = JSON.parse(await rp("http://127.0.0.1:8089/api/gallery/"));
  if (obj.galleries.error) 
    throw new Error(obj.galleries.message);
  if (obj.galleries.length === 0)
    throw new Error("Gallery is under maintenance, please come back later");
   
  return res.status(200).render("galerie", obj);
} catch (err) {
  console.log("GALLERY ROUTE ERROR", err);
  req.flash("warning", err.message);
  return res.status(400).redirect("/");
}});

router.get("/Galerie/Tags", setUser, async (req, res) => {
try {
  let obj = {
        active: "Tags search",
        root: path.join(__dirname, "/pages/")
      };

  if (req.user) 
    obj.user = req.user

  let url = `http://127.0.0.1:8089/api/gallery/`;
  if (req.query.t) {
    url = `http://127.0.0.1:8089/api/gallery/tags?t=${req.query.t}`;
    obj.tags = req.query.t;
  }

  obj.galleries = JSON.parse(await rp(url));
  if (obj.galleries.error) 
    throw new Error(obj.galleries.message);

  return res.status(200).render("tags", obj);
} catch (err) {
  console.log("GALLERY TAGS ROUTE ERROR", err);
  let obj = { //test if this is needed or not
    active: "Tags search",
    root: path.join(__dirname, "/pages/")
  };
  
  if (req.query.t) {
    obj.error = true;
    obj.tags = req.query.t;
  }
  req.flash("warning", err.message);
  return res.status(400).render("tags", obj);
}});

router.get("/shopping-cart", setUser, async (req, res) => {
try {
  let obj = {
    active: "Cart",
    stripePublicKey: stripePublic,
    products: null,
    totalPrice: 0,
    totalQty: 0
  };

  if (req.user) 
    obj.user = req.user

  /* might need req.user condition */
  obj.isDelivery = false;
  obj.delivery = null;
  var [err, result] = await utils.to(DeliveryInfo.findOne({ _userId: req.user._id }));
  if (err)
    throw new Error("An error occurred while looking for your delivery informations, please retry");
  if (result != null) {
    obj.delivery = result;
    obj.isDelivery = true;
  } //until here
    
  if (req.session.cart) {
    let cart = new Cart(req.session.cart);
    obj.products = [];
    itemArr = cart.generateArray();
     
    itemArr.forEach(item => {
      if (item.attributes && item.attributes.isUnique) {
        var items = {
          item: item.attributes,
          qty: item.qty,
          price: formatter.format(item.price).substr(2),
          shortcontent: item.attributes.content.substr(0, 128),
          shorttitle: item.attributes.title.substr(0, 64),
          details: "Toile Unique"
        };
        obj.products.push(items);
      } else {
        item.elements.forEach(element => {
          if (element.attributes !== undefined) {
            var items = {
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
            Object.keys(element.attributes).forEach((attribute, index) => {
              details += attribute.charAt(0).toUpperCase() + attribute.slice(1) + ": " + element.attributes[attribute].charAt(0).toUpperCase() + element.attributes[attribute].slice(1) + " / ";
            })
            items.details = details.substr(0, (details.length - 3));
            obj.products.push(items);
            }
          })
        }
    });
    obj.totalPrice = formatter.format(cart.price.totalIncludingTax).substr(2);
    console.log(obj.totalPrice)
    obj.totalQty = cart.totalQty;

    let countryCode = getCode(obj.delivery.country);
    let options = {
      uri: `http://localhost:8089/api/pwinty/pricing/${countryCode}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: {items: itemArr},
      json: true
    }
    obj.deliveryPrice = await rp(options);
    if (obj.deliveryPrice.error) 
      throw new Error(obj.deliveryPrice.message);

    console.log(obj.deliveryPrice)
    //parse and format price
  }
  return res.status(200).render("cart", obj);
} catch (err) {
  console.log("CART ERROR", err);
  req.flash("info", err.message);
  return res.status(400).redirect("/");
}});

router.get("/Payment", setUser, authUser, async (req, res) => {
try {
  let obj = {
    active: "Payment",
    stripePublicKey: stripePublic,
    totalPrice: 0,
    user: req.user
  };

  if (req.session.cart) {
    let cart = new Cart(req.session.cart);

    if (cart.totalPrice === 0)
      return res.status(400).redirect("/shopping-cart");
    obj.totalPrice = formatter.format(cart.price.totalIncludingTax).substr(2);
  } else
    return res.status(400).redirect("/shopping-cart");

  return res.status(200).render("payment", obj);
} catch (err) {
  console.log("PAYMENT ROUTE ERROR", err);
  req.flash("warning", err.message);
  return res.status(400).redirect("/");
}});

router.get("/User", setUser, authUser, async (req, res) => {
try {
  let obj = {user: req.user};
  obj = await User.findOne({ _id: req.user._id });
  obj.password = undefined;
  obj.active = "User";
  obj.delivery = false; /////////////////?

  var [err, result] = await utils.to(DeliveryInfo.findOne({ _userId: req.user._id }));
  if (err)
    throw new Error("An error occurred while looking for your delivery informations, please retry");

  if (result != null) 
    obj.delivery = result;

  var [err, orders] = await utils.to(Order.find({ _userId: req.user._id }, {}, { sort: { date: -1 } }));
  if (err)
    throw new Error("An error occurred while looking for your orders informations, please retry");

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
}});

router.get("/About", setUser, async (req, res) => {
try {
  let obj = { active: "About" };

  if (req.user)
    obj.user = req.user;

  obj.blogs = JSON.parse(await rp("http://127.0.0.1:8089/api/blog/")); //maybe better save in object check error and if no error -> store value in obj.blogs
  if (obj.blogs.error) 
    throw new Error(obj.blogs.message);

  if (req.session.formData) {
    obj.formData = req.session.formData;
    req.session.formData = undefined;
  }

  return res.status(200).render("about", obj);
} catch (err) {
  console.log("ABOUT ROUTE ERROR", err);
  req.flash("warning", "An error occurred, please try again");
  return res.status(400).redirect("/");
}});

router.get("/Account", setUser, async (req, res) => {
try {
  let obj = { active: "Account" };
  if (req.session.formData) {
    obj.formData = req.session.formData;
    req.session.formData = undefined;
  }

  if (req.user) {
    req.flash("info", "You're already logged in");
    return res.status(200).redirect("/");
  }

  return res.status(200).render("account", obj);
} catch (err) {
  console.log("ACCOUNT ROUTE ERROR", err);
  req.flash("warning", "An error occurred, please try again");
  return res.status(400).redirect("/");
}});

router.get("/Shop", setUser, async (req, res) => {
try {
  let obj = { active: "Shop" };

  if (req.user)
    obj.user = req.user;

  obj.original = JSON.parse(await rp("http://127.0.0.1:8089/api/shop/")); //same as /About
  if (obj.original.error) 
    throw new Error(obj.original.message);

  obj.print = JSON.parse(await rp("http://127.0.0.1:8089/api/shop?tab=print"));
  if (obj.print.error) 
    throw new Error(obj.print.message);
  if (obj.original.length <= 1 && obj.print.length <= 1)
    throw new Error("Shop is under maintenance, please try again later");

  return res.status(200).render("shop", obj);
} catch (err) {
  console.log("SHOP ROUTE ERROR", err);
  req.flash("warning", err.message);
  return res.status(400).redirect("/");
}});

router.get("/Resetpw/:tokenId/:token", setUser, async (req, res) => {
try {
  if (req.user) {
    req.flash("info", "You're logged in, you can change your password here");
    return res.status(200).redirect("/User");
  } 
  let obj = {
    active: "Reset password",
    root: path.join(__dirname, "/pages/"),
    tokenId: req.params.tokenId, //sanitize
    token: req.params.token
  };

  var [err, pwToken] = await utils.to(PwToken.findOne({ _id: obj.tokenId, token: obj.token }));
  if (err)
    throw new Error("An error occurred while fetching the token, please try again");
  if (pwToken === null)
    throw new Error("Invalid token, please try to request another one here");

  return res.status(200).render("Resetpw", obj); 
} catch (err) {
  console.log("RESETPW ROUTE ERROR", err);
  req.flash("warning", err.message);
  return res.status(200).redirect("/Account");
}});

/* END MAIN ROUTES */
/* SINGLE ITEM ROUTES */

router.get("/Order/:id", setUser, authUser, setOrder, authGetOrder, async (req, res) => {
try {
  let obj = { active: "Order recap", user: req.user };
    
  obj.order = JSON.parse(await rp(`http://127.0.0.1:8089/api/order/${req.params.id}`)); //same as /About
  if (obj.order.error) 
    throw new Error(obj.order.message);

  obj.deliveryPriceFormatted = formatter.format(obj.order.deliveryPrice).substr(2);
  obj.products = [];
  obj.order.items.forEach(item => {
    if (item.attributes.isUnique) {
      var items = {
        item: item.attributes,
        qty: item.qty,
        price: formatter.format(item.price).substr(2),
        shortcontent: item.attributes.content.substr(0, 128),
        shorttitle: item.attributes.title.substr(0, 64),
        details: "Toile Unique"
      };
      obj.products.push(items);
    } else {
      item.elements.forEach(element => {
        if (element.attributes !== undefined) {
          var items = {
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
          Object.keys(element.attributes).forEach((attribute, index) => {
            details += attribute.charAt(0).toUpperCase() + attribute.slice(1) + ": " + element.attributes[attribute].charAt(0).toUpperCase() + element.attributes[attribute].slice(1) + " / ";
          })
          items.details = details.substr(0, (details.length - 3));
          obj.products.push(items);
        }
      })
    }
  });

  return res.status(200).render("single/order-recap", obj);
} catch (err) {
  console.log("ORDER RECAP ROUTE ERROR", err);
  req.flash("warning", err.message);
  return res.status(400).redirect("/");
}});

router.get("/Galerie/:id", setUser, async (req, res) => {
try {
  let id = req.params.id;
  let obj = {
    active: "Galerie",
    root: path.join(__dirname, "/pages/")
  };

  if (req.user)
    obj.user = req.user;

  obj.galleries = JSON.parse(await rp(`http://127.0.0.1:8089/api/gallery/single/${id}`)); // like /About
  if (obj.galleries.error) 
    throw new Error(obj.galleries.message);

  obj.img = JSON.parse(await rp(`http://127.0.0.1:8089/api/image/Gallery/${id}`)); // like /About
  if (obj.img.error) 
    throw new Error(obj.img.error);

  return res.status(200).render("single/galerie-single", obj);
} catch (err) {
  console.log("GALLERY SINGLE ROUTE ERROR", err);
  req.flash("warning", err.message);
  return res.status(400).redirect("/Galerie");
}});

router.get("/Shop/:id", setUser, async (req, res) => {
try {
  let id = req.params.id;
  let obj = {
    active: "Shop",
    root: path.join(__dirname, "/pages/")
  };

  if (req.user)
    obj.user = req.user;

  obj.shopItem = JSON.parse(await rp(`http://127.0.0.1:8089/api/shop/single/${id}`)); // like /About
  if (obj.shopItem.error) 
    throw new Error(obj.shopItem.message);
  obj.shopItem.price = formatter.format(obj.shopItem.price).substr(2);

  obj.img = JSON.parse(await rp(`http://127.0.0.1:8089/api/image/Shop/${id}`)); // like /About
  if (obj.img.error) 
    throw new Error(obj.img.error);

  return res.status(200).render("single/shop-single", obj);
} catch (err) {
  console.log("SHOP SINGLE ROUTE ERROR", err);
  req.flash("warning", err.message);
  return res.status(400).redirect("/Shop");
}});

router.get("/Blog/:id", setUser, async (req, res) => {
try {
  let id = req.params.id;
  let obj = { active: "Blog" };

  if (req.user)
    obj.user = req.user;

  obj.blogs = JSON.parse(await rp(`http://127.0.0.1:8089/api/blog/single/${id}`)); // like /About
  if (obj.blogs.error) 
    throw new Error(obj.blogs.message);

  return res.status(200).render("single/blog-single", obj);
} catch (err) {
  console.log("BLOG ROUTE ERROR");
  req.flash("warning", err.message);
  return res.status(200).redirect("/About");
}});

/* END SINGLE */
/* ADMIN ROUTES */

router.get("/Admin", setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
try {
  let obj = { active: "Admin", user: req.user };

  return res.status(200).render("restricted/admin", obj);
} catch (err) {
  console.log("ADMIN ROUTE ERROR", err);
  req.flash("warning", err.message);
  return res.status(400).redirect("/");
}});

router.get("/Admin/Front", setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
try {
  let obj = { active: "Update Homepage", user: req.user };

  obj.front = JSON.parse(await rp("http://127.0.0.1:8089/api/front/")); // like /About
  if (obj.front.length <= 0) 
    obj.front = undefined;

return res.status(200).render("restricted/front-post", obj);
} catch (err) {
  console.log("ADMIN FRONT ERROR", err);
  req.flash("warning", err.message);
  return res.status(400).redirect("/");
}});

router.get("/Admin/Orders", setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
try {
  let obj = { active: "Admin Orders", user: req.user };

  let result = JSON.parse(await rp(`http://localhost:8089/api/order/`)); // like /About
  if (result.error) 
    throw new Error(result.message);

  if (result.orders != null) 
    obj.orders = result.orders;

  return res.status(200).render("restricted/orders", obj);
} catch (err) {
  console.log("ADMIN ROUTE ERROR", err);
  req.flash("warning", err.message);
  return res.status(400).redirect("/Admin");
}});

router.get("/Admin/Order/:id", setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
try {
  let obj = { active: "Order recap", user: req.user };
  
  obj.order = JSON.parse(await rp(`http://127.0.0.1:8089/api/order/${req.params.id}`)); // like /About
  if (obj.order.error) 
    throw new Error(obj.order.message);

  obj.deliveryPriceFormatted = formatter.format(obj.order.deliveryPrice).substr(2);
  obj.products = [];
  obj.order.items.forEach(item => {
    if (item.attributes.isUnique) {
      var items = {
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
          var items = {
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
          Object.keys(element.attributes).forEach((attribute, index) => {
            details += attribute.charAt(0).toUpperCase() + attribute.slice(1) + ": " + element.attributes[attribute].charAt(0).toUpperCase() + element.attributes[attribute].slice(1) + " / ";
          })
          items.details = details.substr(0, (details.length - 3));
          obj.products.push(items);
        }
      })
    }
  });

  return res.status(200).render("restricted/order-manage", obj);
} catch (err) {
  console.log("ORDER RECAP ROUTE ERROR", err);
  req.flash("warning", err.message);
  return res.status(400).redirect("/");
}});

router.get("/Admin/Galerie/Post", setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
try {
  let obj = { active: "Post a gallery item", user: req.user };
    
  return res.status(200).render("restricted/gallery-post", obj);
} catch (err) {
  console.log("GALLERY POST ROUTE ERROR", err);
  req.flash("warning", err.message);
  return res.status(400).redirect("/Galerie");
}});

router.get("/Admin/Galerie/Patch/:galleryId", setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
try {
  let obj = { active: "Edit a gallery item" };
      
  var [err, result] = await utils.to(Gallery.findOne({ _id: req.params.galleryId }));
  if (err || !result)
    throw new Error("An error occurred while fetching the gallery item");
  obj.gallery = result;

  obj.img = JSON.parse(await rp(`http://127.0.0.1:8089/api/image/Gallery/${req.params.galleryId}`));
  if (obj.img.error) 
    throw new Error(obj.img.error);

  return res.status(200).render("restricted/gallery-patch", obj);

} catch (err) {
  console.log("GALLERY PATCH ROUTE ERROR", err);
  req.flash("warning", err.message);
  return res.status(400).redirect("/Galerie");
}});

router.get("/Admin/Shop/Post", setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
try {
  let obj = { active: "Post a shop item", user: req.user };

  return res.status(200).render("restricted/shop-post", obj);
} catch (err) {
  console.log("SHOP POST ROUTE ERROR", err);
  req.flash("warning", err.message);
  return res.status(400).redirect("/Shop");
}});

router.get("/Admin/Shop/Patch/:shopId", setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
try {
  let obj = { active: "Edit a shop item", user: req.user };

  var [err, result] = await utils.to(Shop.findOne({ _id: req.params.shopId }));
  if (err || !result)
    throw new Error("An error occurred while fetching the shop item");
  obj.shop = result;

  obj.img = JSON.parse(await rp(`http://127.0.0.1:8089/api/image/Shop/${req.params.shopId}`));
  if (obj.img.error) 
    throw new Error(obj.img.error);

  return res.status(200).render("restricted/shop-patch", obj);
} catch (err) {
  console.log("SHOP PATCH ROUTE ERROR", err);
  req.flash("warning", err.message);
  return res.status(400).redirect("/Shop");
}});

router.get("/Admin/Blog/Post", setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
try {
  let obj = { active: "Post a blog", user: req.user };

  if (req.session.formData) {
    obj.formData = req.session.formData;
    req.session.formData = undefined;
  }

  return res.status(200).render("restricted/blog-post", obj);
} catch (err) {
  console.log("BLOG POST ROUTE ERROR", err);
  req.flash("warning", err.message);
  return res.status(200).redirect("/restricted/blog-post");
}});

router.get("/Admin/Blog/Patch/:blogId", setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
try {
  let obj = {active: "Edit a blog", user: req.user};

  if (req.session.formData) {
    obj.formData = req.session.formData;
    req.session.formData = undefined;
  }

  var [err, blog] = await utils.to(Blog.findOne({ _id: req.params.blogId }));
  if (err)
    throw new Error("An error occurred while loading the blog, please try again");
  if (blog === null) 
    throw new Error("No blog exists with this ID");

  obj.blogContent = blog;
  obj._id = req.params.blogId;
     
  return res.status(200).render("restricted/blog-patch", obj);
} catch (err) {
  console.log("BLOG PATCH ROUTE ERROR", err);
  req.flash("warning", err.message);
  return res.status(200).redirect("/");
}});

module.exports = router;