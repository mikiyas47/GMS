const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    full_name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true,
        unique: true,
        sparse: true,
        default: null
    },
    password_hash: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'receptionist'],
        required: true
    },
    is_active: {
        type: Boolean,
        default: true
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);
