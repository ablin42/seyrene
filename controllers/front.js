const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const Front = require('../models/Front');
const { ROLE, setUser, authUser, authRole, setOrder, authGetOrder } = require('./helpers/verifySession');
const gHelpers = require('./helpers/galleryHelpers');
const utils = require('./helpers/utils');

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
}).single("img");

router.get('/', setUser, async (req, res) => {
try {
    var [err, result] = await utils.to(Front.find());
    if (err)
        throw new Error("An error occurred while fetching fronts");

    return res.status(200).json(result);
} catch (err) {
    console.log("FETCHING FRONT ERROR:", err);
    return res.status(200).json({error: true, message: err.message})
}})

//sanitize input
router.post('/post', upload, setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => { //vgallery
try {
    if (req.body.referenceId >= 0 && req.body.referenceId <= 4) {
        let front = {null: false, referenceId: req.body.referenceId};

        var [err, result] = await utils.to(Front.findOne({ referenceId: front.referenceId }));
        if (err)
                throw new Error("Something went wrong while finding reference for your image");
            
        if (result === null) {
            newFront = new Front(front);
            newFront.mimetype = req.file.mimetype;
            let oldpath = req.file.destination + req.file.filename;
            let newpath = req.file.destination + newFront._id + path.extname(req.file.originalname);
            fs.rename(oldpath, newpath, (err) => {
                if (err)
                  throw new Error(err)
            })
            newFront.path = newpath;

            var [err, result] = await utils.to(newFront.save());
            if (err)
                throw new Error("Something went wrong while uploading your image");
        } else {   
            let oldpath = req.file.destination + req.file.filename;
            let newpath = req.file.destination + result._id + path.extname(req.file.originalname);
            fs.rename(oldpath, newpath, (err) => {
                if (err)
                    throw new Error(err)
            })
            var [err, result] = await utils.to(Front.findOneAndUpdate({referenceId: front.referenceId}, {$set: {null: false, path: newpath, mimetype: req.file.mimetype}}));
            if (err)
                throw new Error("Something went wrong while updating your image");
        }
        return res.status(200).json({msg: "Image successfully uploaded!"});
    } else
        throw new Error("Invalid reference, please try again");
} catch (err) {
    console.log("POST FRONT ERROR", err);
    return res.status(400).json({err: true, msg: err.message});
}})

//delete item using its id + sanitize :id
router.get('/delete/:id', setUser, authUser, authRole(ROLE.ADMIN), async (req, res) => { /////////////////////// HERE
try {
    let id = req.params.id; //sanitize
    var [err, front] = await utils.to(Front.findOneAndUpdate({ referenceId: id }, { $set: { null: true } }));
    if (err)
        throw new Error("An error occurred while deleting the item, please try again");
    fs.unlink(front.path, (err) => {
        if (err) throw new Error("An error occurred while deleting your image");
    })
    return res.status(200).json({msg: "Image successfully deleted!"});
} catch (err) {
    console.log("DELETE FRONT ERROR", err);
    return res.status(400).json({err: true, msg: err.message});
}})

//sanitize :id
router.get('/image/:id', setUser, async (req, res) => {
try {
    let id = req.params.id;

    var [err, result] = await utils.to(Front.findOne({'_id': id }));
    if (err) 
        throw new Error("An error occurred while fetching the image");

    fs.readFile(result.path, function(err, data) {
        if (err)
            throw new Error("File couldn't be read");
        let contentType = { 'Content-Type': result.mimetype };
        
        res.writeHead(200, contentType);
        return res.status(200).end(data);
    });
} catch (err) {
    console.log("FRONT IMAGE ERROR", err);
    return res.status(400).json(err.message);
}})

module.exports = router;