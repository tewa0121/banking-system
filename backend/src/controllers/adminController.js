const { User, Account, Transaction } = require('../models');

// ============================================
// Get All Users
// ============================================
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll();
        
        res.status(200).json({
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
        const user = await User.findById(id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        const account = await Account.findByUserId(id);
        
        res.status(200).json({
            success: true,
            data: {
                user,
                account
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
// Get All Accounts
// ============================================
exports.getAllAccounts = async (req, res) => {
    try {
        const accounts = await Account.findAll();
        
        res.status(200).json({
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
        const { limit = 100 } = req.query;
        
        // Get all transactions with account and user info
        const query = `
            SELECT t.*, a.account_number, u.full_name, u.email
            FROM transactions t
            JOIN accounts a ON t.account_id = a.id
            JOIN users u ON a.user_id = u.id
            ORDER BY t.created_at DESC
            LIMIT ?
        `;
        
        const { pool } = require('../config/database');
        const [transactions] = await pool.execute(query, [parseInt(limit)]);
        
        res.status(200).json({
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
// Update User Role (Make Admin)
// ============================================
exports.updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        
        if (!['customer', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Must be customer or admin'
            });
        }
        
        const { pool } = require('../config/database');
        const query = 'UPDATE users SET role = ? WHERE id = ?';
        const [result] = await pool.execute(query, [role, id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        const user = await User.findById(id);
        
        res.status(200).json({
            success: true,
            message: `User role updated to ${role}`,
            data: user
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
// ⭐ Update User Status (Active/Inactive)
// ============================================
exports.updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        console.log('📥 Update user status:', { id, status });

        if (!['active', 'inactive'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be active or inactive'
            });
        }

        const { pool } = require('../config/database');
        const query = 'UPDATE users SET status = ? WHERE id = ?';
        const [result] = await pool.execute(query, [status, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = await User.findById(id);

        res.status(200).json({
            success: true,
            message: `User status updated to ${status}`,
            data: user
        });
    } catch (error) {
        console.error('❌ Update user status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user status',
            error: error.message
        });
    }
};

// ============================================
// Get Dashboard Statistics
// ============================================
exports.getDashboardStats = async (req, res) => {
    try {
        const { pool } = require('../config/database');
        
        // Total users
        const [userCount] = await pool.execute('SELECT COUNT(*) as total FROM users');
        
        // Total accounts
        const [accountCount] = await pool.execute('SELECT COUNT(*) as total FROM accounts');
        
        // Total transactions
        const [transactionCount] = await pool.execute('SELECT COUNT(*) as total FROM transactions');
        
        // Total balance
        const [totalBalance] = await pool.execute('SELECT SUM(balance) as total FROM accounts');
        
        // Recent transactions
        const [recentTransactions] = await pool.execute(`
            SELECT t.*, a.account_number, u.full_name
            FROM transactions t
            JOIN accounts a ON t.account_id = a.id
            JOIN users u ON a.user_id = u.id
            ORDER BY t.created_at DESC
            LIMIT 10
        `);
        
        res.status(200).json({
            success: true,
            data: {
                totalUsers: userCount[0].total || 0,
                totalAccounts: accountCount[0].total || 0,
                totalTransactions: transactionCount[0].total || 0,
                totalBalance: totalBalance[0].total || 0,
                recentTransactions
            }
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get dashboard statistics',
            error: error.message
        });
    }
};