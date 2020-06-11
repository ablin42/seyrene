const express = require('express');
const router = express.Router();
const stripe = require('stripe')('sk_test_52HhMBaVOLRzC2iN3zljiCcP00Zb6YvQ3W');
const rp = require("request-promise");

const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Gallery = require('../models/Gallery');
const Shop = require('../models/Shop');
const { ROLE, setUser, authUser, authRole, setOrder, authGetOrder } = require('./helpers/verifySession');
const utils = require('./helpers/utils');


router.post('/charge', setUser, async (req, res) => {
try {
    if (req.user) {
        let cart = new Cart(req.session.cart ? req.session.cart : {});
        let total = cart.totalPrice;
        let items = cart.generateArray();
        const token = req.body.stripeToken;

        if (total > 0) {
            for (let i = 0; i < items.length; i++) {
                if (items[i].attributes.isUnique) {
                    var [err, item] = await utils.to(Shop.findById(items[i].attributes._id));
                    if (err || item === null)
                        throw new Error("An error occurred while looking for an item you tried to purchase");
                } else {
                    var [err, item] = await utils.to(Gallery.findById(items[i].attributes._id));
                    if (err || item === null)
                        throw new Error("An error occurred while looking for an item you tried to purchase");
                }
            }

            stripe.charges.create({
                amount: total * 100,
                currency: 'eur',
                description: 'Charging for purchase @ maral',
                source: token,
            }, (err, charge) => {
                if (err) {
                    req.flash("warning", err.message);
                    return res.status(200).redirect("/payment");
                }

                let options = {
                    uri: `http://localhost:8089/api/order/create`,
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Accept': 'application/json'
                    },
                    body: {items: items, price: total, user: req.user, chargeId: charge.id},
                    json: true
                }
                rp(options, (err, response, body) => {
                    if (err) {
                        req.flash("warning", "An error occurred while creating your order");
                        return res.status(200).redirect("/payment");
                    }
                    if (body.err === true) {
                        req.flash("warning", body.message);
                        return res.status(200).redirect("/payment");
                    }
                    return res.status(200).redirect(`/api/cart/clear/${body.orderId}`);
                });
            });
        } else
            throw new Error("Your cart is empty!");
    } else 
        throw new Error("Unauthorized, please make sure you are logged in");
} catch (err) {
    console.log("STRIPE CHARGE ERROR:", err);
    return res.status(200).json({error: true, message: err.message})
}})

router.post('/refund', setUser, async (req, res) => {
try {
    if (req.user) {
        let chargeId = req.body.chargeId;

        var [err, order] = await utils.to(Order.findOne({chargeId: chargeId})); 
        if (err || order === null)
            throw new Error("We couldn't find your order, please try again");

        if (order._userId === req.user._id || req.user.level >= 3) {
    
            stripe.refunds.create({payment_intent: chargeId},
                (err, refund) => {
                    if (err)
                        return res.status(200).json({error: true, message: err.raw.message});
                    return res.status(200).json({error: false, data: refund});
                }
            );
        } else 
            throw new Error("Unauthorized, contact your administrator if you think this is an issue.");
    }
} catch (err) {
    console.log("STRIPE REFUND ERROR:", err);
    return res.status(200).json({error: true, message: err.message})
}})

router.post('/create-intent', setUser, async (req, res) => {
try {
    if (req.user) {
        let cart = new Cart(req.session.cart ? req.session.cart : {});
        let total = cart.price.totalIncludingTax; /////////////////////HERE
        console.log(total)
        let items = cart.generateArray();

        if (total > 0) {
            for (let i = 0; i < items.length; i++) {
                if (items[i].attributes.isUnique) {
                    var [err, item] = await utils.to(Shop.findById(items[i].attributes._id));
                    if (err || item === null)
                        throw new Error("An error occurred while looking for an item you tried to purchase");
                } else {
                    var [err, item] = await utils.to(Gallery.findById(items[i].attributes._id));
                    if (err || item === null)
                        throw new Error("An error occurred while looking for an item you tried to purchase");
                }
            }

            stripe.paymentIntents.create({
                amount: Math.round(total * 100), ///////////////////////add delivery price here (and taxes)
                currency: "eur",
                description: 'Charging for purchase @ maral',
            }, (err, paymentIntent) => {
                if (err) 
                    return res.status(200).send({error: true, message: err.message});

                let options = {
                    uri: `http://localhost:8089/api/order/initialize`,
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Accept': 'application/json'
                    },
                    body: {items: items, price: total, deliveryPrice: cart.price.shippingIncludingTax, user: req.user, chargeId: paymentIntent.id},
                    json: true
                }
                rp(options, (err, response, body) => {
                    if (err) 
                        return res.status(200).send({error: true, message: "An error occurred while initializing your order"});
                    if (body.err === true) 
                        return res.status(200).send({error: true, message: body.message});

                    return res.status(200).send({error: false, clientSecret: paymentIntent.client_secret, orderId: body._id});
                });
            });
        } else
            throw new Error("Your cart is empty!");
    } else 
        throw new Error("Unauthorized, please make sure you are logged in");
} catch (err) {
    console.log("STRIPE CREATE INTENT ERROR:", err);
    return res.status(200).json({error: true, message: err.message})
}})

module.exports = router;