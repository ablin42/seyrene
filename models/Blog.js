const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const BlogSchema = mongoose.Schema({
    authorId: {
        type: String,
        required: true,
        default: "5d8146c171f8b91548a4b6a8"
    },
    author: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
}, {timestamps: true});

BlogSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Blog', BlogSchema);