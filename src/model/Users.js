
const mongoose = require('mongoose');
const { type } = require('os');

const subscriptionSchema = new mongoose.Schema({
    id: {type: String},
    status: {type: String,default: 'pending'},
    start: { type: Date},
    end: {type: Date},
    lastBillDate: {type: Date},
    nextBillDate: {type: Date},
    paymentMade: {type: Number},
    paymentsRemaining: {type: Number},
    
})

const userSchema = new mongoose.Schema({
    name: {type: String,required: true},
    email: {type: String,required: true,unique: true},
    password: {type: String,required: false},
    isGoogleUser: {type: Boolean,required: false},
    googleId: {type: String,required: false},
    role: { type: String,default: 'admin'},
    adminId: {type: mongoose.Schema.Types.ObjectId, ref: 'Users', index: true},
    credits: {type: Number, default: 0},
    subscription : {type: subscriptionSchema, default: ()=> ({}) },

    
});

module.exports = mongoose.model('User', userSchema); // Exporting the User model