const express = require('express');
const router = express.Router();

const {contactValidation} = require('./helpers/joiValidation');
const mailer = require('./helpers/mailer');
require('dotenv/config');

// Send us a mail
router.post('/', async (req, res) => {
try {
    const {error} = await contactValidation(req.body);
    if (error) 
        throw new Error(error.message);
    let name = req.body.name; //sanitize
        email = req.body.email,
        subject = `FROM ${name}, [${req.body.email}] - ${req.body.title}`,
        content = req.body.content;

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