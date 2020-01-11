const mongoose = require('mongoose');

const FrontSchema = mongoose.Schema({
    null: {
        type: Boolean,
        default: false
    },
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