const express = require('express');
const router = express.Router();
const verify = require('./verifyToken');

router.get('/', verify, (req, res) => {
    res.status(200).send(req.user);
})

module.exports = router;