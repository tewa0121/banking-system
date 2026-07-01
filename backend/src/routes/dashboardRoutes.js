const router = require('express').Router();
const { protect, adminOnly, tellerOnly, accountantOnly, auditorOnly, customerOnly } = require('../middleware/auth');
const { pool } = require('../config/database');

// Admin Dashboard
router.get('/admin', protect, adminOnly, async (req, res) => {
    try {
        const [userCount] = await pool.query('SELECT COUNT(*) as total FROM users');
        const [accountCount] = await pool.query('SELECT COUNT(*) as total FROM accounts');
        const [transactionCount] = await pool.query('SELECT COUNT(*) as total FROM transactions');
        const [totalBalance] = await pool.query('SELECT SUM(balance) as total FROM accounts');
        const [activeUsers] = await pool.query("SELECT COUNT(*) as total FROM users WHERE status = 'active'");
        const [todayTx] = await pool.query('SELECT COUNT(*) as total FROM transactions WHERE DATE(created_at) = CURDATE()');
        
        res.json({
            success: true,
            data: {
                totalUsers: userCount[0].total || 0,
                activeUsers: activeUsers[0].total || 0,
                totalAccounts: accountCount[0].total || 0,
                totalTransactions: transactionCount[0].total || 0,
                totalBalance: totalBalance[0].total || 0,
                todayTransactions: todayTx[0].total || 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Teller Dashboard
router.get('/teller', protect, tellerOnly, async (req, res) => {
    try {
        const [todayTx] = await pool.query(
            'SELECT COUNT(*) as total, SUM(amount) as volume FROM transactions WHERE DATE(created_at) = CURDATE() AND status = "completed"'
        );
        const [customerCount] = await pool.query("SELECT COUNT(*) as total FROM users WHERE role = 'customer'");
        const [accountCount] = await pool.query("SELECT COUNT(*) as total FROM accounts WHERE status = 'active'");
        
        res.json({
            success: true,
            data: {
                todayTransactions: todayTx[0]?.total || 0,
                todayVolume: todayTx[0]?.volume || 0,
                totalCustomers: customerCount[0]?.total || 0,
                activeAccounts: accountCount[0]?.total || 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Accountant Dashboard
router.get('/accountant', protect, accountantOnly, async (req, res) => {
    try {
        const [summary] = await pool.query(`
            SELECT 
                COUNT(*) as total_transactions,
                SUM(CASE WHEN transaction_type = 'deposit' THEN amount ELSE 0 END) as total_deposits,
                SUM(CASE WHEN transaction_type = 'withdraw' THEN ABS(amount) ELSE 0 END) as total_withdrawals
            FROM transactions
            WHERE DATE(created_at) = CURDATE() AND status = 'completed'
        `);
        
        const [balance] = await pool.query('SELECT SUM(balance) as total FROM accounts WHERE status = "active"');
        const [pending] = await pool.query("SELECT COUNT(*) as total FROM transactions WHERE status = 'pending'");
        
        res.json({
            success: true,
            data: {
                todayTransactions: summary[0]?.total_transactions || 0,
                totalDeposits: summary[0]?.total_deposits || 0,
                totalWithdrawals: summary[0]?.total_withdrawals || 0,
                totalBalance: balance[0]?.total || 0,
                pendingTransactions: pending[0]?.total || 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Auditor Dashboard
router.get('/auditor', protect, auditorOnly, async (req, res) => {
    try {
        const [logCount] = await pool.query('SELECT COUNT(*) as total FROM audit_logs');
        const [txCount] = await pool.query('SELECT COUNT(*) as total FROM transactions');
        const [suspicious] = await pool.query('SELECT COUNT(*) as total FROM transactions WHERE amount > 100000 OR status = "failed"');
        const [userCount] = await pool.query('SELECT COUNT(*) as total FROM users');
        
        res.json({
            success: true,
            data: {
                auditLogs: logCount[0]?.total || 0,
                totalTransactions: txCount[0]?.total || 0,
                suspiciousTransactions: suspicious[0]?.total || 0,
                totalUsers: userCount[0]?.total || 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Customer Dashboard
router.get('/customer', protect, customerOnly, async (req, res) => {
    try {
        const [accounts] = await pool.query(
            'SELECT COUNT(*) as total, SUM(balance) as balance FROM accounts WHERE user_id = ? AND status = "active"',
            [req.user.id]
        );
        
        const [transactions] = await pool.query(
            'SELECT COUNT(*) as total FROM transactions t JOIN accounts a ON t.account_id = a.id WHERE a.user_id = ? AND DATE(t.created_at) = CURDATE()',
            [req.user.id]
        );
        
        const [notifications] = await pool.query(
            'SELECT COUNT(*) as total FROM notifications WHERE user_id = ? AND is_read = 0',
            [req.user.id]
        );
        
        res.json({
            success: true,
            data: {
                totalAccounts: accounts[0]?.total || 0,
                totalBalance: accounts[0]?.balance || 0,
                todayTransactions: transactions[0]?.total || 0,
                unreadNotifications: notifications[0]?.total || 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;