const jwt = require('jsonwebtoken');
const { User } = require('../models');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Please login first'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        // ⭐ Check if user is active
        if (user.status === 'inactive') {
            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated. Please contact admin.'
            });
        }

        // ⭐ Check if system is in maintenance mode
        const { pool } = require('../config/database');
        const [settings] = await pool.execute('SELECT maintenance_mode FROM settings LIMIT 1');
        
        if (settings.length > 0 && settings[0].maintenance_mode === 1) {
            // Allow admin to login during maintenance
            if (user.role !== 'admin') {
                return res.status(503).json({
                    success: false,
                    message: 'System is currently under maintenance. Please try again later.'
                });
            }
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};

// ⭐ Admin middleware
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
    }
};

module.exports = { protect, adminOnly };