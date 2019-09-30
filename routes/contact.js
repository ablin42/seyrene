const express = require('express');
const router = express.Router();
const {contactValidation} = require('./joiValidation');
const nodemailer = require('nodemailer');
require('dotenv/config');

router.post('/', async (req, res) => {
    const {error} = await contactValidation(req.body);
    if (error) {
        req.flash('warning', error.message);
        return res.status(400).redirect('/Contact');
    }
    let transporter = nodemailer.createTransport({
       service: 'gmail',
       auth: {
           user: process.env.EMAIL,
           pass: process.env.EMAILPW
       }
    })

    let mailOptions = {
       from: req.body.email,
       to: 'Maral.canvas@gmail.com',
       subject: `DE [${req.body.email}] - ${req.body.title}`,
       text: req.body.content
    }

    transporter.sendMail(mailOptions, (err, data) => {
        if (err) {
            console.log("ERROR", err);
        } else {
            console.log("SUCCESS");
        }
    })

    req.flash("success", "Email sent!");
    res.status(200).redirect('/');
})

module.exports = router;