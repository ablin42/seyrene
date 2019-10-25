const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Gallery = require('../models/Gallery');
const utils = require('./helpers/utils');
require('dotenv/config');

const stripeSecret = process.env.STRIPE_SECRET;
const stripe = require('stripe')(stripeSecret);

router.get('/add-to-cart/:itemId', async (req, res) => {
try {
    let productId = req.params.itemId;
    let cart = new Cart(req.session.cart ? req.session.cart : {});
    
    Gallery.findById(productId, (err, product) => {
        if (err)
            throw new Error("An error occured while looking for the product");
        cart.add(product, product.id);
        req.session.cart = cart;
        req.flash("success", "Item added to cart");
        res.status(200).redirect('/Galerie');
    })
} catch (err) {
    console.log("ADD TO CART ERROR");
    req.flash("warning", err.message);
    return res.status(400).redirect('/');
}})

router.post('/purchase', async (req, res) => {
try {
    let items = req.body.items;
    let token = req.body.stripeTokenId;
    let total = 0;
    console.log(items)

    for (let i = 0; i < items.length; i++) {
        var [err, item] = await utils.to(Gallery.findById(items[i].id));
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
    .then(() => {
        console.log("charging successful")
        //return res
    })
    .catch((err) => {
        console.log("charging failure", err)
        //return res
    })

    if (total !== 0)
        return res.status(200).json({"ok": total});
    return res.status(200).json({"no": total});
} catch (err) {
    console.log("PURCHASE ERROR");
    console.log(err.message)
    req.flash("warning", err.message);
    return res.status(400).redirect('/');
}})

module.exports = router;