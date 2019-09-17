const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {registerValidation, loginValidation} = require('../routes/validation')

// REGISTER
router.post('/register', async (req, res) => {
    // Check fields validity
    const {error} = registerValidation(req.body);
    if (error)
        return res.status(400).send(error.details[0].message);
    // foreach error.details
    //error.details[0].message

    // Check if email or username exists in DB
    const emailExist = await User.findOne({email: req.body.email});
    if (emailExist)
        return res.status(400).send("Email already taken");
    const nameExist = await User.findOne({name: req.body.name});
    if (nameExist)
        return res.status(400).send("Username already taken");

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
        res.status(200).send({user: savedUser._id});
    } catch (err) {res.status(400).json({message: err})}
})

// LOGIN
router.post('/login', async (req, res) => {
    // Check fields validity
    const {error} = loginValidation(req.body);
    if (error)
        return res.status(400).send(error.details[0].message);
    // Check if email exists in DB
    const user = await User.findOne({email: req.body.email});
    if (!user)
        return res.status(400).send("Invalid credentials");
    // Check if pw matches
    const validPw = await bcrypt.compare(req.body.password, user.password);
    if (!validPw)
        return res.status(400).send("Invalid credentials");
    
    // Create user session token
    const token = jwt.sign({_id: user._id}, process.env.TOKEN_SECRET);//have aswell user level access
    res.header('auth-token', token).status(200).send(token);
})
module.exports = router;