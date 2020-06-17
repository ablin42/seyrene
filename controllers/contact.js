const express = require("express");
const router = express.Router();
const { validationResult } = require("express-validator");
const { vContact } = require("./validators/vContact");

const { setUser } = require("./helpers/verifySession");
const { checkCaptcha } = require("./helpers/captcha");
const mailer = require("./helpers/mailer");
require('dotenv').config();

// Send us a mail
router.post("/", vContact, setUser, checkCaptcha, async (req, res) => {
try {
  const subject = `FROM ${req.body.name}, [${req.body.email}] - ${req.body.title}`;
  const content = req.body.content;
  const formData = {
    name: req.body.name,
    email: req.body.email,
    subject: req.body.title,
    content: content
  };
  req.session.formData = formData;

  const vResult = validationResult(req);
  if (!vResult.isEmpty()) {
    vResult.errors.forEach(item => {
      req.flash("info", item.msg);
    });
    throw new Error("Incorrect form input");
  }

  //maral.canvas@gmail.com
  if (await mailer("ablin@byom.de", subject, content))
    throw new Error("An error occurred while trying to send the mail, please retry");

  return res.status(200).json({error: false, message: "Email sent! We will answer as soon as we can"});
} catch (err) {
  console.log("ERROR CONTACT:", err);
  return res.status(200).json({error: true, message: err.message});
}});

module.exports = router;