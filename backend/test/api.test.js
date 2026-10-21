/**
 * Comprehensive Automated Test Suite for Gym Management System Backend
 */
const http = require('http');
const app = require('../src/app');
const { connectDB } = require('../src/config/db');

let server;
let baseUrl;

function request(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, baseUrl);
        const options = {
            method,
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(data);
                } catch (e) {
                    parsed = data;
                }
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: parsed
                });
            });
        });

        req.on('error', reject);

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function runTests() {
    console.log('🧪 Starting Gym Management System Backend Tests...\n');

    await connectDB();

    await new Promise((resolve) => {
        server = app.listen(0, () => {
            const port = server.address().port;
            baseUrl = `http://localhost:${port}`;
            console.log(`📡 Test server running on ${baseUrl}\n`);
            resolve();
        });
    });

    let passed = 0;
    let failed = 0;

    function assert(condition, message) {
        if (condition) {
            console.log(`  ✅ PASS: ${message}`);
            passed++;
        } else {
            console.error(`  ❌ FAIL: ${message}`);
            failed++;
        }
    }

    try {
        // --- 1. Public Endpoints ---
        console.log('--- Testing Public Endpoints ---');
        const timetableRes = await request('GET', '/api/public/timetable');
        assert(timetableRes.status === 200 && timetableRes.body.success, 'GET /api/public/timetable returns 200 OK');
        assert(Array.isArray(timetableRes.body.data), 'Timetable returns list of sessions');

        const trainersRes = await request('GET', '/api/public/trainers');
        assert(trainersRes.status === 200 && trainersRes.body.success, 'GET /api/public/trainers returns 200 OK');
        assert(trainersRes.body.data.length > 0, 'Public trainers returns at least 1 trainer');
        const firstTrainer = trainersRes.body.data[0];
        assert(
            firstTrainer.firstName !== undefined &&
            firstTrainer.specialization !== undefined &&
            firstTrainer.phone === undefined &&
            firstTrainer.email === undefined,
            'Public trainers contains safe fields only (no phone, no email)'
        );

        // --- 2. Auth Endpoints ---
        console.log('\n--- Testing Authentication & Authorization ---');
        // Invalid login
        const badLogin = await request('POST', '/api/auth/login', { email: 'admin@gym.com', password: 'WrongPassword' });
        assert(badLogin.status === 401, 'Invalid password returns 401 Unauthorized');

        // Admin login
        const adminLogin = await request('POST', '/api/auth/login', { email: 'admin@gym.com', password: 'Admin@123' });
        assert(adminLogin.status === 200 && adminLogin.body.token, 'Admin login succeeds with JWT');
        const adminToken = adminLogin.body.token;

        // Receptionist login
        const recLogin = await request('POST', '/api/auth/login', { email: 'reception@gym.com', password: 'Reception@123' });
        assert(recLogin.status === 200 && recLogin.body.token, 'Receptionist login succeeds with JWT');
        const recToken = recLogin.body.token;

        // /api/auth/me
        const meRes = await request('GET', '/api/auth/me', null, { Authorization: `Bearer ${adminToken}` });
        assert(meRes.status === 200 && meRes.body.user.role === 'admin', 'GET /api/auth/me returns admin profile');

        // --- 3. Staff Accounts Management (Admin only) ---
        console.log('\n--- Testing Staff Accounts Management ---');
        // Receptionist attempting to view staff accounts should be forbidden (403)
        const recStaffAccess = await request('GET', '/api/users', null, { Authorization: `Bearer ${recToken}` });
        assert(recStaffAccess.status === 403, 'Receptionist is forbidden from accessing /api/users (403)');

        // Admin creating staff account
        const newStaffEmail = `staff_${Date.now()}@gym.com`;
        const createStaffRes = await request('POST', '/api/users', {
            full_name: 'John FrontDesk',
            email: newStaffEmail,
            password: 'StaffPassword@123',
            role: 'receptionist'
        }, { Authorization: `Bearer ${adminToken}` });
        assert(createStaffRes.status === 201, 'Admin can create receptionist account');

        // --- 4. Members CRUD ---
        console.log('\n--- Testing Members Management ---');
        const newMemberRes = await request('POST', '/api/members', {
            first_name: 'Diana',
            last_name: 'Prince',
            phone: '+1-555-7788',
            email: 'diana@themyscira.com',
            gender: 'female',
            status: 'active'
        }, { Authorization: `Bearer ${recToken}` });
        assert(newMemberRes.status === 201, 'Receptionist can register new member');
        const newMemberId = newMemberRes.body.data.id;

        // Get members list
        const membersList = await request('GET', '/api/members?search=Diana', null, { Authorization: `Bearer ${recToken}` });
        assert(membersList.status === 200 && membersList.body.data.length > 0, 'Can search and list members');

        // Member detail
        const memberDetail = await request('GET', `/api/members/${newMemberId}`, null, { Authorization: `Bearer ${recToken}` });
        assert(memberDetail.status === 200 && memberDetail.body.data.id === newMemberId, 'Can get member details');

        // --- 5. Attendance Check-in Business Logic ---
        console.log('\n--- Testing Check-in Business Logic ---');
        // Member has no active membership yet -> Check-in MUST be rejected!
        const checkinNoPlan = await request('POST', '/api/attendance/checkin', {
            member_id: newMemberId
        }, { Authorization: `Bearer ${recToken}` });
        assert(checkinNoPlan.status === 403, 'Check-in denied when member has no active membership (403)');

        // Create active membership for member
        const today = new Date().toISOString().split('T')[0];
        const nextMonth = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0];
        const createMemRes = await request('POST', '/api/memberships', {
            member_id: newMemberId,
            plan_name: 'Monthly Standard',
            price: 60.00,
            start_date: today,
            end_date: nextMonth
        }, { Authorization: `Bearer ${recToken}` });
        assert(createMemRes.status === 201, 'Active membership created for member');
        const membershipId = createMemRes.body.data.id;

        // Check-in should now succeed!
        const checkinSuccess = await request('POST', '/api/attendance/checkin', {
            member_id: newMemberId
        }, { Authorization: `Bearer ${recToken}` });
        assert(checkinSuccess.status === 201, 'Check-in successful with active membership');
        const attendanceId = checkinSuccess.body.data.id;

        // Checkout
        const checkoutRes = await request('PATCH', `/api/attendance/${attendanceId}/checkout`, null, { Authorization: `Bearer ${recToken}` });
        assert(checkoutRes.status === 200 && checkoutRes.body.data.check_out_time, 'Checkout successful with timestamp');

        // --- 6. Freezing & Unfreezing Business Logic ---
        console.log('\n--- Testing Freezing & Unfreezing Business Logic ---');
        // Freeze membership
        const freezeRes = await request('PATCH', `/api/memberships/${membershipId}/freeze`, null, { Authorization: `Bearer ${recToken}` });
        assert(freezeRes.status === 200 && freezeRes.body.data.status === 'frozen', 'Membership successfully frozen');

        // Check-in during frozen state MUST be rejected!
        const checkinFrozen = await request('POST', '/api/attendance/checkin', {
            member_id: newMemberId
        }, { Authorization: `Bearer ${recToken}` });
        assert(checkinFrozen.status === 403, 'Check-in denied when membership is frozen');

        // Unfreeze membership -> end_date extended
        const unfreezeRes = await request('PATCH', `/api/memberships/${membershipId}/unfreeze`, null, { Authorization: `Bearer ${recToken}` });
        assert(unfreezeRes.status === 200 && unfreezeRes.body.data.status === 'active', 'Membership unfreezed and extended');

        // --- 7. Payment & Membership Renewal Business Logic ---
        console.log('\n--- Testing Payment & Membership Renewal ---');
        const paymentRes = await request('POST', '/api/payments', {
            member_id: newMemberId,
            amount: 550.00,
            method: 'card',
            plan_name: 'Annual VIP'
        }, { Authorization: `Bearer ${recToken}` });
        assert(paymentRes.status === 201 && paymentRes.body.data.membership, 'Payment creates and renews membership');

        // --- 8. Product Sales & Stock Business Logic ---
        console.log('\n--- Testing Products & Sales Business Logic ---');
        // Get products
        const productsList = await request('GET', '/api/products', null, { Authorization: `Bearer ${recToken}` });
        assert(productsList.status === 200 && productsList.body.data.length > 0, 'Can retrieve product catalog');
        const testProduct = productsList.body.data[0];
        const initialStock = testProduct.stockQty;

        // Sell 1 item
        const saleRes = await request('POST', '/api/product-sales', {
            product_id: testProduct.id,
            member_id: newMemberId,
            quantity: 1
        }, { Authorization: `Bearer ${recToken}` });
        assert(saleRes.status === 201, 'Product sale completed successfully');
        assert(saleRes.body.data.remainingStock === initialStock - 1, 'Stock quantity decremented on sale');

        // Try to buy excessive stock -> must fail
        const badSale = await request('POST', '/api/product-sales', {
            product_id: testProduct.id,
            member_id: newMemberId,
            quantity: 99999
        }, { Authorization: `Bearer ${recToken}` });
        assert(badSale.status === 400, 'Sale rejected when stock is insufficient (400)');

        // --- 9. Reports (Admin only) ---
        console.log('\n--- Testing Administrative Reports ---');
        // Receptionist blocked from reports
        const recReportAccess = await request('GET', '/api/reports/revenue', null, { Authorization: `Bearer ${recToken}` });
        assert(recReportAccess.status === 403, 'Receptionist blocked from accessing reports (403)');

        // Admin can access revenue report
        const revReport = await request('GET', '/api/reports/revenue', null, { Authorization: `Bearer ${adminToken}` });
        assert(revReport.status === 200 && revReport.body.summary.grossRevenue >= 0, 'Admin can view revenue report');

        // Admin attendance analytics
        const attReport = await request('GET', '/api/reports/attendance', null, { Authorization: `Bearer ${adminToken}` });
        assert(attReport.status === 200 && attReport.body.summary !== undefined, 'Admin can view attendance analytics');

        // Admin expiring memberships report
        const expReport = await request('GET', '/api/reports/expiring-memberships?days=365', null, { Authorization: `Bearer ${adminToken}` });
        assert(expReport.status === 200 && Array.isArray(expReport.body.data), 'Admin can view expiring memberships');

        // Run expiry check
        const expiryJobRes = await request('POST', '/api/reports/run-expiry-check', null, { Authorization: `Bearer ${adminToken}` });
        assert(expiryJobRes.status === 200 && expiryJobRes.body.success, 'Admin can trigger membership expiry job');

        console.log(`\n========================================`);
        console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
        console.log(`========================================\n`);

    } catch (err) {
        console.error('Test execution error:', err);
        failed++;
    } finally {
        if (server) {
            server.close();
        }
        process.exit(failed > 0 ? 1 : 0);
    }
}

runTests();
