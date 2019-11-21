const express = require('express');
const path = require('path');
const request = require('request-promise');

const verifySession = require('./helpers/verifySession');
const utils = require('./helpers/utils');
const Blog = require('../models/Blog');
const User = require('../models/User');
const Shop = require('../models/Shop');
const Order = require('../models/Order');
const Gallery = require('../models/Gallery');
const DeliveryInfo = require('../models/DeliveryInfo');
const PwToken = require('../models/PasswordToken');
const Cart = require('../models/Cart');
require('dotenv/config');

const stripeSecret = process.env.STRIPE_SECRET;
const stripePublic = process.env.STRIPE_PUBLIC;

const router = express.Router();

router.get('/', verifySession, (req, res) => {
try {
    let obj = {active: "Home"};//{root: path.join(__dirname, '/pages/')};
    if (req.user) {
        obj.userId = req.user._id;
        obj.name = req.user.name;
        obj.level = req.user.level;
    }
    res.status(200).render('home', obj);
} catch (err) {
    console.log("HOME ROUTE ERROR", err);
    res.status(400).render('home');
}})

router.get('/Galerie', verifySession, async (req, res) => {
try {
    let obj = {
        active: "Galerie",
        root: path.join(__dirname, '/pages/')
    };
    obj.galleries = JSON.parse(await request('http://127.0.0.1:8089/api/gallery/'));
    if (obj.galleries.error)
            throw new Error(obj.galleries.message);
    if (req.user) {
        obj.userId = req.user._id;
        obj.name = req.user.name;
        obj.level = req.user.level;
    }
    res.status(200).render('galerie', obj);
} catch (err) {
    console.log("GALLERY ROUTE ERROR", err);
    req.flash("warning", err.message);
    res.status(400).redirect("/");
}})

router.get('/Order/:id', verifySession, async (req, res) => {
    try {
        let obj = {active: "Order recap"};
        if (req.user) {
            obj.userId = req.user._id;
            obj.name = req.user.name;
            obj.level = req.user.level;
        }
        var [err, order] = await utils.to(Order.findById(req.params.id));
        if (err || order == null)
            throw new Error("No order exist with this ID!");
        if ((order._userId === req.user._id) || req.user.level >= 3) {
            //seek order with id and check if either admin or if user id correspond to user id in order
            obj.order = order;
            res.status(200).render('order-recap', obj);
        } else
            throw new Error("Please make sure you're logged in to check your order");
    } catch (err) {
        console.log("ORDER RECAP ROUTE ERROR", err);
        req.flash("warning", err.message);
        res.status(400).redirect("/");
}})

router.get('/shopping-cart', verifySession, async (req, res) => {
try {
    let obj = {active: "Cart", stripePublicKey: stripePublic, products: null, totalPrice: 0, totalQty: 0}
    if (req.user) {
        obj.userId = req.user._id;
        obj.name = req.user.name;
        obj.level = req.user.level;
        obj.isDelivery = false;
        obj.delivery = null;
        var [err, result] = await utils.to(DeliveryInfo.findOne({ _userId: req.user._id }));
        if (err)
            throw new Error("An error occured while looking for your delivery informations, please retry");
        if (result != null) {
            obj.delivery = result;
            obj.isDelivery = true
        }
    }
    if (req.session.cart)  {
        let cart = new Cart(req.session.cart);
        obj.products = cart.generateArray();
        obj.totalPrice = cart.totalPrice;
        obj.totalQty = cart.totalQty
    }
    res.status(200).render('cart', obj);
} catch (err) {
    console.log("CART ERROR", err);
    req.flash("info", err.message);
    return res.status(400).redirect('/');
}})

router.get('/Login', verifySession, (req, res) => {
try {
    let obj = {active: "Login"};
    if (req.session.formData) {
        obj.formData = req.session.formData;
        req.session.formData = undefined;
    }
    if (req.user) {
        req.flash("info", "You're already logged in");
        return res.status(200).redirect('/');
    }
    res.status(200).render('login', obj);
} catch (err) {
    console.log("LOGIN ROUTE ERROR", err);
    req.flash("warning", "An error occured, please try again");
    res.status(400).redirect("/");
}})

