const express = require('express');
const router = express.Router();
const { Trainer } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize(['admin']));

/**
 * @route   GET /api/trainers
 * @desc    Get all trainers with complete administrative details
 * @access  Admin
 */
router.get('/', async (req, res, next) => {
    try {
        const trainers = await Trainer.find().sort({ createdAt: -1 });

        res.json({
            success: true,
            count: trainers.length,
            data: trainers.map(t => ({
                id: t._id,
                firstName: t.first_name,
                lastName: t.last_name,
                fullName: `${t.first_name} ${t.last_name}`,
                phone: t.phone,
                email: t.email,
                specialization: t.specialization,
                certification: t.certification,
                hireDate: t.hire_date,
                isActive: t.is_active
            }))
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   POST /api/trainers
 * @desc    Create a new trainer
 * @access  Admin
 */
router.post('/', async (req, res, next) => {
    try {
        const {
            first_name,
            last_name,
            phone,
            email,
            specialization,
            certification,
            hire_date,
            is_active = true
        } = req.body;

        if (!first_name || !last_name) {
            return res.status(400).json({
                success: false,
                message: 'First name and last name are required.'
            });
        }

        const trainer = await Trainer.create({
            first_name: first_name.trim(),
            last_name: last_name.trim(),
            phone: phone || null,
            email: email ? email.trim().toLowerCase() : null,
            specialization: specialization || null,
            certification: certification || null,
            hire_date: hire_date || null,
            is_active
        });

        res.status(201).json({
            success: true,
            message: 'Trainer created successfully.',
            data: trainer
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   PUT /api/trainers/:id
 * @desc    Update a trainer
 * @access  Admin
 */
router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const trainer = await Trainer.findById(id);

        if (!trainer) {
            return res.status(404).json({
                success: false,
                message: 'Trainer not found.'
            });
        }

        const {
            first_name,
            last_name,
            phone,
            email,
            specialization,
            certification,
            hire_date,
            is_active
        } = req.body;

        if (first_name) trainer.first_name = first_name.trim();
        if (last_name) trainer.last_name = last_name.trim();
        if (phone !== undefined) trainer.phone = phone;
        if (email !== undefined) trainer.email = email ? email.trim().toLowerCase() : null;
        if (specialization !== undefined) trainer.specialization = specialization;
        if (certification !== undefined) trainer.certification = certification;
        if (hire_date !== undefined) trainer.hire_date = hire_date;
        if (is_active !== undefined) trainer.is_active = is_active;

        await trainer.save();

        res.json({
            success: true,
            message: 'Trainer updated successfully.',
            data: trainer
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   DELETE /api/trainers/:id
 * @desc    Delete a trainer
 * @access  Admin
 */
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const trainer = await Trainer.findById(id);

        if (!trainer) {
            return res.status(404).json({
                success: false,
                message: 'Trainer not found.'
            });
        }

        await Trainer.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Trainer deleted successfully.'
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
