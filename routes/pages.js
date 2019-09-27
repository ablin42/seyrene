const express = require('express');
const path = require('path');
const verifyToken = require('./verifyToken');
const verifySession = require('./verifySession');
const request = require('request-promise');
const format = require('date-format');
const Blog = require('../models/Blog');
const User = require('../models/User');

const router = express.Router();

//needs try catches and status 400
//
//
// important

router.get('/', verifySession, (req, res) => {
    let obj = {};//{root: path.join(__dirname, '/pages/')};
    if (req.user._id != undefined) {
        obj.userId = req.user._id;
        obj.name = req.user.name;
    }
    res.status(200).render('home', obj);
})

router.get('/Galerie', verifySession, (req, res) => {
    let obj = {};
    if (req.user._id != undefined) {
        obj.userId = req.user._id;
        obj.name = req.user.name;
    }
    res.status(200).render('galerie', obj);
})

router.get('/Login', verifySession, (req, res) => { //had verifyToken here, weird, might have forgotten to delete it
    let obj = {};
    if (req.user._id) {
        return res.status(200).redirect('/');
    }
    res.status(200).render('login', obj);
})

router.get('/Register', verifySession, (req, res) => {
    let obj = {};
    if (req.user._id) {
        return res.status(200).redirect('/');
    }
    res.status(200).render('register', obj);
})

router.get('/User', verifySession, async (req, res) => {
    let obj = {};
    if (req.user._id != undefined) {
        obj = await User.findOne({_id: req.user._id});
        obj.password = undefined;
        res.status(200).render('user', obj);
    } else {
        req.flash('warning', "You need to be logged in")
        res.status(200).redirect('/Login');
    }
})

router.get('/Bio', verifySession, (req, res) => {
    let obj = {};
    if (req.user._id != undefined) {
        obj.userId = req.user._id;
        obj.name = req.user.name;
    }
    res.status(200).render('bio', obj);
})

router.get('/Shop', verifySession, (req, res) => {
    let obj = {};
    if (req.user._id != undefined) {
        obj.userId = req.user._id;
        obj.name = req.user.name;
    }
    res.status(200).render('shop', obj);
})

router.get('/Contact', verifySession, (req, res) => {
    let obj = {};
    if (req.user._id != undefined) {
        obj.userId = req.user._id;
        obj.name = req.user.name;
    }
    res.status(200).render('contact', obj);
})

router.get('/Blog', verifySession, async (req, res) => {
    let obj = {};
    obj.blogs = JSON.parse(await request('http://127.0.0.1:8089/api/blog/'));
    if (req.user._id != undefined) {
        obj.userId = req.user._id;
        obj.name = req.user.name;
        obj.level = req.user.level;
    }
    res.status(200).render('blog', obj);
})

router.get('/Blog/Post', verifySession, async (req, res) => { //verify level access
    if (req.user.level > 1) {
        let obj = {};
        obj.blogs = JSON.parse(await request('http://127.0.0.1:8089/api/blog/'));
        if (req.user) {
            obj.userId = req.user._id;
            obj.name = req.user.name;
            obj.level = req.user.level;
        }
        return res.status(200).render('blog-post', obj);
    } else {
        res.status(404).send("404 error"); // 404 page render here
    }
})

router.get('/Blog/Patch/:blogId', verifySession, async (req, res) => { //verify level access
    if (req.user.level > 1) {
        let obj = {};
        obj.blogContent = await Blog.findOne({_id: req.params.blogId}); // if exist continue if not redirect
        obj._id = req.params.blogId;
        obj.blogs = JSON.parse(await request('http://127.0.0.1:8089/api/blog/'));
        if (req.user) {
            obj.userId = req.user._id;
            obj.name = req.user.name;
            obj.level = req.user.level;
        }
        return res.status(200).render('blog-patch', obj);
    } else {
        res.status(404).send("404 error"); // 404 page render here
    }
})

module.exports = router;