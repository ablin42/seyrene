const express = require('express');
const router = express.Router();
const multer = require('multer');

const Front = require('../models/Front');
const verifySession = require('./helpers/verifySession');
const gHelpers = require('./helpers/galleryHelpers');
const utils = require('./helpers/utils');

upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10000000 //too low probably
    },
    fileFilter: function (req, file, cb) {
        gHelpers.sanitizeFile(req, file, cb);
    }
}).single('img')

router.get('/', async (req, res) => {
try {
    var [err, result] = await utils.to(Front.find());
    if (err)
        throw new Error("An error occured while fetching fronts");
    return res.status(200).json(result);
} catch (err) {
    console.log("FETCHING FRONT ERROR:", err);
    return res.status(200).json({error: true, message: err.message})
}})

//sanitize input
router.post('/post', upload, verifySession, async (req, res) => { //vgallery
try {
    if (req.user.level >= 3) {
        if (req.body.referenceId >= 0 && req.body.referenceId <= 4) {
            let front = {referenceId: req.body.referenceId};
            front.img = await gHelpers.imgEncode(req.file);

            var [err, result] = await utils.to(Front.findOne({referenceId: front.referenceId}));
            if (err || result == null)
                throw new Error("Something went wrong while finding reference for your image");
            
           /* if (result == null) {
                newFront = new Front(front);
                var [err, result] = await utils.to(newFront.save());
                if (err)
                    throw new Error("Something went wrong while uploading your image");
            } else {*/
                var [err, result] = await utils.to(Front.findOneAndUpdate({referenceId: front.referenceId}, {$set: {null: false, img: front.img}}));
                if (err)
                    throw new Error("Something went wrong while updating your image");
           // }
            
            req.flash('success', "Image successfully uploaded!");
            return res.status(200).redirect("/Admin/Front");
            return res.status(200).json({url: "/Admin/Front", msg: "Image successfully uploaded!"});
        } else
            throw new Error("Invalid reference, please try again");
    } else 
        throw new Error("Unauthorized. Contact your administrator if you think this is a mistake");
} catch (err) {
    console.log("POST FRONT ERROR", err);
    return res.status(400).json({url: "/", msg: err.message, err: true})
}})

//delete item using its id + sanitize :id
router.get('/delete/:id', verifySession, async (req, res) => { /////////////////////// HERE
try {
    if (req.user.level >= 3) {
        let id = req.params.id; //sanitize
        var [err, front] = await utils.to(Front.findOneAndUpdate({referenceId: id}, {$set: {null: true}}));
        if (err)
            throw new Error("An error occured while deleting the item, please try again");
        req.flash('success', "Image successfully deleted!");
        return res.status(200).redirect('/Admin/Front');
    } else 
        throw new Error("Unauthorized. Contact your administrator if you think this is a mistake");
} catch (err) {
    console.log("DELETE FRONT ERROR", err);
    req.flash('warning', err.message);            
    res.status(400).redirect(`/Admin/Front`);
}})

//sanitize :id
router.get('/image/:id', async (req, res) => {
try {
    let id = req.params.id;
    var [err, result] = await utils.to(Front.findOne({'_id': id }));
    if (err) 
        throw new Error("An error occured while fetching the image");
    
    res.set('Content-Type', result.img.contentType)
    return res.status(200).send(result.img.data);
} catch (err) {
    console.log("FRONT IMAGE ERROR", err);
    return res.status(400).json(err.message);
}})

module.exports = router;