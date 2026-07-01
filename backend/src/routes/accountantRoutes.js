const router = require('express').Router();
const { protect, accountantOnly } = require('../middleware/auth');
const { pool } = require('../config/database');

// ============================================
// GET ALL TRANSACTIONS
// ============================================
router.get('/transactions', protect, accountantOnly, async (req, res) => {
    try {
        const { limit = 100, start_date, end_date } = req.query;
        
        let query = `
            SELECT t.*, a.account_number, u.full_name as customer_name
            FROM transactions t
            JOIN accounts a ON t.account_id = a.id
            JOIN users u ON a.user_id = u.id
            WHERE 1=1
        `;
        const params = [];
        
        if (start_date) {
            query += ' AND DATE(t.created_at) >= ?';
            params.push(start_date);
        }
        if (end_date) {
            query += ' AND DATE(t.created_at) <= ?';
            params.push(end_date);
        }
        
        query += ' ORDER BY t.created_at DESC LIMIT ?';
        params.push(parseInt(limit));
        
        const [transactions] = await pool.query(query, params);
        res.json({ success: true, data: transactions });
    } catch (error) {
        console.error('❌ Get transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get transactions',
            error: error.message
        });
    }
});

// ============================================
// GET TRANSACTION SUMMARY
// ============================================
router.get('/transactions/summary', protect, accountantOnly, async (req, res) => {
    try {
        const { period = 'today' } = req.query;
        
        let dateCondition = 'DATE(created_at) = CURDATE()';
        if (period === 'week') {
            dateCondition = 'YEARWEEK(created_at) = YEARWEEK(CURDATE())';
        } else if (period === 'month') {
            dateCondition = 'MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())';
        } else if (period === 'year') {
            dateCondition = 'YEAR(created_at) = YEAR(CURDATE())';
        }
        
        const [summary] = await pool.query(`
            SELECT 
                COUNT(*) as total_transactions,
                SUM(CASE WHEN transaction_type = 'deposit' THEN amount ELSE 0 END) as total_deposits,
                SUM(CASE WHEN transaction_type = 'withdraw' THEN ABS(amount) ELSE 0 END) as total_withdrawals,
                SUM(CASE WHEN transaction_type = 'transfer' THEN ABS(amount) ELSE 0 END) as total_transfers,
                COUNT(DISTINCT account_id) as active_accounts,
                AVG(amount) as average_transaction
            FROM transactions
            WHERE ${dateCondition}
            AND status = 'completed'
        `);
        
        res.json({
            success: true,
            data: {
                period,
                ...summary[0]
            }
        });
    } catch (error) {
        console.error('❌ Get summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get summary',
            error: error.message
        });
    }
});

// ============================================
// ⭐ GET ALL ACCOUNTS - አዲስ
// ============================================
router.get('/accounts', protect, accountantOnly, async (req, res) => {
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
        console.error('❌ Get accounts error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get accounts',
            error: error.message
        });
    }
});

