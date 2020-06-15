const rp = require("request-promise");

async function setCaptcha(req, res, next) {
    const captcha = req.body.captcha;

    if (!captcha) {
        req.flash("warning", "Please solve the captcha");
        return res.status(403).redirect("/Contact");
    }

    const secretKey = "6Ld8MaUZAAAAAJOHua_oEH4mVX0P2ATrfacoxIgM";
    const verifyUrl = `https://google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${req.body.captcha}&remoteip=${req.connection.remoteAddress}`;

    rp(verifyUrl, (err, response, body) => {
        body = JSON.parse(body);

        if (body.success && !body.success) {
            req.flash("warning", "Failed captcha verification, please try again");
            return res.status(403).redirect("/Contact");
        }
        next();
        //return res.json({error: false, message: "Captcha passed"});
    })
}

function verifyCaptcha(req, res, next) {
  if (req.user == null) {
    req.flash("warning", "You need to be logged in");
    return res.status(403).redirect("/Account");
  }

  next ();
}

module.exports = {
   setCaptcha
}