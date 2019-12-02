const express = require('express');
const router = express.Router();
const multer = require('multer');
const {validationResult} = require('express-validator');
const {vGallery} = require('./validators/vGallery');

const Gallery = require('../models/Gallery');
const verifySession = require('./helpers/verifySession');
const gHelpers = require('./helpers/galleryHelpers');
const utils = require('./helpers/utils');

upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 1000000 //too low probably
    },
    fileFilter: function (req, file, cb) {
        gHelpers.sanitizeFile(req, file, cb);
    }
}).single('img')

router.get('/', async (req, res) => {
try {
    /*
    const options = {
        page: parseInt(req.query.page, 10) || 1,
        limit: 6,
        sort: { date: -1 }
    }
    var [err, result] = await utils.to(Gallery.paginate({}, options));
    if (err)
        throw new Error("An error occured while fetching galleries");
    var galleries = result.docs; //probably can remove img since we use id and api to load it*/
    return res.status(200).json({"xd": "tru"});
} catch (err) {
    console.log("FETCHING FRONT ERROR:", err);
    return res.status(200).json({error: true, message: err.message})
}})

//sanitize input
router.post('/post', upload, verifySession, vGallery, async (req, res) => {
try {
    if (req.user.level > 1) {
        // Check form inputs validity
        const vResult = validationResult(req);
        if (!vResult.isEmpty()) {
            vResult.errors.forEach((item) => {
               throw new Error(item.msg);
            })}
        const obj = {title: req.body.title, content: req.body.content};// need to sanitize data

        obj.tags = gHelpers.parseTags(req.body.tags);    
        obj.img = await gHelpers.imgEncode(req.file);
    
        const gallery = new Gallery(obj);
        var [err, result] = await utils.to(gallery.save());
        console.log(err)
        if (err)
            throw new Error("Something went wrong while uploading your file");

        req.flash('success', "Item successfully uploaded!");
        return res.status(200).json({url: "/Galerie", msg: "Item successfully uploaded!"});
    } else 
        throw new Error("Unauthorized. Contact your administrator if you think this is a mistake");
} catch (err) {
    console.log("POST GALLERY ERROR", err);
    return res.status(400).json({url: "/", msg: err.message, err: true})
}})

module.exports = router;