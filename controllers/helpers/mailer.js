const nodemailer = require('nodemailer');
require('dotenv/config');

module.exports =  async function sendValidationMail(email, subject, text) {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SERVER_EMAIL,
            pass: process.env.SERVER_EMAILPW
        }
    })

    let mailOptions = {
        from: process.env.SERVER_EMAIL,
        to: email,
        subject: subject,
        text: text
        //subject: `Account Verification Token for Maral`,
        //text: 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/127.0.0.1:8089\/api\/auth\/confirmation\/' + token + '.\n'
    }

    transporter.sendMail(mailOptions, (err) => {
        if (err) {
            console.log("ERROR", err);
            return true;
        } else {
            console.log("SUCCESS");
        }
    })
    return false;
}