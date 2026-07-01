const router = require('express').Router();
const { protect, customerOnly } = require('../middleware/auth');
const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

// ============================================
// GET PROFILE
// ============================================
router.get('/profile', protect, customerOnly, async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT id, full_name, email, phone, address, status, profile_image, created_at FROM users WHERE id = ?',
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
        console.error('❌ Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get profile'
        });
    }
});

// ============================================
// UPDATE PROFILE
// ============================================
router.put('/profile', protect, customerOnly, async (req, res) => {
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
        console.error('❌ Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile'
        });
    }
});

// ============================================
// CHANGE PASSWORD
// ============================================
router.put('/profile/password', protect, customerOnly, async (req, res) => {
    try {
        const { current_password, new_password } = req.body;

        if (!current_password || !new_password) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        if (new_password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters'
            });
        }

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
        console.error('❌ Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password'
        });
    }
});

// ============================================
// GET ACCOUNTS
// ============================================
router.get('/accounts', protect, customerOnly, async (req, res) => {
    try {
        const [accounts] = await pool.query(
            'SELECT id, account_number, account_type, balance, currency, status, created_at FROM accounts WHERE user_id = ?',
            [req.user.id]
        );

        res.json({
            success: true,
            data: accounts
        });
    } catch (error) {
        console.error('❌ Get accounts error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get accounts'
        });
    }
});

// ============================================
// GET ACCOUNT DETAILS
// ============================================
router.get('/accounts/:id', protect, customerOnly, async (req, res) => {
    try {
        const { id } = req.params;

        const [accounts] = await pool.query(
            'SELECT id, account_number, account_type, balance, currency, status, created_at FROM accounts WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );

        if (accounts.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Account not found'
            });
        }

        res.json({
            success: true,
            data: accounts[0]
        });
    } catch (error) {
        console.error('❌ Get account error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get account'
        });
    }
});

// ============================================
// GET TRANSACTIONS
// ============================================
router.get('/accounts/:id/transactions', protect, customerOnly, async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 20, page = 1 } = req.query;
        const offset = (page - 1) * limit;

        const [accountCheck] = await pool.query(
            'SELECT id FROM accounts WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );

        if (accountCheck.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this account'
            });
        }

        const [transactions] = await pool.query(
            `SELECT id, transaction_type, amount, description, reference_number, status, created_at 
             FROM transactions 
             WHERE account_id = ? 
             ORDER BY created_at DESC 
             LIMIT ? OFFSET ?`,
            [id, parseInt(limit), parseInt(offset)]
        );

        const [total] = await pool.query(
            'SELECT COUNT(*) as total FROM transactions WHERE account_id = ?',
            [id]
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
        console.error('❌ Get transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get transactions'
        });
    }
});

// ============================================
// GET BALANCE SUMMARY
// ============================================
router.get('/balance-summary', protect, customerOnly, async (req, res) => {
    try {
        const [summary] = await pool.query(
            `SELECT 
                COUNT(*) as total_accounts,
                SUM(balance) as total_balance,
                AVG(balance) as average_balance
             FROM accounts 
             WHERE user_id = ? AND status = 'active'`,
            [req.user.id]
        );

        const [byType] = await pool.query(
            `SELECT 
                account_type,
                COUNT(*) as count,
                SUM(balance) as total_balance
             FROM accounts 
             WHERE user_id = ? AND status = 'active'
             GROUP BY account_type`,
            [req.user.id]
        );

        res.json({
            success: true,
            data: {
                summary: summary[0],
                by_type: byType
            }
        });
    } catch (error) {
        console.error('❌ Get balance summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get balance summary'
        });
    }
});

