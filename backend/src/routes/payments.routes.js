const express = require('express');
const router = express.Router();
const { Payment, Member, Membership } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize(['admin', 'receptionist']));

/**
 * @route   GET /api/payments
 * @desc    Get all payment records with member, membership, and staff details
 * @access  Admin, Receptionist
 */
router.get('/', async (req, res, next) => {
    try {
        const { member_id, method, from_date, to_date } = req.query;
        const filter = {};

        if (member_id) filter.member_id = member_id;
        if (method) filter.method = method;
        if (from_date || to_date) {
            filter.paid_at = {};
            if (from_date) filter.paid_at.$gte = new Date(`${from_date}T00:00:00.000Z`);
            if (to_date) filter.paid_at.$lte = new Date(`${to_date}T23:59:59.999Z`);
        }

        const payments = await Payment.find(filter)
            .populate('member_id', 'first_name last_name phone')
            .populate('membership_id', 'plan_name start_date end_date')
            .populate('received_by', 'full_name')
            .sort({ paid_at: -1 });

        res.json({
            success: true,
            count: payments.length,
            data: payments.map(p => {
                const m = p.member_id || {};
                const ms = p.membership_id || {};
                return {
                    id: p._id,
                    memberId: m._id,
                    memberName: m.first_name ? `${m.first_name} ${m.last_name}` : 'Unknown',
                    memberPhone: m.phone,
                    membershipId: ms._id || null,
                    planName: ms.plan_name || 'Direct / Custom',
                    membershipPeriod: ms.start_date ? `${ms.start_date} to ${ms.end_date}` : null,
                    amount: p.amount,
                    method: p.method,
                    paidAt: p.paid_at,
                    receivedBy: p.received_by ? {
                        id: p.received_by._id,
                        name: p.received_by.full_name
                    } : null
                };
            })
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   POST /api/payments
 * @desc    Record payment; creates or renews membership and recalculates end_date
 * @access  Admin, Receptionist
 */
router.post('/', authorize(['admin', 'receptionist']), async (req, res, next) => {
    try {
        const {
            member_id,
            amount,
            method,
            membership_id,
            plan_name,
            duration_months,
            start_date,
            end_date
        } = req.body;

        if (!member_id || amount === undefined || !method) {
            return res.status(400).json({
                success: false,
                message: 'member_id, amount, and payment method are required.'
            });
        }

        if (isNaN(Number(amount)) || Number(amount) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Payment amount must be a valid number greater than zero.'
            });
        }

        const validMethods = ['cash', 'card', 'mobile_money', 'bank_transfer'];
        if (!validMethods.includes(method)) {
            return res.status(400).json({
                success: false,
                message: `Invalid payment method '${method}'. Allowed methods: ${validMethods.join(', ')}`
            });
        }

        const member = await Member.findById(member_id);
        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Member not found.'
            });
        }

        let targetMembershipId = membership_id || null;
        let createdOrRenewedMembership = null;

        // Business Logic: Payment: a paid payment creates or renews the membership and recalculates end_date
        if (plan_name) {
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];

            // Check if member already has an active membership
            const activeMembership = await Membership.findOne({
                member_id,
                status: 'active',
                end_date: { $gte: todayStr }
            }).sort({ end_date: -1 });

            let calcStartDate;
            if (start_date) {
                calcStartDate = new Date(start_date);
            } else if (activeMembership) {
                const currEnd = new Date(activeMembership.end_date);
                currEnd.setDate(currEnd.getDate() + 1);
                calcStartDate = currEnd;
            } else {
                calcStartDate = new Date(today);
            }

            let calcEndDate;
            if (end_date) {
                calcEndDate = new Date(end_date);
            } else {
                let months = duration_months ? parseInt(duration_months, 10) : 1;
                const lowerPlan = plan_name.toLowerCase();
                if (!duration_months) {
                    if (lowerPlan.includes('annual') || lowerPlan.includes('year')) months = 12;
                    else if (lowerPlan.includes('quarter') || lowerPlan.includes('3 month')) months = 3;
                    else if (lowerPlan.includes('semi') || lowerPlan.includes('6 month')) months = 6;
                    else months = 1;
                }

                calcEndDate = new Date(calcStartDate);
                calcEndDate.setMonth(calcEndDate.getMonth() + months);
            }

            const startDateStr = calcStartDate.toISOString().split('T')[0];
            const endDateStr = calcEndDate.toISOString().split('T')[0];

            createdOrRenewedMembership = await Membership.create({
                member_id,
                plan_name: plan_name.trim(),
                price: Number(amount),
                start_date: startDateStr,
                end_date: endDateStr,
                status: 'active',
                created_by: req.user.id
            });

            targetMembershipId = createdOrRenewedMembership._id;
            await Member.findByIdAndUpdate(member_id, { status: 'active' });
        } else if (targetMembershipId) {
            createdOrRenewedMembership = await Membership.findById(targetMembershipId);
            if (createdOrRenewedMembership) {
                await Member.findByIdAndUpdate(member_id, { status: 'active' });
            }
        }

        const newPayment = await Payment.create({
            member_id,
            membership_id: targetMembershipId,
            amount: Number(amount),
            method,
            paid_at: new Date(),
            received_by: req.user.id
        });

        res.status(201).json({
            success: true,
            message: 'Payment recorded successfully.',
            data: {
                payment: newPayment,
                membership: createdOrRenewedMembership
            }
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
