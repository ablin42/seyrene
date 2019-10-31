const express = require('express');
const router = express.Router();
const multer = require('multer');
const {validationResult} = require('express-validator');
const {vShop} = require('./validators/vShop');

const Shop = require('../models/Shop');
const verifySession = require('./helpers/verifySession');
const gHelpers = require('./helpers/galleryHelpers'); //////////
//const sHelpers = require('./helpers/shopHelpers');
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

function parsePrice(shopItems) {
let result = [];
for (i = 0; i < shopItems.length; i++) {
    let obj = {
        "_id": shopItems[i]._id,
        "title": shopItems[i].title,
        "content": shopItems[i].content,
        "price": shopItems[i].price,
        "isUnique": shopItems[i].isUnique,
        "date": shopItems[i].date,
        "createdAt": shopItems[i].createdAt,
        "updatedAt": shopItems[i].updatedAt,
        "__v": shopItems[i].__v
    };
    result.push(obj);
}
return result;
}

router.get('/', async (req, res) => {
try {
    const options = {
        page: parseInt(req.query.page, 10) || 1,
        limit: 6,
        sort: { date: -1 }
    }
    let query = {isUnique: true};
    if (req.query.tab === "print")
        query.isUnique = false;
    var [err, result] = await utils.to(Shop.paginate(query, options));
    if (err)
        throw new Error("An error occured while fetching the shop items");
    var shopItems = result.docs; //probably can remove img since we use id and api to load it
    ress = await parsePrice(shopItems);
    return res.status(200).json(ress);
} catch (err) {
    console.log("FETCHING SHOP ERROR:", err);
    return res.status(200).json({error: true, message: err.message})
}})

//sanitize input
router.post('/post', upload, verifySession, vShop, async (req, res) => {
try {
    if (req.user.level > 1) {
        console.log(req.body)
        // Check form inputs validity
        const vResult = validationResult(req);
        if (!vResult.isEmpty()) {
            vResult.errors.forEach((item) => {
               throw new Error(item.msg);
        })}
        const obj = {title: req.body.title, content: req.body.content, isUnique: req.body.isUnique, price: req.body.price};// need to sanitize data
        obj.img = await gHelpers.imgEncode(req.file);
    
        const shop = new Shop(obj);
        var [err, result] = await utils.to(shop.save());
        if (err)
            throw new Error("Something went wrong while uploading your file");

        req.flash('success', "Item successfully uploaded!");
        return res.status(200).json({url: "/Shop", msg: "Item successfully uploaded!"});
    } else 
        throw new Error("Unauthorized. Contact your administrator if you think this is a mistake");
} catch (err) {
    console.log("POST SHOP ERROR", err);
    return res.status(400).json({url: "/", msg: err.message, err: true})
}})

//sanitize :id (and input)
router.post('/patch/:id', upload, verifySession, vShop, async (req, res) => {
try {
    if (req.user.level > 1) {
        // Check form inputs validity
        const vResult = validationResult(req);
        if (!vResult.isEmpty()) {
            vResult.errors.forEach((item) => {
            throw new Error(item.msg);
        })}
        let id = req.params.id;      
        const obj = {title: req.body.title, content: req.body.content, isUnique: req.body.isUnique, price: req.body.price};// need to sanitize data

        if (req.file)
            obj.img = await gHelpers.imgEncode(req.file);
    
        var [err, result] = await utils.to(Shop.updateOne({_id: id}, {$set: obj}));
        if (err)
            throw new Error("Something went wrong while updating your file");

        req.flash('success', "Item successfully updated!");
        return res.status(200).json({url: "/Shop", msg: "Item successfully updated!"});
    } else 
        throw new Error("Unauthorized. Contact your administrator if you think this is a mistake");
} catch (err) {
    console.log("PATCH SHOP ERROR", err);
    return res.status(400).json({url: "/", msg: err.message, err: true})
}})

//delete item using its id + sanitize :id
router.get('/delete/:id', verifySession, async (req, res) => { /////////////////////// HERE
try {
    if (req.user.level > 1) {
        let id = req.params.id; //sanitize
        var [err, shop] = await utils.to(Shop.deleteOne({_id: id}));
        if (err)
            throw new Error("An error occured while deleting the item, please try again");
        req.flash('success', "Item successfully deleted!");
        return res.status(200).redirect('/Shop');
    } else 
        throw new Error("Unauthorized. Contact your administrator if you think this is a mistake");
} catch (err) {
    console.log("DELETE SHOP ERROR", err);
    req.flash('warning', err.message);            
    res.status(400).redirect(`/Shop`);
}})

//show all item's id
router.get('/items', async (req, res) => {
try {
    var [err, result] = await utils.to(Shop.find());
    if (err)
        throw new Error("An error occured while fetching the shop items")
    const resArray = result.map(element => element._id);
     
    return res.status(200).json(resArray);
} catch (err) {
    console.log("SHOP ITEMS ERROR", err);
    return res.status(400).json(err.message)
}});

//sanitize :id
router.get('/single/:id', async (req, res) => {
try {
    let id = req.params.id;
    var [err, result] = await utils.to(Shop.findById(id));
    if (err || result === null) 
        throw new Error("An error occured while fetching the shop item");

    result.img = undefined;//set it to this so it doesnt fuck rendering of response (buffer)
    return res.status(200).json(result);
} catch (err) {
    console.log("SHOP SINGLE ERROR", err);
    return res.status(200).json({error: true, message: err.message})
}})

//sanitize :id
router.get('/image/:id', async (req, res) => {
try {
    let id = req.params.id;
    var [err, result] = await utils.to(Shop.findOne({'_id': id }));
    if (err) 
        throw new Error("An error occured while fetching the image");

    res.set('Content-Type', result.img.contentType)
    return res.status(200).send(result.img.data);
} catch (err) {
    console.log("SHOP IMAGE ERROR", err);
    return res.status(400).json(err.message);
}})

module.exports = router;