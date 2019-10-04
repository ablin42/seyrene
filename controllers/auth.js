const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Token = require('../models/VerificationToken');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path')
const {registerValidation, loginValidation} = require('./helpers/joiValidation');
const crypto = require('crypto');
const request = require('request');
const mailer = require('./helpers/mailer');
require('dotenv/config');

async function emailExist(req) {
    if (await User.findOne({email: req.body.email})) {
        req.flash('warning', "An account already exist with this e-mail.");
        return true;
    } 
    return false;
}

async function nameExist(req) {
    if (await User.findOne({name: req.body.name})) {
        req.flash('warning', "An account already exist with this username.");
        return true
    }
    return false;
}

async function registerUser(req, res) {
    // Check fields validity
    let {error} = await registerValidation(req.body);
    if (error) {
        req.flash('warning', error.message);
        return res.status(400).redirect('/Register');
    }
    // Check if email or username exists in DB
    const [emailTaken, nameTaken] = await Promise.all([emailExist(req), nameExist(req)])
    if (emailTaken || nameTaken){
        return res.status(400).redirect('/Register');
    }
    
    // Hash and salt pw
    const salt = await bcrypt.genSalt(10);
    const hashPw = await bcrypt.hash(req.body.password, salt);

    const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: hashPw
    });
    //try {
        const savedUser = await user.save( async (err) => {
            if (err) console.log(err)
        });
        // Create user session token
        const token = jwt.sign({_id: user._id}, process.env.TOKEN_SECRET);//have aswell user level access
    //} catch (err) {res.status(400).json({message: err})}*/

    // Create a verification token for this user
    let vToken = crypto.randomBytes(16).toString('hex');
    let validationToken = new Token({ _userId: user._id, token: vToken });
        
    let savedToken = await validationToken.save((err) => {
        if (err) console.log(err)
    });
   //subject: `Account Verification Token for Maral`,
        //text: 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/127.0.0.1:8089\/api\/auth\/confirmation\/' + token + '.\n'
    let subject = `Account Verification Token for Maral`;
    let content = `Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/127.0.0.1:8089\/api\/auth\/confirmation\/'${vToken}'.`;
    if (await mailer(user.email, subject, content)) {
        req.flash('info', "An error occured while trying to send the mail, please retry");
        return res.status(400).redirect('/Register');
    }
    
    //req.session._id = user._id;
    //req.session.name = user.name;

    req.flash('success', "Account created successfully, please check your emails to confirm your account");
    res.header('authToken', token); // save token to header
    res.redirect('/');
    return res.status()
}

router.post('/register', async (req, res) => {
    result = await registerUser(req, res);
   
    return ;//res.redirect('/Register')
})

router.post('/login', async (req, res) => {
    // Check fields validity
    const {error} = loginValidation(req.body); //not really necessary in login
    let formData = {"email": req.body.email};
    if (error){
        req.flash('warning', error.message);
        return res.status(400).render('login', formData); 
    }

    // Check if email exists in DB
    const user = await User.findOne({email: req.body.email});
    if (!user){
        req.flash('warning', 'Invalid credentials');
        return res.status(400).render('login', formData);
    }
    // Check if pw matches
    const validPw = await bcrypt.compare(req.body.password, user.password);
    if (!validPw){
        req.flash('warning', 'Invalid credentials');
        return res.status(400).render('login', formData);
    }
    if (!user.isVerified) {
        req.flash('info', 'Your account has not been verified. Please check your e-mails');
        request.post('http://127.0.0.1:8089/api/auth/resend', {
            json: {email: req.body.email}
        })
        return res.status(401).redirect('/Login'); 
    }
    
    // Create user session token
    const token = jwt.sign({_id: user._id, name: user.name, level: user.level}, process.env.TOKEN_SECRET);// callback and expiration date

    // Create session variables
    req.session._id = user._id;
    req.session.name = user.name;
    req.session.level = user.level;
    req.session.token = token;
    
    res.header('authToken', token); // save token to header
    req.flash('success', 'Logged in successfully!');
    res.redirect('/');
})

router.get('/logout', (req, res) => {
    //might want to delete token idk
    req.session.destroy(function(err) {
        if (err)
            console.log(err)
    })
    res.redirect('/');
})

router.get('/confirmation/:token', (req, res, next) => {
    
    Token.findOne({ token: req.params.token }, function (err, token) {
        if (!token) {
            req.flash('info', "We were unable to find a valid token. Your token my have expired.");
            return res.status(400).redirect('/Login');
        }
 
        // If we found a token, find a matching user
        User.findOne({ _id: token._userId }, function (err, user) {
            if (!user) {
                req.flash('info', "We were unable to find a user for this token.");
                return res.status(400).redirect('/Login');
            } 
            if (user.isVerified) {
                req.flash('info', "This user has already been verified.");                
                return res.status(400).redirect('/Login');
            }
 
            // Verify and save the user
            user.isVerified = true;
            user.save(function (err) {
                if (err) { 
                    req.flash('warning', err.message);    
                    return res.status(500).redirect('/Login'); 
                }
                req.flash('success', "The account has been verified. Please log in.");    
                res.status(200).redirect('/Login');
            });
        });

    });
});


router.post('/resend', (req, res, next) => {
 
    User.findOne({ email: req.body.email }, function (err, user) {
        if (!user) {
            req.flash('info', "We were unable to find a user with that email.");    
            return res.status(400).redirect('/Login');
        }
        if (user.isVerified) {
            req.flash('info', "This account has already been verified. Please log in.");    
            return res.status(400).redirect('/Login');
        }
 
        // Create a verification token, save it, and send email
        let vToken = crypto.randomBytes(16).toString('hex');
        let token = new Token({ _userId: user._id, token: vToken });
 
        // Save the token
        token.save(async (err, savedToken) => {
            if (err) { 
                req.flash('warning', err.message);    
                return res.status(500).redirect('/Login'); 
            }
 
            let subject = `Account Verification Token for Maral`;
            let content = `Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/127.0.0.1:8089\/api\/auth\/confirmation\/'${vToken}'.`;
            if (await mailer(user.email, subject, content)) {
                req.flash('info', "An error occured while trying to send the mail, please retry");
                return res.status(400).redirect('/Register');
            }
            req.flash('info', `A verification email has been sent to ${user.email}.`);
            res.status(200).redirect('/Login');
            });
        });
});

module.exports = router;