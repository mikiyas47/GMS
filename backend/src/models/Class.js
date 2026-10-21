const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: null
    },
    trainer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trainer',
        default: null
    },
    duration_minutes: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Class', classSchema);
