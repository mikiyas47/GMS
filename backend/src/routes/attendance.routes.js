const express = require('express');
const router = express.Router();
const { Attendance, Member, Membership } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize(['admin', 'receptionist']));

/**
 * @route   GET /api/attendance
 * @desc    Get attendance logs, currently checked-in members, or filtered by date/member
 * @access  Admin, Receptionist
 */
router.get('/', async (req, res, next) => {
    try {
        const { member_id, date, currently_in } = req.query;
        const filter = {};

        if (member_id) filter.member_id = member_id;
        if (currently_in === 'true' || currently_in === '1') {
            filter.check_out_time = null;
        }

        if (date) {
            const start = new Date(`${date}T00:00:00.000Z`);
            const end = new Date(`${date}T23:59:59.999Z`);
            filter.check_in_time = { $gte: start, $lte: end };
        }

        const logs = await Attendance.find(filter)
            .populate('member_id', 'first_name last_name phone')
            .populate('checked_in_by', 'full_name')
            .sort({ check_in_time: -1 });

        res.json({
            success: true,
            count: logs.length,
            data: logs.map(l => {
                const m = l.member_id || {};
                return {
                    id: l._id,
                    memberId: m._id,
                    memberName: m.first_name ? `${m.first_name} ${m.last_name}` : 'Unknown',
                    memberPhone: m.phone,
                    checkInTime: l.check_in_time,
                    checkOutTime: l.check_out_time,
                    isCheckedIn: !l.check_out_time,
                    checkedInBy: l.checked_in_by ? {
                        id: l.checked_in_by._id,
                        name: l.checked_in_by.full_name
                    } : null
                };
            })
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   POST /api/attendance/checkin
 * @desc    Check-in a member (allowed ONLY if member has an active, non-frozen membership)
 * @access  Admin, Receptionist
 */
router.post('/checkin', async (req, res, next) => {
    try {
        const { member_id } = req.body;

        if (!member_id) {
            return res.status(400).json({
                success: false,
                message: 'member_id is required.'
            });
        }

        const member = await Member.findById(member_id);
        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Member not found.'
            });
        }

        const todayStr = new Date().toISOString().split('T')[0];

        // Business Logic: Check-in allowed only if member has an active, non-frozen membership
        if (member.status === 'frozen') {
            return res.status(403).json({
                success: false,
                message: `Check-in denied: Member account is currently FROZEN. Please unfreeze their membership first.`
            });
        }

        if (member.status === 'expired' || member.status === 'cancelled') {
            return res.status(403).json({
                success: false,
                message: `Check-in denied: Member account status is '${member.status}'. An active renewed membership is required.`
            });
        }

        const activeMembership = await Membership.findOne({
            member_id,
            status: 'active',
            start_date: { $lte: todayStr },
            end_date: { $gte: todayStr }
        }).sort({ end_date: -1 });

        if (!activeMembership) {
            return res.status(403).json({
                success: false,
                message: `Check-in denied: Member has no active, valid membership covering today (${todayStr}). Please renew membership.`
            });
        }

        // Verify if already checked in
        const activeSession = await Attendance.findOne({
            member_id,
            check_out_time: null
        }).sort({ check_in_time: -1 });

        if (activeSession) {
            return res.status(400).json({
                success: false,
                message: `Member is already checked in. Please check them out first.`,
                attendanceId: activeSession._id
            });
        }

        const attendance = await Attendance.create({
            member_id,
            check_in_time: new Date(),
            check_out_time: null,
            checked_in_by: req.user.id
        });

        res.status(201).json({
            success: true,
            message: `Check-in successful for ${member.first_name} ${member.last_name}. Active plan: ${activeMembership.plan_name}.`,
            data: {
                ...attendance.toObject(),
                memberName: `${member.first_name} ${member.last_name}`,
                planName: activeMembership.plan_name,
                planEndDate: activeMembership.end_date
            }
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   PATCH /api/attendance/:id/checkout
 * @desc    Check-out a member
 * @access  Admin, Receptionist
 */
router.patch('/:id/checkout', async (req, res, next) => {
    try {
        const { id } = req.params;

        const record = await Attendance.findById(id);
        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Attendance record not found.'
            });
        }

        if (record.check_out_time) {
            return res.status(400).json({
                success: false,
                message: `Member was already checked out.`
            });
        }

        record.check_out_time = new Date();
        await record.save();

        res.json({
            success: true,
            message: 'Check-out successful.',
            data: record
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
