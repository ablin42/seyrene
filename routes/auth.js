const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {registerValidation, loginValidation} = require('../routes/validation');
require('../utils.js')();

// REGISTER
router.post('/register', async (req, res) => {
    let data = {
        error: false,
        message: "Account created successfully!"
    }
    // Check fields validity
    const {error} = registerValidation(req.body);
    if (error)
    {
        data.message = error.details[0].message;
        data.error = true;
        data.alert = formatAlert("warning", data.message, "text-align: center; width: 60%; margin:auto");
        return res.status(400).send(data);
    }
    // foreach error.details
    //error.details[0].message

    // Check if email or username exists in DB
    const emailExist = await User.findOne({email: req.body.email});
    if (emailExist)
    {
        data.message = "An account already exist with this e-mail.";
        data.error = true;
        data.alert = formatAlert("warning", data.message, "text-align: center; width: 60%; margin:auto");
        return res.status(400).send(data);
    }
    const nameExist = await User.findOne({name: req.body.name});
    if (nameExist)
    {
        data.message = "An account already exist with this username.";
        data.error = true;
        data.alert = formatAlert("warning", data.message, "text-align: center; width: 60%; margin:auto");
        return res.status(400).send(data);

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
        data.alert = formatAlert("success", data.message, "text-align: center; width: 60%; margin:auto");
        data.token = token;
        
        res.status(200).send(data);
    } catch (err) {res.status(400).json({message: err})}
})

// LOGIN
router.post('/login', async (req, res) => {
    let data = {
        error: false,
        message: "Logged in successfully!"
    }
    // Check fields validity
    const {error} = loginValidation(req.body);
    if (error)
    {
        data.message = error.details[0].message;
        data.error = true;
        data.alert = formatAlert("warning", data.message, "text-align: center; width: 60%; margin:auto");
        return res.status(400).send(data);
    }
    // Check if email exists in DB
    const user = await User.findOne({email: req.body.email});
    if (!user)
    {
        data.message = "Invalid credentials";
        data.error = true;
        data.alert = formatAlert("warning", data.message, "text-align: center; width: 60%; margin:auto");
        return res.status(400).send(data);
    }
    // Check if pw matches
    const validPw = await bcrypt.compare(req.body.password, user.password);
    if (!validPw)
    {
        data.message = "Invalid credentials";
        data.error = true;
        data.alert = formatAlert("warning", data.message, "text-align: center; width: 60%; margin:auto");
        return res.status(400).send(data);
    }
    
    // Create user session token
    const token = jwt.sign({_id: user._id}, process.env.TOKEN_SECRET);//have aswell user level access
    data.alert = formatAlert("success", data.message, "text-align: center; width: 60%; margin:auto");
    data.token = token;
    res.header('auth-token', token).status(200).send(data);
})
module.exports = router;