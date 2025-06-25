
const mongoose = require('mongoose');
const { type } = require('os');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: false,
    },
    name: {
        type: String,
        required: true,
    },
    isGoogleUser: {
        type: Boolean,
        required: false,
    },
    googleId: {
        type: String,
        required: false,
    }
});

module.exports = mongoose.model('User', userSchema); // Exporting the User model