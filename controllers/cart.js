const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Gallery = require('../models/Gallery');
const Shop = require('../models/Shop');

const { setUser } = require('./helpers/verifySession');
require('dotenv/config');
var formatter = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

router.get('/add/:itemId', setUser, async (req, res) => {
try {
    let productId = req.params.itemId;
    let cart = new Cart(req.session.cart ? req.session.cart : {});

    Shop.findById(productId, (err, product) => {
        if (err)
            return res.status(400).json({"error": true, "msg": "An error occurred while looking for the product"});
        if (product.isUnique === true) {
            let arr = cart.generateArray();
            for (let i = 0; i < arr.length; i++) {
                if (arr[i].attributes._id == product._id) {//elements: [{attributes : attributes}]
                    return res.status(200).json({"error": true, "msg": "You can't buy an unique painting more than once!"});
                } 
            }
        }

        cart.add(product, product.id);
        req.session.cart = cart;
        let cartCpy = JSON.parse(JSON.stringify(cart));
        cartCpy.totalPrice = formatter.format(cart.totalPrice).substr(2);
        cartCpy.items[product.id].price = formatter.format(cart.items[product.id].price).substr(2);

        return res.status(200).json({error: false, msg: "Item added to cart", cart: cartCpy});
    });
} catch (err) {
    console.log("ADD TO CART ERROR");
    return res.status(400).json({"error": true, "msg": err.message});
}});

router.get('/del/:itemId', setUser, async (req, res) => {
try {
    let productId = req.params.itemId;
    let cart = new Cart(req.session.cart ? req.session.cart : {});
            
    Shop.findById(productId, (err, product) => {
        if (err)
            return res.status(400).json({"error": true, "msg": "An error occurred while looking for the product"});
        cart.delete(product, product.id);
        req.session.cart = cart;
        let cartCpy = JSON.parse(JSON.stringify(cart));
        cartCpy.totalPrice = formatter.format(cart.totalPrice).substr(2);
        if (cartCpy.items[productId])
            cartCpy.items[product.id].price = formatter.format(cart.items[product.id].price).substr(2);

        return res.status(200).json({error: false, msg: "Item removed from cart", cart: cartCpy});
    });
} catch (err) {
    console.log("DELETE FROM CART ERROR");
    return res.status(400).json({"error": true, "msg": err.message});
}});

router.post('/add/pwinty/:itemId', setUser, async (req, res) => {
try {
    let productId = req.params.itemId; //for now is shop id, but will make it later image id
    let cart = new Cart(req.session.cart ? req.session.cart : {});
    let data = {
        SKU: req.body.SKU,
        price: req.body.price,
        attributes: req.body.attributes,
    };

    Gallery.findById(productId, async (err, product) => {
        try {
            if (err)
            return res.status(400).json({"error": true, "msg": "An error occurred while looking for the product"});

            /*var [err, image] = await utils.to(Image.findOne({isMain: true, itemType: "Shop", _itemId: product._id}));
            if (err) 
                throw new Error("An error occurred while fetching the image");*/

            let item = await cart.pwintyAdd(product, data);
            req.session.cart = cart;

            let cartCpy = JSON.parse(JSON.stringify(cart));
            cartCpy.totalPrice = formatter.format(cart.totalPrice).substr(2);
            if (cartCpy.items[data.SKU])
                cartCpy.items[data.SKU].price = formatter.format(cart.items[data.SKU].price).substr(2);

            return res.status(200).json({error: false, msg: "Item added to cart", cart: cartCpy, item: item}); //send curr item qty/price?
        } catch (err) {
            return res.status(400).json({"error": true, "msg": err.message});
        }
    });
} catch (err) {
    console.log("ADD TO CART ERROR");
    return res.status(400).json({"error": true, "msg": err.message});
}});

router.post('/update/pwinty/:itemId/:qty', setUser, async (req, res) => {
try {
    let productId = req.params.itemId;
    let newQty = parseInt(req.params.qty); //sanitize
    let cart = new Cart(req.session.cart ? req.session.cart : {});
    let data = {
        SKU: req.body.SKU,
        price: req.body.price,
        attributes: req.body.attributes,
    };

    if (Number.isInteger(newQty) && (newQty >= 0 && newQty <= 99)) {
        Gallery.findById(productId, async (err, product) => {
            try {
                if (err || !product)
                    return res.status(400).json({"error": true, "msg": "An error occurred while looking for the product"});

                let item = await cart.pwintyUpdate(data, newQty);
                item.price = formatter.format(item.price).substr(2);
                req.session.cart = cart;
                let cartCpy = JSON.parse(JSON.stringify(cart));
                cartCpy.totalPrice = formatter.format(cart.totalPrice).substr(2);
                if (cartCpy.items[productId])
                    cartCpy.items[product.id].price = formatter.format(cart.items[product.id].price).substr(2);
            
                let msg = "Item quantity updated";
                if (newQty == 0)
                    msg = "Item removed from cart";
                return res.status(200).json({error: false, msg: msg, cart: cartCpy, item: item});
            } catch (err) {
                return res.status(400).json({"error": true, "msg": err.message});
            }
        });
    } else
        throw new Error("Quantity for an item must be between 0 and 99");          
} catch (err) {
    console.log("UPDATE CART ERROR");
    return res.status(400).json({"error": true, "msg": err.message});
}});

router.post('/del/pwinty/:itemId', setUser, async (req, res) => {
try {
    let productId = req.params.itemId;
    let cart = new Cart(req.session.cart ? req.session.cart : {});
    let data = {
        SKU: req.body.SKU,
        price: req.body.price,
        attributes: req.body.attributes,
    };
            
    Gallery.findById(productId, async (err) => {
        try {
            if (err)
                return res.status(400).json({"error": true, "msg": "An error occurred while looking for the product"});

            let item = await cart.pwintyDelete(data);
            req.session.cart = cart;
            let cartCpy = JSON.parse(JSON.stringify(cart));
            cartCpy.totalPrice = formatter.format(cart.totalPrice).substr(2);
            if (cartCpy.items[data.SKU])
                cartCpy.items[data.SKU].price = formatter.format(cartCpy.items[data.SKU].price).substr(2);
            
            return res.status(200).json({error: false, msg: "Item removed from cart", cart: cartCpy, item: item});
        } catch (err) {
            console.log(err);
            return res.status(400).json({"error": true, "msg": err.message});
        }
    });
} catch (err) {
    console.log("DELETE FROM CART ERROR");
    return res.status(400).json({"error": true, "msg": err.message});
}});

router.get('/clear/:id', setUser, async (req, res) => {
try {
    let cart = new Cart({});
    cart.clearCart();
    req.session.cart = cart;
    req.flash("success", "Purchase successful, your order has been placed!");

    return res.status(200).redirect(`/Order/${req.params.id}`);
} catch (err) {
    console.log("CLEAR CART ERROR");
    req.flash("warning", err.message);
    return res.status(400).redirect('/');
}});

/*
router.get('/totalprice', setUser, async (req, res) => {
try {
    let total = 0;   

    if (req.session.cart) 
        total = req.session.cart.totalPrice; ///////////////WTF IS THIS

    console.log(total, req.session.cart.totalPrice)

    //maybe add delivery fees and taxes etc
    return res.status(400).json({"err": false, "total": total})
} catch (err) {
    console.log("TOTAL PRICE CART ERROR");
    return res.status(400).json({"err": true, "msg": err.message})
}})*/

module.exports = router;