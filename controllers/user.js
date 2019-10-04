const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Token = require('../models/VerificationToken');
const PwToken = require('../models/PasswordToken');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const verifySession = require('./helpers/verifySession');
const {nameValidation, emailValidation, pwValidation, resetPwValidation} = require('./helpers/joiValidation');
const crypto = require('crypto');
const mailer = require('./helpers/mailer');
require('dotenv/config');


router.get('/', async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (err) {res.status(400).json({message: err})}
})

router.post('/lostpw', async (req, res) => { //check if pwtoken already exist
    try {
        let email = req.body.email;
        let token = crypto.randomBytes(16).toString('hex');
        let user = await User.findOne({ email: email });
        if (user === null) {
            req.flash('danger', "Invalid e-mail, please make sure you entered the correct e-mail");
            return res.status(200).redirect('/Lostpw');
        }
        let pwToken = await PwToken.findOne({ _userId: user._id});
        if (pwToken === null) {
            pwToken = new PwToken({ _userId: user._id, token: token });

            let savedToken = await pwToken.save((err) => {
                if (err) {
                    console.log(err)
                    req.flash('warning', "An error occured while saving your token, please try again");
                    return res.status(200).redirect('/Lostpw');
                }
            });
        } else {
            await PwToken.updateOne({ _userId: user._id}, {$set: {token: token}}, (err) => {
                if (err) {
                    console.log(err)
                    req.flash('warning', "An error occured while saving your token, please try again");
                    return res.status(200).redirect('/Lostpw');
                }
            });
        }

        let subject = "Password Reset Token for Maral";
        let content = `Hello,\n\n You asked your password to be reset, please follow this link in order to change your password: \n http:\/\/127.0.0.1:8089\/resetpw\/${pwToken._id}\/${token}`;
        if (await mailer(email, subject, content)) {
            console.log("An error occured while send the e-mail")
            req.flash('warning', "An error occured while send the e-mail, please try again");
            return res.status(200).redirect('/Lostpw');
        } 
    
        req.flash('success', "An e-mail was sent to your address, please follow the link we sent you");
        res.status(200).redirect('/');
    } catch (err) {console.log(err)}
})

router.post('/resetpw', async (req, res) => {
    try {
        let tokenId = req.body.tokenId,
            token = req.body.token,
            pw = req.body.password,
            pw2 = req.body.password2;
        console.log({tokenId, token, pw, pw2})

        //check passwords validity
        const {error} = await resetPwValidation({password: pw, password2: pw2});
        if (error) {
            req.flash('warning', error.message);
            return res.status(400).redirect(`/resetpw/${tokenId}/${token}`);
        }
        // Hash and salt pw
        const salt = await bcrypt.genSalt(10);
        const hashPw = await bcrypt.hash(pw, salt);

        pwToken = await PwToken.findOne({_id: tokenId, token: token}); //if result is positive do sth else err
        if (pwToken === null) {
            req.flash('warning', 'Invalid token, please try to request another one here');
            return res.status(200).redirect('/Lostpw');
        }
        user = await User.updateOne({_id: pwToken._userId}, {$set: {password: hashPw}}); //on success/failure
        deletePwToken = await PwToken.deleteOne({_id: tokenId});

        req.flash('success', "Password successfully modified");
        return res.status(200).redirect('/Login');
    } catch (err) {console.log(err)}
})

router.post('/patch/name', verifySession, async (req, res) => {
    const {error} = await nameValidation(req.body);
    if (error) {
        req.flash('warning', error.message);
        return res.status(400).redirect('/User');
    }
    if (req.user._id != undefined) {
        try {
            // Check if name is already assigned
            const nameExist = await User.findOne({name: req.body.name});
            if (nameExist) {
                req.flash('warning', "An account already exist with this username.");
                return res.status(400).redirect('/User');
            }
            const patchedUser = await User.updateOne({_id: req.user._id}, {$set: {name: req.body.name}});
            req.flash('success', "Username successfully modified");
            res.status(200).redirect('/User');
        } catch (err) {res.status(400).json({message: err})}  
    }
    else {
        res.status(200).send("Unauthorized.");//redirect or 404
    }
})

router.post('/patch/email', verifySession, async (req, res) => {
    let newEmail = req.body.email;
    const {error} = await emailValidation(req.body);
    if (error) {
        req.flash('warning', error.message);
        return res.status(400).redirect('/User');
    }
    if (req.user._id != undefined) {
        try {
            // Check if email is already in use on another account
            const emailExist = await User.findOne({email: req.body.email});
            if (emailExist) {
                req.flash('warning', "An account already exist with this e-mail.");
                return res.status(400).redirect('/User');
            }
            vToken = crypto.randomBytes(16).toString('hex');
            const patchedUser = await User.updateOne({_id: req.user._id}, {$set: {email: newEmail, isVerified: false}});
            const updatedToken = await Token.updateOne({_userId: req.user._id}, {$set: {token: vToken}});
            //send mail
            if (await mailer(newEmail, vToken)) {
                req.flash('info', "An error occured while trying to send the mail, please retry");
                return res.status(400).redirect('/User');
            }

            req.flash('success', "Email successfully modified, please confirm your new e-mail by clicking on the link we sent you");
            res.status(200).redirect('/User');
        } catch (err) {res.status(400).json({message: err})}  
    }
    else {
        res.status(200).send("Unauthorized.");//redirect or 404
    }
})

router.post('/patch/password', verifySession, async (req, res) => {
    const {error} = await pwValidation(req.body);
    if (error) {
        req.flash('warning', error.message);
        return res.status(400).redirect('/User');
    }
    if (req.user._id != undefined) {
        try {
            const user = await User.findById(req.user._id);

            // Check if pw matches
            const validPw = await bcrypt.compare(req.body.cpassword, user.password);
            if (!validPw){
                req.flash('warning', 'This is not your current password!');
                return res.status(400).redirect('/User');
            }
            if (req.body.password !== req.body.password2){
                req.flash('warning', "The passwords you entered didn't match!");
                return res.status(400).redirect('/User');
            }
            // Hash and salt pw
            const salt = await bcrypt.genSalt(10);
            const hashPw = await bcrypt.hash(req.body.password, salt);
          
            const patchedUser = await User.updateOne({_id: req.user._id}, {$set: {password: hashPw}});
            req.flash('success', "Password successfully modified");
            res.status(200).redirect('/User');
        } catch (err) {res.status(400).json({message: err})}  
    }
    else {
        res.status(200).send("Unauthorized.");//redirect or 404
    }
})

module.exports = router;