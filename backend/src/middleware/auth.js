const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// ============================================
// ROLES
// ============================================
const ROLES = {
    ADMIN: 'admin',
    TELLER: 'teller',
    ACCOUNTANT: 'accountant',
    AUDITOR: 'auditor',
    CUSTOMER: 'customer'
};

// ============================================
// ROLE PERMISSIONS
// ============================================
const PERMISSIONS = {
    admin: {
        can: [
            'create_user', 'edit_user', 'delete_user', 'view_users',
            'assign_role', 'reset_password',
            'create_branch', 'edit_branch', 'delete_branch', 'view_branches',
            'manage_settings', 'view_audit_logs', 'manage_backup',
            'view_all_transactions', 'view_all_accounts',
            'generate_reports', 'view_financial_reports'
        ]
    },
    teller: {
        can: [
            'deposit', 'withdraw', 'transfer',
            'view_customer_accounts', 'view_customer_info',
            'create_customer_account',
            'view_daily_transactions', 'view_account_balance',
            'print_receipt'
        ]
    },
    accountant: {
        can: [
            'view_all_transactions', 'view_all_accounts',
            'manage_interest_rates', 'manage_fees',
            'generate_financial_reports',
            'view_profit_loss', 'view_balance_sheet',
            'view_cash_flow', 'reconcile_accounts'
        ]
    },
    auditor: {
        can: [
            'view_audit_logs', 'view_all_transactions',
            'view_all_accounts', 'view_user_activities',
            'generate_audit_reports',
            'view_suspicious_transactions'
        ]
    },
    customer: {
        can: [
            'view_own_accounts', 'view_own_transactions',
            'transfer_own', 'view_own_profile',
            'edit_own_profile', 'change_own_password',
            'view_account_statement'
        ]
    }
};

// ============================================
// CHECK PERMISSION
// ============================================
function hasPermission(userRole, action) {
    if (!userRole || !PERMISSIONS[userRole]) return false;
    return PERMISSIONS[userRole].can.includes(action);
}

// ============================================
// VERIFY TOKEN
// ============================================
async function protect(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'No token provided. Please login.'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        const [users] = await pool.query(
            'SELECT id, full_name, email, role, status FROM users WHERE id = ?',
            [decoded.id]
        );
        
        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }
        
        const user = users[0];
        
        if (user.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Account is inactive. Please contact admin.'
            });
        }
        
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
}

// ============================================
// ROLE MIDDLEWARES
// ============================================
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role: ${roles.join(' or ')}`
            });
        }
        
        next();
    };
}

function adminOnly(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
    }
    next();
}

function tellerOnly(req, res, next) {
    if (!req.user || !['teller', 'admin'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Teller access required'
        });
    }
    next();
}

function accountantOnly(req, res, next) {
    if (!req.user || !['accountant', 'admin'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Accountant access required'
        });
    }
    next();
}

function auditorOnly(req, res, next) {
    if (!req.user || !['auditor', 'admin'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Auditor access required'
        });
    }
    next();
}

function customerOnly(req, res, next) {
    if (!req.user || !['customer', 'admin'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Customer access required'
        });
    }
    next();
}

function requirePermission(action) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }
        
        if (!hasPermission(req.user.role, action)) {
            return res.status(403).json({
                success: false,
                message: `Permission denied: ${action}`
            });
        }
        
        next();
    };
}

module.exports = {
    ROLES,
    PERMISSIONS,
    hasPermission,
    protect,
    requireRole,
    adminOnly,
    tellerOnly,
    accountantOnly,
    auditorOnly,
    customerOnly,
    requirePermission
};