// ============================================
// ⭐ CUSTOMER DEPOSIT
// ============================================
router.post('/deposit', protect, customerOnly, async (req, res) => {
    try {
        const { account_id, amount, description } = req.body;
        
        console.log('📥 Deposit request:', { account_id, amount, description, user_id: req.user.id });

        if (!account_id) {
            return res.status(400).json({
                success: false,
                message: 'Account ID is required'
            });
        }

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid amount is required'
            });
        }

        // ⭐ አካውንቱ የደንበኛው መሆኑን ማረጋገጥ
        const [accounts] = await pool.query(
            'SELECT id, balance, user_id, account_number FROM accounts WHERE id = ? AND user_id = ?',
            [account_id, req.user.id]
        );

        if (accounts.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Account not found or you do not have access'
            });
        }

        const reference_number = 'DEP' + Date.now().toString().slice(-12);

        // ⭐ ግብይቱን መመዝገብ
        await pool.query(
            `INSERT INTO transactions 
             (account_id, transaction_type, amount, description, reference_number, status) 
             VALUES (?, 'deposit', ?, ?, ?, 'completed')`,
            [account_id, amount, description || 'Deposit', reference_number]
        );

        // ⭐ የአካውንት ቀሪ ሂሳብ ማሻሻል
        await pool.query(
            'UPDATE accounts SET balance = balance + ? WHERE id = ?',
            [amount, account_id]
        );

        // የተሻሻለውን ቀሪ ሂሳብ ለማግኘት
        const [updatedAccount] = await pool.query(
            'SELECT balance FROM accounts WHERE id = ?',
            [account_id]
        );

        console.log('✅ Deposit successful for account:', account_id);

        res.json({
            success: true,
            message: 'Deposit successful',
            data: { 
                reference_number, 
                amount,
                new_balance: parseFloat(updatedAccount[0].balance)
            }
        });

    } catch (error) {
        console.error('❌ Deposit error:', error);
        res.status(500).json({
            success: false,
            message: 'Deposit failed',
            error: error.message
        });
    }
});

// ============================================
// ⭐ CUSTOMER WITHDRAW
// ============================================
router.post('/withdraw', protect, customerOnly, async (req, res) => {
    try {
        const { account_id, amount, description } = req.body;
        
        console.log('📥 Withdraw request:', { account_id, amount, description, user_id: req.user.id });

        if (!account_id) {
            return res.status(400).json({
                success: false,
                message: 'Account ID is required'
            });
        }

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid amount is required'
            });
        }

        // ⭐ አካውንቱ የደንበኛው መሆኑን ማረጋገጥ
        const [accounts] = await pool.query(
            'SELECT id, balance, user_id, account_number FROM accounts WHERE id = ? AND user_id = ?',
            [account_id, req.user.id]
        );

        if (accounts.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Account not found or you do not have access'
            });
        }

        if (parseFloat(accounts[0].balance) < parseFloat(amount)) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient balance'
            });
        }

        const reference_number = 'WIT' + Date.now().toString().slice(-12);

        // ⭐ ግብይቱን መመዝገብ
        await pool.query(
            `INSERT INTO transactions 
             (account_id, transaction_type, amount, description, reference_number, status) 
             VALUES (?, 'withdraw', ?, ?, ?, 'completed')`,
            [account_id, -amount, description || 'Withdrawal', reference_number]
        );

        // ⭐ የአካውንት ቀሪ ሂሳብ ማሻሻል
        await pool.query(
            'UPDATE accounts SET balance = balance - ? WHERE id = ?',
            [amount, account_id]
        );

        // የተሻሻለውን ቀሪ ሂሳብ ለማግኘት
        const [updatedAccount] = await pool.query(
            'SELECT balance FROM accounts WHERE id = ?',
            [account_id]
        );

        console.log('✅ Withdrawal successful for account:', account_id);

        res.json({
            success: true,
            message: 'Withdrawal successful',
            data: { 
                reference_number, 
                amount,
                new_balance: parseFloat(updatedAccount[0].balance)
            }
        });

    } catch (error) {
        console.error('❌ Withdraw error:', error);
        res.status(500).json({
            success: false,
            message: 'Withdrawal failed',
            error: error.message
        });
    }
});

