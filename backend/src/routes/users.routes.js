const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

const { validateEthiopianPhone, validateEmail, validateName, validatePassword } = require('../utils/validators');

router.use(authenticate, authorize(['admin']));

/**
 * @route   GET /api/users
 * @desc    Get all staff accounts (Admin only)
 * @access  Admin
 */
router.get('/', async (req, res, next) => {
    try {
        const users = await User.find().select('-password_hash').sort({ created_at: -1 });

        res.json({
            success: true,
            count: users.length,
            data: users.map(u => ({
                id: u._id,
                fullName: u.full_name,
                email: u.email,
                phone: u.phone || null,
                role: u.role,
                isActive: u.is_active,
                createdAt: u.created_at
            }))
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   POST /api/users
 * @desc    Create a new staff account (Admin only)
 * @access  Admin
 */
router.post('/', async (req, res, next) => {
    try {
        const { full_name, email, phone, password, role } = req.body;

        // 1. Validate required fields
        if (!full_name || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: 'Full name, email, password, and role are required.'
            });
        }

        // 2. Name validation
        const nameVal = validateName(full_name, 'Full name', true);
        if (!nameVal.isValid) {
            return res.status(400).json({ success: false, message: nameVal.error });
        }

        // 3. Email validation
        const emailVal = validateEmail(email, true);
        if (!emailVal.isValid) {
            return res.status(400).json({ success: false, message: emailVal.error });
        }
        const cleanEmail = emailVal.normalized;

        // 4. Password strength validation
        const passVal = validatePassword(password);
        if (!passVal.isValid) {
            return res.status(400).json({ success: false, message: passVal.error });
        }

        // 5. Role validation
        const validRoles = ['admin', 'receptionist'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: `Invalid role '${role}'. Only 'admin' or 'receptionist' are permitted.`
            });
        }

        // 6. Phone validation (Ethiopian phone code)
        let normalizedPhone = null;
        if (phone && phone.trim()) {
            const phoneVal = validateEthiopianPhone(phone);
            if (!phoneVal.isValid) {
                return res.status(400).json({ success: false, message: phoneVal.error });
            }
            normalizedPhone = phoneVal.normalized;

            // Check duplicate phone
            const existingPhone = await User.findOne({ phone: normalizedPhone });
            if (existingPhone) {
                return res.status(409).json({
                    success: false,
                    message: `A staff account with phone number '${normalizedPhone}' already exists. No duplicate phone numbers allowed.`
                });
            }
        }

        // 7. Check duplicate email
        const existingEmail = await User.findOne({ email: cleanEmail });
        if (existingEmail) {
            return res.status(409).json({
                success: false,
                message: `A staff account with email '${cleanEmail}' already exists. No duplicate emails allowed.`
            });
        }

        const password_hash = await bcrypt.hash(password, 10);
        const user = await User.create({
            full_name: full_name.trim(),
            email: cleanEmail,
            phone: normalizedPhone,
            password_hash,
            role,
            is_active: true
        });

        res.status(201).json({
            success: true,
            message: 'Staff account created successfully.',
            data: {
                id: user._id,
                fullName: user.full_name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                isActive: user.is_active
            }
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   PATCH /api/users/:id
 * @desc    Update a staff account (Admin only)
 * @access  Admin
 */
router.patch('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { full_name, email, phone, role, is_active, password } = req.body;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Staff account not found.'
            });
        }

        if (id.toString() === req.user.id.toString() && is_active === false) {
            return res.status(400).json({
                success: false,
                message: 'You cannot deactivate your own active admin account.'
            });
        }

        if (full_name !== undefined) {
            const nameVal = validateName(full_name, 'Full name', true);
            if (!nameVal.isValid) {
                return res.status(400).json({ success: false, message: nameVal.error });
            }
            user.full_name = full_name.trim();
        }

        if (email !== undefined) {
            const emailVal = validateEmail(email, true);
            if (!emailVal.isValid) {
                return res.status(400).json({ success: false, message: emailVal.error });
            }
            const cleanEmail = emailVal.normalized;
            const existing = await User.findOne({ email: cleanEmail, _id: { $ne: id } });
            if (existing) {
                return res.status(409).json({
                    success: false,
                    message: `Email '${cleanEmail}' is already used by another account.`
                });
            }
            user.email = cleanEmail;
        }

        if (phone !== undefined) {
            if (phone && phone.trim()) {
                const phoneVal = validateEthiopianPhone(phone);
                if (!phoneVal.isValid) {
                    return res.status(400).json({ success: false, message: phoneVal.error });
                }
                const normalizedPhone = phoneVal.normalized;
                const existingPhone = await User.findOne({ phone: normalizedPhone, _id: { $ne: id } });
                if (existingPhone) {
                    return res.status(409).json({
                        success: false,
                        message: `Phone number '${normalizedPhone}' is already used by another account.`
                    });
                }
                user.phone = normalizedPhone;
            } else {
                user.phone = null;
            }
        }

        if (role) {
            if (!['admin', 'receptionist'].includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid role '${role}'. Only 'admin' and 'receptionist' are allowed.`
                });
            }
            user.role = role;
        }

        if (is_active !== undefined) {
            user.is_active = is_active;
        }

        if (password) {
            const passVal = validatePassword(password);
            if (!passVal.isValid) {
                return res.status(400).json({ success: false, message: passVal.error });
            }
            user.password_hash = await bcrypt.hash(password, 10);
        }

        await user.save();

        res.json({
            success: true,
            message: 'Staff account updated successfully.',
            data: {
                id: user._id,
                fullName: user.full_name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                isActive: user.is_active,
                createdAt: user.created_at
            }
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete a staff account (Admin only)
 * @access  Admin
 */
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        if (id.toString() === req.user.id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own account.'
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Staff account not found.'
            });
        }

        await User.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Staff account deleted successfully.'
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
