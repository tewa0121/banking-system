const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
require('dotenv').config();

const { testConnection, initializeDatabase } = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const accountRoutes = require('./routes/accountRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const passwordRoutes = require('./routes/passwordRoutes');
const reportRoutes = require('./routes/reportRoutes');
const interestRoutes = require('./routes/interestRoutes');
const languageRoutes = require('./routes/languageRoutes');
const bankRoutes = require('./routes/bankRoutes');
const settingsRoutes = require('./routes/settingsRoutes'); // ⭐ አክል

const errorHandler = require('./middleware/errorHandler');

const app = express();

// ============================================
// ⭐ CORS - ቀጥተኛ መፍትሄ (ከሁሉም በፊት)
// ============================================
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// ============================================
// Middleware
// ============================================
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// Health Check
// ============================================
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        port: process.env.PORT || 5005
    });
});

// ============================================
// API Routes
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/password', passwordRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/interest', interestRoutes);
app.use('/api/languages', languageRoutes);
app.use('/api/banks', bankRoutes);
app.use('/api/settings', settingsRoutes); // ⭐ አክል

app.use(errorHandler);

// ============================================
// Start Server
// ============================================
const startServer = async () => {
    await initializeDatabase();
    const connected = await testConnection();
    if (connected) {
        console.log('✅ All systems ready!');
        console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode`);
    }
};

startServer();

module.exports = app;