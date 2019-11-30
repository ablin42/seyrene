const express = require('express');
const router = express.Router();
const {validationResult} = require('express-validator');
const {vOrder} = require('./validators/vShop');//vOrder

const Order = require('../models/Order');
const User = require('../models/User');
const Shop = require('../models/Shop');
const DeliveryInfo = require('../models/DeliveryInfo');
const verifySession = require('./helpers/verifySession');
const utils = require('./helpers/utils');
const mailer = require('./helpers/mailer')

router.post('/create', verifySession, async (req, res) => {
try {
    if (req.body.user) { //undefined
        // Set sold out to true if an unique item is bought
        for (let index = 0; index < req.body.items.length; index++) {
            var [err, item] = await utils.to(Shop.findOneAndUpdate({_id: req.body.items[index].item._id, isUnique: true}, {$set: {soldOut: true}}));
            if (err) 
                throw new Error("An error occured while deleting the unique item from the store, please try again");
        }
        // Fetch delivery infos
        var [err, infos] = await utils.to(DeliveryInfo.findOne({ _userId: req.body.user._id }));
        if (err)
            throw new Error("An error occured while looking for your delivery informations, please try again");

        const order = new Order({
            _userId: req.body.user._id,
            items: req.body.items,
            price: req.body.price,
            status: "Validated",
            firstname: infos.firstname,
            lastname: infos.lastname,
            full_address: infos.full_address,
            full_street: infos.full_street,
            country: infos.country,
            street_name: infos.street_name,
            street_number: infos.street_number,
            city: infos.city,
            state: infos.state,
            zipcode: infos.zipcode,
            instructions: infos.instructions
        });

        var [err, result] = await utils.to(order.save());
        if (err || result == null) 
            throw new Error("An error occured while creating your order");

        // Send mails
        let subject = `New Order #${order._id}`;
        let content = `To see the order, please follow the link below using your administrator account: <hr/><a href="http://localhost:8089/Admin/Order/${order._id}">CLICK HERE</a>`;
        if (await mailer("ablin@byom.de", subject, content)) //maral.canvas@gmail.com
            throw new Error("An error occured while trying to send the mail, please retry");
    
        var [err, user] = await utils.to(User.findById(req.body.user._id));
        if (err || user == null)
            throw new Error("An error occured while finding your user account, please try again");
        content = `To see your order, please follow the link below (make sure you're logged in): <hr/><a href="http://localhost:8089/Order/${order._id}">CLICK HERE</a>`;
        if (await mailer(user.email, subject, content))
            throw new Error("An error occured while trying to send the mail, please retry");
    
        console.log("created order");
        return res.status(200).json({err: false, orderId: order._id});
    } else 
        throw new Error("Unauthorized, please make sure you are logged in");
} catch (err) {
    console.log("CREATING ORDER ERROR:", err);
    return res.status(200).json({err: true, message: err.message})
}})

router.post('/update', verifySession, async (req, res) => {
try {
    order = new Order({ //obj update using req.body vars
    
    });
    // if order.userId = req.user.id || req.user.level >= 3
    var [err, result] = await utils.to(order.save()); //update etc
    console.log(err, result);
    if (err) 
        throw new Error("An error occured while creating your order");
    
    // send mail
    console.log("created order");
    return res.status(200).json({err: false});
} catch (err) {
    console.log("FETCHING SHOP ERROR:", err);
    return res.status(200).json({err: true, message: err.message})
}})

router.get('/cancel/:id', verifySession, async (req, res) => {
try {
    if (req.user && req.params.id) {
        var [err, order] = await utils.to(Order.findById(req.params.id));
        if (err || order == null) 
            throw new Error("We couldn't find your order, please try again");
        if (order.status == "Shipping" || order.status == "Shipped" || order.status == "Cancelled")
            throw new Error("You can't cancel an order that is already shipping, shipped or cancelled!");
        if (order._userId === req.user._id || req.user.level >= 3) {
            var [err, order] = await utils.to(Order.findOneAndUpdate({_id: req.params.id}, {$set:{status: "Cancelled"}}));
            if (err || order == null) 
                throw new Error("We couldn't cancel your order, please try again");

            // SET UNIQUE ITEM BOUGHT TO SOLDOUT: FALSE
            for (let index = 0; index < order.items.length; index++) {
                var [err, item] = await utils.to(Shop.findOneAndUpdate({_id: items[index].item._id, isUnique: true}, {$set: {soldOut: false}}));
                if (err) 
                    throw new Error("An error occured while deleting the unique item from the store, please try again");
            }
       
            // REFUND STRIPE PAYMENT

            // Send mails
            let subject = `Cancelled Order #${order._id}`;
            let content = `To see the cancelled order, please follow the link below using your administrator account: <hr/><a href="http://localhost:8089/Admin/Order/${order._id}">CLICK HERE</a>`;
            if (await mailer("ablin@byom.de", subject, content)) //maral.canvas@gmail.com
                throw new Error("An error occured while trying to send the mail, please retry");
        
            var [err, user] = await utils.to(User.findById(req.user._id));
            if (err || user == null)
                throw new Error("An error occured while finding your user account, please try again");
            content = `You cancelled your order, to see the cancelled order, please follow the link below (make sure you're logged in): <hr/><a href="http://localhost:8089/Order/${order._id}">CLICK HERE</a>`;
            if (await mailer(user.email, subject, content))
                throw new Error("An error occured while trying to send the mail, please retry");
                
            console.log("cancelled order");
            return res.status(200).json({err: false, msg: "Your order was successfully cancelled"});
        } else
            throw new Error("Unauthorized, please make sure you are logged in");
    } else 
        throw new Error("Unauthorized, please make sure you are logged in");
} catch (err) {
    console.log("CANCEL ORDER ERROR:", err);
    return res.status(200).json({err: true, msg: err.message})
}})

module.exports = router;