router.get('/Register', verifySession, (req, res) => {
try {
    let obj = {active: "Register"};
    if (req.session.formData) {
        obj.formData = req.session.formData;
        req.session.formData = undefined;
    }
    if (req.user) {
        req.flash("info", "You're already logged in");
        return res.status(200).redirect('/');
    }
    res.status(200).render('register', obj);
} catch (err) {
    console.log("REGISTER ROUTE ERROR", err);
    req.flash("warning", "An error occured, please try again");
    res.status(400).redirect("/");
}})

router.get('/User', verifySession, async (req, res) => {
try {
    let obj = {};
    if (req.user) {
        obj = await User.findOne({_id: req.user._id});
        obj.password = undefined;
        obj.active = "User";
        obj.delivery = false;
        var [err, result] = await utils.to(DeliveryInfo.findOne({ _userId: req.user._id }));
        if (err)
            throw new Error("An error occured while looking for your delivery informations, please retry");
        if (result != null)
            obj.delivery = result;
        var [err, orders] = await utils.to(Order.find({ _userId: req.user._id }));
        if (err)
            throw new Error("An error occured while looking for your orders informations, please retry");
        if (orders != null)
            obj.orders = orders;    
        console.log(orders)
        res.status(200).render('user', obj);
    } else 
        throw new Error("You need to be logged in");
} catch (err) {
    console.log("USER ROUTE ERROR", err);
    req.flash("warning", err.message);
    res.status(400).redirect("/Login");
}})

router.get('/Bio', verifySession, (req, res) => {
try {
    let obj = {active: "Biographie"};
    if (req.user) {
        obj.userId = req.user._id;
        obj.name = req.user.name;
        obj.level = req.user.level;
    }
    res.status(200).render('bio', obj);
} catch (err) {
    console.log("BIO ROUTE ERROR", err);
    req.flash("warning", "An error occured, please try again");
    res.status(400).redirect("/");
}})

router.get('/Shop', verifySession, async (req, res) => {
try {
    let obj = {active: "Shop"};
    obj.original = JSON.parse(await request('http://127.0.0.1:8089/api/shop/'));
    if (obj.original.error)
        throw new Error(obj.original.message);
    obj.print = JSON.parse(await request('http://127.0.0.1:8089/api/shop?tab=print'));
    if (obj.print.error)
        throw new Error(obj.print.message);
    if (req.user) {
        obj.userId = req.user._id;
        obj.name = req.user.name;
        obj.level = req.user.level;
    }
    res.status(200).render('shop', obj);
} catch (err) {
    console.log("SHOP ROUTE ERROR", err);
    req.flash("warning", "An error occured, please try again");
    res.status(400).redirect("/");
}})

router.get('/Contact', verifySession, (req, res) => {
try {
    let obj = {active: "Contact"};
    if (req.session.formData) {
        obj.formData = req.session.formData;
        req.session.formData = undefined;
    }
    if (req.user) {
        obj.userId = req.user._id;
        obj.name = req.user.name;
        obj.level = req.user.level;
    }
    res.status(200).render('contact', obj);
} catch (err) {
    console.log("CONTACT ROUTE ERROR", err);
    req.flash("warning", "An error occured, please try again");
    res.status(400).redirect("/");
}})

router.get('/Blog', verifySession, async (req, res) => {
try {
    let obj = {active: "Blog"};
    obj.blogs = JSON.parse(await request('http://127.0.0.1:8089/api/blog/'));
    if (obj.blogs.error)
        throw new Error(obj.blogs.message);
    if (req.user) {
        obj.userId = req.user._id;
        obj.name = req.user.name;
        obj.level = req.user.level;
    }
    return res.status(200).render('blog', obj);
} catch (err) {
    console.log("BLOG ROUTE ERROR", err);
    req.flash("warning", err.message);
    return res.status(200).redirect('/');
}})

