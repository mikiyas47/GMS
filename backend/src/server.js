const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const app = require('./app');
const { connectDB } = require('./config/db');
const { startExpiryScheduler } = require('./jobs/expiryJob');

const PORT = parseInt(process.env.PORT, 10) || 5000;

async function bootstrap() {
    try {
        console.log('[Server] Initializing Gym Management System Backend with MongoDB...');
        
        // 1. Connect to MongoDB & Seed Data
        await connectDB();

        // 2. Start Background Jobs (Daily / Hourly Expiry Task)
        startExpiryScheduler(1);

        // 3. Start HTTP Server
        const server = app.listen(PORT, () => {
            console.log('====================================================');
            console.log(`🏋️  Gym Management Backend running on http://localhost:${PORT}`);
            console.log(`🍃  Active Database Engine: MONGODB`);
            console.log(`🛡️  Role-Based Access: Admin & Receptionist enabled`);
            console.log('====================================================');
        });

        // Graceful shutdown
        const shutdown = (signal) => {
            console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
            server.close(() => {
                console.log('[Server] HTTP server closed.');
                process.exit(0);
            });
        };

        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));

    } catch (err) {
        console.error('[Server] Fatal bootstrap error:', err);
        process.exit(1);
    }
}

bootstrap();
