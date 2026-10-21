const mongoose = require('mongoose');

const productSaleSchema = new mongoose.Schema({
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    member_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        default: null
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    total_amount: {
        type: Number,
        required: true
    },
    payment_method: {
        type: String,
        enum: ['cash', 'card', 'mobile_money', 'bank_transfer'],
        default: 'cash'
    },
    sold_at: {
        type: Date,
        default: Date.now
    },
    sold_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

module.exports = mongoose.model('ProductSale', productSaleSchema);
