const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

/**
 * @route   POST /api/auth/login
 * @desc    Staff login (Admin or Receptionist)
 * @access  Public
 */
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide both email and password.'
            });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Your account is currently disabled. Please contact an administrator.'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            success: true,
            message: 'Login successful.',
            token,
            user: {
                id: user._id,
                fullName: user.full_name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Staff logout
 * @access  Admin, Receptionist
 */
router.post('/logout', authenticate, (req, res) => {
    res.json({
        success: true,
        message: 'Successfully logged out.'
    });
});

/**
 * @route   GET /api/auth/me
 * @desc    Get currently authenticated staff profile
 * @access  Admin, Receptionist
 */
router.get('/me', authenticate, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('full_name email role is_active created_at');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User profile not found.'
            });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                fullName: user.full_name,
                email: user.email,
                role: user.role,
                isActive: user.is_active,
                createdAt: user.created_at
            }
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
