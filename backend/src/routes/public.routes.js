const express = require('express');
const router = express.Router();
const { ClassSession, Product } = require('../models');

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
 * @route   GET /api/public/timetable
 * @desc    Public schedule of active classes and sessions
 * @access  Public
 */
router.get('/timetable', async (req, res, next) => {
    try {
        const sessions = await ClassSession.find({ is_active: true })
            .populate('class_id')
            .sort({ day_of_week: 1, start_time: 1 });

        const formatted = sessions.map(s => {
            const cls = s.class_id;
            return {
                sessionId: s._id,
                dayOfWeek: s.day_of_week,
                dayName: daysMap[s.day_of_week] || 'Unknown',
                startTime: s.start_time,
                endTime: s.end_time,
                room: s.room,
                class: cls ? {
                    id: cls._id,
                    name: cls.name,
                    description: cls.description,
                    durationMinutes: cls.duration_minutes
                } : null
            };
        });

        res.json({
            success: true,
            count: formatted.length,
            data: formatted
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/public/products
 * @desc    Public listing of gym equipments, gear, and products that the gym sells
 * @access  Public
 */
router.get('/products', async (req, res, next) => {
    try {
        const products = await Product.find({ is_active: true })
            .sort({ createdAt: -1 });

        const formatted = products.map(p => ({
            id: p._id,
            name: p.name,
            price: p.price,
            stockQty: p.stock_qty,
            inStock: p.stock_qty > 0,
            imageUrl: p.image_url || null,
            category: p.category || 'Equipment & Gear',
            description: p.description || ''
        }));

        res.json({
            success: true,
            count: formatted.length,
            data: formatted
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
