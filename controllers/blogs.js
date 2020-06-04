const express = require("express");
const router = express.Router();
const { vBlog } = require("./validators/vBlog");
const rp = require("request-promise");

const Blog = require("../models/Blog");
const verifySession = require("./helpers/verifySession");
const bHelpers = require("./helpers/blogHelpers");
const utils = require("./helpers/utils");

async function formatBlogData(blogs) {
  let arr = [];
  for (let i = 0; i < blogs.length; i++) {
    let images = blogs[i].content.match(/<img src=(["'])(?:(?=(\\?))\2.)*?\1>/)
    let obj = {
      _id: blogs[i]._id,
      title: blogs[i].title,
      content: blogs[i].content,
      shorttitle: blogs[i].title.substr(0, 128),
      shortcontent: blogs[i].content.replace(/<img src=(["'])(?:(?=(\\?))\2.)*?\1>/g, "").substr(0, 512),
      thumbnail: images,
      date: blogs[i].date,
      createdAt: blogs[i].createdAt,
      updatedAt: blogs[i].updatedAt,
      author: blogs[i].author,
      __v: blogs[i].__v
    };
    if (images && images.length > 1)
      obj.thumbnail = images[0]
    arr.push(obj);
  }
  return arr;
}

//blog pagination
router.get("/", async (req, res) => {
try {
  const options = {
    page: parseInt(req.query.page, 10) || 1,
    limit: 6,
    sort: { date: -1 }
  };
  let result = await bHelpers.getBlogs(options);
  result = await formatBlogData(result);

  res.status(200).json(result);
} catch (err) {
  console.log("BLOG FETCH ERROR", err);
  res.status(200).json({ error: true, message: err.message });
}});

// get a blog object
router.get("/single/:blogId", async (req, res) => {
try {
  var [err, blog] = await utils.to(Blog.findById(req.params.blogId));
  if (err)
    throw new Error("An error occurred while fetching the blog's data, please try again");

  if (blog === null) 
    throw new Error("No blog post exist with this ID");
  var blog = await bHelpers.parseBlogs(blog, true);

  return res.status(200).json(blog);
} catch (err) {
  console.log("ERROR FETCHING A BLOG:", err);
  res.status(200).json({ error: true, message: err.message });
}});

// post a blog
router.post("/", verifySession, vBlog, async (req, res) => {
try {
  if (req.user.level > 1) {
    const obj = { //sanitize
      authorId: req.user._id,
      title: req.body.title,
      content: req.body.content
    };
    const formData = {
      title: obj.title,
      content: obj.content
    };
    req.session.formData = formData;

    const blog = new Blog(obj);
    var [err, savedBlog] = await utils.to(blog.save());
    if (err) {
      console.log(err)
      throw new Error("An error occurred while posting your blog, please try again");
    }

    req.flash("success", "Post successfully uploaded");
    res.status(200).redirect(`/Admin/Blog/Patch/${blog._id}`);
  } else
    throw new Error("Unauthorized. Contact your administrator if you think this is a mistake");
} catch (err) {
  console.log("POST BLOG ERROR", err);
  req.flash("warning", err.message);
  res.status(400).redirect("/Admin/Blog/Post");
}});

// patch a blog
router.post("/patch/:blogId", verifySession, vBlog, async (req, res) => {
try {
  if (req.user.level > 1) {
    let id = req.params.blogId;
    const formData = {
      title: req.body.title,
      content: req.body.content
    };
    req.session.formData = formData;

    var [err, patchedBlog] = await utils.to(Blog.updateOne({ _id: id },{$set: {title: req.body.title, content: req.body.content}}));
    if (err)
      throw new Error("An error occurred while updating the blog, please try again");

    req.flash("success", "Post corrigé avec succès");
    res.status(200).redirect(`/Blog/${req.params.blogId}`);
  } else
      throw new Error("Unauthorized. Contact your administrator if you think this is a mistake");
} catch (err) {
  console.log("PATCH BLOG ERROR", err);
  req.flash("warning", err.message);
  res.status(400).redirect(`/Admin/Blog/Patch/${req.params.blogId}`);
}});

// delete a blog
router.get("/delete/:blogId", verifySession, async (req, res) => {
try {
  if (req.user.level > 1) {
    let blogId = req.params.blogId
    var [err, removedBlog] = await utils.to(Blog.deleteOne({ _id: blogId }));

    if (err)
      throw new Error("An error occurred while deleting the blog, please try again");
  
      req.flash("success", "Item successfully deleted!");
      return res.status(200).redirect("/About");
    } else
      throw new Error("Unauthorized. Contact your administrator if you think this is a mistake");
} catch (err) {
  console.log("DELETE BLOG ERROR", err);
  req.flash("warning", err.message);
  res.status(400).redirect("/About");
}});

module.exports = router;
