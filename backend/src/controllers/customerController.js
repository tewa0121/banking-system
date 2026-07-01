const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

// ============================================
// Get Customer Profile
// ============================================
exports.getProfile = async (req, res) => {
    try {
        const [users] = await pool.query(
            `SELECT id, full_name, email, phone, address, role, status, 
                    profile_image, created_at, last_login 
             FROM users 
             WHERE id = ?`,
            [req.user.id]
        );
        
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            data: users[0]
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get profile',
            error: error.message
        });
    }
};

// ============================================
// Update Customer Profile
// ============================================
exports.updateProfile = async (req, res) => {
    try {
        const { full_name, phone, address } = req.body;
        
        await pool.query(
            'UPDATE users SET full_name = ?, phone = ?, address = ? WHERE id = ?',
            [full_name, phone, address, req.user.id]
        );
        
        res.json({
            success: true,
            message: 'Profile updated successfully'
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: error.message
        });
    }
};

// ============================================
// Change Password
// ============================================
exports.changePassword = async (req, res) => {
    try {
        const { current_password, new_password } = req.body;
        
        const [users] = await pool.query(
            'SELECT password_hash FROM users WHERE id = ?',
            [req.user.id]
        );
        
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        const isMatch = await bcrypt.compare(current_password, users[0].password_hash);
        
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(new_password, salt);
        
        await pool.query(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [hashedPassword, req.user.id]
        );
        
        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password',
            error: error.message
        });
    }
};

// ============================================
// Get Customer Accounts
// ============================================
exports.getAccounts = async (req, res) => {
    try {
        const [accounts] = await pool.query(`
            SELECT 
                id, account_number, account_type, balance, 
                currency, status, created_at
            FROM accounts 
            WHERE user_id = ?
            ORDER BY created_at DESC
        `, [req.user.id]);
        
        res.json({
            success: true,
            count: accounts.length,
            data: accounts
        });
    } catch (error) {
        console.error('Get accounts error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get accounts',
            error: error.message
        });
    }
};

// ============================================
// Get Account Details
// ============================================
exports.getAccountDetails = async (req, res) => {
    try {
        const { account_id } = req.params;
        
        const [accounts] = await pool.query(`
            SELECT 
                id, account_number, account_type, balance, 
                currency, status, created_at
            FROM accounts 
            WHERE id = ? AND user_id = ?
        `, [account_id, req.user.id]);
        
        if (accounts.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Account not found or you do not have access'
            });
        }
        
        res.json({
            success: true,
            data: accounts[0]
        });
    } catch (error) {
        console.error('Get account details error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get account details',
            error: error.message
        });
    }
};

