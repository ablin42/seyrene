const express = require('express');
const router = express.Router();
const {validationResult} = require('express-validator');
//const {vOrder} = require('./validators/vShop');//vOrder
const {vDelivery} = require("./validators/vUser");
const rp = require("request-promise");
const country = require('country-list-js');

const Order = require('../models/Order');
const Purchase = require('../models/PurchaseData');
const User = require('../models/User');
const Shop = require('../models/Shop');
const DeliveryInfo = require('../models/DeliveryInfo');
const { ROLE, setUser, authUser, authRole, setOrder, authGetOrder } = require('./helpers/verifySession');
const utils = require('./helpers/utils');
const mailer = require('./helpers/mailer');
const format = require("date-format");
var formatter = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
require('dotenv').config();

const toTitleCase = (phrase) => {
    let arr = phrase.toLowerCase().split(' ');
    let parsed = [];
    
    arr.forEach(item => {
        let obj = item.charAt(0).toUpperCase() + item.slice(1);
        if (item === "and")
            obj = "and";
        parsed.push(obj);
    });
    
    return parsed.join(' ');
};

/*
router.get('/cc', async (req, res) => {
try {
    let nbFail = 0;
    
    pwintyCountries.forEach(countryn => {
        resu = country.findByName(toTitleCase(countryn.name));
        //resu = getCode(countryn.name)
        //resu = countries.getAlpha2Code(countryn.name, 'en');
        if (!resu) {
            console.log("Err:", countryn.name)
            nbFail++;
        }
    })
    //console.log(country.findByName(pwintyCountries[0].name.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')), pwintyCountries[0].name.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '))
    //console.log(country.findByIso2("BA"))
    return res.status(200).json({error: false, number: nbFail});
} catch (err) {
    console.log("COUNTRY TESTS ERR", err);
    return res.status(200).json({error: true, message: err.message})
}})*/

router.get('/', setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
try {
    const options = {
        page: parseInt(req.query.page, 10) || 1,
        limit: 20,
        sort: { date: -1 }
    };

    let [err, result] = await utils.to(Order.paginate({}, options));
    if (err || result === null)
        throw new Error("An error occurred while fetching orders");

    let orders = [];
    result.docs.forEach((order) => {
        let orderObj = {
            _id: order._id,
            status: order.status,
            price: formatter.format(order.price).substr(2),
            date_f: format.asString("dd/MM/yyyy", new Date(order.date)),
            lastname: order.lastname,
            firstname: order.firstname
        };
        orders.push(orderObj);
    });
    
    return res.status(200).json({error: false, orders: orders});
} catch (err) {
    console.log("FETCHING ORDERS ERROR:", err);
    return res.status(200).json({error: true, message: err.message});
}});

router.get('/:id', setUser, authUser, setOrder, authGetOrder, async (req, res) => {
try {
    let id = req.params.id;
    var [err, result] = await utils.to(Order.findById(id));
    if (err)
        throw new Error("An error occurred while fetching your order");
    if (result === null)
        throw new Error("No order exist with this ID!");

    result.price = formatter.format(result.price).substr(2);
    result.items.forEach((item, index) => {
        result.items[index].price = formatter.format(item.price).substr(2);
        result.items[index].attributes.content = item.attributes.content.substr(0, 128);
        result.items[index].attributes.title = item.attributes.title.substr(0, 64);
    });

    return res.status(200).json(result);
} catch (err) {
    console.log("FETCHING ORDER ERROR:", err);
    return res.status(200).json({error: true, message: err.message});
}});

function getNeededAttributes(attributes) {
    let obj = {};

    switch (attributes.category) {
        case "CAN": {
            if (attributes.subcategory === "ROL" && typeof attributes.glaze === "string") 
                obj.glaze = attributes.glaze;
            else 
                obj.wrap = attributes.wrap;
        }
        break;
        case "FRA":{
            obj.frameColour = attributes.frameColour;
            if (attributes.subcategory === "BOX" || attributes.subcategory === "CLA" || attributes.subcategory === "GLO" || attributes.subcategory === "SWO") {
                if (attributes.mountColour && attributes.mountType !== "NM")
                    obj.mountColour = attributes.mountColour;
            }
        }
        break;
    }

    return obj;
}

