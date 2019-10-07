const express = require('express');
const router = express.Router();
const multer = require('multer');

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
router.post('/post', verifyToken, async (req, res) => {
try {
    if (req.user.level > 1) {
        upload(req, res, async function (err) {
            try {
                const obj = {title: req.body.title, content: req.body.content};// need to sanitize data
                gHelpers.multerErr(err);
                obj.tags = gHelpers.parseTags(req.body.tags); 
                validation = await gHelpers.validationCheck(obj);
                obj.img = await gHelpers.imgEncode(req.file);
            
                const gallery = new Gallery(obj);
                var [err, result] = await utils.to(gallery.save());
                if (err)
                    throw new Error("Something went wrong while uploading your file");

                req.flash('success', "Item successfully uploaded!");
                return res.status(200).json({url: "/Galerie", msg: "Item successfully uploaded!"});
            } catch (err) {
                console.log("FILE UPLOAD ERROR", err)
                return res.status(400).json({url: "/Galerie/Post", msg: err.message, err: true});
            }});
    } else 
        throw new Error("Unauthorized. Contact your administrator if you think this is a mistake");
} catch (err) {
    console.log("POST GALLERY ERROR", err);
    return res.status(400).json({url: "/", msg: err.message, err: true})
}})

//sanitize :id (and input)
router.post('/patch/:id', verifyToken, async (req, res) => {
try {
    if (req.user.level > 1) {
        let id = req.params.id;        
        upload(req, res, async function (err) {
            try {
                const obj = {title: req.body.title, content: req.body.content};// need to sanitize data
                gHelpers.multerErr(err);
                obj.tags = gHelpers.parseTags(req.body.tags); 
                validation = await gHelpers.validationCheck(obj);
                     
                if (req.file)
                    obj.img = await gHelpers.imgEncode(req.file);

                var [err, result] = await utils.to(Gallery.updateOne({_id: id}, {$set: obj}));
                if (err)
                    throw new Error("Something went wrong while updating your file");
            
                req.flash('success', "Item successfully updated!");
                return res.status(200).json({url: "/Galerie", msg: "Item successfully updated!"});
            } catch (err) {
                console.log("FILE UPLOAD ERROR", err)
                return res.status(400).json({url: "/Galerie/Patch/", msg: err.message, err: true});
            }});
    } else 
        throw new Error("Unauthorized. Contact your administrator if you think this is a mistake");
} catch (err) {
    console.log("PATCH GALLERY ERROR", err);
    return res.status(400).json({url: "/", msg: err.message, err: true})
}})

//delete item using its id + sanitize :id
router.get('/delete/:id', verifyToken, async (req, res) => { /////////////////////// HERE
let id = req.params.id;
try {
    if (req.user.level > 1) {
        await Gallery.deleteOne({_id: id});
        req.flash('success', "Item successfully deleted!");
        return res.status(200).redirect('/Galerie');
    } else {
        req.flash('warning', "Unauthorized. Contact your administrator if you think this is a mistake"); 
        return res.status(200).redirect('/Login');//redirect or 404  
    }
} catch (err) {
    req.flash('warning', "An error occured, please retry");            
    res.status(400).redirect(`/Galerie/Patch/${id}`);
}})

//show all item's id
router.get('/item', async (req, res) => {
    const result = await Gallery.find();
    const resArray = result.map(element => element._id);
     
    return res.status(200).json(resArray);
});

//sanitize :id
router.get('/item/:id', (req, res) => {
    let id = req.params.id;
    Gallery.findOne({'_id': id }, (err, result) => {
    if (err) {
        return console.log(err)
    }

    result.img = undefined;//set it to this so it doesnt fuck rendering of response (buffer)
    return res.status(200).send(result);
    })
})

//sanitize :id
router.get('/image/:id', (req, res) => {
    let id = req.params.id;
    Gallery.findOne({'_id': id }, (err, result) => {
    if (err) {
        return console.log(err)
    }
    res.set('Content-Type', result.img.contentType)
    return res.status(200).send(result.img.data);
    })
})

module.exports = router;