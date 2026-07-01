const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
require('dotenv').config();

const { initializeDatabase } = require('./config/database');

// Routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const tellerRoutes = require('./routes/tellerRoutes');
const accountantRoutes = require('./routes/accountantRoutes');
const auditorRoutes = require('./routes/auditorRoutes');
const customerRoutes = require('./routes/customerRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// ============================================
// ⭐ CORS Configuration - የተሻሻለ
// ============================================
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5000',
    'http://localhost:5001',
    'http://localhost:5006',
    'http://localhost:5007',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:5006',
    'http://127.0.0.1:5173'
];

app.use(cors({
    origin: function (origin, callback) {
        // ለሙከራ ሁሉንም ይፍቀዱ
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            console.log('❌ CORS blocked for origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Access-Control-Allow-Origin',
        'Access-Control-Allow-Headers',
        'Access-Control-Allow-Methods',
        'Access-Control-Allow-Credentials'
    ]
}));

// ============================================
// ⭐ ተጨማሪ CORS ሚድዌር
// ============================================
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
        res.header('Access-Control-Allow-Origin', origin);
    } else {
        res.header('Access-Control-Allow-Origin', '*');
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// ============================================
// Middleware
// ============================================
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ============================================
// Health Check
// ============================================
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        cors: {
            allowedOrigins: allowedOrigins
        }
    });
});

// ============================================
// Routes
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teller', tellerRoutes);
app.use('/api/accountant', accountantRoutes);
app.use('/api/auditor', auditorRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

module.exports = app;