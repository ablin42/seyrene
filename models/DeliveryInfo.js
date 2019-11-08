const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
    _userId: { 
        type: String, 
        required: true, 
        ref: 'User' 
    },
    fullname: {
        type: String,
        required: true,
        min: 2,
        max: 128
    },
    country: {
        type: String,
        required: true,
    },
    street: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    state: {
        type: String,
        required: true,
    },
    zipcode: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
    },
    instructions: {
        type: String,
    },
    date: {
        type: Date,
        default: Date.now
    },
}, {timestamps: true});

module.exports = mongoose.model('Delivery', deliverySchema);