async function createPwintyOrder(order, req) {
    let countryCode = country.findByName(toTitleCase(order.country));
    if (countryCode)
        countryCode = countryCode.code.iso2;
    else 
        throw new Error("We cannot find your country ISO code, please contact us if the error persist");
    let options = {
        method: 'POST',
        uri : `${process.env.BASEURL}/api/pwinty/orders/create`,//${API_URL}/v3.0/Orders
        body: {
            merchantOrderId: order._id,
            recipientName: order.firstname + " " + order.lastname,
            address1: order.full_address, //has city + country, might need to use only full_street
            addressTownOrCity: order.city,
            stateOrCounty: order.state,
            postalOrZipCode: order.zipcode,
            countryCode: countryCode,
            preferredShippingMethod: "standard", // Possible values are Budget, Standard, Express, and Overnight.
        },
      json: true
    };

  let response = await rp(options);
  console.log(response);

  if (response.statusCode === 200) {
    let pwintyOrderId = response.data.id;
    let body = [];

    order.items.forEach((item) => {
        if (item.attributes.isUnique !== true) {
            item.elements.forEach((product) => {
                let obj = {
                    "sku" : product.attributes.SKU,
                    "url" : `${process.env.BASEURL}/api/image/main/Shop/${item.attributes._id}`, 
                    "sizing" : "crop", // idk yet // resize for canvas
                    "copies" : product.qty,
                    "attributes" : ""
                };

                obj.attributes = getNeededAttributes(product.attributes);
                body.push(obj);
              });
          }
      });
      options.body = body;
      options.uri = `${process.env.BASEURL}/api/pwinty/orders/${pwintyOrderId}/images/batch`;

      response = await rp(options);
      console.log(response);

      if (response.statusCode === 200) {
          console.log("products and images added to order");
          options.uri = `${process.env.BASEURL}/api/pwinty/orders/${pwintyOrderId}/status`;
          options.method = "GET";   

          response = await rp(options);
          console.log(response);

          if (response.statusCode === 200) {
              if (response.data.isValid === true) { //////////////////////////////////////
                options.uri = `${process.env.BASEURL}/api/pwinty/orders/${pwintyOrderId}`;
                response = await rp(options);
                console.log(response, "xX");

                console.log("order is valid");
                options.uri = `${process.env.BASEURL}/api/pwinty/orders/${pwintyOrderId}/submit`;
                options.method = "POST";
                options.body = { status: "Submitted" };// Cancelled, AwaitingPayment or Submitted.

                response = await rp(options);
                console.log(response);

                if (response.statusCode === 200) {
                    console.log("submitted order");

                    let [err, orderResponse] = await utils.to(Order.findOneAndUpdate({chargeId: req.body.data.object.id, status: "awaitingStripePayment" }, {$set: {pwintyOrderId: pwintyOrderId}})); 
                    if (err || orderResponse === null)
                        throw new Error("An error occurred while submitting your order, please try again later");

                    response = await submitOrder(order, req);
                    response.pwintyOrderId = pwintyOrderId;

                    return response;
                } else
                    throw new Error(`Something went wrong while submitting the order: ${response.errordata.statusTxt}`);
              } else
                  throw new Error(`Order is not valid: ${response.data.generalErrors[0]}`);
          } else
              throw new Error(`Something went wrong while checking the order's validity: ${response.errordata.statusTxt}`);
      } else
          throw new Error(`Something went wrong while adding products: ${response.errordata.statusTxt}`);
  } else
      throw new Error(`Something went wrong while creating the order: ${response.errordata.statusTxt}`);
}

