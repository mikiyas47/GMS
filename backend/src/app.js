const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

// Route modules
const publicRoutes = require('./routes/public.routes');
const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const membersRoutes = require('./routes/members.routes');
const membershipsRoutes = require('./routes/memberships.routes');
const paymentsRoutes = require('./routes/payments.routes');
const trainersRoutes = require('./routes/trainers.routes');
const classesRoutes = require('./routes/classes.routes');
const sessionsRoutes = require('./routes/sessions.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const productsRoutes = require('./routes/products.routes');
const salesRoutes = require('./routes/sales.routes');
const reportsRoutes = require('./routes/reports.routes');

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check & Root
app.get('/', (req, res) => {
    res.json({
        name: 'Gym Management System API',
        status: 'online',
        databaseEngine: 'mongodb',
        version: '1.0.0',
        documentation: {
            public: ['/api/public/timetable', '/api/public/trainers'],
            auth: ['/api/auth/login', '/api/auth/logout', '/api/auth/me'],
            staffAccounts: '/api/users',
            members: '/api/members',
            memberships: '/api/memberships',
            payments: '/api/payments',
            trainers: '/api/trainers',
            classes: '/api/classes',
            sessions: '/api/sessions',
            attendance: '/api/attendance',
            products: '/api/products',
            sales: '/api/product-sales',
            reports: ['/api/reports/revenue', '/api/reports/attendance', '/api/reports/expiring-memberships']
        }
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        database: 'mongodb',
        timestamp: new Date().toISOString()
    });
});

// Mount Routes per specification (with /api prefix)
app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/memberships', membershipsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/trainers', trainersRoutes);
app.use('/api/classes', classesRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/product-sales', salesRoutes);
app.use('/api/reports', reportsRoutes);

// Fallback mounts without /api prefix (ensures /auth/login works if client URL omitted /api)
app.use('/public', publicRoutes);
app.use('/auth', authRoutes);
app.use('/users', usersRoutes);
app.use('/members', membersRoutes);
app.use('/memberships', membershipsRoutes);
app.use('/payments', paymentsRoutes);
app.use('/trainers', trainersRoutes);
app.use('/classes', classesRoutes);
app.use('/sessions', sessionsRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/products', productsRoutes);
app.use('/product-sales', salesRoutes);
app.use('/reports', reportsRoutes);

// 404 Route Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Endpoint ${req.method} ${req.originalUrl} not found.`
    });
});

// Central Error Handler
app.use(errorHandler);

module.exports = app;
