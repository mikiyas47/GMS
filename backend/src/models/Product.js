const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true
    },
    stock_qty: {
        type: Number,
        default: 0
    },
    reorder_level: {
        type: Number,
        default: 5
    },
    is_active: {
        type: Boolean,
        default: true
    },
    image_url: {
        type: String,
        default: null
    },
    image: {
        type: String,
        default: null
    },
    category: {
        type: String,
        default: 'Equipment & Gear'
    },
    description: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

productSchema.pre('save', function (next) {
    if (this.image && !this.image_url) {
        this.image_url = this.image;
    } else if (this.image_url && !this.image) {
        this.image = this.image_url;
    }
    if (typeof next === 'function') next();
});


module.exports = mongoose.model('Product', productSchema);
