const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    member_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: true
    },
    membership_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Membership',
        default: null
    },
    amount: {
        type: Number,
        required: true
    },
    method: {
        type: String,
        enum: ['cash', 'card', 'mobile_money', 'bank_transfer'],
        required: true
    },
    paid_at: {
        type: Date,
        default: Date.now
    },
    received_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

module.exports = mongoose.model('Payment', paymentSchema);
