const express = require('express');
const router = express.Router();
const Gallery = require('../models/Gallery');
const verifyToken = require('./verifyToken');
const {galleryValidation} = require('./joiValidation');

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

router.post('/',  async (req, res) => {//verifyToken
   // if (req.user.level > 1) {
        try {
            const obj = {
                title: req.body.title,
                content: req.body.content,
                imgPath: "/",
                tags: req.body.tags
            };
            const {error} = await galleryValidation(obj);
            if (error) {
                req.flash('warning', error.details[0].message);
                return res.status(400).redirect('/');
            }
            const gallery = new Gallery(obj);
            //await gallery.save();
            req.flash('success', "Item uploadé avec succès");
            return res.status(200).redirect('/Galerie');
        } catch (err) {res.status(400).json({message: err})}

        return res.status(200).send("OK2");   //
   // }
  //  res.status(200).send("UNAUTHORIZED");
})

module.exports = router;