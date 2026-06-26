const { pool } = require('../config/database');
const { User, Account, Transaction } = require('../models');

// ============================================
// Search Users (Admin only)
// ============================================
exports.searchUsers = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query || query.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Search query must be at least 2 characters'
            });
        }

        const searchTerm = `%${query}%`;

        const [users] = await pool.execute(`
            SELECT id, full_name, email, phone, address, role, status, created_at
            FROM users
            WHERE full_name LIKE ? 
               OR email LIKE ? 
               OR phone LIKE ?
            ORDER BY created_at DESC
            LIMIT 50
        `, [searchTerm, searchTerm, searchTerm]);

        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search users',
            error: error.message
        });
    }
};

// ============================================
// Search Transactions
// ============================================
exports.searchTransactions = async (req, res) => {
    try {
        const { query, account_id } = req.query;

        if (!query || query.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Search query must be at least 2 characters'
            });
        }

        const searchTerm = `%${query}%`;
        let sql = `
            SELECT t.*, a.account_number, u.full_name
            FROM transactions t
            JOIN accounts a ON t.account_id = a.id
            JOIN users u ON a.user_id = u.id
            WHERE t.description LIKE ? 
               OR t.reference_number LIKE ?
               OR t.transaction_type LIKE ?
        `;
        const params = [searchTerm, searchTerm, searchTerm];

        if (account_id) {
            sql += ' AND t.account_id = ?';
            params.push(account_id);
        }

        sql += ' ORDER BY t.created_at DESC LIMIT 50';

        const [transactions] = await pool.execute(sql, params);

        res.status(200).json({
            success: true,
            count: transactions.length,
            data: transactions
        });
    } catch (error) {
        console.error('Search transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search transactions',
            error: error.message
        });
    }
};

// ============================================
// Global Search (Users, Accounts, Transactions)
// ============================================
exports.globalSearch = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query || query.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Search query must be at least 2 characters'
            });
        }

        const searchTerm = `%${query}%`;

        // Search Users
        const [users] = await pool.execute(`
            SELECT id, full_name, email, phone, role, status, 'user' as type
            FROM users
            WHERE full_name LIKE ? OR email LIKE ?
            LIMIT 10
        `, [searchTerm, searchTerm]);

        // Search Accounts
        const [accounts] = await pool.execute(`
            SELECT a.id, a.account_number, a.account_type, a.balance, a.status, 
                   u.full_name as owner, 'account' as type
            FROM accounts a
            JOIN users u ON a.user_id = u.id
            WHERE a.account_number LIKE ? OR u.full_name LIKE ?
            LIMIT 10
        `, [searchTerm, searchTerm]);

        // Search Transactions
        const [transactions] = await pool.execute(`
            SELECT t.id, t.transaction_type, t.amount, t.description, 
                   t.status, t.created_at, a.account_number, 'transaction' as type
            FROM transactions t
            JOIN accounts a ON t.account_id = a.id
            WHERE t.description LIKE ? OR t.reference_number LIKE ?
            LIMIT 10
        `, [searchTerm, searchTerm]);

        res.status(200).json({
            success: true,
            data: {
                users,
                accounts,
                transactions
            }
        });
    } catch (error) {
        console.error('Global search error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to perform search',
            error: error.message
        });
    }
};

// ============================================
// Search Accounts by Number or Owner
// ============================================
exports.searchAccounts = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query || query.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Search query must be at least 2 characters'
            });
        }

        const searchTerm = `%${query}%`;

        const [accounts] = await pool.execute(`
            SELECT a.*, u.full_name, u.email
            FROM accounts a
            JOIN users u ON a.user_id = u.id
            WHERE a.account_number LIKE ? 
               OR u.full_name LIKE ?
               OR u.email LIKE ?
            ORDER BY a.created_at DESC
            LIMIT 50
        `, [searchTerm, searchTerm, searchTerm]);

        res.status(200).json({
            success: true,
            count: accounts.length,
            data: accounts
        });
    } catch (error) {
        console.error('Search accounts error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search accounts',
            error: error.message
        });
    }
};