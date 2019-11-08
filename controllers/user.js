const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const {validationResult} = require('express-validator');
const {vName, vEmail, vPassword, vLostPw, vDelivery} = require('./validators/vUser');

const mailer = require('./helpers/mailer');
const verifySession = require('./helpers/verifySession');
const utils = require('./helpers/utils')
const User = require('../models/User');
const Token = require('../models/VerificationToken');
const PwToken = require('../models/PasswordToken');
require('dotenv/config');

router.get('/', async (req, res) => {//later
try {
    const users = await User.find();
    return res.status(200).json(users);
} catch (err) {
    return res.status(400).json({message: err.message})
}})

router.post('/lostpw', vLostPw, async (req, res) => { //check if pwtoken already exist
try {
    // Check form inputs validity
    const vResult = validationResult(req);
    if (!vResult.isEmpty()) {
        vResult.errors.forEach((item) => {
            req.flash("info", item.msg)
        })
        throw new Error("Incorrect form input");
    }

    // find user using email
    var [err, user] = await utils.to(User.findOne({ email: req.body.email }));
    if (err)
        throw new Error("An error occured while looking for your account, please retry");
    if (user === null)
        throw new Error("Invalid e-mail, please make sure you entered the correct e-mail");

    var [err, pwToken] = await utils.to(PwToken.findOne({ _userId: user._id}));
    if (err)
        throw new Error("An error occured while looking for your token, please retry");

    const token = crypto.randomBytes(16).toString('hex');
    if (pwToken === null) {
        pwToken = new PwToken({ _userId: user._id, token: token });
        var [err, result] = await utils.to(pwToken.save());
        if (err) 
            throw new Error("An error occured while saving your token, please try again");
    } else {
        // update token if one already exist
        var [err, result] = await utils.to(PwToken.updateOne({ _userId: user._id}, {$set: {token: token}}))
            if (err) 
                throw new Error("An error occured while updating your token, please try again");
    }

    const subject = "Password Reset Token for Maral",
          content = `Hello,\n\n You asked your password to be reset, please follow this link in order to change your password: \n http:\/\/127.0.0.1:8089\/resetpw\/${pwToken._id}\/${token}`;
    if (await mailer(req.body.email, subject, content)) 
        throw new Error("An error occured while send the e-mail, please try again");
            
    req.flash('success', "An e-mail was sent to your address, please follow the link we sent you");
    return res.status(200).redirect('/');
} catch (err) {
    console.log("ERROR LOSTPW:", err);
    req.flash('warning', err.message);
    return res.status(400).redirect('/Lostpw');
}})

router.post('/resetpw', vPassword, async (req, res) => {
try {
    // Check form inputs validity
    const vResult = validationResult(req);
    if (!vResult.isEmpty()) {
        vResult.errors.forEach((item) => {
            req.flash("info", item.msg)
        })
        throw new Error("Incorrect form input");
    }
        
    // hash and salt pw
    const hashPw = await bcrypt.hash(req.body.password, 10);
    if (!hashPw)
        throw new Error("An error occured while encrypting your data, please try again");

    // check if token is valid
    var [err, pwToken] = await utils.to(PwToken.findOne({_id: req.body.tokenId, token: req.body.token}));
    if (err)
        throw new Error("Invalid token, please try to request another one here");

    // update password and delete token
    var [err, user] = await utils.to(User.updateOne({_id: pwToken._userId}, {$set: {password: hashPw}}));
    if (err)
        throw new Error("An error occured while updating your password, please try again");
    var [err, pwToken] = await utils.to(PwToken.deleteOne({_id: req.body.tokenId}));
    if (err)
        throw new Error("An error occured while cleaning up your token, please try again");

    req.flash('success', "Password successfully modified");
    return res.status(200).redirect('/Login');
} catch (err) {
    console.log("ERROR RESETPW:", err);
    req.flash('warning', err.message);
    return res.status(400).redirect(`/Resetpw/${req.body.tokenId}/${req.body.token}`);
}})

