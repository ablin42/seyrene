const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const GallerySchema = mongoose.Schema({
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