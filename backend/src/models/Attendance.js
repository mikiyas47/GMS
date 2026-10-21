const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    member_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: true
    },
    check_in_time: {
        type: Date,
        default: Date.now,
        required: true
    },
    check_out_time: {
        type: Date,
        default: null
    },
    checked_in_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
});

module.exports = mongoose.model('Attendance', attendanceSchema);
