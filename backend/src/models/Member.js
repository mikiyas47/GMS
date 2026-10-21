const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
    first_name: {
        type: String,
        required: true,
        trim: true
    },
    last_name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    date_of_birth: {
        type: String
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        default: null
    },
    address: {
        type: String,
        default: null
    },
    emergency_contact_name: {
        type: String,
        default: null
    },
    emergency_contact_phone: {
        type: String,
        default: null
    },
    notes: {
        type: String,
        default: null
    },
    join_date: {
        type: String,
        default: () => new Date().toISOString().split('T')[0]
    },
    status: {
        type: String,
        enum: ['active', 'frozen', 'expired', 'cancelled'],
        default: 'active'
    },
    registered_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: (doc, ret) => {
            ret.id = ret._id.toString();
            return ret;
        }
    },
    toObject: {
        virtuals: true,
        transform: (doc, ret) => {
            ret.id = ret._id.toString();
            return ret;
        }
    }
});

module.exports = mongoose.model('Member', memberSchema);

