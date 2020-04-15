const express = require('express');
const router = express.Router();
const {validationResult} = require('express-validator');
const stripe = require('stripe')('sk_test_52HhMBaVOLRzC2iN3zljiCcP00Zb6YvQ3W');
//const {vOrder} = require('./validators/vShop');
const rp = require("request-promise");

const Order = require('../models/Order');
const User = require('../models/User');
const Cart = require('../models/Cart');
const Image = require('../models/Image');
const Gallery = require('../models/Gallery');
const Shop = require('../models/Shop');
const DeliveryInfo = require('../models/DeliveryInfo');
const verifySession = require('./helpers/verifySession');
const utils = require('./helpers/utils');
const mailer = require('./helpers/mailer');

router.get('/', verifySession, async (req, res) => {
try {
    console.log("stripe API route");
    
    return res.status(200).send("OK");
} catch (err) {
    console.log("FETCHING ORDER ERROR:", err);
    return res.status(200).json({error: true, message: err.message})
}})

// Token is created using Stripe Checkout or Elements!
// Get the payment token ID submitted by the form:

/*stripe.refunds.create(
    {charge: 'ch_1FXIoVAghyYyjMX1hRHRMSOH'},
    function(err, refund) {
      // asynchronously called
    }
  );*/

router.post('/charge', verifySession, async (req, res) => {
try {
    if (req.user) {
        // fetch total price
        let cart = new Cart(req.session.cart ? req.session.cart : {});
        let total = cart.totalPrice;
        let items = cart.generateArray();
        const token = req.body.stripeToken;

        if (total > 0) {
            // check if bought items exist in DB
            for (let i = 0; i < items.length; i++) {
                if (items[i].attributes.isUnique) {
                    var [err, item] = await utils.to(Shop.findById(items[i].attributes._id));
                    if (err || item === null)
                        throw new Error("An error occured while looking for an item you tried to purchase");
                } else {
                    var [err, item] = await utils.to(Gallery.findById(items[i].attributes._id));
                    if (err || item === null)
                        throw new Error("An error occured while looking for an item you tried to purchase");
                }
            }

            // stripe charging
            const charge = stripe.charges.create({
              amount: 999,//total * 100,
              currency: 'eur',
              description: 'Charging for purchase @ maral',
              source: token,
            }, (err, charge) => {
                if (err || charge === null)
                    throw new Error("An error occured while charging your order"); // change w/ msg

                // create order
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
                    console.log(err, body)
                    if (err)
                        throw new Error("An error occured while creating your order"); // change w/ msg
                    
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

router.post('/refund', verifySession, async (req, res) => {
try {
    let chargeId = req.body.chargeId;

    stripe.refunds.create({charge: chargeId},
        function(err, refund) {
            if (err)
                return res.status(200).json({err: true, msg: err.raw.message});
            return res.status(200).json({err: false, data: refund});
        }
    );
} catch (err) {
    console.log("STRIPE REFUND ERROR:", err);
    return res.status(200).json({error: true, message: err.message})
}})

module.exports = router;