// ============================================
// ⭐ GET DAILY REPORT - አዲስ
// ============================================
router.get('/reports/daily', protect, accountantOnly, async (req, res) => {
    try {
        const { date } = req.query;
        const targetDate = date || new Date().toISOString().split('T')[0];
        
        // Daily summary
        const [summary] = await pool.query(`
            SELECT 
                COUNT(*) as total_transactions,
                SUM(CASE WHEN transaction_type = 'deposit' THEN amount ELSE 0 END) as total_deposits,
                SUM(CASE WHEN transaction_type = 'withdraw' THEN ABS(amount) ELSE 0 END) as total_withdrawals,
                SUM(CASE WHEN transaction_type = 'transfer' THEN ABS(amount) ELSE 0 END) as total_transfers,
                COUNT(DISTINCT account_id) as active_accounts
            FROM transactions
            WHERE DATE(created_at) = ?
            AND status = 'completed'
        `, [targetDate]);
        
        // Detailed transactions
        const [transactions] = await pool.query(`
            SELECT 
                t.*,
                a.account_number,
                u.full_name as customer_name
            FROM transactions t
            JOIN accounts a ON t.account_id = a.id
            JOIN users u ON a.user_id = u.id
            WHERE DATE(t.created_at) = ?
            AND t.status = 'completed'
            ORDER BY t.created_at DESC
        `, [targetDate]);
        
        // Top accounts
        const [topAccounts] = await pool.query(`
            SELECT 
                a.account_number,
                u.full_name as customer_name,
                COUNT(t.id) as transaction_count,
                SUM(ABS(t.amount)) as total_amount
            FROM transactions t
            JOIN accounts a ON t.account_id = a.id
            JOIN users u ON a.user_id = u.id
            WHERE DATE(t.created_at) = ?
            AND t.status = 'completed'
            GROUP BY a.id, a.account_number, u.full_name
            ORDER BY total_amount DESC
            LIMIT 10
        `, [targetDate]);
        
        res.json({
            success: true,
            data: {
                date: targetDate,
                summary: summary[0],
                transactions: transactions,
                top_accounts: topAccounts
            }
        });
    } catch (error) {
        console.error('❌ Get daily report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get daily report',
            error: error.message
        });
    }
});

