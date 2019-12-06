const express = require('express');
const router = express.Router();

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
    
router.get('/:itemType/:itemId', async (req, res) => {
try {
    let itemId = req.params.itemId,
        itemType = req.params.itemType;
        
    var [err, result] = await utils.to(Image.find({itemType: itemType, _itemId: itemId}).sort({ isMain: -1 }));
    if (err) 
        throw new Error("An error occured while fetching the image");
    if (result == null || result.length < 1)
        throw new Error("No results were found");

    let arr = [];
    result.forEach(item => {
        console.log(item._id, item.isMain)
    })
    return res.status(200).json(result);
} catch (err) {
    console.log("IMAGES FETCH ERROR", err);
    return res.status(400).json({error: err.message});
}})
    
module.exports = router;