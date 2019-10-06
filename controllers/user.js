const express = require('express');
const router = express.Router();
const crypto = require('crypto');

const bcrypt = require('bcryptjs');
const {nameValidation, emailValidation, pwValidation, resetPwValidation} = require('./helpers/joiValidation');
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
    return res.status(400).json({message: err})
}})

router.post('/lostpw', async (req, res) => { //check if pwtoken already exist
try {
    const email = req.body.email,
          token = crypto.randomBytes(16).toString('hex');

    // find user using email
    User.findOne({ email: email }, async (err, user) => {
        if (err) //if user === null
            throw new Error("Invalid e-mail, please make sure you entered the correct e-mail");
             // fetch token using user id, if it return null, create a token and save it
        PwToken.findOne({ _userId: user._id}, (err, pwToken) => {
            if (err) // si pwtoken === null
                throw new Error("ISSOU")
            if (pwToken === null) {
                pwToken = new PwToken({ _userId: user._id, token: token });
                pwToken.save((err) => {
                    if (err) 
                        throw new Error("An error occured while saving your token, please try again");
                });
            } else {
                // update token if one already exist
                PwToken.updateOne({ _userId: user._id}, {$set: {token: token}}, (err) => {
                    if (err) 
                        throw new Error("An error occured while updating your token, please try again");
                });
            }
        })
        const subject = "Password Reset Token for Maral",
            content = `Hello,\n\n You asked your password to be reset, please follow this link in order to change your password: \n http:\/\/127.0.0.1:8089\/resetpw\/${pwToken._id}\/${token}`;
        if (await mailer(email, subject, content)) 
            throw new Error("An error occured while send the e-mail, please try again");
        
        req.flash('success', "An e-mail was sent to your address, please follow the link we sent you");
        return res.status(200).redirect('/');
    });
      

          

 
    /*
    if (user === null) 
        throw new Error("Invalid e-mail, please make sure you entered the correct e-mail");
    if (pwToken === null) {
        pwToken = new PwToken({ _userId: user._id, token: token });
        */

   
} catch (err) {
    console.log("ERROR LOSTPW:", err);
    req.flash('warning', err.message);
    return res.status(400).redirect('/Lostpw');
}})

router.post('/resetpw', async (req, res) => {
try {
    const tokenId = req.body.tokenId,//sanitize
          token = req.body.token,
          pw = req.body.password,
          pw2 = req.body.password2;

    // check passwords validity
    const {error} = await resetPwValidation({password: pw, password2: pw2});
    if (error) 
        throw new Error(error.message);
        
    // hash and salt pw
    const hashPw = await bcrypt.hash(pw, 10);
    if (!hashPw)
        throw new Error("An error occured while encrypting your data, please try again");

    // check if token is valid
    PwToken.findOne({_id: tokenId, token: token}, (err, pwToken) => {
        if (err)
            throw new Error("Invalid token, please try to request another one here");
        // update password and delete token
        User.updateOne({_id: pwToken._userId}, {$set: {password: hashPw}}, (err) => {
            if (err)
                throw new Error("An error occured while updating your password, please try again");
            PwToken.deleteOne({_id: tokenId}, (err) => {
                if (err)
                    throw new Error("An error occured while cleaning up your token, please try again");
                req.flash('success', "Password successfully modified");
                return res.status(200).redirect('/Login');
            });
        });
    });
} catch (err) {
    console.log("ERROR RESETPW:", err);
    req.flash('warning', err.message);
    return res.status(400).redirect('/Lostpw');
}})

router.post('/patch/name', verifySession, async (req, res) => {
try {
    if (req.user._id != undefined) {
        const {error} = await nameValidation(req.body);
        if (error)
            throw new Error(error.message);
        const name = req.body.name,
              id = req.user._id; //sanitize
        
        // Check if name is already assigned
        const nameExist = await utils.nameExist(name);
        if (nameExist)
            throw new Error("An account already exist with this username")
        // Update username
        User.updateOne({_id: id}, {$set: {name: name}}, (err) => {
            if (err)
                throw new Error("An error occured while updating your username, please try again")
            req.flash('success', "Username successfully modified");
            res.status(200).redirect('/User');
        });
    }
    else 
        throw new Error("Unauthorized, please make sure you are logged in");
} catch (err) {
    console.log("ERROR PATCHING NAME:", err);
    req.flash('warning', err.message);
    return res.status(400).redirect('/User');
}})

router.post('/patch/email', verifySession, async (req, res) => {
try {
    if (req.user._id != undefined) {
        const newEmail = req.body.email, //sanitize
              id = req.user._id,
              vToken = crypto.randomBytes(16).toString('hex'); 
        const {error} = await emailValidation(req.body);
        if (error)
            throw new Error(error.message);
        // Check if email is already in use on another account
        const emailExist = await utils.emailExist(newEmail);
        if (emailExist) 
            throw new Error("An account already exist with this e-mail");

        User.updateOne({_id: id}, {$set: {email: newEmail, isVerified: false}}, (err) => {
            if (err)
                throw new Error("An error occured while updating your email, please try again");
        }); 
        Token.updateOne({_userId: id}, {$set: {token: vToken}}, (err) => {
            if (err)
                throw new Error("An error occured while updating your token, please try again");
        }); 
        
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

router.post('/patch/password', verifySession, async (req, res) => {
try {
    if (req.user._id != undefined) {
        const {error} = await pwValidation(req.body);
        if (error)
            throw new Error(error.message);

        const id = req.user._id,
              cpassword = req.body.cpassword,
              password = req.body.password,
              password2 = req.body.password2;
        
        User.findById(id, async (err, user) => {
            if (err)
                throw new Error("An error occured, please make sure you are logged in and try again");
            
            // Check if pw matches
            const validPw = await bcrypt.compare(cpassword, user.password);
            if (!validPw)
                throw new Error("This is not your current password!");
            if (password !== password2)
                throw new Error("The passwords you entered didn't match!");
            // Hash and salt pw
            const hashPw = await bcrypt.hash(password, 10);
            if (!hashPw)
                throw new Error("An error occured while encrypting your data, please try again");
            
            User.updateOne({_id: id}, {$set: {password: hashPw}}, (err) => {
                if (err)
                    throw new Error("An error occured while updating your password, please try again");
                    req.flash('success', "Password successfully modified");
                    res.status(200).redirect('/User');
            });
        });
    }
    else 
        throw new Error("Unauthorized, please make sure you are logged in");
} catch (err) {
    console.log("ERROR PATCHING PASSWORD:", err);
    req.flash('warning', err.message);
    return res.status(400).redirect('/User');
}})

module.exports = router;