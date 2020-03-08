const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Shop = require('../models/Shop');
const Order = require('../models/Order');
const User = require('../models/User');
const DeliveryInfo = require('../models/DeliveryInfo');
const utils = require('./helpers/utils');
const mailer = require('./helpers/mailer');
const rp = require('request-promise');

const verifySession = require('./helpers/verifySession');
require('dotenv/config');

//var formatter = new Intl.NumberFormat();
var formatter = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
const stripeSecret = process.env.STRIPE_SECRET;
const stripe = require('stripe')(stripeSecret);

router.get('/update/:itemId/:qty', async (req, res) => {
try {
    let productId = req.params.itemId;
    let newQty = parseInt(req.params.qty); //sanitize
    let cart = new Cart(req.session.cart ? req.session.cart : {});

    if (Number.isInteger(newQty) && (newQty >= 0 && newQty <= 99))
    {
        Shop.findById(productId, (err, product) => {
            if (err || !product)
                return res.status(400).json({"error": true, "msg": "An error occured while looking for the product"});
            if (product.isUnique === true && newQty > 1)
                return res.status(400).json({"error": true, "msg": "Quantity can't exceed 1 for unique items!"})

            cart.update(product, product.id, newQty);
            req.session.cart = cart;
            let cartCpy = JSON.parse(JSON.stringify(cart));
            cartCpy.totalPrice = formatter.format(cart.totalPrice).substr(2);
            if (cartCpy.items[productId])
                cartCpy.items[product.id].price = formatter.format(cart.items[product.id].price).substr(2);
        
            let msg = "Item quantity updated";
            if (newQty == 0)
                msg = "Item removed from cart";
            return res.status(200).json({error: false, msg: msg, cart: cartCpy});
        })
    }
    else
        throw new Error("Quantity for an item must be between 0 and 99");          
} catch (err) {
    console.log("UPDATE CART ERROR");
    return res.status(400).json({"error": true, "msg": err.message})
}})

router.post('/add/:itemId', async (req, res) => {
try {
    let productId = req.params.itemId;
    let cart = new Cart(req.session.cart ? req.session.cart : {});

    console.log(req.body)
        
    Shop.findById(productId, (err, product) => {
        if (err)
            return res.status(400).json({"error": true, "msg": "An error occured while looking for the product"});
        if (product.isUnique === true) {
            let arr = cart.generateArray();
            for (let i = 0; i < arr.length; i++) {
                if (arr[i].item._id == product._id) {
                    return res.status(200).json({"error": true, "msg": "You can't buy an unique painting more than once!"});
                } 
            }
        }

        //send product and product info fetched from shop.findbyid

        cart.add(product, product.id);
        req.session.cart = cart;
        let cartCpy = JSON.parse(JSON.stringify(cart));
        cartCpy.totalPrice = formatter.format(cart.totalPrice).substr(2);
        cartCpy.items[product.id].price = formatter.format(cart.items[product.id].price).substr(2);

        return res.status(200).json({error: false, msg: "Item added to cart", cart: cartCpy});
    })
} catch (err) {
    console.log("ADD TO CART ERROR");
    return res.status(400).json({"error": true, "msg": err.message})
}})

router.get('/del/:itemId', async (req, res) => {
try {
    let productId = req.params.itemId;
    let cart = new Cart(req.session.cart ? req.session.cart : {});
            
    Shop.findById(productId, (err, product) => {
        if (err)
            return res.status(400).json({"error": true, "msg": "An error occured while looking for the product"});
        cart.delete(product, product.id);
        req.session.cart = cart;
        let cartCpy = JSON.parse(JSON.stringify(cart));
        cartCpy.totalPrice = formatter.format(cart.totalPrice).substr(2);
        if (cartCpy.items[productId])
            cartCpy.items[product.id].price = formatter.format(cart.items[product.id].price).substr(2);

        return res.status(200).json({error: false, msg: "Item removed from cart", cart: cartCpy});
    })
} catch (err) {
    console.log("DELETE FROM CART ERROR");
    return res.status(400).json({"error": true, "msg": err.message})
}})

router.get('/clear/:id', async (req, res) => {
try {
    let cart = new Cart({});
    cart.clearCart();
    req.session.cart = cart;
    return res.status(200).redirect(`/Order/${req.params.id}`);
} catch (err) {
    console.log("CLEAR CART ERROR");
    req.flash("warning", err.message);
    return res.status(400).redirect('/');
}})

router.get('/totalprice', async (req, res) => {
try {
    let total = 0;   

    if (req.session.cart) 
        total = req.session.cart.totalPrice;

    //maybe add delivery fees and taxes etc
    return res.status(400).json({"err": false, "total": total})
} catch (err) {
    console.log("TOTAL PRICE CART ERROR");
    return res.status(400).json({"err": true, "msg": err.message})
}})

router.post('/purchase', verifySession, async (req, res) => {
try {
    if (req.user) {
        let token = req.body.stripeTokenId;
        let cart = new Cart(req.session.cart ? req.session.cart : {});
        let total = cart.totalPrice;
        let items = cart.generateArray();

        for (let i = 0; i < items.length; i++) {
            items[i].item.img = undefined;
            var [err, item] = await utils.to(Shop.findById(items[i].item._id));
            if (err || item === null)
                throw new Error("An error occured while looking for an item you tried to purchase");
        }
        if (total > 0) {
            stripe.charges.create({
                amount: Math.round(total * 100),
                source: token,
                currency: 'eur'
            })
            .then(async () => {
                let options = {
                    uri: `http://localhost:8089/api/order/create`,
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Accept': 'application/json'
                    },
                    body: {items: items, price: total, user: req.user},
                    json: true
                }
                rp(options)
                .then(function(response) {
                    if (response.err === false) 
                        return res.status(200).json({"err": false, "id": response.orderId});
                    else 
                        throw new Error(response.message);
                })  
                .catch((err) => {
                    //cancel stripe charging here 
                    return res.status(200).json({"err": true, "msg": err.message});
                })
            })
            .catch((err) => {
                console.log("charging failure", err);
                //cancel stripe charging here 
                return res.status(200).json({"err": true, "msg": err.message});
            })
        }
        else
            throw new Error("Your cart is empty!");
    } else 
        throw new Error("Unauthorized, please make sure you are logged in");
} catch (err) {
    console.log("PURCHASE ERROR:", err);
    return res.status(200).json({"err": true, "msg": err.message});
}})

module.exports = router;