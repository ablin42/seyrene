const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Blog = require('../models/Blog');
const verifyToken = require('./verifyToken');

router.get('/', async (req, res) => {
    try {
        const posts = await Post.find();
        res.status(200).json(posts);
    } catch (err) {res.status(400).json({message: err})}
})

router.get('/blog', async (req, res) => {
    try {
        const blogs = await Blog.find().sort('-date');
        res.status(200).json(blogs);
    } catch (err) {res.status(400).json({message: err})}
})


router.get('/blog/:blogId', async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.blogId);
        res.status(200).json(blog)
    } catch (err) {res.status(400).json({message: err})}
})

router.post('/blog', verifyToken, async (req, res) => {
    if (req.user.level > 1) {
        const blog = new Blog({
            author: req.user.name,
            title: req.body.title,
            content: req.body.content
        });
    
        try {
            const savedBlog = await blog.save();
            req.flash('success', "Post uploadé avec succès");
            res.status(200).redirect('/Blog');
        } catch (err) {res.status(400).json({message: err})}
    }
    else {
        res.status(200).send("Unauthorized.");//redirect or 404
    }
})

router.post('/blog/patch/:blogId', async (req, res) => {
    try {
        const patchedBlog = await Blog.updateOne({_id: req.params.blogId}, {$set: {
            title: req.body.title,
            content: req.body.content
        }});
        req.flash('success', "Post corrigé avec succès");
        res.status(200).redirect('/Blog');
    } catch (err) {res.status(400).json({message: err})}
})

router.get('/blog/delete/:blogId', async (req, res) => {
    try {
        const removedBlog = await Blog.deleteOne({_id: req.params.blogId});
        req.flash('success', "Post supprimé avec succès");
        res.status(200).redirect('/Blog');
    } catch (err) {res.status(400).json({message: err})}
})

module.exports = router;