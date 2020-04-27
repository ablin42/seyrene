const express = require("express");
const router = express.Router();
const multer = require("multer");
const { validationResult } = require("express-validator");
const { vGallery } = require("./validators/vGallery");
const path = require('path');
const fs = require('fs');
const rp = require("request-promise");

const Gallery = require("../models/Gallery");
const Image = require("../models/Image");
const verifySession = require("./helpers/verifySession");
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
    fileSize: 50000000 //too low probably
  },
  fileFilter: function(req, file, cb) {
    gHelpers.sanitizeFile(req, file, cb);
  }
}).array("img");

async function fetchMainImg(galleries) {
  let arr = [];
  for (let i = 0; i < galleries.length; i++) {
    let obj = {
      _id: galleries[i]._id,
      title: galleries[i].title,
      content: galleries[i].content,
      shortcontent: galleries[i].content.substr(0, 128),
      shorttitle: galleries[i].title.substr(0, 64),
      date: galleries[i].date,
      createdAt: galleries[i].createdAt,
      updatedAt: galleries[i].updatedAt,
      tags: galleries[i].tags,
      mainImgId: "",
      __v: galleries[i].__v
    };
    var [err, img] = await utils.to(
      Image.findOne({
        _itemId: galleries[i]._id,
        itemType: "Gallery",
        isMain: true
      })
    );
    if (err || img == null)
      throw new Error("An error occured while fetching the galleries images");
    obj.mainImgId = img._id;
    arr.push(obj);
  }
  return arr;
}

router.get("/", async (req, res) => {
  try {
    const options = {
      page: parseInt(req.query.page, 10) || 1,
      limit: 6,
      sort: { date: -1 }
    };
    var [err, result] = await utils.to(Gallery.paginate({}, options));
    if (err) throw new Error("An error occured while fetching galleries");
    var galleries = result.docs;
    galleries = await fetchMainImg(galleries);

    return res.status(200).json(galleries);
  } catch (err) {
    console.log("FETCHING GALLERIES ERROR:", err);
    return res.status(200).json({ error: true, message: err.message });
  }
});

router.get("/Tags", async (req, res) => {
  try {
    const options = {
      page: parseInt(req.query.page, 10) || 1,
      limit: 6,
      sort: { date: -1 }
    };
    console.log(
      "this is to make sure i notice if there is a problem with tags parameter"
    );
    if (req.query.t) var tagsArr = req.query.t.split(","); //sanitize

    var [err, result] = await utils.to(
      Gallery.paginate({ tags: { $all: tagsArr } }, options)
    );
    if (err)
      throw new Error("An error occured while fetching galleries item by tags");
    var galleries = result.docs;
    if (galleries.length == 0)
      throw new Error("No result found for the selected tags");
    galleries = await fetchMainImg(galleries);
    console.log(galleries);
    return res.status(200).json(galleries);
  } catch (err) {
    console.log("FETCHING GALLERIES BY TAGS ERROR:", err);
    return res.status(200).json({ error: true, message: err.message });
  }
});

