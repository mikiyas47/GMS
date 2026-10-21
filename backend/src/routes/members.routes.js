const express = require('express');
const router = express.Router();
const { Member, Membership, Payment, Attendance } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

/**
 * @route   GET /api/members
 * @desc    Get all members with filters and latest membership summary
 * @access  Admin, Receptionist
 */
router.get('/', authorize(['admin', 'receptionist']), async (req, res, next) => {
    try {
        const { search, status } = req.query;
        const filter = {};

        if (status) {
            filter.status = status;
        }

        if (search) {
            const regex = new RegExp(search.trim(), 'i');
            filter.$or = [
                { first_name: regex },
                { last_name: regex },
                { phone: regex },
                { email: regex }
            ];
        }

        const members = await Member.find(filter)
            .populate('registered_by', 'full_name')
            .sort({ createdAt: -1 });

        // Retrieve active membership summary for each member
        const formatted = await Promise.all(members.map(async (m) => {
            const activeMem = await Membership.findOne({
                member_id: m._id,
                status: 'active'
            }).sort({ end_date: -1 });

            return {
                id: m._id,
                firstName: m.first_name,
                lastName: m.last_name,
                fullName: `${m.first_name} ${m.last_name}`,
                phone: m.phone,
                email: m.email,
                dateOfBirth: m.date_of_birth,
                gender: m.gender,
                address: m.address,
                emergencyContactName: m.emergency_contact_name,
                emergencyContactPhone: m.emergency_contact_phone,
                notes: m.notes,
                joinDate: m.join_date,
                status: m.status,
                registeredBy: m.registered_by ? {
                    id: m.registered_by._id,
                    name: m.registered_by.full_name
                } : null,
                currentPlan: activeMem ? activeMem.plan_name : null,
                planEndDate: activeMem ? activeMem.end_date : null
            };
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

/**
 * @route   POST /api/members
 * @desc    Register a new member
 * @access  Admin, Receptionist
 */
router.post('/', authorize(['admin', 'receptionist']), async (req, res, next) => {
    try {
        const {
            first_name,
            last_name,
            phone,
            email,
            date_of_birth,
            gender,
            address,
            emergency_contact_name,
            emergency_contact_phone,
            notes,
            status = 'active'
        } = req.body;

        if (!first_name || !last_name || !phone) {
            return res.status(400).json({
                success: false,
                message: 'First name, last name, and phone number are required.'
            });
        }

        const validStatuses = ['active', 'frozen', 'expired', 'cancelled'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status '${status}'. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        const member = await Member.create({
            first_name: first_name.trim(),
            last_name: last_name.trim(),
            phone: phone.trim(),
            email: email ? email.trim().toLowerCase() : null,
            date_of_birth: date_of_birth || null,
            gender: gender || null,
            address: address || null,
            emergency_contact_name: emergency_contact_name || null,
            emergency_contact_phone: emergency_contact_phone || null,
            notes: notes || null,
            status,
            registered_by: req.user.id
        });

        const memberData = member.toObject ? member.toObject() : member;
        memberData.id = member._id.toString();

        res.status(201).json({
            success: true,
            message: 'Member registered successfully.',
            data: memberData
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/members/:id
 * @desc    Get detailed member profile with memberships, payments, attendance history
 * @access  Admin, Receptionist
 */
router.get('/:id', authorize(['admin', 'receptionist']), async (req, res, next) => {
    try {
        const { id } = req.params;

        const member = await Member.findById(id).populate('registered_by', 'full_name');
        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Member not found.'
            });
        }

        const memberships = await Membership.find({ member_id: id })
            .populate('created_by', 'full_name')
            .sort({ createdAt: -1 });

        const payments = await Payment.find({ member_id: id })
            .populate('received_by', 'full_name')
            .populate('membership_id', 'plan_name')
            .sort({ paid_at: -1 });

        const attendance = await Attendance.find({ member_id: id })
            .populate('checked_in_by', 'full_name')
            .sort({ check_in_time: -1 })
            .limit(50);

        res.json({
            success: true,
            data: {
                ...member.toObject(),
                memberships,
                payments,
                attendance
            }
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   PUT /api/members/:id
 * @desc    Update member details
 * @access  Admin, Receptionist
 */
router.put('/:id', authorize(['admin', 'receptionist']), async (req, res, next) => {
    try {
        const { id } = req.params;
        const member = await Member.findById(id);

        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Member not found.'
            });
        }

        const {
            first_name,
            last_name,
            phone,
            email,
            date_of_birth,
            gender,
            address,
            emergency_contact_name,
            emergency_contact_phone,
            notes,
            status
        } = req.body;

        if (first_name) member.first_name = first_name.trim();
        if (last_name) member.last_name = last_name.trim();
        if (phone) member.phone = phone.trim();
        if (email !== undefined) member.email = email ? email.trim().toLowerCase() : null;
        if (date_of_birth !== undefined) member.date_of_birth = date_of_birth;
        if (gender !== undefined) member.gender = gender;
        if (address !== undefined) member.address = address;
        if (emergency_contact_name !== undefined) member.emergency_contact_name = emergency_contact_name;
        if (emergency_contact_phone !== undefined) member.emergency_contact_phone = emergency_contact_phone;
        if (notes !== undefined) member.notes = notes;
        if (status) {
            const validStatuses = ['active', 'frozen', 'expired', 'cancelled'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid status '${status}'. Must be one of: ${validStatuses.join(', ')}`
                });
            }
            member.status = status;
        }

        await member.save();

        res.json({
            success: true,
            message: 'Member updated successfully.',
            data: member
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   DELETE /api/members/:id
 * @desc    Delete a member
 * @access  Receptionist only
 */
router.delete('/:id', authorize('receptionist'), async (req, res, next) => {
    try {
        const { id } = req.params;

        const member = await Member.findById(id);
        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Member not found.'
            });
        }

        await Member.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Member deleted successfully.'
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
