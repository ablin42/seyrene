const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Gallery = require('../models/Gallery');
require('dotenv/config');

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
    req.flash("info", err.message);
    return res.status(400).redirect('/');
}})

module.exports = router;