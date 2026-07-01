const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

// ============================================
// Dashboard Statistics
// ============================================
exports.getDashboardStats = async (req, res) => {
    try {
        const [userCount] = await pool.query('SELECT COUNT(*) as total FROM users');
        const [activeUsers] = await pool.query("SELECT COUNT(*) as total FROM users WHERE status = 'active'");
        const [accountCount] = await pool.query('SELECT COUNT(*) as total FROM accounts');
        const [transactionCount] = await pool.query('SELECT COUNT(*) as total FROM transactions');
        const [totalBalance] = await pool.query('SELECT SUM(balance) as total FROM accounts');
        const [todayTransactions] = await pool.query(
            'SELECT COUNT(*) as total FROM transactions WHERE DATE(created_at) = CURDATE()'
        );
        
        // በሚና የተጠቃሚዎች ብዛት
        const [roleCounts] = await pool.query(`
            SELECT role, COUNT(*) as count 
            FROM users 
            GROUP BY role
        `);
        
        const roles = {};
        roleCounts.forEach(r => { roles[r.role] = r.count; });
        
        res.json({
            success: true,
            data: {
                users: {
                    total: userCount[0].total,
                    active: activeUsers[0].total,
                    byRole: roles
                },
                accounts: {
                    total: accountCount[0].total
                },
                transactions: {
                    total: transactionCount[0].total,
                    today: todayTransactions[0].total
                },
                totalBalance: totalBalance[0].total || 0
            }
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get dashboard stats',
            error: error.message
        });
    }
};

// ============================================
// Get All Users
// ============================================
exports.getAllUsers = async (req, res) => {
    try {
        const [users] = await pool.query(`
            SELECT id, full_name, email, phone, address, role, status, 
                    profile_image, created_at, last_login 
            FROM users 
            ORDER BY created_at DESC
        `);
        
        res.json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get users',
            error: error.message
        });
    }
};

// ============================================
// Get User by ID
// ============================================
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [users] = await pool.query(`
            SELECT id, full_name, email, phone, address, role, status, 
                    profile_image, created_at, last_login 
            FROM users 
            WHERE id = ?
        `, [id]);
        
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // የተጠቃሚውን አካውንቶች ማየት
        const [accounts] = await pool.query(`
            SELECT id, account_number, account_type, balance, currency, status 
            FROM accounts 
            WHERE user_id = ?
        `, [id]);
        
        res.json({
            success: true,
            data: {
                ...users[0],
                accounts
            }
        });
    } catch (error) {
        console.error('Get user by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user',
            error: error.message
        });
    }
};

// ============================================
// Update User Role
// ============================================
exports.updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        
        const validRoles = ['customer', 'teller', 'accountant', 'auditor', 'admin'];
        
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: `Invalid role. Valid roles: ${validRoles.join(', ')}`
            });
        }
        
        const [result] = await pool.query(
            'UPDATE users SET role = ? WHERE id = ?',
            [role, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // የለውጥ መዝገብ አስቀምጥ
        await pool.query(
            `INSERT INTO audit_logs (user_id, action, details, ip_address) 
             VALUES (?, 'role_update', ?, ?)`,
            [req.user.id, `Changed role to ${role} for user ${id}`, req.ip]
        );
        
        const [user] = await pool.query(
            'SELECT id, full_name, email, role, status FROM users WHERE id = ?',
            [id]
        );
        
        res.json({
            success: true,
            message: `User role updated to ${role}`,
            data: user[0]
        });
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user role',
            error: error.message
        });
    }
};