async function submitOrder(orderx, req) {
    let err, order, user;
    
    [err, order] = await utils.to(Order.findOneAndUpdate({chargeId: req.body.data.object.id, status: "awaitingStripePayment" }, {$set: {status: "Submitted"}})); 
    if (err || order === null)
        throw new Error("An error occurred while submitting your order, please try again later");
    
    // Send mails
    let subject = `New Order #${order._id}`;
    let content = `To see the order, please follow the link below using your administrator account: <hr/><a href="${process.env.BASEURL}/Admin/Order/${order._id}">CLICK HERE</a>`;
    if (await mailer("ablin@byom.de", subject, content)) //maral.canvas@gmail.com
        throw new Error("An error occurred while trying to send the mail, please retry");

    [err, user] = await utils.to(User.findById(order._userId));
    if (err || user == null)
        throw new Error("An error occurred while finding your user account, please try again");
    content = `To see your order, please follow the link below (make sure you're logged in): <hr/><a href="${process.env.BASEURL}/Order/${order._id}">CLICK HERE</a>`;
    if (await mailer(user.email, subject, content))
        throw new Error("An error occurred while trying to send the mail, please retry");

    console.log("order saved to db", order._id);
    return {err: false, orderId: order._id};
}

async function savePurchaseData(req, order, response) {
    let pwintyOrderId = "";
    let shippingAddress = [];
    let err, purchaseDataResponse, user, delivery;

    if (response.pwintyOrderId)
        pwintyOrderId = response.pwintyOrderId;
    
    [err, delivery] = await utils.to(DeliveryInfo.findOne({_userId: order._userId})); 
    if (err || delivery === null)
        throw new Error("An error occurred while finding your delivery informations, please try again later");

    [err, user] = await utils.to(User.findOne({_id: order._userId})); 
    if (err || user === null)
        throw new Error("An error occurred while finding your user informations, please try again later");
    
    shippingAddress = delivery;
    const purchaseData = new Purchase({
        _orderId: order._id,
        _userId: order._userId,
        chargeId: order.chargeId,
        pwintyId: pwintyOrderId,
        shippingAddress: shippingAddress,
        billingAddress: order.billing, 
        username: user.name,
        email: user.email,
        paymentInfo: req.body 
    });

    [err, purchaseDataResponse] = await utils.to(purchaseData.save());
    if (err || response == null)
        throw new Error("An error occurred while saving your purchase informations");

    return purchaseData;
}

router.post('/confirm', setUser, authUser, async (req, res) => {
try {
    /////////////// once this is triggered, wait 24h then proceed if no fraud webhook/refund events occurred
    let err, order, item;

    if (req.body.type === "payment_intent.succeeded" && req.body.data.object.id) { //make sure its sent by webhook
        [err, order] = await utils.to(Order.findOne({chargeId: req.body.data.object.id, status: "awaitingStripePayment" })); 
        if (err || order === null)
            throw new Error("An error occurred while finding your order, please try again later");

        let isPwinty = false;
        for (let index = 0; index < order.items.length; index++) {
            [err, item] = await utils.to(Shop.findOneAndUpdate({_id: order.items[index].attributes._id, isUnique: true}, {$set: {soldOut: true}}));
            if (err)
                throw new Error("An error occurred while deleting the unique item from the store, please try again");
            if (!order.items[index].attributes.isUnique)
                isPwinty = true;
        }

        if (isPwinty === false)
            var response = await submitOrder(order, req);
        else 
            response = await createPwintyOrder(order, req);
        
        await savePurchaseData(req, order, response);
    }
    return res.status(200).send("OK");
} catch (err) {
    console.log("CONFIRMING ORDER ERROR:", err);
    return res.status(200).json({error: true, message: err.message});
}});

