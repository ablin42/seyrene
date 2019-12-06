const mongoose = require('mongoose');

const ImageSchema = mongoose.Schema({
    _itemId: {
        type: String,
        required: true
    },
    itemType: {
        type: String,
        required: true
    },
    isMain: {
        type: Boolean,
        required: true
    },
    img: {
        data: Buffer,
        contentType: String
    },
    date: {
        type: Date,
        default: Date.now
    }
}, {timestamps: true});

module.exports = mongoose.model('Image', ImageSchema);