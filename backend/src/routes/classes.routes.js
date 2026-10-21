const express = require('express');
const router = express.Router();
const { Class, Trainer } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

/**
 * @route   GET /api/classes
 * @desc    Get all classes with trainer details
 * @access  Admin, Receptionist
 */
router.get('/', authorize(['admin', 'receptionist']), async (req, res, next) => {
    try {
        const classes = await Class.find()
            .populate('trainer_id', 'first_name last_name specialization')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: classes.length,
            data: classes.map(c => ({
                id: c._id,
                name: c.name,
                description: c.description,
                durationMinutes: c.duration_minutes,
                trainerId: c.trainer_id ? c.trainer_id._id : null,
                trainer: c.trainer_id ? {
                    id: c.trainer_id._id,
                    name: `${c.trainer_id.first_name} ${c.trainer_id.last_name}`,
                    specialization: c.trainer_id.specialization
                } : null
            }))
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   POST /api/classes
 * @desc    Create a new class
 * @access  Admin
 */
router.post('/', authorize(['admin']), async (req, res, next) => {
    try {
        const { name, description, trainer_id, duration_minutes } = req.body;

        if (!name || !duration_minutes) {
            return res.status(400).json({
                success: false,
                message: 'Class name and duration_minutes are required.'
            });
        }

        if (trainer_id) {
            const trainer = await Trainer.findById(trainer_id);
            if (!trainer) {
                return res.status(400).json({
                    success: false,
                    message: `Trainer with ID ${trainer_id} does not exist.`
                });
            }
        }

        const newClass = await Class.create({
            name: name.trim(),
            description: description || null,
            trainer_id: trainer_id || null,
            duration_minutes: parseInt(duration_minutes, 10)
        });

        res.status(201).json({
            success: true,
            message: 'Class created successfully.',
            data: newClass
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   PUT /api/classes/:id
 * @desc    Update a class
 * @access  Admin
 */
router.put('/:id', authorize(['admin']), async (req, res, next) => {
    try {
        const { id } = req.params;
        const target = await Class.findById(id);

        if (!target) {
            return res.status(404).json({
                success: false,
                message: 'Class not found.'
            });
        }

        const { name, description, trainer_id, duration_minutes } = req.body;

        if (name) target.name = name.trim();
        if (description !== undefined) target.description = description;
        if (trainer_id !== undefined) target.trainer_id = trainer_id || null;
        if (duration_minutes !== undefined) target.duration_minutes = parseInt(duration_minutes, 10);

        await target.save();

        res.json({
            success: true,
            message: 'Class updated successfully.',
            data: target
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   DELETE /api/classes/:id
 * @desc    Delete a class
 * @access  Admin
 */
router.delete('/:id', authorize(['admin']), async (req, res, next) => {
    try {
        const { id } = req.params;
        const target = await Class.findById(id);

        if (!target) {
            return res.status(404).json({
                success: false,
                message: 'Class not found.'
            });
        }

        await Class.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Class deleted successfully.'
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
