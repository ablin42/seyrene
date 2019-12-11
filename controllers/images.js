const express = require('express');
const router = express.Router();

const verifySession = require('./helpers/verifySession');
const Image = require('../models/Image');
const utils = require('./helpers/utils');

router.get('/:id', async (req, res) => {
try {
    let id = req.params.id;
    var [err, result] = await utils.to(Image.findById(id));
    if (err) 
        throw new Error("An error occured while fetching the image");
    if (result == null)
        throw new Error("No results were found");
        
    res.set('Content-Type', result.img.contentType)
    return res.status(200).send(result.img.data);
} catch (err) {
    console.log("IMAGE FETCH ERROR", err);
    return res.status(400).json(err.message);
}})

router.get('/main/:itemType/:itemId', async (req, res) => {
try {
    let id = req.params.itemId,
        itemType = req.params.itemType;

    var [err, result] = await utils.to(Image.findOne({itemType: itemType, _itemId: id, isMain: true}));
    if (err) 
        throw new Error("An error occured while fetching the image");
    if (result == null)
        throw new Error("No results were found");
            
    res.set('Content-Type', result.img.contentType)
    return res.status(200).send(result.img.data);
} catch (err) {
    console.log("IMAGE FETCH ERROR", err);
    return res.status(400).json(err.message);
}})
 
router.get('/select/:itemType/:itemId/:id', verifySession, async (req, res) => {
try {
    if (req.user.level >= 3) {
        let id = req.params.id;
        let itemType = req.params.itemType;
        let itemId = req.params.itemId;
    
        //set old main to false, set new one to true
        var [err, result] = await utils.to(Image.updateMany({_itemId: itemId, itemType: itemType, isMain: true}, {$set: {isMain: false}}));
        if (err) 
            throw new Error("An error occured while updating the main image");
    
        var [err, result] = await utils.to(Image.findOneAndUpdate({_id: id}, {$set: {isMain: true}}));
        if (err) 
            throw new Error("An error occured while updating the main image");

        return res.status(200).json({err: false, msg: "New main image successfully selected!"});
    } else 
        throw new Error("Unauthorized. Contact your administrator if you think this is a mistake");
} catch (err) {
    console.log("IMAGE SELECT MAIN ERROR", err);
    return res.status(400).json({err: true, msg: err.message});
}})

router.get('/delete/:id', verifySession, async (req, res) => {
try {
    if (req.user.level >= 3) {
        let id = req.params.id;
    
        var [err, result] = await utils.to(Image.deleteOne({_id: id, isMain: false}));
        if (err) 
            throw new Error("An error occured while deleting the image");
        if (result.n === 0)
            throw new Error("You cannot delete the main image, delete the whole item or add a new image to replace the main image");

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
        throw new Error("An error occured while fetching the image");
    if (result == null || result.length < 1)
        throw new Error("No results were found");

    return res.status(200).json(result);
} catch (err) {
    console.log("IMAGES FETCH ERROR", err);
    return res.status(400).json({error: err.message});
}})
    
module.exports = router;