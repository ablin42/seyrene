const express = require('express');
const path = require('path');
const verifyToken = require('./verifyToken');
const verifySession = require('./verifySession');
const request = require('request-promise');
const format = require('date-format');

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

router.get('/Login', verifySession, (req, res) => { //had verifyToken here, weird, might have forgotten to delete it
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

router.get('/Blog', verifySession, async (req, res) => {
    let obj = {
        root: path.join(__dirname, '/pages/')
    };
    obj.blogs = JSON.parse(await request('http://127.0.0.1:8089/api/post/blog'));
    if (req.user) {
        obj.name = req.user.name;
    }
    obj.blogs.forEach((item, index) => {
        item.date = format.asString("Le dd/MM/yy à hh:mm:ss", new Date(item.date));
    });
    res.status(200).render('blog', obj);
})

module.exports = router;