router.post('/patch/name', vName, verifySession, async (req, res) => {
try {
    if (req.user) {
        // Check form inputs validity
        const vResult = validationResult(req);
        if (!vResult.isEmpty()) {
            vResult.errors.forEach((item) => {
                req.flash("info", item.msg)
            })
            throw new Error("Incorrect form input");
        }
      
        const name = req.body.name,
              id = req.user._id; //sanitize
        
        // Check if name is already assigned
        const nameExist = await utils.nameExist(name);
        if (nameExist)
            throw new Error("An account already exist with this username")
        // Update username
        var [err, user] = await utils.to(User.updateOne({_id: id}, {$set: {name: name}}));
        if (err)
            throw new Error("An error occured while updating your username, please try again")
        req.flash('success', "Username successfully modified");
        res.status(200).redirect('/User');
    }
    else 
        throw new Error("Unauthorized, please make sure you are logged in");
} catch (err) {
    console.log("ERROR PATCHING NAME:", err);
    req.flash('warning', err.message);
    return res.status(400).redirect('/User');
}})

router.post('/patch/email', vEmail, verifySession, async (req, res) => {
try {
    if (req.user) {
        // Check form inputs validity
        const vResult = validationResult(req);
        if (!vResult.isEmpty()) {
            vResult.errors.forEach((item) => {
                req.flash("info", item.msg)
            })
            throw new Error("Incorrect form input");
        }

        const newEmail = req.body.email, //sanitize
              id = req.user._id,
              vToken = crypto.randomBytes(16).toString('hex'); 

        // Check if email is already in use on another account
        const emailExist = await utils.emailExist(newEmail);
        if (emailExist) 
            throw new Error("An account already exist with this e-mail");

        var [err, user] = await utils.to(User.updateOne({_id: id}, {$set: {email: newEmail, isVerified: false}}));
        if (err)
            throw new Error("An error occured while updating your email, please try again");
        var [err, token] = await utils.to(Token.updateOne({_userId: id}, {$set: {token: vToken}}));
        if (err)
            throw new Error("An error occured while updating your token, please try again"); 
        
        //send mail
        let subject = `Account Verification Token for Maral`,
            content = `Hello,\n\n Please verify your account by following the link: \nhttp:\/\/127.0.0.1:8089\/api\/auth\/confirmation\/${vToken}`;
        if (await mailer(newEmail, subject, content)) 
            throw new Error("An error occured while trying to send the mail, please retry");

        req.flash('success', "Email successfully modified, please confirm your new e-mail by clicking on the link we sent you");
        res.status(200).redirect('/User');
    }
    else 
        throw new Error("Unauthorized, please make sure you are logged in");
} catch (err) {
    console.log("ERROR PATCHING EMAIL:", err);
    req.flash('warning', err.message);
    return res.status(400).redirect('/User');
}})

router.post('/patch/password', vPassword, verifySession, async (req, res) => {
try {
    if (req.user) {
        // Check form inputs validity
        const vResult = validationResult(req);
        if (!vResult.isEmpty()) {
            vResult.errors.forEach((item) => {
                req.flash("info", item.msg)
            })
            throw new Error("Incorrect form input");
        }

        const id = req.user._id,
              cpassword = req.body.cpassword,
              password = req.body.password;
                      
        var [err, user] = await utils.to(User.findById(id));
        if (err)
            throw new Error("An error occured, please make sure you are logged in and try again");
            
        // Check if pw matches
        const validPw = await bcrypt.compare(cpassword, user.password);
        if (!validPw)
            throw new Error("This is not your current password!");
        // Hash and salt pw
        const hashPw = await bcrypt.hash(password, 10);
        if (!hashPw)
            throw new Error("An error occured while encrypting your data, please try again");
            
        var [err, user] = await utils.to(User.updateOne({_id: id}, {$set: {password: hashPw}}));
        if (err)
            throw new Error("An error occured while updating your password, please try again");
        req.flash('success', "Password successfully modified");
        res.status(200).redirect('/User');
    }
    else 
        throw new Error("Unauthorized, please make sure you are logged in");
} catch (err) {
    console.log("ERROR PATCHING PASSWORD:", err);
    req.flash('warning', err.message);
    return res.status(400).redirect('/User');
}})

router.post('/patch/delivery-info', vDelivery, verifySession, async (req, res) => {
try {
    req.flash('success', "Delivery informations successfully modified");
    res.status(200).redirect('/User');
    console.log("XDDD");
} catch (err) {
    console.log("ERROR PATCHING PASSWORD:", err);
    req.flash('warning', err.message);
    return res.status(400).redirect('/User');
}})

module.exports = router;