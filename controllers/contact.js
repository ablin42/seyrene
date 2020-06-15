const express = require("express");
const router = express.Router();
const { validationResult } = require("express-validator");
const { vContact } = require("./validators/vContact");
const rp = require("request-promise");

const { setUser } = require("./helpers/verifySession");
const { setCaptcha } = require("./helpers/captcha");
const mailer = require("./helpers/mailer");
require("dotenv/config");

router.post("/subscribe", setCaptcha, (req, res) => {
try {
  console.log("issou")
  /*if (req.body.captcha === undefined || req.body.captcha === '' || req.body.captcha === null)
    throw new Error("Please solve the captcha");
  
  const secretKey = "6Ld8MaUZAAAAAJOHua_oEH4mVX0P2ATrfacoxIgM";
  const verifyUrl = `https://google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${req.body.captcha}&remoteip=${req.connection.remoteAddress}`;

  rp(verifyUrl, (err, response, body) => {
    body = JSON.parse(body);

    if (body.success && !body.success) {
      throw new Error("Failed captcha verification, please try again");
    }

    return res.json({error: false, message: "Captcha passed"});
  })*/
} catch (err) {
  console.log(err)
  return res.json({error: true, message: err.message});
}})

// Send us a mail
router.post("/", vContact, setUser, async (req, res) => {
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

    // Check form inputs validity
    const vResult = validationResult(req);
    if (!vResult.isEmpty()) {
      vResult.errors.forEach(item => {
        req.flash("info", item.msg);
      });
      throw new Error("Incorrect form input");
    }

    //maral.canvas@gmail.com
    if (await mailer("ablin@byom.de", subject, content))
      throw new Error(
        "An error occurred while trying to send the mail, please retry"
      );

    req.flash("success", "Email sent! We will answer as soon as we can");
    res.status(200).redirect("/");
  } catch (err) {
    console.log("ERROR CONTACT:", err);
    req.flash("warning", err.message);
    return res.status(400).redirect("/About");
  }
});

module.exports = router;
