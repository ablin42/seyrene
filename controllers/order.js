const express = require('express');
const router = express.Router();
const {validationResult} = require('express-validator');
const {vOrder} = require('./validators/vShop');//vOrder
const rp = require("request-promise");
const { getCode, getName } = require('country-list');

const Order = require('../models/Order');
const User = require('../models/User');
const Shop = require('../models/Shop');
const DeliveryInfo = require('../models/DeliveryInfo');
const verifySession = require('./helpers/verifySession');
const utils = require('./helpers/utils');
const mailer = require('./helpers/mailer');

//var formatter = new Intl.NumberFormat();
var formatter = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

router.get('/:id', verifySession, async (req, res) => {
try {
    let id = req.params.id;
    var [err, result] = await utils.to(Order.findById(id));
    if (err)
        throw new Error("An error occured while fetching your order");
    if (result == null)
        throw new Error("No order exist with this ID!");
    if ((result._userId === req.user._id) || req.user.level >= 3) {
        result.price = formatter.format(result.price).substr(2);
        result.items.forEach((item, index) => {
            result.items[index].price = formatter.format(item.price).substr(2);
            result.items[index].item.content = item.item.content.substr(0, 128);
            result.items[index].item.title = item.item.title.substr(0, 64);
        })
        return res.status(200).json(result);
    }
    else 
        throw new Error("Please make sure you're logged in to check your order");
} catch (err) {
    console.log("FETCHING ORDER ERROR:", err);
    return res.status(200).json({error: true, message: err.message})
}})

const API_URL = "https://sandbox.pwinty.com";
const MERCHANTID = "sandbox_1e827211-b264-4962-97c0-a8b74a6f5e98";
const APIKEY = "61cf3a92-0ede-4c83-b3d8-0bb0aee55ed8";

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

        let options = {
            method: 'POST',
            uri : `${API_URL}/v3.0/Orders`,
            headers: {
                'X-Pwinty-MerchantId': MERCHANTID,
                'X-Pwinty-REST-API-Key': APIKEY
            },
            body: {
                merchantOrderId: order._id,
                recipientName: order.firstname + " " + order.lastname,
                address1: order.full_address, //has city + country, might need to use only full_street
                addressTownOrCity: order.city,
                stateOrCounty: order.state,
                postalOrZipCode: order.zipcode,
                countryCode: getCode(order.country),
                preferredShippingMethod: "standard", // Possible values are Budget, Standard, Express, and Overnight.
            },
            json: true
        }
        
        let pwintyOrderId = "";
        await rp(options)
        .then(async(response) => {
            if (response.statusCode === 200) {
                console.log("created order");
                pwintyOrderId = response.data.id;
                let body = [];
                req.body.items.forEach((item, index) => {
                    //console.log(item)
                    let obj = {
                        "sku" : "CAN-19MM-HMC-10X10", //fetch from item db
                        "url" : `http://localhost:8089/api/image/main/Shop/${item.item._id}`, 
                        "sizing" : "crop", // idk yet
                        "copies" : item.qty,
                        "attributes" : {
                            "wrap":"white", //An object with properties representing the attributes for the image.???????????? //fetch from item db
                        }
                    }
                    body.push(obj);
                })
                options.body = body;
                options.uri = `http://localhost:8089/api/pwinty/orders/${pwintyOrderId}/images/batch`;
                return rp(options);
            } else
                throw new Error("Something went wrong with the order API! (creating)");
        })
        .then((response) => {
            if (response.statusCode === 200) {
                console.log("products and images added to order");
                options.uri = `http://localhost:8089/api/pwinty/orders/${pwintyOrderId}/status`;
                options.method = "GET";
                return rp(options);
            } else
                throw new Error("Something went wrong with the order API! (adding products)");
        })
       .then((response) => {
            if (response.statusCode === 200) {
                if (response.data.isValid === true) {
                    console.log("order is valid");
                    options.uri = ``;
                    
                    return res.status(200).json({err: false, orderId: order._id});
                    return rp(options);
                }
            } else
                throw new Error("Something went wrong with the order API! (checking validity)");
        })/*
        .then((response) => {
            if (response.statusCode === 200) {
                console.log("submitted order");
                
                // create order in db
                return res.status(200).json({err: false, orderId: order._id});
            } else
                throw new Error("Something went wrong with the order API! (submitting)");
        })*/
        .catch((err) => {
            console.log("PWINTY RP CATCH", err.message)
            return res.status(400).json({ error: true, errordata: err.error });
        })

           /* var [err, result] = await utils.to(order.save());
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
                    throw new Error("An error occured while trying to send the mail, please retry"); */
    } else 
        throw new Error("Unauthorized, please make sure you are logged in");
} catch (err) {
    console.log("CREATING ORDER ERROR:", err);
    return res.status(200).json({err: true, message: err.message})
}})

router.post('/update', verifySession, async (req, res) => {
let url = req.header('Referer') || '/Admin/Orders';
try {
    if (req.user && req.user.level >= 3) {
        let newStatus = req.body.status;
        console.log(newStatus)
        if (newStatus !== "Validated" && newStatus !== "Shipping" && newStatus !== "Delivered" && newStatus !== "Cancelled")
            throw new Error("Invalid parameter, please try again");
        var [err, order] = await utils.to(Order.findOneAndUpdate({"_id": req.body.orderId}, {$set: {status: newStatus}}));
        console.log(err, order);
        if (err || order == null)
            throw new Error("An error occured while updating the order");
        
        // Send mails
        let subject = `Updated Order #${order._id}`;
        let content = `You updated an order, to see the order, please follow the link below using your administrator account: <hr/><a href="http://localhost:8089/Admin/Order/${order._id}">CLICK HERE</a>`;
        if (await mailer("ablin@byom.de", subject, content)) //maral.canvas@gmail.com
            throw new Error("An error occured while trying to send the mail, please retry");
      
        var [err, user] = await utils.to(User.findById(order._userId));
        if (err || user == null)
            throw new Error("An error occured while finding your user account, please try again");
        content = `Your order's status was updated, to see your order, please follow the link below (make sure you're logged in): <hr/><a href="http://localhost:8089/Order/${order._id}">CLICK HERE</a>`;
        if (await mailer(user.email, subject, content))
            throw new Error("An error occured while trying to send the mail, please retry");
       
        req.flash("success", "Order updated");
        return res.status(200).redirect(url)
    } else
        throw new Error("Unauthorized, please make sure you are logged in");
} catch (err) {
    console.log("UPDATING ORDER ERROR:", err);
    req.flash("warning", err.message);
    return res.status(200).redirect(url)
}})

router.get('/cancel/:id', verifySession, async (req, res) => {
try {
    if (req.user && req.params.id) {
        var [err, order] = await utils.to(Order.findById(req.params.id));

        if (err || order == null) 
            throw new Error("We couldn't find your order, please try again");
        if (order.status == "Shipping" || order.status == "Delivered" || order.status == "Cancelled")
            throw new Error("You can't cancel an order that is already shipping, delivered or cancelled!");
        if (order._userId === req.user._id || req.user.level >= 3) {
            var [err, order] = await utils.to(Order.findOneAndUpdate({_id: req.params.id}, {$set:{status: "Cancelled"}}));
            if (err || order == null) 
                throw new Error("We couldn't cancel your order, please try again");

            // SET UNIQUE ITEM BOUGHT TO SOLDOUT: FALSE
            for (let index = 0; index < order.items.length; index++) {
                var [err, itemx] = await utils.to(Shop.findOneAndUpdate({_id: order.items[index].item._id, isUnique: true}, {$set: {soldOut: false}}));
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