const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    level: {
        type: Number,
        default: 1
    },
    name: {
        type: String,
        required: true,
        min: 4,
        max: 30
    },
    email: {
        type: String,
        required: true,
        min: 3,
        max: 255
    },
    password: {
        type: String,
        required: true,
        min: 8,
        max: 1024
    },
    date: {
        type: Date,
        default: Date.now
    },
    isVerified: { 
        type: Boolean, 
        default: false
    },
}, {timestamps: true});

module.exports = mongoose.model('User', userSchema);