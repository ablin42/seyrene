const express = require('express');
const router = express.Router();
const Gallery = require('../models/Gallery');
const verifyToken = require('./helpers/verifyToken');
const multer = require('multer');
const gHelpers = require('./helpers/galleryHelpers');

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
        const result = await Gallery.paginate({}, options);
        const galleries = result.docs;
        res.status(200).json(galleries);
    } catch (err) {res.status(400).json({message: err})}
})


//sanitize input
router.post('/post', verifyToken, async (req, res) => {
if (req.user.level > 1) {
    try {
        upload(req, res, async function (err) {
            const obj = {title: req.body.title, content: req.body.content};// need to sanitize data

            let multerCheckErr = gHelpers.multerErr(err);
            if (multerCheckErr.err === true)
                return res.status(400).json(multerCheckErr);

            obj.tags = gHelpers.parseTags(req.body.tags); 
            if (obj.tags.err === true) 
                return res.status(400).json(obj.tags);
         
            validation = gHelpers.validationCheck(obj);
            if (validation.err === true)
                return res.status(400).json(validation);
                
            obj.img = await gHelpers.imgEncode(req.file);
            if (obj.img.err === true)
                return res.status(400).json(obj.img);
        
            try {
                const gallery = new Gallery(obj);
                await gallery.save();
            } catch (err) {return res.status(400).json({url: "/Galerie/Post", msg: "Something went wrong while uploading your file", err: true})}
         
            req.flash('success', "Item successfully uploaded!");
            return res.status(200).json({url: "/Galerie", msg: "Item successfully uploaded!"});
        });
    } catch (err) {return res.status(200).json({url: "/Galerie", msg: "An error occured, please try again", err: true})}
} else {
    req.flash('warning', "Unauthorized. Contact your administrator if you think this is a mistake");
    return res.status(200).json({url: "/Login", error: "Unauthorized. Contact your administrator if you think this is a mistake"});
}})

//sanitize :id (and input)
router.post('/patch/:id', verifyToken, async (req, res) => {
let id = req.params.id;
if (req.user.level > 1) {
    try {
        upload(req, res, async function (err) {
            const obj = {title: req.body.title, content: req.body.content};// need to sanitize data

            let multerCheckErr = gHelpers.multerErr(err);
            if (multerCheckErr.err === true)
                return res.status(400).json(multerCheckErr);

            obj.tags = gHelpers.parseTags(req.body.tags); 
            if (obj.tags.err === true) 
                return res.status(400).json(obj.tags);
            
            validation = gHelpers.validationCheck(obj);
            if (validation.err === true)
                return res.status(400).json(validation);
                 
            if (req.file) {
                obj.img = await gHelpers.imgEncode(req.file);
                if (obj.img.err === true)
                    return res.status(400).json(obj.img);
            }

            try {
                await Gallery.updateOne({_id: id}, {$set: obj});
            } catch (err) {return res.status(400).json({url: "/Galerie/Post", msg: "Something went wrong while updating your file", err: true})}

            req.flash('success', "Item successfully updated!");
            return res.status(200).json({url: "/Galerie", msg: "Item successfully updated!"});
        })
    } catch (err) {return res.status(200).json({url: `/Galerie/Patch/${id}`, msg: "An error occured, please try again", err: true})}
 } else {
    req.flash('warning', "Unauthorized. Contact your administrator if you think this is a mistake");
    return res.status(200).json({url: "/Login", error: "Unauthorized. Contact your administrator if you think this is a mistake"});
}})

//delete item using its id + sanitize :id
router.get('/delete/:id', verifyToken, async (req, res) => {
    let id = req.params.id;
    if (req.user.level > 1) {
        try {
            await Gallery.deleteOne({_id: id});
            req.flash('success', "Item successfully deleted!");
            return res.status(200).redirect('/Galerie');
        } catch (err) {
            req.flash('warning', "An error occured, please retry");            
            res.status(400).redirect(`/Galerie/Patch/${id}`);
        }
    } else {
        req.flash('warning', "Unauthorized. Contact your administrator if you think this is a mistake"); 
        return res.status(200).redirect('/Login');//redirect or 404  
    }
})

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