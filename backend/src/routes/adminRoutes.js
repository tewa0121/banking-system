const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

// ============================================
// GET STATS - የተሻሻለ (Active Users ጨምሮ)
// ============================================
router.get('/stats', protect, adminOnly, async (req, res) => {
    try {
        // ጠቅላላ ተጠቃሚዎች
        const [userCount] = await pool.query('SELECT COUNT(*) as total FROM users');
        
        // ንቁ ተጠቃሚዎች
        const [activeUsers] = await pool.query("SELECT COUNT(*) as total FROM users WHERE status = 'active'");
        console.log('✅ Active users count:', activeUsers[0].total);
        
        // ጠቅላላ አካውንቶች
        const [accountCount] = await pool.query('SELECT COUNT(*) as total FROM accounts');
        
        // ጠቅላላ ግብይቶች
        const [transactionCount] = await pool.query('SELECT COUNT(*) as total FROM transactions');
        
        // ጠቅላላ ቀሪ ሂሳብ
        const [totalBalance] = await pool.query('SELECT SUM(balance) as total FROM accounts');
        
        // የዛሬ ግብይቶች
        const [todayTransactions] = await pool.query(
            'SELECT COUNT(*) as total FROM transactions WHERE DATE(created_at) = CURDATE()'
        );
        
        // በሚና የተከፋፈሉ ተጠቃሚዎች
        const [roleCounts] = await pool.query(`
            SELECT role, COUNT(*) as count 
            FROM users 
            GROUP BY role
        `);
        
        const roles = {};
        roleCounts.forEach(r => { roles[r.role] = r.count; });
        
        // የቅርብ ጊዜ ግብይቶች
        const [recentTransactions] = await pool.query(`
            SELECT t.*, u.full_name, a.account_number
            FROM transactions t
            JOIN accounts a ON t.account_id = a.id
            JOIN users u ON a.user_id = u.id
            ORDER BY t.created_at DESC
            LIMIT 10
        `);
        
        res.json({
            success: true,
            data: {
                totalUsers: userCount[0].total || 0,
                activeUsers: activeUsers[0].total || 0,
                totalAccounts: accountCount[0].total || 0,
                totalTransactions: transactionCount[0].total || 0,
                totalBalance: totalBalance[0].total || 0,
                todayTransactions: todayTransactions[0].total || 0,
                byRole: roles,
                recentTransactions: recentTransactions || []
            }
        });
    } catch (error) {
        console.error('❌ Stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get stats',
            error: error.message
        });
    }
});

// ============================================
// GET ALL USERS
// ============================================
router.get('/users', protect, adminOnly, async (req, res) => {
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
        console.error('❌ Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get users',
            error: error.message
        });
    }
});

// ============================================
// GET USER BY ID
// ============================================
router.get('/users/:id', protect, adminOnly, async (req, res) => {
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
        
        const [accounts] = await pool.query(
            'SELECT id, account_number, account_type, balance, currency, status FROM accounts WHERE user_id = ?',
            [id]
        );
        
        res.json({
            success: true,
            data: {
                ...users[0],
                accounts
            }
        });
    } catch (error) {
        console.error('❌ Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user',
            error: error.message
        });
    }
});

// ============================================
// UPDATE USER ROLE
// ============================================
router.put('/users/:id/role', protect, adminOnly, async (req, res) => {
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
        
        res.json({
            success: true,
            message: `User role updated to ${role}`
        });
    } catch (error) {
        console.error('❌ Update role error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update role',
            error: error.message
        });
    }
});

// ============================================
// UPDATE USER STATUS
// ============================================
router.put('/users/:id/status', protect, adminOnly, async (req, res) => {
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
        
        res.json({
            success: true,
            message: `User status updated to ${status}`
        });
    } catch (error) {
        console.error('❌ Update status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update status',
            error: error.message
        });
    }
});