router.get('/Lostpw', verifySession, async (req, res) => {
try {
    if (req.user) {
        req.flash('info', "You're logged in, you can change your password here.")
        return res.status(200).redirect('/User');
    } else {
        let obj = {
            active: "Lost password",
            root: path.join(__dirname, '/pages/')
        };
        res.status(200).render('Lostpw', obj);
    }
} catch (err) {
    console.log("LOSTPW ROUTE ERROR", err);
    req.flash("warning", "An error occured, please try again");
    res.status(400).redirect("/");
}})

router.get('/Resetpw/:tokenId/:token', verifySession, async (req, res) => { //if user connected, redirect to home
try {
    if (req.user) {
        req.flash('info', "You're logged in, you can change your password here.")
        return res.status(200).redirect('/User');
    } else {
        let obj = {
            active: "Reset password",
            root: path.join(__dirname, '/pages/'),
            tokenId: req.params.tokenId, //sanitize
            token: req.params.token
        };
       
        var [err, pwToken] = await utils.to(PwToken.findOne({_id: obj.tokenId, token: obj.token}));
        if (err)
            throw new Error("An error occured while fetching the token, please try again");
        if (pwToken === null) 
            throw new Error("Invalid token, please try to request another one here");
        res.status(200).render('Resetpw', obj);
    }
} catch (err) {
    console.log("RESETPW ROUTE ERROR", err);
    req.flash("warning", err.message);
    return res.status(200).redirect("/Lostpw");
}})

router.get('/Blog/Post', verifySession, async (req, res) => {
try {
    if (req.user) {
        let obj = {active: "Post a blog"};
        if (req.session.formData) {
            obj.formData = req.session.formData;
            req.session.formData = undefined;
        }
        if (req.user) {
            obj.userId = req.user._id;
            obj.name = req.user.name;
            obj.level = req.user.level;
        }
        return res.status(200).render('restricted/blog-post', obj);
    } else 
        throw new Error("Unauthorized. Contact your administrator if you think this is a mistake");
} catch (err) {
    console.log("BLOG POST ROUTE ERROR", err);
    req.flash("warning", err.message);
    return res.status(200).redirect("/Blog");
}})

router.get('/Blog/Patch/:blogId', verifySession, async (req, res) => { 
try {
    if (req.user) {
        let obj = {
            active: "Edit a blog"
        };
        var err, blog;
        [err, blog] = await utils.to(Blog.findOne({_id: req.params.blogId}));
        if (err)
            throw new Error("An error occured while loading the blog, please try again");
        if (blog === null)
            throw new Error("No blog exists with this ID");
        obj.blogContent = blog;
        obj._id = req.params.blogId;
        if (req.user) {
            obj.userId = req.user._id;
            obj.name = req.user.name;
            obj.level = req.user.level;
        }
        return res.status(200).render('restricted/blog-patch', obj);
    } else 
        throw new Error("Unauthorized. Contact your administrator if you think this is a mistake");
} catch (err) {
    console.log("BLOG PATCH ROUTE ERROR", err);
    req.flash("warning", err.message);
    return res.status(200).redirect("/");
}})

router.get('/Blog/:id', verifySession, async (req, res) => {
    try {
        let id = req.params.id;
        let obj = {active: "Blog"};
        obj.blogs = JSON.parse(await request(`http://127.0.0.1:8089/api/blog/single/${id}`));
        if (obj.blogs.error)
            throw new Error(obj.blogs.message);
        if (req.user) {
            obj.userId = req.user._id;
            obj.name = req.user.name;
            obj.level = req.user.level;
        }
        return res.status(200).render('blog-single', obj);
    } catch (err) {
        console.log("BLOG ROUTE ERROR", err);
        req.flash("warning", err.message);
        return res.status(200).redirect('/Blog');
}})

router.get('/Shop/Post', verifySession, async (req, res) => {
try {
    if (req.user) {
        let obj = {active: "Post a shop item"};
        if (req.user) {
            obj.userId = req.user._id;
            obj.name = req.user.name;
            obj.level = req.user.level;
        }
    
        return res.status(200).render('restricted/shop-post', obj);
    } else 
         throw new Error("Unauthorized. Contact your administrator if you think this is a mistake"); 
} catch (err) {
    console.log("SHOP POST ROUTE ERROR", err);
    req.flash("warning", err.message);
    res.status(400).redirect("/Shop");
}})
    
