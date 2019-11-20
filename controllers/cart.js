const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Shop = require('../models/Shop');
const Order = require('../models/Order');
const DeliveryInfo = require('../models/DeliveryInfo');
const utils = require('./helpers/utils');
const mailer = require('./helpers/mailer');

const verifySession = require('./helpers/verifySession');
require('dotenv/config');

const stripeSecret = process.env.STRIPE_SECRET;
const stripe = require('stripe')(stripeSecret);

router.get('/add/:itemId', async (req, res) => {
try {
    let productId = req.params.itemId;
    let cart = new Cart(req.session.cart ? req.session.cart : {});
        
    Shop.findById(productId, (err, product) => {
        if (err)
            throw new Error("An error occured while looking for the product");
        if (product.isUnique === true) {
            let arr = cart.generateArray();
            for (let i = 0; i < arr.length; i++) {
                if (arr[i].item._id == product._id) {
                    return res.status(200).json({"error": true, "msg": "You can't buy an unique painting more than once!"})
                } 
            }
        }
        cart.add(product, product.id);
        req.session.cart = cart;
        return res.status(200).json({"error": false, "msg": "Item added to cart", "totalPrice": cart.totalPrice})
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
            throw new Error("An error occured while looking for the product");
        cart.delete(product, product.id);
        req.session.cart = cart;
        return res.status(200).json({"error": false, "msg": "Item removed from cart", "totalPrice": cart.totalPrice})
    })
} catch (err) {
    console.log("DELETE FROM CART ERROR");
    return res.status(400).json({"error": true, "msg": err.message})
}})

router.get('/clear', async (req, res) => {
try {
    let cart = new Cart({});
    cart.clearCart();
    req.session.cart = cart;
    return res.status(200).send("ty for purchasing");//redirect ty for purchase
} catch (err) {
    console.log("CLEAR CART ERROR");
    req.flash("warning", err.message);
    return res.status(400).redirect('/');
}})

router.post('/purchase', verifySession, async (req, res) => {
//if req.user
try {
    if (req.user) {
        var items = req.body.items;
        let token = req.body.stripeTokenId;
        let total = 0;
        console.log(items)

        for (let i = 0; i < items.length; i++) {
            var [err, item] = await utils.to(Shop.findById(items[i].id));
            if (err || item === null)
                throw new Error("An error occured while looking for an item you tried to purchase");
            else 
                total += items[i].price;
        }
        console.log(total);

        stripe.charges.create({
            amount: total * 100,
            source: token,
            currency: 'eur'
        })
        .then(async () => {
            for (let index = 0;  index < items.length;  index++) {
                var [err, item] = await utils.to(Shop.findOneAndDelete({_id: items[index].id, isUnique: true}));
                if (err) 
                    throw new Error("An error occured while deleting the unique item");
            }

            var [err, infos] = await utils.to(DeliveryInfo.findOne({ _userId: req.user._id }));
            if (err)
                throw new Error("An error occured while looking for your delivery informations, please retry");

            const order = new Order({
                _userId: req.user._id,
                items: items,
                price: total,
                status: "Validated",
                firstname: infos.firstname,
                lastname:  infos.lastname,
                full_address:  infos.full_address,
                full_street:  infos.full_street,
                country:  infos.country,
                street_name:  infos.street_name,
                street_number:  infos.street_number,
                city: infos.city,
                state: infos.state,
                zipcode: infos.zipcode,
                instructions:  infos.instructions
            });

            var [err, result] = await utils.to(order.save());
            if (err)
                throw new Error("An error occured while creating your order, please try again");

            let subject = `New Order #${order._id}`;//order id and href to order?
            let content = `To manage order, please follow the link below using your administrator account: <hr/><a href="http://localhost:8089/Admin/Orders/${order._id}">CLICK HERE</a>`;
            //maral.canvas@gmail.com
            if (await mailer("ablin@byom.de", subject, content)) 
                throw new Error("An error occured while trying to send the mail, please retry");

            console.log("add order to db, send mail, etc")
            if (total !== 0)
                return res.status(200).json({"ok": total});
            return res.status(200).json({"no": total});
            //return res
        })
        .catch((err) => {
            console.log("charging failure", err)
            //return res
        })
    } else 
        throw new Error("Unauthorized, please make sure you are logged in");
} catch (err) {
    console.log("PURCHASE ERROR");
    console.log(err.message)
    req.flash("warning", err.message);
    return res.status(400).redirect('/shopping-cart');
}})

module.exports = router;