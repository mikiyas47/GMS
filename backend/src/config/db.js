const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const {
    User,
    Member,
    Trainer,
    Membership,
    Payment,
    Class,
    ClassSession,
    Attendance,
    Product
} = require('../models');

/**
 * Connect to MongoDB and seed default accounts
 */
async function connectDB() {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gym_management';

    try {
        console.log(`[MongoDB] Connecting to database...`);
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 20000,
        });

        console.log(`[MongoDB] Connected successfully to MongoDB: ${mongoose.connection.host}/${mongoose.connection.name}`);
        
        // Auto-seed initial data if database is empty
        await seedInitialData();

    } catch (err) {
        console.error('\n❌ [MongoDB] Connection Failed!');
        console.error(`Error details: ${err.message}`);
        console.error('\n👉 To connect to MongoDB Atlas (Cloud):');
        console.error('1. Open backend/.env');
        console.error('2. Paste your Atlas connection URI in MONGODB_URI=...');
        console.error('   Example: MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/gym_management?retryWrites=true&w=majority\n');
        throw err;
    }
}

/**
 * Seeds default administrator, receptionist, trainers, classes, timetable, products
 */
async function seedInitialData() {
    try {
        const adminHash = bcrypt.hashSync('Admin@123', 10);
        const receptionHash = bcrypt.hashSync('Reception@123', 10);

        // 1. Ensure default administrator always exists
        let admin = await User.findOne({ email: 'admin@gym.com' });
        if (!admin) {
            console.log('[MongoDB] Creating default administrator (admin@gym.com)...');
            admin = await User.create({
                full_name: 'System Administrator',
                email: 'admin@gym.com',
                password_hash: adminHash,
                role: 'admin',
                is_active: true
            });
        }

        // 2. Ensure default receptionist always exists
        let receptionist = await User.findOne({ email: 'reception@gym.com' });
        if (!receptionist) {
            console.log('[MongoDB] Creating default receptionist (reception@gym.com)...');
            receptionist = await User.create({
                full_name: 'Sarah Receptionist',
                email: 'reception@gym.com',
                password_hash: receptionHash,
                role: 'receptionist',
                is_active: true
            });
        }

        // 3. Ensure initial trainers exist
        const trainerCount = await Trainer.countDocuments();
        let t1, t2, t3;
        if (trainerCount === 0) {
            console.log('[MongoDB] Seeding initial trainers, classes, and timetable...');
            t1 = await Trainer.create({
                first_name: 'Marcus',
                last_name: 'Stone',
                phone: '+1-555-0101',
                email: 'marcus.stone@gym.com',
                specialization: 'CrossFit & Strength',
                certification: 'CSCS Certified, Level 3 Trainer',
                hire_date: '2023-01-15',
                is_active: true
            });

            t2 = await Trainer.create({
                first_name: 'Elena',
                last_name: 'Rostova',
                phone: '+1-555-0102',
                email: 'elena.rostova@gym.com',
                specialization: 'Yoga & Pilates',
                certification: 'RYT-500 Master Instructor',
                hire_date: '2023-03-20',
                is_active: true
            });

            t3 = await Trainer.create({
                first_name: 'David',
                last_name: 'Kim',
                phone: '+1-555-0103',
                email: 'david.kim@gym.com',
                specialization: 'Boxing & HIIT',
                certification: 'Golden Gloves Certified Coach',
                hire_date: '2023-06-01',
                is_active: true
            });
        } else {
            const trainers = await Trainer.find().limit(3);
            t1 = trainers[0];
            t2 = trainers[1] || trainers[0];
            t3 = trainers[2] || trainers[0];
        }

        // 4. Ensure Classes and sessions exist
        const classCount = await Class.countDocuments();
        if (classCount === 0 && t1) {
            const c1 = await Class.create({
                name: 'HIIT Ignition',
                description: 'High-intensity interval training designed to maximize calorie burn and endurance.',
                trainer_id: t3?._id || t1._id,
                duration_minutes: 45
            });

            const c2 = await Class.create({
                name: 'Vinyasa Flow Yoga',
                description: 'Fluid yoga practice linking breath with dynamic poses for flexibility and core strength.',
                trainer_id: t2?._id || t1._id,
                duration_minutes: 60
            });

            const c3 = await Class.create({
                name: 'Power Strength & Conditioning',
                description: 'Compound barbell and dumbbell lifting targeting full-body power and hypertrophy.',
                trainer_id: t1._id,
                duration_minutes: 60
            });

            await ClassSession.create([
                { class_id: c1._id, day_of_week: 1, start_time: '07:00', end_time: '07:45', room: 'Studio A', is_active: true },
                { class_id: c2._id, day_of_week: 1, start_time: '08:00', end_time: '09:00', room: 'Zen Studio', is_active: true },
                { class_id: c3._id, day_of_week: 2, start_time: '17:30', end_time: '18:30', room: 'Main Floor', is_active: true },
                { class_id: c1._id, day_of_week: 4, start_time: '07:00', end_time: '07:45', room: 'Studio A', is_active: true }
            ]);
        }

        // 5. Ensure Products exist
        const productCount = await Product.countDocuments();
        if (productCount === 0) {
            await Product.create([
                { name: 'Optimum Whey Protein 2kg (Vanilla)', price: 65.00, stock_qty: 24, reorder_level: 5, is_active: true },
                { name: 'Pre-Workout Explosive Energy (Blue Razz)', price: 38.00, stock_qty: 18, reorder_level: 6, is_active: true },
                { name: 'Electrolyte Hydration Drink 500ml', price: 3.50, stock_qty: 48, reorder_level: 12, is_active: true },
                { name: 'Gym Grips & Wrist Wraps (Pair)', price: 22.00, stock_qty: 4, reorder_level: 5, is_active: true },
                { name: 'Gym Pro Shaker Bottle 700ml', price: 12.00, stock_qty: 2, reorder_level: 5, is_active: true }
            ]);
        }
        console.log('[MongoDB] System accounts and initial catalog ready.');
    } catch (seedErr) {
        console.error('[MongoDB] Seeding error:', seedErr.message);
    }
}

module.exports = {
    connectDB,
    seedInitialData
};
