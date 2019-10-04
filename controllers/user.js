const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Token = require('../models/VerificationToken');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const verifySession = require('./helpers/verifySession');
const {nameValidation, emailValidation, pwValidation} = require('./helpers/joiValidation');
const crypto = require('crypto');
const mailer = require('./helpers/mailer');
require('dotenv/config');


router.get('/', async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (err) {res.status(400).json({message: err})}
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