const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    _userId: { 
        type: String, 
        required: true, 
        ref: 'User' 
    },
    items: {
        type: Array,
        required: true
    },
    price: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    firstname: {
        type: String,
        required: true,
        min: 2,
        max: 128
    },
    lastname: {
        type: String,
        required: true,
        min: 2,
        max: 128
    },
    full_address: {
        type: String,
        required: true
    },
    full_street: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true,
    },
    street_name: {
        type: String,
        required: true,
    },
    street_number: {
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
    instructions: {
        type: String,
    },
    date: {
        type: Date,
        default: Date.now
    },
}, {timestamps: true});

module.exports = mongoose.model('Order', orderSchema);