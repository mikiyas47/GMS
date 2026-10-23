const express = require('express');
const router = express.Router();
const { Member, Membership, Payment, Attendance } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const {
    validateEthiopianPhone,
    validateEmail,
    validateName,
    validateDateOfBirth
} = require('../utils/validators');

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

        // 1. Required fields presence
        if (!first_name || !last_name || !phone) {
            return res.status(400).json({
                success: false,
                message: 'First name, last name, and phone number are required.'
            });
        }

        // 2. Validate first & last names
        const firstNameVal = validateName(first_name, 'First name', true);
        if (!firstNameVal.isValid) {
            return res.status(400).json({ success: false, message: firstNameVal.error });
        }
        const lastNameVal = validateName(last_name, 'Last name', true);
        if (!lastNameVal.isValid) {
            return res.status(400).json({ success: false, message: lastNameVal.error });
        }

        // 3. Validate Ethiopian phone format
        const phoneVal = validateEthiopianPhone(phone);
        if (!phoneVal.isValid) {
            return res.status(400).json({ success: false, message: phoneVal.error });
        }
        const normalizedPhone = phoneVal.normalized;

        // 4. Check duplicate phone number across members
        const existingMemberByPhone = await Member.findOne({ phone: normalizedPhone });
        if (existingMemberByPhone) {
            return res.status(409).json({
                success: false,
                message: `A member with phone number '${normalizedPhone}' is already registered. Duplicate phone numbers are not permitted.`
            });
        }

        // 5. Validate & check duplicate email (if provided)
        let cleanEmail = null;
        if (email && email.trim()) {
            const emailVal = validateEmail(email, false);
            if (!emailVal.isValid) {
                return res.status(400).json({ success: false, message: emailVal.error });
            }
            cleanEmail = emailVal.normalized;

            const existingMemberByEmail = await Member.findOne({ email: cleanEmail });
            if (existingMemberByEmail) {
                return res.status(409).json({
                    success: false,
                    message: `A member with email '${cleanEmail}' is already registered. Duplicate email addresses are not permitted.`
                });
            }
        }

        // 6. Validate Emergency Contact Phone (must be Ethiopian, and distinct from member phone)
        let normalizedEmergPhone = null;
        if (emergency_contact_phone && emergency_contact_phone.trim()) {
            const emergVal = validateEthiopianPhone(emergency_contact_phone);
            if (!emergVal.isValid) {
                return res.status(400).json({
                    success: false,
                    message: `Emergency contact: ${emergVal.error}`
                });
            }
            normalizedEmergPhone = emergVal.normalized;

            if (normalizedEmergPhone === normalizedPhone) {
                return res.status(400).json({
                    success: false,
                    message: 'Emergency contact phone number cannot be the same as the member\'s own phone number.'
                });
            }
        }

        // 7. Validate Date of Birth
        if (date_of_birth) {
            const dobVal = validateDateOfBirth(date_of_birth);
            if (!dobVal.isValid) {
                return res.status(400).json({ success: false, message: dobVal.error });
            }
        }

        // 8. Validate status
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
            phone: normalizedPhone,
            email: cleanEmail,
            date_of_birth: date_of_birth || null,
            gender: gender || null,
            address: address ? address.trim() : null,
            emergency_contact_name: emergency_contact_name ? emergency_contact_name.trim() : null,
            emergency_contact_phone: normalizedEmergPhone,
            notes: notes ? notes.trim() : null,
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

        if (first_name !== undefined) {
            const firstNameVal = validateName(first_name, 'First name', true);
            if (!firstNameVal.isValid) {
                return res.status(400).json({ success: false, message: firstNameVal.error });
            }
            member.first_name = first_name.trim();
        }

        if (last_name !== undefined) {
            const lastNameVal = validateName(last_name, 'Last name', true);
            if (!lastNameVal.isValid) {
                return res.status(400).json({ success: false, message: lastNameVal.error });
            }
            member.last_name = last_name.trim();
        }

        if (phone !== undefined) {
            const phoneVal = validateEthiopianPhone(phone);
            if (!phoneVal.isValid) {
                return res.status(400).json({ success: false, message: phoneVal.error });
            }
            const normalizedPhone = phoneVal.normalized;

            const existingMemberByPhone = await Member.findOne({
                phone: normalizedPhone,
                _id: { $ne: id }
            });

            if (existingMemberByPhone) {
                return res.status(409).json({
                    success: false,
                    message: `Phone number '${normalizedPhone}' is already in use by another member.`
                });
            }

            member.phone = normalizedPhone;
        }

        if (email !== undefined) {
            if (email && email.trim()) {
                const emailVal = validateEmail(email, false);
                if (!emailVal.isValid) {
                    return res.status(400).json({ success: false, message: emailVal.error });
                }
                const cleanEmail = emailVal.normalized;

                const existingMemberByEmail = await Member.findOne({
                    email: cleanEmail,
                    _id: { $ne: id }
                });

                if (existingMemberByEmail) {
                    return res.status(409).json({
                        success: false,
                        message: `Email address '${cleanEmail}' is already in use by another member.`
                    });
                }
                member.email = cleanEmail;
            } else {
                member.email = null;
            }
        }

        if (date_of_birth !== undefined) {
            if (date_of_birth) {
                const dobVal = validateDateOfBirth(date_of_birth);
                if (!dobVal.isValid) {
                    return res.status(400).json({ success: false, message: dobVal.error });
                }
                member.date_of_birth = date_of_birth;
            } else {
                member.date_of_birth = null;
            }
        }

        if (gender !== undefined) member.gender = gender || null;
        if (address !== undefined) member.address = address ? address.trim() : null;
        if (emergency_contact_name !== undefined) member.emergency_contact_name = emergency_contact_name ? emergency_contact_name.trim() : null;

        if (emergency_contact_phone !== undefined) {
            if (emergency_contact_phone && emergency_contact_phone.trim()) {
                const emergVal = validateEthiopianPhone(emergency_contact_phone);
                if (!emergVal.isValid) {
                    return res.status(400).json({
                        success: false,
                        message: `Emergency contact: ${emergVal.error}`
                    });
                }
                const normalizedEmerg = emergVal.normalized;

                if (normalizedEmerg === member.phone) {
                    return res.status(400).json({
                        success: false,
                        message: 'Emergency contact phone number cannot be the same as the member\'s own phone number.'
                    });
                }
                member.emergency_contact_phone = normalizedEmerg;
            } else {
                member.emergency_contact_phone = null;
            }
        }

        if (notes !== undefined) member.notes = notes ? notes.trim() : null;

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