//sanitize input
router.post("/post", upload, verifySession, vGallery, async (req, res) => {
  try {
    if (req.user.level > 1) {
      // Check form inputs validity
      const vResult = validationResult(req);
      if (!vResult.isEmpty()) {
        vResult.errors.forEach(item => {
          throw new Error(item.msg);
        });
      }
      const obj = { title: req.body.title, content: req.body.content }; // need to sanitize data

      obj.tags = gHelpers.parseTags(req.body.tags);

      const gallery = new Gallery(obj);
      var [err, result] = await utils.to(gallery.save());
      if (err)
        throw new Error("Something went wrong while uploading your file");
      
      for (let i = 0; i < req.files.length; i++) {
        let isMain = false;
        if (i === 0) isMain = true;
        let image = new Image({
          _itemId: result._id,
          itemType: "Gallery",
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

      req.flash(
        "success",
        "Item successfully uploaded! Remember to select your favorite main image"
      );
      return res
        .status(200)
        .json({
          url: `/Admin/Galerie/Patch/${result._id}`,
          msg:
            "Item successfully uploaded! Remember to select your favorite main image"
        });
    } else
      throw new Error(
        "Unauthorized. Contact your administrator if you think this is a mistake"
      );
  } catch (err) {
    console.log("POST GALLERY ERROR", err);
    return res.status(400).json({ url: "/", msg: err.message, err: true });
  }
});

//sanitize :id (and input)
router.post("/patch/:id", upload, verifySession, vGallery, async (req, res) => {
  try {
    if (req.user.level > 1) {
      // Check form inputs validity
      const vResult = validationResult(req);
      if (!vResult.isEmpty()) {
        vResult.errors.forEach(item => {
          throw new Error(item.msg);
        });
      }
      let id = req.params.id;
      const obj = { title: req.body.title, content: req.body.content }; // need to sanitize data

      obj.tags = gHelpers.parseTags(req.body.tags);

      for (let i = 0; i < req.files.length; i++) {
        let image = new Image({
          _itemId: id,
          itemType: "Gallery",
          isMain: false,
          mimetype: req.files[i].mimetype, 
        });
        let oldpath = req.files[i].destination + req.files[i].filename;
        let newpath = req.files[i].destination + image._id + path.extname(req.files[i].originalname);
        image.path = newpath;
        fs.rename(oldpath, newpath, (err) => {
          if (err)
            throw new Error(err)
        })
        var [err, savedImage] = await utils.to(image.save());
        if (err) {
          console.log(err)
          throw new Error("Something went wrong while uploading your image");
        }
      }

      var [err, result] = await utils.to(
        Gallery.updateOne({ _id: id }, { $set: obj })
      );
      if (err) throw new Error("Something went wrong while updating your file");

      req.flash("success", "Item successfully updated!");
      return res
        .status(200)
        .json({ url: "/Galerie", msg: "Item successfully updated!" });
    } else
      throw new Error(
        "Unauthorized. Contact your administrator if you think this is a mistake"
      );
  } catch (err) {
    console.log("PATCH GALLERY ERROR", err);
    return res.status(400).json({ url: "/", msg: err.message, err: true });
  }
});

//delete item using its id + sanitize :id
router.get("/delete/:id", verifySession, async (req, res) => {
  try {
    if (req.user.level > 1) {
      let id = req.params.id; //sanitize
      var [err, gallery] = await utils.to(Gallery.deleteOne({ _id: id }));
      if (err)
        throw new Error("An error occured while deleting the item, please try again");

      rp(`http://localhost:8089/api/image/Gallery/${id}`)
      .then(async (response) => {
        parsed = JSON.parse(response);
        for (let i = 0; i < parsed.length; i++) {
          fs.unlink(parsed[i].path, (err) => {
            if (err) throw new Error("An error occured while deleting your image");
          })
          await Image.deleteOne({ _id: parsed[i]._id });
        }
      })
      .catch((err) => {
        throw new Error("An error occured while fetching the images");
      });

      req.flash("success", "Item successfully deleted!");
      return res.status(200).redirect("/Galerie");
    } else
      throw new Error(
        "Unauthorized. Contact your administrator if you think this is a mistake"
      );
  } catch (err) {
    console.log("DELETE GALLERY ERROR", err);
    req.flash("warning", err.message);
    res.status(400).redirect(`/Galerie/`);
  }
});

//show all item's id
router.get("/items", async (req, res) => {
  try {
    var [err, result] = await utils.to(Gallery.find());
    if (err) throw new Error("An error occured while fetching galleries");
    const resArray = result.map(element => element._id);

    return res.status(200).json(resArray);
  } catch (err) {
    console.log("GALLERY ITEMS ERROR", err);
    return res.status(400).json(err.message);
  }
});

//sanitize :id
router.get("/single/:id", async (req, res) => {
  try {
    let id = req.params.id;
    var [err, result] = await utils.to(Gallery.findById(id));
    if (err || result === null)
      throw new Error("An error occured while fetching the gallery item");

    res.status(200).json(result);
  } catch (err) {
    console.log("GALLERY SINGLE ERROR", err);
    return res.status(200).json({ error: true, message: err.message });
  }
});

module.exports = router;
