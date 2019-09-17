const express = require('express');
const path = require('path');

const router = express.Router();

//needs try catches and status 400
//
//
// important

router.get('/', (req, res) => {
    res.render('home', {
        root: path.join(__dirname, '/pages/')
    })
    res.status(200);
})

router.get('/Galerie', (req, res) => {
    res.render('galerie', {
        root: path.join(__dirname, '/pages/')
    })
    res.status(200);
})

router.get('/Login', (req, res) => {
    res.render('login', {
        root: path.join(__dirname, '/pages/')
    })
    res.status(200);
})

router.get('/Register', (req, res) => {
    res.render('register', {
        root: path.join(__dirname, '/pages/')
    })
    res.status(200);
})

router.get('/Blog', (req, res) => {
    res.render('blog', {
        root: path.join(__dirname, '/pages/')
    })
    res.status(200);
})

module.exports = router;