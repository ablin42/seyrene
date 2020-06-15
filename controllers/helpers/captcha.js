const rp = require("request-promise");

async function checkCaptcha(req, res, next) {
    const captcha = req.body.captcha;

    if (!captcha) 
        return res.status(200).json({error: true, message: "Please solve the captcha"});

    const secretKey = "6Ld8MaUZAAAAAJOHua_oEH4mVX0P2ATrfacoxIgM";
    const verifyUrl = `https://google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${req.body.captcha}&remoteip=${req.connection.remoteAddress}`;

    rp(verifyUrl, (err, response, body) => {
        body = JSON.parse(body);

        if (body.success && !body.success) 
            return res.status(200).json({error: true, message: "Failed captcha verification, please try again"});
        
        next();
    })
}

module.exports = {
    checkCaptcha
}