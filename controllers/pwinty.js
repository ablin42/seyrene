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

/* START ORDERS */
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
        return res.status(200).json({ error: true, errordata: err.error });
    })
} catch (err) {
    return res.status(200).json({ message: err.message });
}});

router.post("/orders/create", async (req, res) => { //router.post?
try {
    let options = {
        method: 'POST',
        uri : `${API_URL}/v3.0/Orders`,
        headers: {
            'X-Pwinty-MerchantId': MERCHANTID,
            'X-Pwinty-REST-API-Key': APIKEY
        },
        body: req.body,
        json: true
    }

    rp(options)
    .then((response) => {
        console.log(response)
        return res.status(200).json(response);
    })
    .catch((err) => {
        //console.log(err)
        return res.status(200).json({ error: true, errordata: err.error });
    })
} catch (err) {
    return res.status(200).json({ message: err.message });
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
            recipientName: "njrkgez", //	Recipient name.
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
        return res.status(200).json({ error: true, errordata: err.error });
    })
} catch (err) {
    return res.status(200).json({ message: err.message });
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
        return res.status(200).json({ error: true, errordata: err.error });
    })
} catch (err) {
    return res.status(200).json({ message: err.message });
}});

router.get("/orders/:id/status", async (req, res) => {
try {
    let id = req.params.id;
    let options = {
        method: 'GET',
        uri : `${API_URL}/v3.0/Orders/${id}/SubmissionStatus`,
        headers: {
            'X-Pwinty-MerchantId': MERCHANTID,
            'X-Pwinty-REST-API-Key': APIKEY
        },
        json: true
    }

    rp(options)
    .then((response) => {
        return res.status(200).json(response);
    })
    .catch((err) => {
        console.log(err.error)
        return res.status(200).json({ error: true, errordata: err.error });
    })
} catch (err) {
    return res.status(200).json({ message: err.message });
}});

router.post("/orders/:id/submit", async (req, res) => {
try {
    let id = req.params.id;
    let options = {
        method: 'POST',
        uri : `${API_URL}/v3.0/Orders/${id}/status`,
        headers: {
            'X-Pwinty-MerchantId': MERCHANTID,
            'X-Pwinty-REST-API-Key': APIKEY
        },
        body: {
            status: req.body.status,// Cancelled, AwaitingPayment or Submitted. //variable
        },
        json: true
    }

    rp(options)
    .then((response) => {
        return res.status(200).json(response);
    })
    .catch((err) => {
        console.log(err.error)
        return res.status(200).json({ error: true, errordata: err.error });
    })
} catch (err) {
    return res.status(200).json({ message: err.message });
}});
/* END ORDERS */


/* IMAGES */
router.get("/orders/:id/images", async (req, res) => {
try {
    let id = req.params.id;
    let options = {
        method: 'POST',
        uri : `${API_URL}/v3.0/orders/${id}/images`,
        headers: {
            'X-Pwinty-MerchantId': MERCHANTID,
            'X-Pwinty-REST-API-Key': APIKEY
        },
       /* body: {
            sku: "",//	An identification code of the product for this image.
            url: "",//	The image's URL.
            copies: "",//	Number of copies of the image to include in the order.
            sizing: "",//	How the image should be resized when printing.
            priceToUser: "",// optional	If payment is set to InvoiceRecipient then the price (in cents/pence) you want to charge for each copy. Only available if your payment option is InvoiceRecipient.
            md5Hash: "",// optional	An MD5 hash of the image file.
            attributes: "",// optional	An object with properties representing the attributes for the image.
        },*/
        body: {
            "sku" : "T-PHO-GP2-CS-M",
            "url" : "https://i.imgur.com/kRiXs12.png",
            "sizing" : "crop",
            "copies" : 2,
            "attributes" : {
               "finish": "matte",
               "style": "snap",
               "brand": "google"
            }
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
        return res.status(200).json({ error: true, errordata: err.error });
    })
} catch (err) {
    return res.status(200).json({ message: err.message });
}});

router.post("/orders/:id/images/batch", async (req, res) => { //POST
try {
    let id = req.params.id;
    let options = {
        method: 'POST',
        uri : `${API_URL}/v3.0/orders/${id}/images/batch`,
        headers: {
            'X-Pwinty-MerchantId': MERCHANTID,
            'X-Pwinty-REST-API-Key': APIKEY
        },
        body: req.body,
        json: true
    }

    rp(options)
    .then((response) => {
        return res.status(200).json(response);
    })
    .catch((err) => {
        console.log("IMAGE BATCH ERROR");
        return res.status(200).json({ error: true, errordata: err.error });
    })
} catch (err) {
    return res.status(200).json({ message: err.message });
}});

/* 
Crop default	Your image will be centred and cropped so that it exactly fits the aspect ratio (height divided by width) of the printing area of the product you chose. Your image will cover all of the product print area.
ShrinkToFit	Your image will be shrunk until the whole image fits within the print area of the product, whilst retaining the aspect ratio of your image. This will usually mean there is white space at the top/bottom or left/right edges.
ShrinkToExactFit	Your image will be resized so that it completely fills the print area of the product. If the aspect ratio of your image is different to that of the printing area, your image will be stretched or squashed to fit. */
/* END IMAGES */

/* SHIPMENT */
/* 

Field	Description	Type
shipmentId	The unique identifier for this shipment. Null if order hasn't been submitted.	string
isTracked	Whether the order will be tracked.	boolean
trackingNumber	Tracking number, when available.	string
trackingUrl	Tracking URL, when available.	string
earliestEstimatedArrivalDate	Estimated earliest arrival of shipment. *	datetime
latestEstimatedArrivalDate	Estimated latest arrival of shipment. *	datetime
shippedOn	The shipping date. Null if the order hasn't been shipped.	datetime
carrier	The shipping carrier used once a shipment has been dispatched: RoyalMail, RoyalMailFirstClass, RoyalMailSecondClass, FedEx, FedExUK, FedExIntl, Interlink, UPS, UpsTwoDay, UKMail, TNT, ParcelForce, DHL, UPSMI, DpdNextDay, EuPostal, AuPost, AirMail, NotKnown.	string
photoIds	The IDs in the top-level image object.	array
* Arrival estimates are beyond our control and are based on typical seasonal processing times and published shipping times for the shipment method relevant to the order.
*/

/* END SHIPMENT */


/* COUNTRIES */
router.get("/countries", async (req, res) => {
try {
    let options = {
        method: 'GET',
        uri : `${API_URL}/v3.0/countries`,
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
        return res.status(200).json({ error: true, errordata: err.error });
    })
} catch (err) {
    return res.status(200).json({ message: err.message });
}});
/* END COUNTRIES */


/* CATALOGUE */
router.get("/countries/:countryCode", async (req, res) => {
try {
    let countryCode = req.params.countryCode;
    let options = {
        method: 'POST',
        uri : `${API_URL}/v3.0/catalogue/prodigi%20direct/destination/${countryCode}/prices`,
        headers: {
            'X-Pwinty-MerchantId': MERCHANTID,
            'X-Pwinty-REST-API-Key': APIKEY
        },
        body: {
            /* variable */
            "skus": ["T-PHO-GP2-CS-M","F-SPA-200X300-FLO-HGE"]
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
        return res.status(200).json({ error: true, errordata: err.error });
    })
} catch (err) {
    return res.status(200).json({ message: err.message });
}});
/* END CATALOGUE */
module.exports = router;