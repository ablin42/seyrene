const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

router.get('/', async (req, res) => {
    try {
        const posts = await Post.find();
        res.status(200).json(posts);
    } catch (err) {res.status(400).json({message: err})}
})

router.get('/:postId', async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        res.status(200).json(post)
    } catch (err) {res.status(400).json({message: err})}
})

router.post('/', async (req, res) => {
    const post = new Post({
        title: req.body.title,
        content: req.body.content
    });

    try {
        const savedPost = await post.save();
        res.status(200).json(savedPost);
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