const express = require('express');
const router = express.Router();
const {contactValidation} = require('./helpers/joiValidation');
const mailer = require('./helpers/mailer');
require('dotenv/config');

router.post('/', async (req, res) => {
    const {error} = await contactValidation(req.body);
    if (error) {
        req.flash('warning', error.message);
        return res.status(400).redirect('/Contact');
    }
    let email = req.body.email,
        subject = `FROM [${req.body.email}] - ${req.body.title}`,
        content = req.body.content;

    if (await mailer(email, subject, content)) {
        req.flash('info', "An error occured while trying to send the mail, please retry");
        return res.status(400).redirect('/Register');
    }

    req.flash("success", "Email sent!");
    res.status(200).redirect('/');
})

module.exports = router;