// ============================================
// Update User Status
// ============================================
exports.updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const validStatuses = ['active', 'inactive', 'suspended'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Valid statuses: ${validStatuses.join(', ')}`
            });
        }
        
        const [result] = await pool.query(
            'UPDATE users SET status = ? WHERE id = ?',
            [status, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // የለውጥ መዝገብ አስቀምጥ
        await pool.query(
            `INSERT INTO audit_logs (user_id, action, details, ip_address) 
             VALUES (?, 'status_update', ?, ?)`,
            [req.user.id, `Changed status to ${status} for user ${id}`, req.ip]
        );
        
        // ማሳወቂያ ፍጠር
        const message = status === 'active' 
            ? 'Your account has been activated. You can now login and use all banking services.'
            : status === 'suspended'
            ? 'Your account has been suspended. Please contact admin for more information.'
            : 'Your account has been deactivated. Please contact admin for more information.';
        
        await pool.query(
            `INSERT INTO notifications (user_id, title, message, type) 
             VALUES (?, ?, ?, ?)`,
            [id, 'Account Status Update', message, status === 'active' ? 'success' : 'error']
        );
        
        const [user] = await pool.query(
            'SELECT id, full_name, email, role, status FROM users WHERE id = ?',
            [id]
        );
        
        res.json({
            success: true,
            message: `User status updated to ${status}`,
            data: user[0]
        });
    } catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user status',
            error: error.message
        });
    }
};

// ============================================
// Get All Accounts
// ============================================
exports.getAllAccounts = async (req, res) => {
    try {
        const [accounts] = await pool.query(`
            SELECT 
                a.*,
                u.full_name as customer_name,
                u.email as customer_email,
                u.phone as customer_phone
            FROM accounts a
            JOIN users u ON a.user_id = u.id
            ORDER BY a.created_at DESC
        `);
        
        res.json({
            success: true,
            count: accounts.length,
            data: accounts
        });
    } catch (error) {
        console.error('Get all accounts error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get accounts',
            error: error.message
        });
    }
};

// ============================================
// Get All Transactions
// ============================================
exports.getAllTransactions = async (req, res) => {
    try {
        const { limit = 100, status, type } = req.query;
        
        let query = `
            SELECT 
                t.*,
                a.account_number,
                u.full_name as customer_name,
                u.email as customer_email
            FROM transactions t
            JOIN accounts a ON t.account_id = a.id
            JOIN users u ON a.user_id = u.id
            WHERE 1=1
        `;
        const params = [];
        
        if (status) {
            query += ' AND t.status = ?';
            params.push(status);
        }
        
        if (type) {
            query += ' AND t.transaction_type = ?';
            params.push(type);
        }
        
        query += ' ORDER BY t.created_at DESC LIMIT ?';
        params.push(parseInt(limit));
        
        const [transactions] = await pool.query(query, params);
        
        res.json({
            success: true,
            count: transactions.length,
            data: transactions
        });
    } catch (error) {
        console.error('Get all transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get transactions',
            error: error.message
        });
    }
};

// ============================================
// Create Teller
// ============================================
exports.createTeller = async (req, res) => {
    try {
        const { full_name, email, password, phone, address } = req.body;
        
        // ኢሜል ቀድሞ እንደሌለ ማረጋገጥ
        const [existing] = await pool.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const [result] = await pool.query(
            `INSERT INTO users (full_name, email, password_hash, phone, address, role) 
             VALUES (?, ?, ?, ?, ?, 'teller')`,
            [full_name, email, hashedPassword, phone, address]
        );
        
        // የለውጥ መዝገብ አስቀምጥ
        await pool.query(
            `INSERT INTO audit_logs (user_id, action, details, ip_address) 
             VALUES (?, 'create_teller', ?, ?)`,
            [req.user.id, `Created teller: ${email}`, req.ip]
        );
        
        res.json({
            success: true,
            message: 'Teller created successfully',
            data: { id: result.insertId, email, role: 'teller' }
        });
    } catch (error) {
        console.error('Create teller error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create teller',
            error: error.message
        });
    }
};

// ============================================
// Get Audit Logs
// ============================================
exports.getAuditLogs = async (req, res) => {
    try {
        const { limit = 50 } = req.query;
        
        const [logs] = await pool.query(`
            SELECT 
                al.*,
                u.full_name as user_name,
                u.email as user_email
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.id
            ORDER BY al.created_at DESC
            LIMIT ?
        `, [parseInt(limit)]);
        
        res.json({
            success: true,
            count: logs.length,
            data: logs
        });
    } catch (error) {
        console.error('Get audit logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get audit logs',
            error: error.message
        });
    }
};

// ============================================
// Get System Settings
// ============================================
exports.getSettings = async (req, res) => {
    try {
        const [settings] = await pool.query('SELECT * FROM settings WHERE id = 1');
        
        res.json({
            success: true,
            data: settings[0] || null
        });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get settings',
            error: error.message
        });
    }
};

// ============================================
// Update System Settings
// ============================================
exports.updateSettings = async (req, res) => {
    try {
        const { interest_rate, transaction_limit, maintenance_mode, currency } = req.body;
        
        await pool.query(
            `UPDATE settings 
             SET interest_rate = ?, 
                 transaction_limit = ?, 
                 maintenance_mode = ?, 
                 currency = ? 
             WHERE id = 1`,
            [interest_rate, transaction_limit, maintenance_mode || 0, currency || 'ETB']
        );
        
        // የለውጥ መዝገብ አስቀምጥ
        await pool.query(
            `INSERT INTO audit_logs (user_id, action, details, ip_address) 
             VALUES (?, 'update_settings', ?, ?)`,
            [req.user.id, 'Updated system settings', req.ip]
        );
        
        res.json({
            success: true,
            message: 'Settings updated successfully'
        });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update settings',
            error: error.message
        });
    }
};