const express = require('express');
const router = express.Router();
const { Payment, ProductSale, Attendance, Membership, Member } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const { runMembershipExpiryCheck } = require('../jobs/expiryJob');

router.use(authenticate, authorize(['admin']));

/**
 * @route   GET /api/reports/revenue
 * @desc    Comprehensive revenue report (memberships + product sales)
 * @access  Admin
 */
router.get('/revenue', async (req, res, next) => {
    try {
        const { from_date, to_date } = req.query;
        const paymentFilter = {};
        const salesFilter = {};

        if (from_date || to_date) {
            paymentFilter.paid_at = {};
            salesFilter.sold_at = {};
            if (from_date) {
                const start = new Date(`${from_date}T00:00:00.000Z`);
                paymentFilter.paid_at.$gte = start;
                salesFilter.sold_at.$gte = start;
            }
            if (to_date) {
                const end = new Date(`${to_date}T23:59:59.999Z`);
                paymentFilter.paid_at.$lte = end;
                salesFilter.sold_at.$lte = end;
            }
        }

        // Aggregate payments by method
        const paymentStats = await Payment.aggregate([
            { $match: paymentFilter },
            {
                $group: {
                    _id: '$method',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Aggregate product sales
        const productStats = await ProductSale.aggregate([
            { $match: salesFilter },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$total_amount' },
                    total_items: { $sum: '$quantity' },
                    count: { $sum: 1 }
                }
            }
        ]);

        const totalMembershipRevenue = paymentStats.reduce((acc, curr) => acc + (curr.total || 0), 0);
        const totalProductRevenue = productStats.length > 0 ? (productStats[0].total || 0) : 0;
        const totalProductUnitsSold = productStats.length > 0 ? (productStats[0].total_items || 0) : 0;
        const grossRevenue = totalMembershipRevenue + totalProductRevenue;

        // Recent payment transactions
        const recentPayments = await Payment.find()
            .populate('member_id', 'first_name last_name')
            .populate('membership_id', 'plan_name')
            .sort({ paid_at: -1 })
            .limit(10);

        res.json({
            success: true,
            summary: {
                grossRevenue: Number(grossRevenue.toFixed(2)),
                membershipRevenue: Number(totalMembershipRevenue.toFixed(2)),
                productSalesRevenue: Number(totalProductRevenue.toFixed(2)),
                totalProductUnitsSold,
                filter: {
                    fromDate: from_date || null,
                    toDate: to_date || null
                }
            },
            methodBreakdown: paymentStats.map(p => ({
                method: p._id,
                total: Number(p.total.toFixed(2)),
                transactionsCount: p.count
            })),
            recentPayments: recentPayments.map(p => {
                const m = p.member_id || {};
                const ms = p.membership_id || {};
                return {
                    id: p._id,
                    memberName: m.first_name ? `${m.first_name} ${m.last_name}` : 'Unknown',
                    planName: ms.plan_name || 'Membership Payment',
                    amount: p.amount,
                    method: p.method,
                    paidAt: p.paid_at
                };
            })
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/reports/attendance
 * @desc    Gym attendance analytics, peak hours, and check-in counts
 * @access  Admin
 */
router.get('/attendance', async (req, res, next) => {
    try {
        const currentlyInside = await Attendance.find({ check_out_time: null })
            .populate('member_id', 'first_name last_name phone')
            .sort({ check_in_time: 1 });

        const totalLifetimeCheckins = await Attendance.countDocuments();

        // Top active members
        const topMembersAgg = await Attendance.aggregate([
            {
                $group: {
                    _id: '$member_id',
                    checkin_count: { $sum: 1 }
                }
            },
            { $sort: { checkin_count: -1 } },
            { $limit: 10 }
        ]);

        const populatedTop = await Promise.all(topMembersAgg.map(async (t) => {
            const member = await Member.findById(t._id);
            return {
                memberId: t._id,
                memberName: member ? `${member.first_name} ${member.last_name}` : 'Unknown',
                phone: member ? member.phone : null,
                totalVisits: t.checkin_count
            };
        }));

        const recentLogs = await Attendance.find()
            .populate('member_id', 'first_name last_name')
            .populate('checked_in_by', 'full_name')
            .sort({ check_in_time: -1 })
            .limit(15);

        res.json({
            success: true,
            summary: {
                totalLifetimeCheckins,
                currentlyInsideCount: currentlyInside.length
            },
            currentlyInside: currentlyInside.map(c => {
                const m = c.member_id || {};
                return {
                    attendanceId: c._id,
                    memberName: m.first_name ? `${m.first_name} ${m.last_name}` : 'Unknown',
                    memberPhone: m.phone,
                    checkInTime: c.check_in_time
                };
            }),
            topActiveMembers: populatedTop,
            recentActivity: recentLogs.map(r => {
                const m = r.member_id || {};
                return {
                    id: r._id,
                    memberName: m.first_name ? `${m.first_name} ${m.last_name}` : 'Unknown',
                    checkInTime: r.check_in_time,
                    checkOutTime: r.check_out_time,
                    checkedInBy: r.checked_in_by ? r.checked_in_by.full_name : null
                };
            })
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/reports/expiring-memberships
 * @desc    Memberships expiring within the next N days (for renewal reminders)
 * @access  Admin
 */
router.get('/expiring-memberships', async (req, res, next) => {
    try {
        const days = parseInt(req.query.days, 10) || 7;

        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + days);
        const targetDateStr = targetDate.toISOString().split('T')[0];

        const expiring = await Membership.find({
            status: 'active',
            end_date: { $gte: todayStr, $lte: targetDateStr }
        }).populate('member_id').sort({ end_date: 1 });

        res.json({
            success: true,
            windowDays: days,
            count: expiring.length,
            data: expiring.map(ms => {
                const m = ms.member_id || {};
                const endDate = new Date(ms.end_date);
                const diffTime = endDate.getTime() - today.getTime();
                const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

                return {
                    membershipId: ms._id,
                    memberId: m._id,
                    memberName: m.first_name ? `${m.first_name} ${m.last_name}` : 'Unknown',
                    memberPhone: m.phone,
                    memberEmail: m.email,
                    planName: ms.plan_name,
                    price: ms.price,
                    startDate: ms.start_date,
                    endDate: ms.end_date,
                    daysRemaining
                };
            })
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   POST /api/reports/run-expiry-check
 * @desc    Manually trigger membership expiry check job (Admin only)
 * @access  Admin
 */
router.post('/run-expiry-check', async (req, res, next) => {
    try {
        const result = await runMembershipExpiryCheck();
        res.json({
            success: true,
            message: 'Membership expiry check executed successfully.',
            result
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