router.post('/initialize', setUser, authUser, async (req, res) => {
try {
    let err, infos, response, deletedOrder;
    
    [err, infos] = await utils.to(DeliveryInfo.findOne({ _userId: req.user._id }));
    if (err)
        throw new Error("An error occurred while looking for your delivery informations, please try again");

    [err, deletedOrder] = await utils.to(Order.findOneAndDelete({ _userId: req.user._id, status: "awaitingStripePayment" }));
    if (err)
        throw new Error("An error occurred, please try again later");

    const order = new Order({
        _userId: req.user._id,
        chargeId: req.body.chargeId,
        items: req.body.items,
        price: req.body.price,
        deliveryPrice: req.body.deliveryPrice,
        status: "awaitingStripePayment",
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


    [err, response] = await utils.to(order.save());
    if (err || response == null)
        throw new Error("An error occurred while creating your order");

    return res.status(200).json(response);
} catch (err) {
    console.log("INITIALIZING ORDER ERROR:", err);
    return res.status(200).json({err: true, message: err.message});
}});

router.post('/update', setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => {
try {
    let url = req.header('Referer') || '/Admin/Orders';
    let newStatus = req.body.status;
    let order, user, err;

    if (newStatus !== "Completed" && newStatus !== "Submitted")
        throw new Error("Invalid parameter, please try again");

    [err, order] = await utils.to(Order.findOne({"_id": req.body.orderId}));
    if (err || order == null)
        throw new Error("An error occurred while finding the order");

    if (order.status === "Cancelled")
        throw new Error("You can't update the status of a cancelled order");

    [err, order] = await utils.to(Order.findOneAndUpdate({"_id": req.body.orderId}, {$set: {status: newStatus}}));
    if (err || order == null)
        throw new Error("An error occurred while updating the order");

    // Send mails
    let subject = `Updated Order #${order._id}`;
    let content = `You updated an order, to see the order, please follow the link below using your administrator account: <hr/><a href="${process.env.BASEURL}/Admin/Order/${order._id}">CLICK HERE</a>`;
    if (await mailer("ablin@byom.de", subject, content)) //maral.canvas@gmail.com
        throw new Error("An error occurred while trying to send the mail, please retry");

    [err, user] = await utils.to(User.findById(order._userId));
    if (err || user == null)
        throw new Error("An error occurred while finding your user account, please try again");

    content = `Your order's status was updated, to see your order, please follow the link below (make sure you're logged in): <hr/><a href="${process.env.BASEURL}/Order/${order._id}">CLICK HERE</a>`;
    if (await mailer(user.email, subject, content))
        throw new Error("An error occurred while trying to send the mail, please retry");

    req.flash("success", "Order updated");
    return res.status(200).redirect(url);
} catch (err) {
    let url = req.header('Referer') || '/Admin/Orders';
    console.log("UPDATING ORDER ERROR:", err);
    
    req.flash("warning", err.message);
    return res.status(200).redirect(url);
}});

async function refundStripe(req, chargeId, orderId) {
    let options = {
        uri: `${process.env.BASEURL}/api/stripe/refund/${orderId}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'cookie': req.headers.cookie
        },
        body: {chargeId: chargeId},
        json: true
    };
    let result = await rp(options);

    return result;
}

router.get('/cancel/:id', setUser, authUser, setOrder, authGetOrder, async (req, res) => {
try {
    let err, order, item, user;
    let orderId = req.params.id;
    if (!orderId)
        throw new Error("Please provide an order ID"); 

    console.log("cancel route");
    [err, order] = await utils.to(Order.findById(req.params.id));
    if (err || order == null)
        throw new Error("We couldn't find your order, please try again");

    switch(order.status) {
        case "Cancelled":
            throw new Error("You can't cancel an order that is already cancelled");
        case "Completed":
            throw new Error("You can't cancel an order that is already completed");
        case "awaitingStripePayment":
            throw new Error("You can't cancel an order that hasn't been finalized");
    }
        
        [err, order] = await utils.to(Order.findOne({_id: req.params.id}));
        if (err || order == null)
            throw new Error("We couldn't find your order, please try again");

        let isPwinty = false;
        for (let index = 0; index < order.items.length; index++) {
            [err, item] = await utils.to(Shop.findOneAndUpdate({_id: order.items[index].attributes._id, isUnique: true}, {$set: {soldOut: false}}));
            if (err)
                throw new Error("An error occurred while deleting the unique item from the store, please try again");
            if (!order.items[index].attributes.isUnique)
                isPwinty = true;
        }

        if (isPwinty === false) {
            let refund = await refundStripe(req, order.chargeId, order._id);
            if (refund.error === true)
                throw new Error(refund.message);
        } else {
            let options = {
                method: 'GET',
                uri : `${process.env.BASEURL}/api/pwinty/orders/${order.pwintyOrderId}`,
                body: {},
                json: true
            };

            let response = await rp(options);
            if (response.statusCode === 200) {
                if (response.data.canCancel === true) {
                    options.method = "POST";
                    options.uri =  `${process.env.BASEURL}/api/pwinty/orders/${order.pwintyOrderId}/submit`;
                    options.body = {status: "Cancelled"};

                    response = await rp(options);
                    if (response.statusCode === 200) {
                        let refund = await refundStripe(req, order.chargeId, order._id);
                        if (refund.error === true)
                            throw new Error(refund.message);
                    } else 
                        throw new Error("We could not cancel your order, please try again later");
                } else 
                    throw new Error("Your order status does not allow it to be cancelled");
            } else 
                throw new Error("We could not check the status of your order, please try again later");
        }

    [err, order] = await utils.to(Order.findOneAndUpdate({_id: req.params.id}, {$set:{status: "Cancelled"}}));
    if (err || order == null)
        throw new Error("We couldn't cancel your order, please try again");

    // Send mails
    let subject = `Cancelled Order #${order._id}`;
    let content = `To see the cancelled order, please follow the link below using your administrator account: <hr/><a href="${process.env.BASEURL}/Admin/Order/${order._id}">CLICK HERE</a>`;
    if (await mailer("ablin@byom.de", subject, content)) //maral.canvas@gmail.com
        throw new Error("An error occurred while trying to send the mail, please retry");

    [err, user] = await utils.to(User.findById(req.user._id));
    if (err || user == null)
        throw new Error("An error occurred while finding your user account, please try again");

    content = `You cancelled your order, to see the cancelled order, please follow the link below (make sure you're logged in): <hr/><a href="${process.env.BASEURL}/Order/${order._id}">CLICK HERE</a>`;
    if (await mailer(user.email, subject, content))
        throw new Error("An error occurred while trying to send the mail, please retry");

    console.log("cancelled order");
    return res.status(200).json({err: false, msg: "Your order was successfully cancelled"});
} catch (err) {
    console.log("CANCEL ORDER ERROR:", err);
    return res.status(200).json({err: true, msg: err.message});
}});

router.post("/billing/save", vDelivery, setUser, authUser, async (req, res) => {
try {
    if (req.body.billing && req.body.clientSecret) {
        const vResult = validationResult(req.body.billing);
        if (!vResult.isEmpty()) {
          vResult.errors.forEach(item => {
            req.flash("info", item.msg);
          });
          throw new Error("Incorrect form input");
        }
        let apiKey = "AIzaSyBluorKuf7tdOULcDK08oZ-98Vw7_12TMI";
        let encoded_address = encodeURI(req.body.billing.fulltext_address);
        let options = {
            uri: `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encoded_address}&inputtype=textquery&key=${apiKey}`,
            json: true
          };

        rp(options).then(async data => {
            if (data.status !== "OK") 
                return res.status(200).json({error: true, message: "We could not validate your address, please make sure it is valid"});
            
            var [err, order] = await utils.to(Order.findOneAndUpdate({_userId: req.user._id, chargeId: req.body.clientSecret, status: "awaitingStripePayment" }, {$set: {billing: req.body.billing}}));
            if (err || order === null)
                throw new Error("An error occurred while registering your billing informations, please try again later");
            
            return res.status(200).json({error: false});
        });
    } else 
        throw new Error("Missing information, please try again");
} catch (err) {
    console.log("SAVE BILLING ERROR:", err);
    return res.status(200).json({error: true, message: err.message});
}});

module.exports = router;