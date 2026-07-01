const app = require('./src/app');
const { initializeDatabase } = require('./src/config/database');
require('dotenv').config();

const PORT = process.env.PORT || 5005;

// Error handlers
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection:', reason);
});

// Start server
async function startServer() {
    try {
        // Initialize database
        await initializeDatabase();
        console.log('✅ Database initialized');

        // Start server
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📍 http://localhost:${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
            console.log('\n👤 Default Users:');
            console.log('   🛡️ Admin: admin@gmail.com / admin123');
            console.log('   💳 Teller: teller@gmail.com / teller123');
            console.log('   📊 Accountant: accountant@gmail.com / accountant123');
            console.log('   🔍 Auditor: auditor@gmail.com / auditor123');
            console.log('   👤 Customer: customer@gmail.com / customer123');
            console.log(`\n🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
}

startServer();