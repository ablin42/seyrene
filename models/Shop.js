const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const GallerySchema = mongoose.Schema({
    itemId: {
        type: ObjectId,
        required: true,
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    img: {
        data: Buffer,
        contentType: String
    },
    price: {
        type: mongoose.Decimal128,
        required: true
    },
    tags: {
        type: Array
    },
    date: {
        type: Date,
        default: Date.now
    }
}, {timestamps: true});

GallerySchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Gallery', GallerySchema);