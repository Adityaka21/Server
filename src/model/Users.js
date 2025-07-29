
const mongoose = require('mongoose');
const { type } = require('os');
const bcrypt = require('bcryptjs');

const subscriptionSchema = new mongoose.Schema({
    id: { type: String },
    status: { type: String },
    start: { type: Date },
    end: { type: Date },
    lastBillDate: { type: Date },
    nextBillDate: { type: Date },
    paymentMade: { type: Number },
    paymentsRemaining: { type: Number },

})

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false },
    isGoogleUser: { type: Boolean, required: false },
    googleId: { type: String, required: false },
    role: { type: String, default: 'admin' },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', index: true },
    credits: { type: Number, default: 0 },
    subscription: { type: subscriptionSchema, default: () => ({}) },
    resetToken: { type: String },
    resetTokenExpiry: { type: Date }


});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next(); // Only hash if password is new or modified

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

module.exports = mongoose.model('User', userSchema); // Exporting the User model