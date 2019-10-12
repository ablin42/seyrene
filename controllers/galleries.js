const express = require('express');
const router = express.Router();
const multer = require('multer');
const {validationResult} = require('express-validator');
const {vGallery} = require('./validators/vGallery');

const Gallery = require('../models/Gallery');
const verifyToken = require('./helpers/verifyToken');
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
    const options = {
        page: parseInt(req.query.page, 10) || 1,
        limit: 6,
        sort: { date: -1 }
    }
    var [err, result] = await utils.to(Gallery.paginate({}, options));
    if (err)
        throw new Error("An error occured while fetching galleries");
    const galleries = result.docs; //probably can remove img since we use id and api to load it 
    return res.status(200).json(galleries);
} catch (err) {
    console.log("FETCHING GALLERIES ERROR:", err);
    return res.status(200).json({error: true, message: err.message})
}})

//sanitize input
router.post('/post', upload, verifyToken, vGallery, async (req, res) => {
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

        validation = await gHelpers.validationCheck(obj);
        obj.img = await gHelpers.imgEncode(req.file);
    
        const gallery = new Gallery(obj);
        var [err, result] = await utils.to(gallery.save());
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

//sanitize :id (and input)
router.post('/patch/:id', upload, verifyToken, vGallery, async (req, res) => {
try {
    if (req.user.level > 1) {
        // Check form inputs validity
        const vResult = validationResult(req);
        if (!vResult.isEmpty()) {
            vResult.errors.forEach((item) => {
            throw new Error(item.msg);
        })}
        let id = req.params.id;      
        const obj = {title: req.body.title, content: req.body.content};// need to sanitize data

        obj.tags = gHelpers.parseTags(req.body.tags); 
        validation = await gHelpers.validationCheck(obj);
        if (req.file)
            obj.img = await gHelpers.imgEncode(req.file);
    
        //const gallery = new Gallery(obj);
        var [err, result] = await utils.to(Gallery.updateOne({_id: id}, {$set: obj}));
        if (err)
            throw new Error("Something went wrong while updating your file");

        req.flash('success', "Item successfully updated!");
        return res.status(200).json({url: "/Galerie", msg: "Item successfully updated!"});
    } else 
        throw new Error("Unauthorized. Contact your administrator if you think this is a mistake");
} catch (err) {
    console.log("PATCH GALLERY ERROR", err);
    return res.status(400).json({url: "/", msg: err.message, err: true})
}})

//delete item using its id + sanitize :id
router.get('/delete/:id', verifyToken, async (req, res) => { /////////////////////// HERE
try {
    if (req.user.level > 1) {
        let id = req.params.id; //sanitize
        var [err, gallery] = await utils.to(Gallery.deleteOne({_id: id}));
        if (err)
            throw new Error("An error occured while deleting the item, please try again");
        req.flash('success', "Item successfully deleted!");
        return res.status(200).redirect('/Galerie');
    } else 
        throw new Error("Unauthorized. Contact your administrator if you think this is a mistake");
} catch (err) {
    console.log("DELETE GALLERY ERROR", err);
    req.flash('warning', err.message);            
    res.status(400).redirect(`/Galerie/`);
}})

//show all item's id
router.get('/items', async (req, res) => {
try {
    var [err, result] = await utils.to(Gallery.find());
    if (err)
        throw new Error("An error occured while fetching galleries")
    const resArray = result.map(element => element._id);
     
    return res.status(200).json(resArray);
} catch (err) {
    console.log("GALLERY ITEMS ERROR", err);
    return res.status(400).json(err.message)
}});

//sanitize :id
router.get('/single/:id', async (req, res) => {
try {
    let id = req.params.id;
    var [err, result] = await utils.to(Gallery.findById(id));
    if (err || result === null) 
        throw new Error("An error occured while fetching the gallery item");

    result.img = undefined;//set it to this so it doesnt fuck rendering of response (buffer)
    return res.status(200).json(result);
} catch (err) {
    console.log("GALLERY SINGLE ERROR", err);
    return res.status(200).json({error: true, message: err.message})
}})

//sanitize :id
router.get('/image/:id', async (req, res) => {
try {
    let id = req.params.id;
    var [err, result] = await utils.to(Gallery.findOne({'_id': id }));
    if (err) 
        throw new Error("An error occured while fetching the image");

    res.set('Content-Type', result.img.contentType)
    return res.status(200).send(result.img.data);
} catch (err) {
    console.log("GALLERY IMAGE ERROR", err);
    return res.status(400).json(err.message);
}})

module.exports = router;