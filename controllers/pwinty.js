const express = require("express");
const router = express.Router();
const rp = require("request-promise");

const mailer = require("./helpers/mailer");
const verifySession = require("./helpers/verifySession");
const utils = require("./helpers/utils");
const User = require("../models/User");
const Token = require("../models/VerificationToken");
const PwToken = require("../models/PasswordToken");
const DeliveryInfo = require("../models/DeliveryInfo");
require("dotenv/config");

const API_URL = "https://sandbox.pwinty.com";
const MERCHANTID = "sandbox_1e827211-b264-4962-97c0-a8b74a6f5e98";
const APIKEY = "61cf3a92-0ede-4c83-b3d8-0bb0aee55ed8";

router.get("/", async (req, res) => {
try {
    return res.status(200).json("home!");
} catch (err) {
    return res.status(400).json({ message: err.message });
}});

router.get("/orders", async (req, res) => {
try {
    let limit = req.query.limit || 100;
    let start = req.query.start || 0;
    let options = {
        method: 'GET',
        uri : `${API_URL}/v3.0/Orders?limit=${limit}&start=${start}`,
        headers: {
            'X-Pwinty-MerchantId': MERCHANTID,
            'X-Pwinty-REST-API-Key': APIKEY
        },
        json: true
    }

    rp(options)
    .then((response) => {
        console.log(response)
        return res.status(200).json(response);
    })
    .catch((err) => {
        console.log(err)
        return res.status(400).json({ error: true, errordata: err.error });
    })
} catch (err) {
    return res.status(400).json({ message: err.message });
}});

router.get("/orders/create", async (req, res) => { //router.post?
try {
    let options = {
        method: 'POST',
        uri : `${API_URL}/v3.0/Orders`,
        headers: {
            'X-Pwinty-MerchantId': MERCHANTID,
            'X-Pwinty-REST-API-Key': APIKEY
        },
        body: {
            merchantOrderId: "123test", //optional	Your identifier for this order.
            recipientName: "xd", //	Recipient name.
            address1: "addreeeeeeeee", //optional * First line of recipient address.
            address2: "", //optional	Second line of recipient address.
            addressTownOrCity: "Paris", // optional *	Town or city of the recipient.
            stateOrCounty: "Paris", //optional	State, county or region of the recipient.
            postalOrZipCode: "75012", // optional *	Postal or zip code of the recipient.
            countryCode: "FR", //	Two-letter country code of the recipient.
            preferredShippingMethod: "standard", // Possible values are Budget, Standard, Express, and Overnight.
            payment: "", //optional	Payment option for order, either InvoiceMe or InvoiceRecipient. Default InvoiceMe
            packingSlipUrl: "", //optional †	URL to a packing slip file. PNG format, A4 size recommended.
            mobileTelephone: "", //optional	Customer's mobile number for shipping updates and courier contact.
            telephone: "", //optional	Customer's non-mobile phone number for shipping updates and courier contact.
            email: "", //optional	Customer's email address.
            invoiceAmountNet: "", //optional	Used for orders where an invoice amount must be supplied (e.g. to Middle East).
            invoiceTax: "", //optional	Used for orders where an invoice amount must be supplied (e.g. to Middle East).
            invoiceCurrency: "", //optional	Used for orders where an invoice amount must be supplied (e.g. to Middle East).
        },
        json: true
    }

    rp(options)
    .then((response) => {
        console.log(response)
        return res.status(200).json(response);
    })
    .catch((err) => {
        console.log(err, "x")
        return res.status(400).json({ error: true, errordata: err.error });
    })
} catch (err) {
    return res.status(400).json({ message: err.message });
}});

router.get("/orders/update/:id", async (req, res) => { //router.post?
try {
    let id = req.params.id;
    let options = {
        method: 'PUT',
        uri : `${API_URL}/v3.0/Orders/${id}`,
        headers: {
            'X-Pwinty-MerchantId': MERCHANTID,
            'X-Pwinty-REST-API-Key': APIKEY
        },
        body: {
            merchantOrderId: "123test", //optional	Your identifier for this order.
            recipientName: "recipiENT", //	Recipient name.
            address1: "addreeeeeeeee", //optional * First line of recipient address.
            address2: "", //optional	Second line of recipient address.
            addressTownOrCity: "Paris", // optional *	Town or city of the recipient.
            stateOrCounty: "Paris", //optional	State, county or region of the recipient.
            postalOrZipCode: "75012", // optional *	Postal or zip code of the recipient.
            countryCode: "FR", //	Two-letter country code of the recipient.
            preferredShippingMethod: "standard", // Possible values are Budget, Standard, Express, and Overnight.
            payment: "", //optional	Payment option for order, either InvoiceMe or InvoiceRecipient. Default InvoiceMe
            packingSlipUrl: "", //optional †	URL to a packing slip file. PNG format, A4 size recommended.
            mobileTelephone: "", //optional	Customer's mobile number for shipping updates and courier contact.
            telephone: "", //optional	Customer's non-mobile phone number for shipping updates and courier contact.
            email: "", //optional	Customer's email address.
            invoiceAmountNet: "", //optional	Used for orders where an invoice amount must be supplied (e.g. to Middle East).
            invoiceTax: "", //optional	Used for orders where an invoice amount must be supplied (e.g. to Middle East).
            invoiceCurrency: "", //optional	Used for orders where an invoice amount must be supplied (e.g. to Middle East).
        },
        json: true
    }

    rp(options)
    .then((response) => {
        console.log(response)
        return res.status(200).json(response);
    })
    .catch((err) => {
        console.log(err, "x")
        return res.status(400).json({ error: true, errordata: err.error });
    })
} catch (err) {
    return res.status(400).json({ message: err.message });
}});

router.get("/orders/:id", async (req, res) => {
try {
    let id = req.params.id;
    let options = {
        method: 'GET',
        uri : `${API_URL}/v3.0/Orders/${id}`,
        headers: {
            'X-Pwinty-MerchantId': MERCHANTID,
            'X-Pwinty-REST-API-Key': APIKEY
        },
        json: true
    }

    rp(options)
    .then((response) => {
        console.log(response)
        return res.status(200).json(response);
    })
    .catch((err) => {
        console.log(err.error)
        return res.status(400).json({ error: true, errordata: err.error });
    })
} catch (err) {
    return res.status(400).json({ message: err.message });
}});

module.exports = router;