// ============================================
// Get Account Transactions
// ============================================
exports.getAccountTransactions = async (req, res) => {
    try {
        const { account_id } = req.params;
        const { limit = 50, page = 1 } = req.query;
        const offset = (page - 1) * limit;
        
        // አካውንቱ የደንበኛው መሆኑን ማረጋገጥ
        const [accountCheck] = await pool.query(
            'SELECT id FROM accounts WHERE id = ? AND user_id = ?',
            [account_id, req.user.id]
        );
        
        if (accountCheck.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this account'
            });
        }
        
        const [transactions] = await pool.query(`
            SELECT 
                id, transaction_type, amount, description,
                reference_number, status, created_at
            FROM transactions 
            WHERE account_id = ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `, [account_id, parseInt(limit), parseInt(offset)]);
        
        const [total] = await pool.query(
            'SELECT COUNT(*) as total FROM transactions WHERE account_id = ?',
            [account_id]
        );
        
        res.json({
            success: true,
            data: {
                transactions,
                pagination: {
                    total: total[0].total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(total[0].total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get account transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get transactions',
            error: error.message
        });
    }
};

// ============================================
// Transfer Between Own Accounts
// ============================================
exports.transferBetweenAccounts = async (req, res) => {
    const { from_account_id, to_account_id, amount, description } = req.body;
    
    if (amount <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Amount must be greater than 0'
        });
    }
    
    if (from_account_id === to_account_id) {
        return res.status(400).json({
            success: false,
            message: 'Cannot transfer to the same account'
        });
    }
    
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // ከአካውንቱ የደንበኛው መሆኑን ማረጋገጥ
        const [fromAccounts] = await connection.query(
            'SELECT id, balance FROM accounts WHERE id = ? AND user_id = ? AND status = "active"',
            [from_account_id, req.user.id]
        );
        
        if (fromAccounts.length === 0) {
            await connection.rollback();
            return res.status(403).json({
                success: false,
                message: 'Source account not found or you do not have access'
            });
        }
        
        if (fromAccounts[0].balance < amount) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Insufficient balance'
            });
        }
        
        // መድረሻ አካውንቱ የደንበኛው መሆኑን ማረጋገጥ
        const [toAccounts] = await connection.query(
            'SELECT id FROM accounts WHERE id = ? AND user_id = ? AND status = "active"',
            [to_account_id, req.user.id]
        );
        
        if (toAccounts.length === 0) {
            await connection.rollback();
            return res.status(403).json({
                success: false,
                message: 'Destination account not found or you do not have access'
            });
        }
        
        const reference_number = 'TRF' + Date.now().toString().slice(-12);
        
        // ወጪ ግብይት
        await connection.query(
            `INSERT INTO transactions 
             (account_id, transaction_type, amount, description, reference_number, status) 
             VALUES (?, 'transfer', ?, ?, ?, 'completed')`,
            [from_account_id, -amount, `Transfer to account ${to_account_id} - ${description || ''}`, reference_number]
        );
        
        // ገቢ ግብይት
        await connection.query(
            `INSERT INTO transactions 
             (account_id, transaction_type, amount, description, reference_number, status) 
             VALUES (?, 'transfer', ?, ?, ?, 'completed')`,
            [to_account_id, amount, `Transfer from account ${from_account_id} - ${description || ''}`, reference_number]
        );
        
        // አካውንቶችን ማሻሻል
        await connection.query(
            'UPDATE accounts SET balance = balance - ? WHERE id = ?',
            [amount, from_account_id]
        );
        await connection.query(
            'UPDATE accounts SET balance = balance + ? WHERE id = ?',
            [amount, to_account_id]
        );
        
        await connection.commit();
        
        res.json({
            success: true,
            message: 'Transfer completed successfully',
            data: { reference_number, amount }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Transfer between accounts error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to transfer',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

// ============================================
// Get Total Balance Summary
// ============================================
exports.getBalanceSummary = async (req, res) => {
    try {
        const [summary] = await pool.query(`
            SELECT 
                COUNT(*) as total_accounts,
                SUM(balance) as total_balance,
                AVG(balance) as average_balance,
                SUM(CASE WHEN balance < 0 THEN 1 ELSE 0 END) as negative_accounts
            FROM accounts 
            WHERE user_id = ? AND status = 'active'
        `, [req.user.id]);
        
        // በአካውንት አይነት የተከፋፈለ
        const [byType] = await pool.query(`
            SELECT 
                account_type,
                COUNT(*) as count,
                SUM(balance) as total_balance
            FROM accounts 
            WHERE user_id = ? AND status = 'active'
            GROUP BY account_type
        `, [req.user.id]);
        
        res.json({
            success: true,
            data: {
                summary: summary[0],
                by_type: byType
            }
        });
    } catch (error) {
        console.error('Get balance summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get balance summary',
            error: error.message
        });
    }
};

// ============================================
// Get Notifications
// ============================================
exports.getNotifications = async (req, res) => {
    try {
        const { limit = 20, unread_only } = req.query;
        
        let query = `
            SELECT id, title, message, type, is_read, link, created_at
            FROM notifications 
            WHERE user_id = ?
        `;
        const params = [req.user.id];
        
        if (unread_only === 'true') {
            query += ' AND is_read = 0';
        }
        
        query += ' ORDER BY created_at DESC LIMIT ?';
        params.push(parseInt(limit));
        
        const [notifications] = await pool.query(query, params);
        
        // ያልተነበቡ ማሳወቂያዎች ብዛት
        const [unreadCount] = await pool.query(
            'SELECT COUNT(*) as total FROM notifications WHERE user_id = ? AND is_read = 0',
            [req.user.id]
        );
        
        res.json({
            success: true,
            data: {
                notifications,
                unread_count: unreadCount[0].total
            }
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get notifications',
            error: error.message
        });
    }
};

// ============================================
// Mark Notification as Read
// ============================================
exports.markNotificationRead = async (req, res) => {
    try {
        const { notification_id } = req.params;
        
        const [result] = await pool.query(
            'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
            [notification_id, req.user.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read',
            error: error.message
        });
    }
};

// ============================================
// Mark All Notifications as Read
// ============================================
exports.markAllNotificationsRead = async (req, res) => {
    try {
        await pool.query(
            'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
            [req.user.id]
        );
        
        res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Mark all notifications read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark all notifications as read',
            error: error.message
        });
    }
};

