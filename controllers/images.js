const express = require('express');
const router = express.Router();
const fs = require('fs');

const { ROLE, setUser, authUser, authRole, setOrder, authGetOrder } = require('./helpers/verifySession');
const Image = require('../models/Image');
const utils = require('./helpers/utils');

router.get('/:id', async (req, res) => {
try {
    let id = req.params.id;
    var [err, result] = await utils.to(Image.findById(id));
    if (err) 
        throw new Error("An error occurred while fetching the image");
    if (result == null)
        throw new Error("No results were found");

    fs.readFile(result.path, function(err, data) {
        if (err)
            return res.status(400).json({error: true, message: "File couldn't be read"});
        let contentType = { 'Content-Type': result.mimetype };
        res.writeHead(200, contentType);
        res.status(200).end(data);
    });
} catch (err) {
    console.log("IMAGE FETCH ERROR", err);
    return res.status(400).json({error: true, message: err.message});
}})

router.get('/main/:itemType/:itemId', async (req, res) => {
try {
    let id = req.params.itemId,
        itemType = req.params.itemType;

    var [err, result] = await utils.to(Image.findOne({itemType: itemType, _itemId: id, isMain: true}));
    if (err) 
        throw new Error("An error occurred while fetching the image");
    if (result == null)
        throw new Error("No results were found");
            
    fs.readFile(result.path, function(err, data) {
        if (err)
            return res.status(400).json({error: true, message: "File couldn't be read"});
        let contentType = { 'Content-Type': result.mimetype };
        res.writeHead(200, contentType);
        res.status(200).end(data);
    });
} catch (err) {
    console.log("IMAGE FETCH ERROR", err);
    return res.status(400).json(err.message);
}})
 
router.get('/select/:itemType/:itemId/:id', setUser, async (req, res) => {
try {
    if (req.user.level >= 3) {
        let id = req.params.id;
        let itemType = req.params.itemType;
        let itemId = req.params.itemId;
    
        //set old main to false, set new one to true
        var [err, result] = await utils.to(Image.updateMany({_itemId: itemId, itemType: itemType, isMain: true}, {$set: {isMain: false}}));
        if (err) 
            throw new Error("An error occurred while updating the main image");
    
        var [err, result] = await utils.to(Image.findOneAndUpdate({_id: id}, {$set: {isMain: true}}));
        if (err) 
            throw new Error("An error occurred while updating the main image");

        return res.status(200).json({err: false, msg: "New main image successfully selected!"});
    } else 
        throw new Error("Unauthorized. Contact your administrator if you think this is a mistake");
} catch (err) {
    console.log("IMAGE SELECT MAIN ERROR", err);
    return res.status(400).json({err: true, msg: err.message});
}})

router.get('/delete/:id', setUser, async (req, res) => {
try {
    if (req.user.level >= 3) {
        let id = req.params.id;

        var [err, find] = await utils.to(Image.findOne({_id: id}));
        if (err) 
            throw new Error("We could not find your image, please try again");
        
        var [err, result] = await utils.to(Image.deleteOne({ _id: id, isMain: false }));
        if (result.n === 1) {
            fs.unlink(find.path, (err) => {
                if (err) throw new Error("An error occurred while deleting your image");
            })
        }

        if (err) 
            throw new Error("An error occurred while deleting the image0");
        if (result.n === 0) {
            if (find && find.itemType === "Blog") {
                var [err, deleted] = await utils.to(Image.deleteOne({ _id: id }));
                if (deleted.n === 1) {
                    fs.unlink(find.path, (err) => {
                        if (err) throw new Error("An error occurred while deleting your image");
                    })
                }
                if (err) 
                    throw new Error("An error occurred while deleting the image2");
            } else 
                throw new Error("You cannot delete the main image, delete the whole item or add a new image to replace the main image");
        }
           
        return res.status(200).json({err: false, msg: "Image was successfully deleted!"});
    } else 
        throw new Error("Unauthorized. Contact your administrator if you think this is a mistake");
} catch (err) {
    console.log("IMAGE DELETE ERROR", err);
    return res.status(400).json({err: true, msg: err.message});
}})

router.get('/:itemType/:itemId', async (req, res) => {
try {
    let itemId = req.params.itemId,
        itemType = req.params.itemType;
        
    var [err, result] = await utils.to(Image.find({itemType: itemType, _itemId: itemId}).sort({ isMain: -1 }));
    if (err) 
        throw new Error("An error occurred while fetching the image");
    //if (result == null || result.length < 1)
      //  throw new Error("No results were found");

    return res.status(200).json(result);
} catch (err) {
    console.log("IMAGES FETCH ERROR", err);
    return res.status(200).json({error: true, message: err.message});
}})
    
module.exports = router;