const express = require('express');
const router = express.Router();
const {validationResult} = require('express-validator');
const stripe = require('stripe')('sk_test_52HhMBaVOLRzC2iN3zljiCcP00Zb6YvQ3W');
//const {vOrder} = require('./validators/vShop');
const rp = require("request-promise");

const Order = require('../models/Order');
const User = require('../models/User');
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

stripe.refunds.create(
    {charge: 'ch_1FXIoVAghyYyjMX1hRHRMSOH'},
    function(err, refund) {
      // asynchronously called
    }
  );

router.get('/refund', verifySession, async (req, res) => {
try {
    let charge = req.body.charge;
    stripe.refunds.create(
        {charge: charge},
        function(err, refund) {
            console.log(refund, err)
            if (err)
                throw new Error(err)
            return res.status(200).send(refund);
        }
    );
} catch (err) {
    console.log("FETCHING ORDER ERROR:", err);
    return res.status(200).json({error: true, message: err.message})
}})

module.exports = router;