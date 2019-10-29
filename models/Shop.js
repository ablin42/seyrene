const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const ShopSchema = mongoose.Schema({
    isUnique: {
        type: Boolean,
        default: false
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
    date: {
        type: Date,
        default: Date.now
    }
}, {timestamps: true});

ShopSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Shop', ShopSchema);