// ============================================
// ⭐ GET MONTHLY REPORT - አዲስ
// ============================================
router.get('/reports/monthly', protect, accountantOnly, async (req, res) => {
    try {
        const { month, year } = req.query;
        const targetMonth = month || new Date().getMonth() + 1;
        const targetYear = year || new Date().getFullYear();
        
        // Monthly summary
        const [summary] = await pool.query(`
            SELECT 
                COUNT(*) as total_transactions,
                SUM(CASE WHEN transaction_type = 'deposit' THEN amount ELSE 0 END) as total_deposits,
                SUM(CASE WHEN transaction_type = 'withdraw' THEN ABS(amount) ELSE 0 END) as total_withdrawals,
                SUM(CASE WHEN transaction_type = 'transfer' THEN ABS(amount) ELSE 0 END) as total_transfers,
                COUNT(DISTINCT account_id) as active_accounts,
                AVG(amount) as average_transaction
            FROM transactions
            WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?
            AND status = 'completed'
        `, [targetMonth, targetYear]);
        
        // Daily breakdown
        const [dailyBreakdown] = await pool.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as transaction_count,
                SUM(CASE WHEN transaction_type = 'deposit' THEN amount ELSE 0 END) as deposits,
                SUM(CASE WHEN transaction_type = 'withdraw' THEN ABS(amount) ELSE 0 END) as withdrawals,
                SUM(ABS(amount)) as total_volume
            FROM transactions
            WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?
            AND status = 'completed'
            GROUP BY DATE(created_at)
            ORDER BY DATE(created_at) DESC
        `, [targetMonth, targetYear]);
        
        res.json({
            success: true,
            data: {
                month: targetMonth,
                year: targetYear,
                summary: summary[0],
                daily_breakdown: dailyBreakdown
            }
        });
    } catch (error) {
        console.error('❌ Get monthly report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get monthly report',
            error: error.message
        });
    }
});

// ============================================
// ⭐ GET BALANCE SHEET - አዲስ
// ============================================
router.get('/reports/balance-sheet', protect, accountantOnly, async (req, res) => {
    try {
        // Total assets (all account balances)
        const [assets] = await pool.query(`
            SELECT 
                SUM(balance) as total_assets,
                account_type,
                COUNT(*) as account_count
            FROM accounts
            WHERE status = 'active'
            GROUP BY account_type
        `);
        
        // Total liabilities (pending transactions, fees, etc.)
        const [liabilities] = await pool.query(`
            SELECT 
                COUNT(*) as pending_transactions,
                SUM(ABS(amount)) as pending_amount
            FROM transactions
            WHERE status = 'pending'
        `);
        
        // Account summary
        const [accountSummary] = await pool.query(`
            SELECT 
                COUNT(*) as total_accounts,
                SUM(balance) as total_balance,
                AVG(balance) as average_balance
            FROM accounts
            WHERE status = 'active'
        `);
        
        res.json({
            success: true,
            data: {
                assets: {
                    total: assets.reduce((sum, a) => sum + parseFloat(a.total_assets || 0), 0),
                    by_type: assets
                },
                liabilities: {
                    pending_transactions: liabilities[0]?.pending_transactions || 0,
                    pending_amount: liabilities[0]?.pending_amount || 0
                },
                account_summary: accountSummary[0],
                generated_at: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('❌ Get balance sheet error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get balance sheet',
            error: error.message
        });
    }
});

// ============================================
// ⭐ GET FINANCIAL TRENDS - አዲስ
// ============================================
router.get('/reports/trends', protect, accountantOnly, async (req, res) => {
    try {
        const { months = 6 } = req.query;
        
        // Monthly trends
        const [monthlyTrends] = await pool.query(`
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as month,
                COUNT(*) as transaction_count,
                SUM(CASE WHEN transaction_type = 'deposit' THEN amount ELSE 0 END) as deposits,
                SUM(CASE WHEN transaction_type = 'withdraw' THEN ABS(amount) ELSE 0 END) as withdrawals,
                SUM(ABS(amount)) as total_volume,
                AVG(amount) as average_transaction
            FROM transactions
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
            AND status = 'completed'
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month DESC
        `, [parseInt(months)]);
        
        // New accounts per month
        const [newAccounts] = await pool.query(`
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as month,
                COUNT(*) as new_accounts
            FROM accounts
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month DESC
        `, [parseInt(months)]);
        
        res.json({
            success: true,
            data: {
                monthly_trends: monthlyTrends,
                new_accounts: newAccounts,
                period_months: parseInt(months)
            }
        });
    } catch (error) {
        console.error('❌ Get trends error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get trends',
            error: error.message
        });
    }
});

// ============================================
// ⭐ EXPORT REPORT - አዲስ
// ============================================
router.get('/reports/export', protect, accountantOnly, async (req, res) => {
    try {
        const { type, start_date, end_date } = req.query;
        
        let query = '';
        let filename = '';
        const params = [];
        
        if (type === 'transactions') {
            query = `
                SELECT 
                    t.id as transaction_id,
                    t.transaction_type,
                    t.amount,
                    t.description,
                    t.reference_number,
                    t.status,
                    t.created_at,
                    a.account_number,
                    u.full_name as customer_name,
                    u.email as customer_email
                FROM transactions t
                JOIN accounts a ON t.account_id = a.id
                JOIN users u ON a.user_id = u.id
                WHERE DATE(t.created_at) BETWEEN ? AND ?
                AND t.status = 'completed'
                ORDER BY t.created_at DESC
            `;
            params.push(start_date, end_date);
            filename = `transactions_${start_date}_to_${end_date}.csv`;
        } else if (type === 'accounts') {
            query = `
                SELECT 
                    a.account_number,
                    a.account_type,
                    a.balance,
                    a.currency,
                    a.status,
                    a.created_at,
                    u.full_name as customer_name,
                    u.email as customer_email,
                    u.phone as customer_phone
                FROM accounts a
                JOIN users u ON a.user_id = u.id
                WHERE a.status = 'active'
                ORDER BY a.balance DESC
            `;
            filename = 'accounts_report.csv';
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid export type'
            });
        }
        
        const [results] = await pool.query(query, params);
        
        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No data found for export'
            });
        }
        
        // Convert to CSV
        const headers = Object.keys(results[0]);
        const rows = results.map(row => 
            headers.map(header => 
                typeof row[header] === 'string' && row[header].includes(',') 
                    ? `"${row[header]}"` 
                    : row[header]
            ).join(',')
        );
        
        const csv = [headers.join(','), ...rows].join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.send(csv);
        
    } catch (error) {
        console.error('❌ Export report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export report',
            error: error.message
        });
    }
});

module.exports = router;