const express = require('express');
const router = express.Router();
const { Membership, Member } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize(['admin', 'receptionist']));

/**
 * @route   GET /api/memberships
 * @desc    List memberships with member details
 * @access  Admin, Receptionist
 */
router.get('/', async (req, res, next) => {
    try {
        const { status, member_id } = req.query;
        const filter = {};

        if (status) filter.status = status;
        if (member_id) filter.member_id = member_id;

        const memberships = await Membership.find(filter)
            .populate('member_id', 'first_name last_name phone email')
            .populate('created_by', 'full_name')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: memberships.length,
            data: memberships.map(ms => {
                const m = ms.member_id || {};
                return {
                    id: ms._id,
                    memberId: m._id,
                    memberName: m.first_name ? `${m.first_name} ${m.last_name}` : 'Unknown',
                    memberPhone: m.phone,
                    memberEmail: m.email,
                    planName: ms.plan_name,
                    price: ms.price,
                    startDate: ms.start_date,
                    endDate: ms.end_date,
                    status: ms.status,
                    frozenFrom: ms.frozen_from,
                    frozenUntil: ms.frozen_until,
                    createdBy: ms.created_by ? {
                        id: ms.created_by._id,
                        name: ms.created_by.full_name
                    } : null,
                    createdAt: ms.created_at
                };
            })
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   POST /api/memberships
 * @desc    Create a new membership for a member
 * @access  Admin, Receptionist
 */
router.post('/', authorize(['admin', 'receptionist']), async (req, res, next) => {
    try {
        const { member_id, plan_name, price, start_date, end_date } = req.body;

        if (!member_id || !plan_name || price === undefined || !start_date || !end_date) {
            return res.status(400).json({
                success: false,
                message: 'member_id, plan_name, price, start_date, and end_date are required.'
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
        const status = (end_date < todayStr) ? 'expired' : 'active';

        const membership = await Membership.create({
            member_id,
            plan_name: plan_name.trim(),
            price: Number(price),
            start_date,
            end_date,
            status,
            created_by: req.user.id
        });

        if (status === 'active') {
            await Member.findByIdAndUpdate(member_id, { status: 'active' });
        }

        res.status(201).json({
            success: true,
            message: 'Membership created successfully.',
            data: membership
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   PATCH /api/memberships/:id/freeze
 * @desc    Freeze an active membership
 * @access  Admin, Receptionist
 */
router.patch('/:id/freeze', async (req, res, next) => {
    try {
        const { id } = req.params;

        const membership = await Membership.findById(id);
        if (!membership) {
            return res.status(404).json({
                success: false,
                message: 'Membership not found.'
            });
        }

        if (membership.status === 'frozen') {
            return res.status(400).json({
                success: false,
                message: 'Membership is already frozen.'
            });
        }

        if (membership.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: `Only active memberships can be frozen. Current status is '${membership.status}'.`
            });
        }

        const todayStr = new Date().toISOString().split('T')[0];

        membership.status = 'frozen';
        membership.frozen_from = todayStr;
        membership.frozen_until = null;
        await membership.save();

        await Member.findByIdAndUpdate(membership.member_id, { status: 'frozen' });

        res.json({
            success: true,
            message: `Membership successfully frozen starting from ${todayStr}.`,
            data: membership
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   PATCH /api/memberships/:id/unfreeze
 * @desc    Unfreeze membership and extend end_date by frozen duration
 * @access  Admin, Receptionist
 */
router.patch('/:id/unfreeze', async (req, res, next) => {
    try {
        const { id } = req.params;

        const membership = await Membership.findById(id);
        if (!membership) {
            return res.status(404).json({
                success: false,
                message: 'Membership not found.'
            });
        }

        if (membership.status !== 'frozen') {
            return res.status(400).json({
                success: false,
                message: `Membership is not frozen (Current status: '${membership.status}').`
            });
        }

        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        // Business Logic: Freezing: when a frozen membership is unfrozen, extend end_date by the number of frozen days.
        const freezeStart = membership.frozen_from ? new Date(membership.frozen_from) : new Date(todayStr);
        const diffMs = Math.max(0, today.getTime() - freezeStart.getTime());
        const frozenDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

        const currentEndDate = new Date(membership.end_date);
        currentEndDate.setDate(currentEndDate.getDate() + frozenDays);
        const newEndDateStr = currentEndDate.toISOString().split('T')[0];

        membership.status = 'active';
        membership.end_date = newEndDateStr;
        membership.frozen_until = todayStr;
        await membership.save();

        await Member.findByIdAndUpdate(membership.member_id, { status: 'active' });

        res.json({
            success: true,
            message: `Membership unfreezed successfully. End date extended by ${frozenDays} day(s) to ${newEndDateStr}.`,
            data: {
                ...membership.toObject(),
                frozenDaysExtended: frozenDays
            }
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
