const express = require('express');
const router = express.Router();
const { ClassSession, Class } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

const daysMap = {
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
    7: 'Sunday'
};

/**
 * @route   GET /api/sessions
 * @desc    Get all timetable sessions
 * @access  Admin, Receptionist
 */
router.get('/', authorize(['admin', 'receptionist']), async (req, res, next) => {
    try {
        const sessions = await ClassSession.find()
            .populate({
                path: 'class_id',
                populate: { path: 'trainer_id' }
            })
            .sort({ day_of_week: 1, start_time: 1 });

        res.json({
            success: true,
            count: sessions.length,
            data: sessions.map(s => {
                const cls = s.class_id;
                const trainer = cls ? cls.trainer_id : null;
                return {
                    id: s._id,
                    classId: cls ? cls._id : null,
                    className: cls ? cls.name : 'Unknown',
                    durationMinutes: cls ? cls.duration_minutes : null,
                    trainerName: trainer ? `${trainer.first_name} ${trainer.last_name}` : null,
                    dayOfWeek: s.day_of_week,
                    dayName: daysMap[s.day_of_week] || 'Unknown',
                    startTime: s.start_time,
                    endTime: s.end_time,
                    room: s.room,
                    isActive: s.is_active
                };
            })
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   POST /api/sessions
 * @desc    Create a new timetable session
 * @access  Admin
 */
router.post('/', authorize(['admin']), async (req, res, next) => {
    try {
        const { class_id, day_of_week, start_time, end_time, room, is_active = true } = req.body;

        if (!class_id || !day_of_week || !start_time || !end_time) {
            return res.status(400).json({
                success: false,
                message: 'class_id, day_of_week (1-7), start_time, and end_time are required.'
            });
        }

        const dayNum = parseInt(day_of_week, 10);
        if (dayNum < 1 || dayNum > 7) {
            return res.status(400).json({
                success: false,
                message: 'day_of_week must be an integer between 1 (Monday) and 7 (Sunday).'
            });
        }

        const cls = await Class.findById(class_id);
        if (!cls) {
            return res.status(404).json({
                success: false,
                message: 'Class not found.'
            });
        }

        const newSession = await ClassSession.create({
            class_id,
            day_of_week: dayNum,
            start_time,
            end_time,
            room: room || null,
            is_active
        });

        res.status(201).json({
            success: true,
            message: 'Session created successfully.',
            data: newSession
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   PUT /api/sessions/:id
 * @desc    Update a timetable session
 * @access  Admin
 */
router.put('/:id', authorize(['admin']), async (req, res, next) => {
    try {
        const { id } = req.params;
        const target = await ClassSession.findById(id);

        if (!target) {
            return res.status(404).json({
                success: false,
                message: 'Session not found.'
            });
        }

        const { class_id, day_of_week, start_time, end_time, room, is_active } = req.body;

        if (class_id) target.class_id = class_id;
        if (day_of_week !== undefined) target.day_of_week = parseInt(day_of_week, 10);
        if (start_time) target.start_time = start_time;
        if (end_time) target.end_time = end_time;
        if (room !== undefined) target.room = room;
        if (is_active !== undefined) target.is_active = is_active;

        await target.save();

        res.json({
            success: true,
            message: 'Session updated successfully.',
            data: target
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   DELETE /api/sessions/:id
 * @desc    Delete a timetable session
 * @access  Admin
 */
router.delete('/:id', authorize(['admin']), async (req, res, next) => {
    try {
        const { id } = req.params;
        const target = await ClassSession.findById(id);

        if (!target) {
            return res.status(404).json({
                success: false,
                message: 'Session not found.'
            });
        }

        await ClassSession.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Session deleted successfully.'
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
