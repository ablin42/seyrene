const express = require("express");
const router = express.Router();
const { validationResult } = require("express-validator");
const { vBlog } = require("./validators/vBlog");
const multer = require("multer");
const path = require('path');
const fs = require('fs');
const rp = require("request-promise");

const Blog = require("../models/Blog");
const Image = require("../models/Image");
const verifySession = require("./helpers/verifySession");
const bHelpers = require("./helpers/blogHelpers");
const gHelpers = require("./helpers/galleryHelpers");
const utils = require("./helpers/utils");

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/img/upload/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
})

upload = multer({
  storage: storage,
  limits: {
    fileSize: 10000000 //too low probably
  },
  fileFilter: function(req, file, cb) {
    gHelpers.sanitizeFile(req, file, cb);
  }
}).array("img");

async function fetchMainImg(blogs) {
  let arr = [];
  for (let i = 0; i < blogs.length; i++) {
    let obj = {
      _id: blogs[i]._id,
      title: blogs[i].title,
      content: blogs[i].content,
      shorttitle: blogs[i].title.substr(0, 128),
      shortcontent: blogs[i].content.substr(0, 512),
      date: blogs[i].date,
      createdAt: blogs[i].createdAt,
      updatedAt: blogs[i].updatedAt,
      author: blogs[i].author,
      __v: blogs[i].__v
    };
    var [err, img] = await utils.to(Image.findOne({_itemId: blogs[i]._id, itemType: "Blog", isMain: true}));
    if (err) 
      throw new Error("An error occurred while fetching the blogs images");
    if (img !== null)
      obj.mainImgId = img._id;
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
    result = await fetchMainImg(result);
    res.status(200).json(result);
  } catch (err) {
    console.log("BLOG FETCH ERROR", err);
    res.status(200).json({ error: true, message: err.message });
  }
});

// get a blog object
router.get("/single/:blogId", async (req, res) => {
  try {
    var [err, blog] = await utils.to(Blog.findById(req.params.blogId));
    if (err)
      throw new Error(
        "An error occurred while fetching the blog's data, please try again"
      );
    if (blog === null) throw new Error("No blog post exist with this ID");
    var blog = await bHelpers.parseBlogs(blog, true);
    return res.status(200).json(blog);
  } catch (err) {
    console.log("ERROR FETCHING A BLOG:", err);
    res.status(200).json({ error: true, message: err.message });
  }
});

// post a blog
router.post("/", upload, verifySession, vBlog, async (req, res) => {
  try {
    if (req.user.level > 1) {
      const obj = {
        //sanitize
        authorId: req.user._id,
        title: req.body.title,
        content: req.body.content
      };
      const formData = {
        title: obj.title,
        content: obj.content
      };
      req.session.formData = formData;

      // Check form inputs validity
      const vResult = validationResult(req);
      if (!vResult.isEmpty()) {
        vResult.errors.forEach(item => {
          req.flash("info", item.msg);
        });
        throw new Error("Incorrect form input");
      }

      const blog = new Blog(obj);
      var [err, savedBlog] = await utils.to(blog.save());
      if (err)
        throw new Error("An error occurred while posting your blog, please try again");

      for (let i = 0; i < req.files.length; i++) {
        let isMain = false;
        if (i === 0) isMain = true;
        let image = new Image({
          _itemId: savedBlog._id,
          itemType: "Blog",
          isMain: isMain,
          mimetype: req.files[i].mimetype
        });
        let oldpath = req.files[i].destination + req.files[i].filename;
        let newpath = req.files[i].destination + image._id + path.extname(req.files[i].originalname);
        fs.rename(oldpath, newpath, (err) => {
          if (err)
            throw new Error(err)
        })
        image.path = newpath;
        var [err, savedImage] = await utils.to(image.save());
        if (err)
          throw new Error("Something went wrong while uploading your image");
      }

      req.flash("success", "Post successfully uploaded");
      res.status(200).redirect(`/Admin/Blog/Patch/${blog._id}`);
    } else
      throw new Error(
        "Unauthorized. Contact your administrator if you think this is a mistake"
      );
  } catch (err) {
    console.log("POST BLOG ERROR", err);
    req.flash("warning", err.message);
    res.status(400).redirect("/Admin/Blog/Post");
  }
});

// patch a blog
router.post(
  "/patch/:blogId",
  upload,
  verifySession,
  vBlog,
  async (req, res) => {
    try {
      if (req.user.level > 1) {
        // Check form inputs validity
        let id = req.params.blogId;
        const vResult = validationResult(req);
        if (!vResult.isEmpty()) {
          vResult.errors.forEach(item => {
            req.flash("info", item.msg);
          });
          throw new Error("Incorrect form input");
        }

        var [err, patchedBlog] = await utils.to(
          Blog.updateOne(
            { _id: id },
            {
              $set: {
                title: req.body.title,
                content: req.body.content
              }
            }
          )
        );
        if (err)
          throw new Error(
            "An error occurred while updating the blog, please try again"
          );

        if (req.files.length > 0) {
          var [err, result] = await utils.to(
            Image.updateMany(
              { _itemId: id, itemType: "Blog", isMain: true },
              { $set: { isMain: false } }
            )
          );
          if (err)
            throw new Error("An error occurred while updating the main image");
          
          for (let i = 0; i < req.files.length; i++) {
            let isMain = false;
            if (i === 0) isMain = true;
            let image = new Image({
              _itemId: id,
              itemType: "Blog",
              isMain: isMain,
              mimetype: req.files[i].mimetype, //oldbinary
          });

          let oldpath = req.files[i].destination + req.files[i].filename;
          let newpath = req.files[i].destination + image._id + path.extname(req.files[i].originalname);
          fs.rename(oldpath, newpath, (err) => {
            if (err)
              throw new Error(err)
          })
          image.path = newpath;

          var [err, savedImage] = await utils.to(image.save());
          if (err)
            throw new Error(
              "Something went wrong while uploading your image"
            );
          }
        }

        req.flash("success", "Post corrigé avec succès");
        res.status(200).redirect(`/Blog/${req.params.blogId}`);
      } else
        throw new Error(
          "Unauthorized. Contact your administrator if you think this is a mistake"
        );
    } catch (err) {
      console.log("PATCH BLOG ERROR", err);
      req.flash("warning", err.message);
      res.status(400).redirect(`/Admin/Blog/Patch/${req.params.blogId}`);
    }
  }
);

// delete a blog
router.get("/delete/:blogId", verifySession, async (req, res) => {
  try {
    if (req.user.level > 1) {
      let blogId = req.params.blogId
      var [err, removedBlog] = await utils.to(
        Blog.deleteOne({ _id: blogId })
      );
      if (err)
        throw new Error("An error occurred while deleting the blog, please try again");
      
        rp(`http://localhost:8089/api/image/Blog/${blogId}`)
        .then(async (response) => {
        parsed = JSON.parse(response);
        for (let i = 0; i < parsed.length; i++) {
          fs.unlink(parsed[i].path, (err) => {
            if (err) throw new Error("An error occurred while deleting your image");
          })
          await Image.deleteOne({ _id: parsed[i]._id });
         }
        })
        .catch((err) => {
          throw new Error("An error occurred while fetching the images");
        });
  
        req.flash("success", "Item successfully deleted!");
        return res.status(200).redirect("/About");
      } else
        throw new Error("Unauthorized. Contact your administrator if you think this is a mistake");
  } catch (err) {
    console.log("DELETE BLOG ERROR", err);
    req.flash("warning", err.message);
    res.status(400).redirect("/About");
  }
});

module.exports = router;
