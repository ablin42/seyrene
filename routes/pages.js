const express = require('express');
const path = require('path');
const verifyToken = require('./verifyToken');
const verifySession = require('./verifySession');

const router = express.Router();

//needs try catches and status 400
//
//
// important

router.get('/', verifySession, (req, res) => {
    let obj = {
        root: path.join(__dirname, '/pages/')
    };
    if (req.user) {
        obj.name = req.user.name;
    }
    res.status(200).render('home', obj);
})

router.get('/Galerie', verifySession, (req, res) => {
    let obj = {
        root: path.join(__dirname, '/pages/')
    };
    if (req.user) {
        obj.name = req.user.name;
    }
    res.status(200).render('galerie', obj);
})

router.get('/Login', verifyToken, verifySession, (req, res) => {
    let obj = {
        root: path.join(__dirname, '/pages/')
    };
    if (req.user._id) {
        return res.status(200).redirect('/');
    }
    res.status(200).render('login', obj);
})

router.get('/Register', verifySession, (req, res) => {
    let obj = {
        root: path.join(__dirname, '/pages/')
    };
    if (req.user._id) {
        return res.status(200).redirect('/');
    }
    res.status(200).render('register', obj);
})

router.get('/Blog', verifySession, (req, res) => {
    let obj = {
        root: path.join(__dirname, '/pages/')
    };
    if (req.user) {
        obj.name = req.user.name;
    }
    res.status(200).render('blog', obj);
})

module.exports = router;