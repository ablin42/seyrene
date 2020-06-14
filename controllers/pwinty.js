const express = require("express");
const router = express.Router();
const rp = require("request-promise");

const mailer = require("./helpers/mailer");
const { ROLE, setUser, authUser, authRole, setOrder, authGetOrder } = require("./helpers/verifySession");
const utils = require("./helpers/utils");
const Order = require("../models/Order");
const Token = require("../models/VerificationToken");
const PwToken = require("../models/PasswordToken");
const DeliveryInfo = require("../models/DeliveryInfo");
require("dotenv/config");
const Money = require("money-exchange");
const fx = new Money();
fx.init();

var formatter = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR"
});

const API_URL = "https://sandbox.pwinty.com";
const MERCHANTID = "sandbox_1e827211-b264-4962-97c0-a8b74a6f5e98";
const APIKEY = "61cf3a92-0ede-4c83-b3d8-0bb0aee55ed8";

/* START ORDERS */
router.get("/orders", setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => { //useless route
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

router.post("/orders/create", setUser, authUser, async (req, res) => {
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

router.get("/orders/:id", setUser, authUser, async (req, res) => {
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

router.get("/orders/:id/status", setUser, authUser, async (req, res) => {
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

router.post("/orders/:id/submit", setUser, authUser, async (req, res) => { //might need setOrder canview
try {
    let id = req.params.id;
    let options = {
        method: 'POST',
        uri : `${API_URL}/v3.0/Orders/${id}/status`,
        headers: {
            'X-Pwinty-MerchantId': MERCHANTID,
            'X-Pwinty-REST-API-Key': APIKEY
        },
        body: {status: req.body.status},// Cancelled, AwaitingPayment or Submitted. //variable
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
router.get("/orders/:id/images", setUser, authUser, async (req, res) => { //maybe unused route
try {
    let id = req.params.id;
    let options = {
        method: 'POST',
        uri : `${API_URL}/v3.0/orders/${id}/images`,
        headers: {
            'X-Pwinty-MerchantId': MERCHANTID,
            'X-Pwinty-REST-API-Key': APIKEY
        },
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

router.post("/orders/:id/images/batch", setUser, authUser, async (req, res) => { //POST
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
        if (response.statusCode === 200) {
            console.log(response)
        } else 
            return res.status(200).json({ error: true, errordata: "XDDD" });
        return res.status(200).json(response);
    })
    .catch((err) => {
        console.log("IMAGE BATCH ERROR");
        return res.status(200).json({ error: true, errordata: err.error });
    })
} catch (err) {
    return res.status(200).json({ message: err.message });
}});

router.post("/callback/status", async (req, res) => {
try {
    console.log("api callback called")
    if (req.body.orderId && req.body.status) {
        var [err, order] = await utils.to(Order.findOne({pwintyOrderId: req.body.orderId}));
        console.log(err, order)
        if (err || order == null)
            throw new Error("An error occurred while finding the order");

        var [err, order] = await utils.to(Order.findOneAndUpdate({pwintyOrderId: req.body.orderId}, {$set:{status: req.body.status}}));
        console.log(err, order)
        if (err || order == null)
            throw new Error("An error occurred while updating the order");

        // Send mails
        let subject = `Updated Order #${order._id}`;
        let content = `You order status has been updated, to see the order please follow the link below using your administrator account: <hr/><a href="http://localhost:8089/Admin/Order/${order._id}">CLICK HERE</a>`;
        if (await mailer("ablin@byom.de", subject, content)) //maral.canvas@gmail.com
            throw new Error("An error occurred while trying to send the mail, please retry");
        
        var [err, user] = await utils.to(Order.findOne({_userId: order._userId}));
        console.log(err, user)
        if (err || user == null)
            throw new Error("An error occurred while finding your user account, please try again later");

        content = `Your order's status was updated, to see your order please follow the link below (make sure you're logged in): <hr/><a href="http://localhost:8089/Order/${order._id}">CLICK HERE</a>`;
        if (await mailer(user.email, subject, content))
            throw new Error("An error occurred while trying to send the mail, please retry");

        return res.status(200).send("OK");
    } else 
        throw new Error("Incorrect body data");
} catch (err) {
    console.log("PWINTY CALLBACK ERROR:", err.message);
    return res.status(200).json({ message: err.message });
}});

/* 
Crop default	Your image will be centred and cropped so that it exactly fits the aspect ratio (height divided by width) of the printing area of the product you chose. Your image will cover all of the product print area.
ShrinkToFit	Your image will be shrunk until the whole image fits within the print area of the product, whilst retaining the aspect ratio of your image. This will usually mean there is white space at the top/bottom or left/right edges.
ShrinkToExactFit	Your image will be resized so that it completely fills the print area of the product. If the aspect ratio of your image is different to that of the printing area, your image will be stretched or squashed to fit. */
/* END IMAGES */

/* COUNTRIES */
router.get("/countries", setUser, async (req, res) => { //maybe unused
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
router.post("/countries/:countryCode", setUser, async (req, res) => {
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
            "skus": req.body.skus,
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

router.post("/pricing/:countryCode", setUser, async (req, res) => {
try {
    let countryCode = req.params.countryCode;
    let items = [];

    if (req.body.items) {
        req.body.items.forEach(item => {
            if (item && item.attributes && item.attributes.isUnique !== true) {
                let obj = {
                    "sku": item.elements[0].attributes.SKU,
                    "quantity": item.elements[0].qty //need qty too (qty for elements with frame color diff not counted properly)
                };
                items.push(obj);
            } else if (item && item.SKU) {
                let obj = {
                    "sku": item.SKU,
                    "quantity": item.quantity //need qty too (qty for elements with frame color diff not counted properly)
                };
                items.push(obj);
            }
        })

        let options = {
            method: 'POST',
            uri : `${API_URL}/v3.0/catalogue/prodigi%20direct/destination/${countryCode}/order/price`,
            headers: {
                'X-Pwinty-MerchantId': MERCHANTID,
                'X-Pwinty-REST-API-Key': APIKEY
            },
            body: {"items": items},
            json: true
        }
        
        rp(options)
        .then((response) => {
            let found = 0;
            response.shipmentOptions.forEach(shipmentOption => {
                if (shipmentOption.isAvailable && shipmentOption.shippingMethod === "Standard") {
                    found = 1;
                    let formatted = {
                        "isAvailable": shipmentOption.isAvailable,
                        "unitPriceIncludingTax": formatter.format(fx.convert((shipmentOption.shipments[0].items[0].unitPriceIncludingTax / 100), "GBP", "EUR")).substr(2),
                        "totalPriceIncludingTax": formatter.format(fx.convert((shipmentOption.totalPriceIncludingTax / 100), "GBP", "EUR")).substr(2),
                        "totalPriceExcludingTax": formatter.format(fx.convert((shipmentOption.totalPriceExcludingTax / 100), "GBP", "EUR")).substr(2),
                        "shippingMethod": shipmentOption.shippingMethod,
                        "shippingPriceIncludingTax": formatter.format(fx.convert((shipmentOption.shippingPriceIncludingTax / 100), "GBP", "EUR")).substr(2),
                        "shippingPriceExcludingTax": formatter.format(fx.convert((shipmentOption.shippingPriceExcludingTax / 100), "GBP", "EUR")).substr(2),
                        "shipments": shipmentOption.shipments
                    }
                    return res.status(200).json({error: false, response: formatted});
                }
            })
            if (found === 0)
                return res.status(200).json({error: false, response: []});
        })
        .catch((err) => {
            console.log(err)
            return res.status(200).json({ error: true, message: err.message });
        })
    } else 
        throw new Error("We couldn't find the delivery price for this item, please try again");
} catch (err) {
    console.log(err)
    return res.status(200).json({error: true, message: err.message });
}});
/* END CATALOGUE */
module.exports = router;