// ============================================
// ⭐ DELETE USER - አዲስ ተጨምሯል
// ============================================
router.delete('/users/:id', protect, adminOnly, async (req, res) => {
    try {
        const { id } = req.params;
        
        // አስተዳዳሪ ራሱን መሰረዝ አይችልም
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own account'
            });
        }
        
        // ተጠቃሚው መኖሩን ያረጋግጡ
        const [users] = await pool.query('SELECT id FROM users WHERE id = ?', [id]);
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // ተጠቃሚውን ያጥፉ
        const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('❌ Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user',
            error: error.message
        });
    }
});

// ============================================
// CREATE TELLER
// ============================================
router.post('/users/teller', protect, adminOnly, async (req, res) => {
    try {
        const { full_name, email, password, phone, address } = req.body;
        
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
        
        res.json({
            success: true,
            message: 'Teller created successfully',
            data: { id: result.insertId }
        });
    } catch (error) {
        console.error('❌ Create teller error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create teller',
            error: error.message
        });
    }
});

// ============================================
// GET ALL ACCOUNTS
// ============================================
router.get('/accounts', protect, adminOnly, async (req, res) => {
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
// GET ALL TRANSACTIONS
// ============================================
router.get('/transactions', protect, adminOnly, async (req, res) => {
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
        console.error('❌ Get transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get transactions',
            error: error.message
        });
    }
});

// ============================================
// GET AUDIT LOGS
// ============================================
router.get('/audit-logs', protect, adminOnly, async (req, res) => {
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
        console.error('❌ Get audit logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get audit logs',
            error: error.message
        });
    }
});

// ============================================
// ⭐ GET SETTINGS
// ============================================
router.get('/settings', protect, adminOnly, async (req, res) => {
    try {
        const [settings] = await pool.query('SELECT * FROM settings WHERE id = 1');
        
        if (settings.length === 0) {
            // ካልሆነ ነባሪ መቼቶችን ይፍጠሩ
            await pool.query(`
                INSERT INTO settings (interest_rate, transaction_limit, maintenance_mode, currency)
                VALUES (5.00, 100000, 0, 'ETB')
            `);
            const [newSettings] = await pool.query('SELECT * FROM settings WHERE id = 1');
            return res.json({
                success: true,
                data: newSettings[0]
            });
        }
        
        res.json({
            success: true,
            data: settings[0]
        });
    } catch (error) {
        console.error('❌ Get settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get settings',
            error: error.message
        });
    }
});

// ============================================
// ⭐ UPDATE SETTINGS - የተሻሻለ
// ============================================
router.put('/settings', protect, adminOnly, async (req, res) => {
    try {
        const { interest_rate, transaction_limit, maintenance_mode, currency } = req.body;
        
        console.log('📥 Updating settings:', { interest_rate, transaction_limit, maintenance_mode, currency });
        
        // ሰንጠረዡ መኖሩን ያረጋግጡ
        const [settings] = await pool.query('SELECT * FROM settings WHERE id = 1');
        
        if (settings.length === 0) {
            // ካልሆነ አዲስ ይፍጠሩ
            await pool.query(`
                INSERT INTO settings (interest_rate, transaction_limit, maintenance_mode, currency, updated_by)
                VALUES (?, ?, ?, ?, ?)
            `, [interest_rate || 5.00, transaction_limit || 100000, maintenance_mode || 0, currency || 'ETB', req.user.id]);
            console.log('✅ New settings created');
        } else {
            // ካለ ያዘምኑ
            await pool.query(
                `UPDATE settings 
                 SET interest_rate = ?, 
                     transaction_limit = ?, 
                     maintenance_mode = ?, 
                     currency = ?,
                     updated_by = ? 
                 WHERE id = 1`,
                [interest_rate || 5.00, transaction_limit || 100000, maintenance_mode || 0, currency || 'ETB', req.user.id]
            );
            console.log('✅ Settings updated');
        }
        
        // የተሻሻለውን መረጃ መልሱ
        const [updatedSettings] = await pool.query('SELECT * FROM settings WHERE id = 1');
        
        res.json({
            success: true,
            message: 'Settings updated successfully',
            data: updatedSettings[0]
        });
    } catch (error) {
        console.error('❌ Update settings error:', error);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Failed to update settings',
            error: error.message
        });
    }
});

module.exports = router;