// ============================================
// ⭐ CUSTOMER TRANSFER - የተሻሻለ
// ============================================
router.post('/transfer', protect, customerOnly, async (req, res) => {
    const { from_account_id, to_account_number, amount, description } = req.body;
    
    console.log('📥 Customer Transfer request:', { 
        from_account_id, 
        to_account_number, 
        amount, 
        description,
        user_id: req.user.id 
    });

    if (!from_account_id) {
        return res.status(400).json({
            success: false,
            message: 'Source account ID is required'
        });
    }

    if (!to_account_number) {
        return res.status(400).json({
            success: false,
            message: 'Destination account number is required'
        });
    }

    if (!amount || amount <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Valid amount is required'
        });
    }

    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // ⭐ ምንጭ አካውንት ማረጋገጥ
        const [fromAccounts] = await connection.query(
            'SELECT id, balance, account_number FROM accounts WHERE id = ? AND user_id = ?',
            [from_account_id, req.user.id]
        );
        
        if (fromAccounts.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Source account not found or you do not have access'
            });
        }
        
        if (parseFloat(fromAccounts[0].balance) < parseFloat(amount)) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Insufficient balance'
            });
        }
        
        // ⭐ መድረሻ አካውንት ማረጋገጥ (በaccount_number)
        const [toAccounts] = await connection.query(
            'SELECT id, account_number FROM accounts WHERE account_number = ?',
            [to_account_number]
        );
        
        if (toAccounts.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: `Destination account "${to_account_number}" not found`
            });
        }
        
        const to_account_id = toAccounts[0].id;
        
        // ⭐ አንድ አካውንት እንዳልሆነ ማረጋገጥ
        if (parseInt(from_account_id) === parseInt(to_account_id)) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Cannot transfer to the same account'
            });
        }
        
        const reference_number = 'TRF' + Date.now().toString().slice(-12);
        
        // ⭐ ቀሪ ሂሳቦችን ማሻሻል
        await connection.query(
            'UPDATE accounts SET balance = balance - ? WHERE id = ?',
            [amount, from_account_id]
        );
        await connection.query(
            'UPDATE accounts SET balance = balance + ? WHERE id = ?',
            [amount, to_account_id]
        );
        
        // ⭐ ግብይቶችን መመዝገብ
        await connection.query(
            `INSERT INTO transactions 
             (account_id, transaction_type, amount, description, reference_number, status) 
             VALUES (?, 'transfer', ?, ?, ?, 'completed')`,
            [from_account_id, -amount, description || `Transfer to ${to_account_number}`, reference_number]
        );
        await connection.query(
            `INSERT INTO transactions 
             (account_id, transaction_type, amount, description, reference_number, status) 
             VALUES (?, 'transfer', ?, ?, ?, 'completed')`,
            [to_account_id, amount, description || `Transfer from ${fromAccounts[0].account_number}`, reference_number]
        );
        
        await connection.commit();
        
        console.log('✅ Customer transfer successful');
        
        res.json({
            success: true,
            message: 'Transfer successful',
            data: { 
                reference_number, 
                amount,
                from_account: fromAccounts[0].account_number,
                to_account: to_account_number
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error('❌ Transfer error:', error);
        res.status(500).json({
            success: false,
            message: 'Transfer failed',
            error: error.message
        });
    } finally {
        connection.release();
    }
});

// ============================================
// GET NOTIFICATIONS
// ============================================
router.get('/notifications', protect, customerOnly, async (req, res) => {
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

        const [unreadCount] = await pool.query(
            'SELECT COUNT(*) as total FROM notifications WHERE user_id = ? AND is_read = 0',
            [req.user.id]
        );

        res.json({
            success: true,
            data: {
                notifications: notifications || [],
                unread_count: unreadCount[0].total || 0
            }
        });
    } catch (error) {
        console.error('❌ Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get notifications'
        });
    }
});

// ============================================
// MARK NOTIFICATION AS READ
// ============================================
router.put('/notifications/:id/read', protect, customerOnly, async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query(
            'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
            [id, req.user.id]
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
        console.error('❌ Mark notification read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read'
        });
    }
});

// ============================================
// MARK ALL NOTIFICATIONS AS READ
// ============================================
router.put('/notifications/read-all', protect, customerOnly, async (req, res) => {
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
        console.error('❌ Mark all notifications read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark all notifications as read'
        });
    }
});

// ============================================
// DELETE NOTIFICATION
// ============================================
router.delete('/notifications/:id', protect, customerOnly, async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query(
            'DELETE FROM notifications WHERE id = ? AND user_id = ?',
            [id, req.user.id]
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
        console.error('❌ Delete notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete notification'
        });
    }
});

module.exports = router;