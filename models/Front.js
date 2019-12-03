const mongoose = require('mongoose');

const FrontSchema = mongoose.Schema({
    referenceId: {
        type: Number,
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

module.exports = mongoose.model('Front', FrontSchema);