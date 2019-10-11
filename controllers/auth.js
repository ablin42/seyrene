const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const request = require('request');
const {validationResult} = require('express-validator');
const {vRegister, vLogin} = require('./validators/vAuth');

const mailer = require('./helpers/mailer');
const utils = require('./helpers/utils')
const User = require('../models/User');
const Token = require('../models/VerificationToken');

require('dotenv/config');

router.post('/register', vRegister, async (req, res) => {
try {
    const obj = {
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        password2: req.body.password2
    }
    const formData = {
        name: obj.name,
        email: obj.email
    }
    req.session.formData = formData;

    const vResult = validationResult(req);
    if (!vResult.isEmpty()) {
        vResult.errors.forEach((item) => {
            req.flash("info", item.msg)
        })
        throw new Error("Incorrect form input");
    }
   
    // Hash and salt pw
    const hashPw = await bcrypt.hash(req.body.password, 10);
    if (!hashPw)
        throw new Error("An error occured while encrypting your data, please try again");
        
    // Create User and validationToken objects
    const user = new User({
        name: obj.name,
        email: obj.email,
        password: hashPw
    });
    const vToken = crypto.randomBytes(16).toString('hex');
    const validationToken = new Token({
        _userId: user._id,
        token: vToken 
    });
     
    // Save User and validationToken to DB
    var [err, result] = await utils.to(user.save());
    if (err)
        throw new Error("An error occured while creating your account, please try again");

    [err, result] = await utils.to(validationToken.save());
    if (err) 
        throw new Error("An error occured while creating your confirmation token, please try again");
    
    // Send account confirmation mail to user
    let subject = `Account Verification Token for Maral`;
    let content = `Hello,\n\n Please verify your account by following the link: \nhttp:\/\/127.0.0.1:8089\/api\/auth\/confirmation\/${vToken}`;
    if (await mailer(user.email, subject, content)) 
        throw new Error("An error occured while trying to send the mail, please retry");
    
    // Create user session token and session data
    const token = jwt.sign({_id: user._id}, process.env.TOKEN_SECRET);//have aswell user level access
    //req.session._id = user._id;
    //req.session.name = user.name;
    
    req.flash('success', "Account created successfully, please check your emails to confirm your account");
    res.header('authToken', token); // save token to header
    return res.status(200).redirect('/Login');
} catch (err) {
    console.log("ERROR REGISTER:", err);
    req.flash("warning", err.message);
    return res.status(400).redirect('/Register');
}})

router.post('/login', vLogin, async (req, res) => {
try {
    const formData = {email: req.body.email};
    req.session.formData = formData;

    const vResult = validationResult(req);
    if (!vResult.isEmpty()) {
        vResult.errors.forEach((item) => {
            req.flash("info", item.msg)
        })
        throw new Error("Incorrect form input");
    }

    // Check if email exists in DB
    var [err, user] = await utils.to(User.findOne({email: req.body.email}));
    if (err)
        throw new Error("An error occured while looking for your user account, please try again");
    if (!user)
        throw new Error("Invalid credentials");

    // Check if pw matches
    const validPw = await bcrypt.compare(req.body.password, user.password);
    if (!validPw)
        throw new Error("Invalid credentials");
    
    // Check if user is verified
    if (!user.isVerified) {
        request.post('http://127.0.0.1:8089/api/auth/resend', {
            json: {email: req.body.email}
        }, (err) => {
            if (err)
                throw new Error("An error occured while sending your validation token, please try again")
        })
        throw new Error("Your account has not been verified. Please check your e-mails");
    }
    
    // Create user session token
    const token = jwt.sign({_id: user._id, name: user.name, level: user.level}, process.env.TOKEN_SECRET, {}, (err => {
        if (err)
            throw new Error("An error occured while generating your token");
    }));// callback and expiration date

    // Create session variables
    req.session._id = user._id;
    req.session.name = user.name;
    req.session.level = user.level;
    req.session.token = token;
    
    res.header('authToken', token); // save token to header
    req.flash('success', 'Logged in successfully!');
    res.redirect('/');
} catch (err) {
    console.log("ERROR LOGIN:", err);
    req.flash('warning', err.message);
    return res.status(400).redirect('/Login');
}})

router.get('/logout', (req, res) => {
try {
    // might want to delete token idk
    // Kill session
    req.session.destroy(function(err) {
        if (err)
            throw new Error("An error occured while logging you out, please try again if it didn't work");
    })
    res.status(200).redirect('/');
} catch (err) {
    console.log("ERROR LOGOUT:", err);
    req.flash('warning', err.message);
    return res.status(400).redirect('/');
}})

// Confirm account with token
router.get('/confirmation/:token', async (req, res) => {
try {
    const receivedToken = req.params.token;//sanitiwe
    var [err, token] = await utils.to(Token.findOne({ token: receivedToken }));
    if (err)
        throw new Error("An error occured while looking for your token, please try again");
    if (!token) 
        throw new Error("We were unable to find a valid token. Your token may have expired");

    // If we found a token, find a matching user
    var [err, user] = await utils.to(User.findOne({ _id: token._userId }));
    if (err)
        throw new Error("An error occured while looking for your user account, please try again");
    if (!user) 
        throw new Error("We were unable to find a user for this token");
            
    if (user.isVerified) 
        throw new Error("This user has already been verified");
 
    // Verify and save the user
    user.isVerified = true;
    var [err, user] = await utils.to(user.save()); 
    if (err)
        throw new Error(err.message);
    req.flash('success', "Your account has been verified. Please log in.");    
    return res.status(200).redirect('/Login');
} catch (err) {
    console.log("ERROR CONFIRMATION TOKEN:", err);
    req.flash('warning', err.message);
    return res.status(400).redirect('/Login');
}});

// Resend account confirmation token
router.post('/resend', async (req, res) => {
try {
    const email = req.body.email;//sanitize
    var [err, user] = await utils.to(User.findOne({ email: email }));
    // Check if an user exist with this email and check if his account is verified
    if (err)
        throw new Error("An error occured while looking for you user account, please try again");
    if (!user) 
        throw new Error("We were unable to find a user with that email");
    if (user.isVerified) 
        throw new Error("This account has already been verified. Please log in");
 
    // Create a verification token, save it, and send email
    let vToken = crypto.randomBytes(16).toString('hex');
    let token = new Token({ _userId: user._id, token: vToken });
 
    // Save the token
    var [err, savedToken] = await utils.to(token.save());
    if (err)  
        throw new Error("An error occured while saving your token, please try again");  
 
    let subject = `Account Verification Token for Maral`;
    let content = `Hello,\n\n Please verify your account by clicking the link: \nhttp:\/\/127.0.0.1:8089\/api\/auth\/confirmation\/${vToken}`;
    if (await mailer(user.email, subject, content))
        throw new Error("An error occured while sending your the email, please try again");

    req.flash('info', `A verification email has been sent to ${user.email}`);
    return res.status(200).redirect('/Login');
} catch (err) {
    console.log("ERROR SENDING TOKEN:", err);
    req.flash('warning', err.message);
    return res.status(400).redirect('/Login');
}});

module.exports = router;