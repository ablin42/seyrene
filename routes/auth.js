const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path')
const {registerValidation, loginValidation} = require('../routes/validation');

router.post('/register', async (req, res) => {
    // Check fields validity
    const {error} = await registerValidation(req.body);
    if (error) {
        console.log(error)
        req.flash('warning', error.details[0].message);
        return res.status(400).redirect('/Register');
    }
    // foreach error.details
    //error.details[0].message

    // Check if email or username exists in DB
    const emailExist = await User.findOne({email: req.body.email});
    if (emailExist) {
        req.flash('warning', "An account already exist with this e-mail.");
        return res.status(400).redirect('/Register');
    }
    const nameExist = await User.findOne({name: req.body.name});
    if (nameExist) {
        req.flash('warning', "An account already exist with this username.");
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
    try {
        const savedUser = await user.save();
        // Create user session token
        const token = jwt.sign({_id: user._id}, process.env.TOKEN_SECRET);//have aswell user level access
        
        req.session._id = savedUser._id;
        req.session.name = savedUser.name;

        req.flash('success', "Account created successfully");
        res.header('authToken', token); // save token to header
        res.redirect('/');
    } catch (err) {res.status(400).json({message: err})}
})

router.post('/login', async (req, res) => {
    // Check fields validity
    const {error} = loginValidation(req.body);
    if (error){
        req.flash('warning', error.details[0].message);
        return res.status(400).redirect('/Login'); 
    }

    // Check if email exists in DB
    const user = await User.findOne({email: req.body.email});
    if (!user){
        req.flash('warning', 'Invalid credentials');
        return res.status(400).redirect('/Login'); 
    }
    // Check if pw matches
    const validPw = await bcrypt.compare(req.body.password, user.password);
    if (!validPw){
        req.flash('warning', 'Invalid credentials');
        return res.status(400).redirect('/Login');
    }
    
    // Create user session token
    const token = jwt.sign({_id: user._id, name: user.name}, process.env.TOKEN_SECRET);//have aswell user level access + callback and expiration date

    // Create session variables
    req.session._id = user._id;
    req.session.name = user.name;
    
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

module.exports = router;