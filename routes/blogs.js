const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const User = require('../models/User');
const verifyToken = require('./verifyToken');
const format = require('date-format');
const {blogValidation} = require('./joiValidation');

/*router.get('/updatemongo', async (req, res) => {
    Blog.updateMany({author:"haaaaarb"}, {$unset: {author: ""}}, 
    function(err, num) {
        console.log(num);
    }
);
res.status(200).send("ok")
})*/

async function getName (authorId) {
    user = await User.findById(authorId, (err, elem) => {})
    return user.name;
}

async function objBlog (item) {
    let obj = {
        _id: item._id,
        author: "",
        title: item.title,
        content: item.content,
        date: format.asString("Le dd/MM/yy à hh:mm:ss", new Date(item.date)),
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        __v: 0
    };
    obj.author = await getName(item.authorId);
    return obj;
}

async function parseBlogs(blogs) {
    let blogsParsed = [];
    for (let item of blogs) {
        let obj = await objBlog(item);
        blogsParsed.push(obj);
    }

    /*blogsParsed.forEach((item, index) => {
        console.log(index, item.author, item.title)
    })*/
    return blogsParsed;
}

async function getBlogs(options) {
    query = await Blog.paginate({}, options).then(async (res) => {
        const blogs = res.docs;
        blogsParsed = await parseBlogs(blogs);
        return blogsParsed;
    })
    return query;
}

router.get('/', async (req, res) => {
    try {
        const options = {
            page: parseInt(req.query.page, 10) || 1,
            limit: 5,
            sort: { date: -1 }
        }
        const result = await getBlogs(options);
        //console.log("return:", result.length)
        res.status(200).json(result);
    } catch (err) {res.status(400).json({message: err})}
})

router.get('/:blogId', async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.blogId);
        res.status(200).json(blog)
    } catch (err) {res.status(400).json({message: err})}
})

router.post('/', verifyToken, async (req, res) => {
    if (req.user.level > 1) {
        const obj = {
            authorId: req.user._id,
            title: req.body.title,
            content: req.body.content
        };
        const {error} = await blogValidation(obj);
        if (error) {
            req.flash('warning', error.details[0].message);
            return res.status(400).redirect('blog-post');
        }
        const blog = new Blog(obj)
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

router.post('/patch/:blogId', verifyToken, async (req, res) => {
    if (req.user.level > 1) {
        try {
            const obj = {
                authorId: req.user._id,
                title: req.body.title,
                content: req.body.content
            };
            const {error} = await blogValidation(obj);
            if (error) {
                req.flash('warning', error.details[0].message);
                return res.status(400).redirect('blog-post');
            }
            const patchedBlog = await Blog.updateOne({_id: req.params.blogId}, {$set: {
                title: req.body.title,
                content: req.body.content
            }});
            req.flash('success', "Post corrigé avec succès");
            res.status(200).redirect('/Blog');
        } catch (err) {res.status(400).json({message: err})}
    }
})

router.get('/delete/:blogId', async (req, res) => {
    try {
        const removedBlog = await Blog.deleteOne({_id: req.params.blogId});
        req.flash('success', "Post supprimé avec succès");
        res.status(200).redirect('/Blog');
    } catch (err) {res.status(400).json({message: err})}
})

module.exports = router;