router.get('/Shop/Patch/:shopId', verifySession, async (req, res) => {
try {
    if (req.user) {
        let obj = {active: "Edit a shop item"};
        var [err, result] = await utils.to(Shop.findOne({_id: req.params.shopId}));
        if (err)
            throw new Error("An error occured while fetching the gallery item");
        if (req.user) {
            obj.userId = req.user._id;
            obj.name = req.user.name;
            obj.level = req.user.level;
        }   
        obj.shop = result;
          
        return res.status(200).render('restricted/shop-patch', obj);
    } else 
        throw new Error("Unauthorized. Contact your administrator if you think this is a mistake"); 
} catch (err) {
    console.log("SHOP PATCH ROUTE ERROR", err);
    req.flash("warning", err.message);
    res.status(400).redirect("/Shop");
}})

router.get('/Shop/:id', verifySession, async (req, res) => {
    try {
        let id = req.params.id;
        let obj = {
            active: "Galerie",
            root: path.join(__dirname, '/pages/')
        };
        obj.shopItem = JSON.parse(await request(`http://127.0.0.1:8089/api/shop/single/${id}`));
        if (obj.shopItem.error)
                throw new Error(obj.shopItem.message);
        if (req.user) {
            obj.userId = req.user._id;
            obj.name = req.user.name;
            obj.level = req.user.level;
        }
        res.status(200).render('shop-single', obj);
    } catch (err) {
        console.log("SHOP SINGLE ROUTE ERROR", err);
        req.flash("warning", err.message);
        res.status(400).redirect("/Shop");
}})

router.get('/Galerie/Post', verifySession, async (req, res) => {
try {
    if (req.user) {
        let obj = {active: "Post a gallery item"};
        if (req.user) {
            obj.userId = req.user._id;
            obj.name = req.user.name;
            obj.level = req.user.level;
        }

        return res.status(200).render('restricted/gallery-post', obj);
    } else 
        throw new Error("Unauthorized. Contact your administrator if you think this is a mistake"); 
} catch (err) {
    console.log("GALLERY POST ROUTE ERROR", err);
    req.flash("warning", err.message);
    res.status(400).redirect("/Galerie");
}})

router.get('/Galerie/Patch/:galleryId', verifySession, async (req, res) => {
try {
    if (req.user) {
        let obj = {active: "Edit a gallery item"};
        if (req.user) {
            obj.userId = req.user._id;
            obj.name = req.user.name;
            obj.level = req.user.level;
        }

        var [err, result] = await utils.to(Gallery.findOne({_id: req.params.galleryId}));
        if (err)
            throw new Error("An error occured while fetching the gallery item");
        obj.gallery = result;
      
        return res.status(200).render('restricted/gallery-patch', obj);
    } else 
        throw new Error("Unauthorized. Contact your administrator if you think this is a mistake"); 
} catch (err) {
    console.log("GALLERY PATCH ROUTE ERROR", err);
    req.flash("warning", err.message);
    res.status(400).redirect("/Galerie");
}})

router.get('/Galerie/:id', verifySession, async (req, res) => {
    try {
        let id = req.params.id;
        let obj = {
            active: "Galerie",
            root: path.join(__dirname, '/pages/')
        };
        obj.galleries = JSON.parse(await request(`http://127.0.0.1:8089/api/gallery/single/${id}`));
        if (obj.galleries.error)
                throw new Error(obj.galleries.message);
        if (req.user) {
            obj.userId = req.user._id;
            obj.name = req.user.name;
            obj.level = req.user.level;
        }
        res.status(200).render('galerie-single', obj);
    } catch (err) {
        console.log("GALLERY SINGLE ROUTE ERROR", err);
        req.flash("warning", err.message);
        res.status(400).redirect("/Galerie");
}})

module.exports = router;