const express = require('express');
const router = express.Router();
const {validationResult} = require('express-validator');
const {vContact} = require('./validators/vContact');

const mailer = require('./helpers/mailer');
require('dotenv/config');

// Send us a mail
router.post('/', vContact, async (req, res) => {
try {
    const subject = `FROM ${req.body.name}, [${req.body.email}] - ${req.body.title}`;
    const content = req.body.content;
    const formData = {
        name: req.body.name,
        email:  req.body.email,
        subject: req.body.title,
        content: content
    }
    req.session.formData = formData;
    
    // Check form inputs validity
    const vResult = validationResult(req);
    if (!vResult.isEmpty()) {
        vResult.errors.forEach((item) => {
              req.flash("info", item.msg)
        })
        throw new Error("Incorrect form input");
    }
   
        //maral.canvas@gmail.com
    if (await mailer("ablin@byom.de", subject, content)) 
        throw new Error("An error occured while trying to send the mail, please retry");

    req.flash("success", "Email sent! We will answer as soon as we can");
    res.status(200).redirect('/');
} catch (err) {
    console.log("ERROR CONTACT:", err);
    req.flash('warning', err.message);
    return res.status(400).redirect('/Contact');
}})

module.exports = router;