// ============================================
// Delete Notification
// ============================================
exports.deleteNotification = async (req, res) => {
    try {
        const { notification_id } = req.params;
        
        const [result] = await pool.query(
            'DELETE FROM notifications WHERE id = ? AND user_id = ?',
            [notification_id, req.user.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete notification',
            error: error.message
        });
    }
};

// ============================================
// Upload Profile Image
// ============================================
exports.uploadProfileImage = async (req, res) => {
    try {
        // ይህንን ከማስቀመጫ (storage) አገልግሎት ጋር ማገናኘት ያስፈልጋል
        const { image_url } = req.body;
        
        await pool.query(
            'UPDATE users SET profile_image = ? WHERE id = ?',
            [image_url, req.user.id]
        );
        
        res.json({
            success: true,
            message: 'Profile image updated successfully'
        });
    } catch (error) {
        console.error('Upload profile image error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload profile image',
            error: error.message
        });
    }
};

// ============================================
// Get Account Statement (PDF/CSV)
// ============================================
exports.getAccountStatement = async (req, res) => {
    try {
        const { account_id } = req.params;
        const { start_date, end_date, format = 'json' } = req.query;
        
        // አካውንቱ የደንበኛው መሆኑን ማረጋገጥ
        const [accountCheck] = await pool.query(
            'SELECT account_number, balance FROM accounts WHERE id = ? AND user_id = ?',
            [account_id, req.user.id]
        );
        
        if (accountCheck.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this account'
            });
        }
        
        let query = `
            SELECT 
                created_at as date,
                transaction_type as type,
                amount,
                description,
                reference_number,
                status
            FROM transactions 
            WHERE account_id = ?
            AND status = 'completed'
        `;
        const params = [account_id];
        
        if (start_date) {
            query += ' AND DATE(created_at) >= ?';
            params.push(start_date);
        }
        
        if (end_date) {
            query += ' AND DATE(created_at) <= ?';
            params.push(end_date);
        }
        
        query += ' ORDER BY created_at ASC';
        
        const [transactions] = await pool.query(query, params);
        
        // Calculate running balance
        let running_balance = 0;
        const statement = transactions.map(t => {
            const amount = parseFloat(t.amount);
            running_balance += amount;
            return {
                ...t,
                amount: amount,
                running_balance: running_balance
            };
        });
        
        if (format === 'csv') {
            const headers = ['Date', 'Type', 'Amount', 'Description', 'Reference', 'Running Balance'];
            const rows = statement.map(t => [
                t.date,
                t.type,
                t.amount,
                t.description || '',
                t.reference_number || '',
                t.running_balance
            ].join(','));
            
            const csv = [headers.join(','), ...rows].join('\n');
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=statement_${accountCheck[0].account_number}.csv`);
            return res.send(csv);
        }
        
        res.json({
            success: true,
            data: {
                account: {
                    account_number: accountCheck[0].account_number,
                    current_balance: accountCheck[0].balance
                },
                period: {
                    start_date: start_date || 'All time',
                    end_date: end_date || 'Now'
                },
                transactions: statement,
                total_transactions: statement.length,
                total_credits: statement.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0),
                total_debits: statement.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0)
            }
        });
    } catch (error) {
        console.error('Get account statement error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get account statement',
            error: error.message
        });
    }
};