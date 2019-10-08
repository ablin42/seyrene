const express = require('express');
const router = express.Router();

const Blog = require('../models/Blog');
const verifyToken = require('./helpers/verifyToken');
const bHelpers = require('./helpers/blogHelpers');
const utils = require('./helpers/utils');
const {blogValidation} = require('./helpers/joiValidation');

//blog pagination
router.get('/', async (req, res) => {
try {
    const options = {
        page: parseInt(req.query.page, 10) || 1,
        limit: 5,
        sort: { date: -1 }
    }
    const result = await bHelpers.getBlogs(options);
    res.status(200).json(result);
} catch (err) {
    console.log("BLOG FETCH ERROR", err)
    res.status(200).json({error: true, message: err.message})
}})

// get a blog object
router.get('/single/:blogId', async (req, res) => {
try {
    var err, blog;
    [err, blog] = await utils.to(Blog.findById(req.params.blogId));
    if (err)
        throw new Error("An error occured while fetching the blog's data, please try again");
    if (blog === null)
        throw new Error("No blog post exist with this ID");
    blog = await bHelpers.parseBlogs(blog, true);
    return res.status(200).json(blog)
} catch (err) {
    console.log("ERROR FETCHING A BLOG:", err);
    res.status(200).json({error: true, message: err.message});
}})

// post a blog
router.post('/', verifyToken, async (req, res) => {
try {
    if (req.user.level > 1) {
        const obj = { //sanitize
            authorId: req.user._id,
            title: req.body.title,
            content: req.body.content
        };
        const {error} = await blogValidation(obj);
        if (error)
            throw new Error(error.message);
        const blog = new Blog(obj);
        var [err, savedBlog] = await utils.to(blog.save());
        if (err)
            throw new Error("An error occured while posting your blog, please try again");
        req.flash('success', "Post successfully uploaded");
        res.status(200).redirect('/Blog');
    }
    else 
        throw new Error("Unauthorized. Contact your administrator if you think this is a mistake");
} catch (err) {
    console.log("POST BLOG ERROR", err);
    req.flash("warning", err.message);
    res.status(400).redirect("/Blog/Post")
}})

// patch a blog
router.post('/patch/:blogId', verifyToken, async (req, res) => {
try {
    if (req.user.level > 1) {
        const obj = { //sanitize
            authorId: req.user._id,
            title: req.body.title,
            content: req.body.content
        };
        const {error} = await blogValidation(obj);
        if (error)
            throw new Error(error.message);
        var [err, patchedBlog] = await utils.to(Blog.updateOne({_id: req.params.blogId}, {$set: {
            title: req.body.title,
            content: req.body.content
        }}));
        if (err)
            throw new Error("An error occured while updating the blog, please try again");
        req.flash('success', "Post corrigé avec succès");
        res.status(200).redirect('/Blog');
    } else 
        throw new Error("Unauthorized. Contact your administrator if you think this is a mistake");
} catch (err) {
    console.log("PATCH BLOG ERROR", err);
    req.flash("warning", err.message);
    res.status(400).redirect(`/Blog/Patch/${req.params.blogId}`);
}})

// delete a blog
router.get('/delete/:blogId', verifyToken, async (req, res) => {
try {
    if (req.user.level > 1) {
        var [err, removedBlog] = await utils.to(Blog.deleteOne({_id: req.params.blogId}));
        if (err)
            throw new Error("An error occured while deleting the blog, please try again");
        req.flash('success', "Post supprimé avec succès");
        res.status(200).redirect('/Blog');
    }
    else
        throw new Error("Unauthorized. Contact your administrator if you think this is a mistake");
} catch (err) {
    console.log("DELETE BLOG ERROR", err);
    req.flash("warning", err.message);
    res.status(400).redirect("/Blog");
}})

module.exports = router;