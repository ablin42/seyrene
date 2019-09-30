const express = require('express');
const router = express.Router();
const Gallery = require('../models/Gallery');
const verifyToken = require('./verifyToken');
const {galleryValidation} = require('./joiValidation');
const multer = require('multer');
const fs = require('fs')


router.get('/', async (req, res) => {
    try {
        const options = {
            page: parseInt(req.query.page, 10) || 1,
            limit: 5,
            sort: { date: -1 }
        }
        const result = await Gallery.find();//getBlogs(options);
        res.status(200).json(result);
    } catch (err) {res.status(400).json({message: err})}
})

const upload = multer({ storage: multer.memoryStorage() })

router.post('/post', upload.single('img'), async (req, res) => {//verifyToken
   // if (req.user.level > 1) {
        try {
            const obj = {
                title: req.body.title,
                content: req.body.content,
                tags: JSON.parse(req.body.tags)
            };

            const {error} = await galleryValidation(obj);
            if (error) {
                console.log(error.details[0].message)
                req.flash('warning', error.details[0].message);
                return res.status(400).redirect('/Galerie/Post');
            }

            img = req.file.buffer;
            encode_image = img.toString('base64');
            let imgInfo = {
                data:  Buffer.from(encode_image, 'base64'),
                contentType: req.file.mimetype
            }
            obj.img = imgInfo;
            const gallery = new Gallery(obj);
            await gallery.save();

            req.flash('success', "Item uploadé avec succès");
            return res.status(200).redirect('/Galerie/Post');
        } catch (err) {console.log(err)}

        return res.status(200).send("OK2");   //
   // }
  //  res.status(200).send("UNAUTHORIZED");
})


router.post('/patch/:id', upload.single('img'), async (req, res) => {//verifyToken
      // if (req.user.level > 1) {
        try {
            const obj = {
                title: req.body.title,
                content: req.body.content,
                tags: JSON.parse(req.body.tags)
            };

            const {error} = await galleryValidation(obj);
            if (error) {
                console.log(error.details[0].message)
                req.flash('warning', error.details[0].message);
                return res.status(400).redirect('/Galerie/Post');
            }
            if (req.file) {
                img = req.file.buffer;
                encode_image = img.toString('base64');
                let imgInfo = {
                    data:  Buffer.from(encode_image, 'base64'),
                    contentType: req.file.mimetype
                }
                obj.img = imgInfo;
            }

            await Gallery.updateOne({_id: req.params.id}, {$set: obj});

            req.flash('success', "Item modifié avec succès");
            return res.status(200).redirect('/Galerie');
        } catch (err) {console.log(err)}

        return res.status(200).send("OK2");   //
   // }
  //  res.status(200).send("UNAUTHORIZED");
 })

 router.get('/delete/:id', verifyToken, async (req, res) => {
    if (req.user.level > 1) {
        try {
            const removedGallery = await Gallery.deleteOne({_id: req.params.id});
            req.flash('success', "Item de galerie supprimé avec succès");
            res.status(200).redirect('/Gallerie');
        } catch (err) {res.status(400).json({message: err})}
    } else {
        res.status(200).send("Unauthorized.");//redirect or 404
    }
})

 
router.get('/item', async (req, res) => {
    const result = await Gallery.find()
    const resArray = result.map(element => element._id);
     
    res.send(resArray)
});

router.get('/item/:id', (req, res) => {
    Gallery.findOne({'_id': req.params.id }, (err, result) => {
    if (err) {
        return console.log(err)
    }

    result.img = "";//set it to this so it doesnt fuck rendering of response (buffer)
    res.send(result);
    })
})

router.get('/image/:id', (req, res) => {
    Gallery.findOne({'_id': req.params.id }, (err, result) => {
    if (err) {
        return console.log(err)
    }
    res.set('Content-Type', result.img.contentType)
    res.send(result.img.data);
    })
})

module.exports = router;