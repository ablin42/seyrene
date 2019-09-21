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

router.post('/blog', verifyToken, async (req, res) => {
    if (req.user.level > 1) {
        const blog = new Blog({
            author: req.user.name,
            title: req.body.title,
            content: req.body.content
        });
    
        try {
            const savedBlog = await blog.save();
            res.status(200).json(savedBlog);
        } catch (err) {res.status(400).json({message: err})}
    }
    else {
        res.status(200).send("Unauthorized.");//redirect
    }
})

router.get('/blog/:blogId', async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.blogId);
        res.status(200).json(blog)
    } catch (err) {res.status(400).json({message: err})}
})

router.delete('/blog/:blogId', async (req, res) => {
    try {
        const removedPost = await Post.remove({_id: req.params.postId});
        res.status(200).json(removedPost);
    } catch (err) {res.status(400).json({message: err})}
})

router.patch('/blog/:blogId', async (req, res) => {
    try {
        const patchedPost = await Post.updateOne({_id: req.params.postId}, {$set: {
            title: req.body.title
        }});
        res.status(200).json(patchedPost);
    } catch (err) {res.status(400).json({message: err})}
})

router.get('/:postId', async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        res.status(200).json(post)
    } catch (err) {res.status(400).json({message: err})}
})

router.delete('/:postId', async (req, res) => {
    try {
        const removedPost = await Post.remove({_id: req.params.postId});
        res.status(200).json(removedPost);
    } catch (err) {res.status(400).json({message: err})}
})

router.patch('/:postId', async (req, res) => {
    try {
        const patchedPost = await Post.updateOne({_id: req.params.postId}, {$set: {
            title: req.body.title
        }});
        res.status(200).json(patchedPost);
    } catch (err) {res.status(400).json({message: err})}
})

module.exports = router;