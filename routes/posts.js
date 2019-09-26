const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const User = require('../models/User');
const verifyToken = require('./verifyToken');
const format = require('date-format');

/*router.get('/updatemongo', async (req, res) => {
    Blog.updateMany({author:"haaaaarb"}, {$unset: {author: ""}}, 
    function(err, num) {
        console.log(num);
    }
);
res.status(200).send("ok")
})*/

router.get('/blog', async (req, res) => {
    try {
        const reqPage = req.query.page || 1;
        const options = {
            page: parseInt(reqPage, 10) || 1,
            limit: 5,
            sort: { date: -1 }
        }
        const result = await Blog.paginate({}, options);
        const blogs = result.docs;
        let blogsParsed = [];

        for await (const item of blogs) {
            await User.findById(item.authorId, (err, elem) => {
                if (err) console.log(err);
                let obj = {
                    _id: item._id,
                    author: elem.name,
                    title: item.title,
                    content: item.content,
                    date: format.asString("Le dd/MM/yy à hh:mm:ss", new Date(item.date)),
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt,
                    __v: 0
                }
                console.log(obj.title)
                blogsParsed.push(obj);
            })
        }
        /*blogs.forEach((item, index) => {
            //search for user name using its id 
            console.log(item.authorId)
            user = User.findById(item.authorId, (err, elem) => {
                let obj = {
                    _id: item._id,
                    author: elem.name,
                    title: item.title,
                    content: item.content,
                    date: format.asString("Le dd/MM/yy à hh:mm:ss", new Date(item.date)),
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt,
                    __v: 0
                }
                console.log(obj.author)
                blogsParsed.push(obj);
            })
        });*/
        res.status(200).json(blogsParsed);
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
            authorId: req.user._id,
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