const { Membership, Member } = require('../models');

/**
 * Business Logic: Expiry job (MongoDB / Mongoose)
 * Sets memberships past end_date to 'expired'
 * Marks the member 'expired' if they have no other active membership.
 */
async function runMembershipExpiryCheck() {
    try {
        const todayStr = new Date().toISOString().split('T')[0];

        // 1. Find all active memberships past end_date
        const expiredMemberships = await Membership.find({
            status: 'active',
            end_date: { $lt: todayStr }
        });

        if (expiredMemberships.length === 0) {
            return {
                expiredMembershipsCount: 0,
                updatedMembersCount: 0,
                checkedDate: todayStr
            };
        }

        // 2. Mark memberships as expired
        await Membership.updateMany(
            { status: 'active', end_date: { $lt: todayStr } },
            { $set: { status: 'expired' } }
        );

        // 3. For each affected member, verify if they have any remaining active memberships
        const memberIds = [...new Set(expiredMemberships.map(m => m.member_id.toString()))];
        let updatedMembersCount = 0;

        for (const memberId of memberIds) {
            const activeMembership = await Membership.findOne({
                member_id: memberId,
                status: 'active',
                end_date: { $gte: todayStr }
            });

            // If no active membership remains, mark member as expired
            if (!activeMembership) {
                const res = await Member.updateOne(
                    { _id: memberId, status: 'active' },
                    { $set: { status: 'expired' } }
                );
                if (res.modifiedCount > 0) {
                    updatedMembersCount++;
                }
            }
        }

        console.log(`[ExpiryJob] Ran membership check for ${todayStr}: marked ${expiredMemberships.length} membership(s) expired, updated ${updatedMembersCount} member(s).`);

        return {
            expiredMembershipsCount: expiredMemberships.length,
            updatedMembersCount,
            checkedDate: todayStr
        };
    } catch (err) {
        console.error('[ExpiryJob] Error executing membership expiry check:', err);
        throw err;
    }
}

/**
 * Initializes the background recurring timer
 */
function startExpiryScheduler(intervalHours = 1) {
    runMembershipExpiryCheck().catch(err => console.error('[ExpiryJob] Initial check error:', err));

    const intervalMs = intervalHours * 60 * 60 * 1000;
    const timer = setInterval(() => {
        runMembershipExpiryCheck().catch(err => console.error('[ExpiryJob] Scheduled check error:', err));
    }, intervalMs);

    return timer;
}

module.exports = {
    runMembershipExpiryCheck,
    startExpiryScheduler
};
