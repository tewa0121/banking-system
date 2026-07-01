const router = require('express').Router();
const { protect, auditorOnly } = require('../middleware/auth');
const { pool } = require('../config/database');

// ============================================
// GET AUDIT LOGS
// ============================================
router.get('/audit-logs', protect, auditorOnly, async (req, res) => {
    try {
        const [logs] = await pool.query(`
            SELECT al.*, u.full_name as user_name, u.email as user_email
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.id
            ORDER BY al.created_at DESC
            LIMIT 100
        `);
        res.json({ success: true, data: logs });
    } catch (error) {
        console.error('❌ Get audit logs error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// GET ALL TRANSACTIONS - የተሻሻለ
// ============================================
router.get('/transactions', protect, auditorOnly, async (req, res) => {
    try {
        // ⭐ performed_by አምድ ከሌለ ያስወግዱት
        const [transactions] = await pool.query(`
            SELECT 
                t.*, 
                a.account_number, 
                u.full_name as customer_name
                -- performed_by አምድ ከሌለ ይህን አስወግዱ
                -- p.full_name as performed_by_name
            FROM transactions t
            JOIN accounts a ON t.account_id = a.id
            JOIN users u ON a.user_id = u.id
            -- performed_by አምድ ከሌለ ይህን አስወግዱ
            -- LEFT JOIN users p ON t.performed_by = p.id
            ORDER BY t.created_at DESC
            LIMIT 100
        `);
        res.json({ success: true, data: transactions });
    } catch (error) {
        console.error('❌ Get transactions error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// GET SUSPICIOUS TRANSACTIONS - የተሻሻለ
// ============================================
router.get('/suspicious', protect, auditorOnly, async (req, res) => {
    try {
        const [suspicious] = await pool.query(`
            SELECT 
                t.*, 
                a.account_number, 
                u.full_name as customer_name
            FROM transactions t
            JOIN accounts a ON t.account_id = a.id
            JOIN users u ON a.user_id = u.id
            WHERE t.amount > 100000 OR t.status = 'failed'
            ORDER BY t.created_at DESC
            LIMIT 50
        `);
        res.json({ success: true, data: suspicious });
    } catch (error) {
        console.error('❌ Get suspicious error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// GET USER ACTIVITY
// ============================================
router.get('/users/:id/activity', protect, auditorOnly, async (req, res) => {
    try {
        const { id } = req.params;
        const [activities] = await pool.query(`
            SELECT action, details, created_at
            FROM audit_logs
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 50
        `, [id]);
        res.json({ success: true, data: activities });
    } catch (error) {
        console.error('❌ Get user activity error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// GET TRANSACTIONS WITH PERFORMED BY (አማራጭ - አምዱ ካለ)
// ============================================
router.get('/transactions-with-performer', protect, auditorOnly, async (req, res) => {
    try {
        // ይህን ራውት የሚጠቀሙት performed_by አምድ ካለ ብቻ ነው
        const [transactions] = await pool.query(`
            SELECT 
                t.*, 
                a.account_number, 
                u.full_name as customer_name,
                p.full_name as performed_by_name
            FROM transactions t
            JOIN accounts a ON t.account_id = a.id
            JOIN users u ON a.user_id = u.id
            LEFT JOIN users p ON t.performed_by = p.id
            ORDER BY t.created_at DESC
            LIMIT 100
        `);
        res.json({ success: true, data: transactions });
    } catch (error) {
        console.error('❌ Get transactions with performer error:', error);
        // አምዱ ከሌለ ስህተቱን ይያዙ
        res.status(500).json({ 
            success: false, 
            message: 'performed_by column does not exist in transactions table',
            error: error.message 
        });
    }
});

module.exports = router;