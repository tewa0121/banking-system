const router = require('express').Router();
const { protect, tellerOnly } = require('../middleware/auth');
const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

// ============================================
// GET CUSTOMERS
// ============================================
router.get('/customers', protect, tellerOnly, async (req, res) => {
    try {
        const [customers] = await pool.query(
            `SELECT id, full_name, email, phone, address, status, created_at 
             FROM users 
             WHERE role = 'customer' 
             ORDER BY created_at DESC`
        );
        res.json({ success: true, data: customers });
    } catch (error) {
        console.error('❌ Get customers error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// GET CUSTOMER BY ID
// ============================================
router.get('/customers/:id', protect, tellerOnly, async (req, res) => {
    try {
        const { id } = req.params;
        const [customers] = await pool.query(
            `SELECT id, full_name, email, phone, address, status, created_at 
             FROM users 
             WHERE id = ? AND role = 'customer'`,
            [id]
        );
        if (customers.length === 0) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }
        res.json({ success: true, data: customers[0] });
    } catch (error) {
        console.error('❌ Get customer error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// CREATE CUSTOMER
// ============================================
router.post('/customers', protect, tellerOnly, async (req, res) => {
    try {
        const { full_name, email, password, phone, address } = req.body;
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const [result] = await pool.query(
            `INSERT INTO users (full_name, email, password_hash, phone, address, role) 
             VALUES (?, ?, ?, ?, ?, 'customer')`,
            [full_name, email, hashedPassword, phone, address]
        );
        res.json({ success: true, message: 'Customer created', data: { id: result.insertId } });
    } catch (error) {
        console.error('❌ Create customer error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// GET ACCOUNTS
// ============================================
router.get('/accounts', protect, tellerOnly, async (req, res) => {
    try {
        const { user_id } = req.query;
        let query = `
            SELECT a.*, u.full_name as customer_name
            FROM accounts a
            JOIN users u ON a.user_id = u.id
        `;
        const params = [];
        if (user_id) {
            query += ' WHERE a.user_id = ?';
            params.push(user_id);
        }
        query += ' ORDER BY a.created_at DESC';
        const [accounts] = await pool.query(query, params);
        res.json({ success: true, data: accounts });
    } catch (error) {
        console.error('❌ Get accounts error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// CREATE ACCOUNT
// ============================================
router.post('/accounts', protect, tellerOnly, async (req, res) => {
    try {
        const { user_id, account_type, initial_deposit } = req.body;
        const [users] = await pool.query('SELECT id FROM users WHERE id = ?', [user_id]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const account_number = 'ACC' + Date.now().toString().slice(-10);
        const [result] = await pool.query(
            `INSERT INTO accounts (user_id, account_number, account_type, balance) 
             VALUES (?, ?, ?, ?)`,
            [user_id, account_number, account_type, initial_deposit || 0]
        );
        res.json({ success: true, message: 'Account created', data: { id: result.insertId, account_number } });
    } catch (error) {
        console.error('❌ Create account error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// GET ACCOUNT BALANCE
// ============================================
router.get('/accounts/:id/balance', protect, tellerOnly, async (req, res) => {
    try {
        const { id } = req.params;
        const [accounts] = await pool.query(`
            SELECT a.*, u.full_name as customer_name
            FROM accounts a
            JOIN users u ON a.user_id = u.id
            WHERE a.id = ?
        `, [id]);
        if (accounts.length === 0) {
            return res.status(404).json({ success: false, message: 'Account not found' });
        }
        res.json({ success: true, data: accounts[0] });
    } catch (error) {
        console.error('❌ Get balance error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// GET TRANSACTIONS
// ============================================
router.get('/transactions', protect, tellerOnly, async (req, res) => {
    try {
        const { account_id, limit = 50 } = req.query;
        let query = `
            SELECT t.*, a.account_number, u.full_name as customer_name
            FROM transactions t
            JOIN accounts a ON t.account_id = a.id
            JOIN users u ON a.user_id = u.id
        `;
        const params = [];
        if (account_id) {
            query += ' WHERE t.account_id = ?';
            params.push(account_id);
        }
        query += ' ORDER BY t.created_at DESC LIMIT ?';
        params.push(parseInt(limit));
        const [transactions] = await pool.query(query, params);
        res.json({ success: true, data: transactions });
    } catch (error) {
        console.error('❌ Get transactions error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// DEPOSIT
// ============================================
router.post('/transactions/deposit', protect, tellerOnly, async (req, res) => {
    try {
        const { account_id, amount, description } = req.body;
        
        if (!account_id || !amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid account or amount'
            });
        }
        
        const [accounts] = await pool.query(
            'SELECT id, balance FROM accounts WHERE id = ?',
            [account_id]
        );
        
        if (accounts.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Account not found'
            });
        }
        
        const reference_number = 'DEP' + Date.now().toString().slice(-12);
        
        await pool.query(
            `INSERT INTO transactions 
             (account_id, transaction_type, amount, description, reference_number, status) 
             VALUES (?, 'deposit', ?, ?, ?, 'completed')`,
            [account_id, amount, description, reference_number]
        );
        
        await pool.query(
            'UPDATE accounts SET balance = balance + ? WHERE id = ?',
            [amount, account_id]
        );
        
        res.json({
            success: true,
            message: 'Deposit successful',
            data: { reference_number, amount }
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
// WITHDRAW
// ============================================
router.post('/transactions/withdraw', protect, tellerOnly, async (req, res) => {
    try {
        const { account_id, amount, description } = req.body;
        
        if (!account_id || !amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid account or amount'
            });
        }
        
        const [accounts] = await pool.query(
            'SELECT id, balance FROM accounts WHERE id = ?',
            [account_id]
        );
        
        if (accounts.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Account not found'
            });
        }
        
        if (parseFloat(accounts[0].balance) < parseFloat(amount)) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient balance'
            });
        }
        
        const reference_number = 'WIT' + Date.now().toString().slice(-12);
        
        await pool.query(
            `INSERT INTO transactions 
             (account_id, transaction_type, amount, description, reference_number, status) 
             VALUES (?, 'withdraw', ?, ?, ?, 'completed')`,
            [account_id, -amount, description, reference_number]
        );
        
        await pool.query(
            'UPDATE accounts SET balance = balance - ? WHERE id = ?',
            [amount, account_id]
        );
        
        res.json({
            success: true,
            message: 'Withdrawal successful',
            data: { reference_number, amount }
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
// ⭐ TELLER TRANSFER - የተሻሻለ (ችግር ተፈትቷል)
// ============================================
router.post('/transactions/transfer', protect, tellerOnly, async (req, res) => {
    try {
        const { from_account_id, to_account_number, amount, description } = req.body;
        
        console.log('📥 Teller Transfer request received:');
        console.log('  from_account_id:', from_account_id);
        console.log('  to_account_number:', to_account_number);
        console.log('  amount:', amount);
        console.log('  description:', description);
        console.log('  performed_by:', req.user.id);
        
        // ⭐ መረጃ ማረጋገጫ
        if (!from_account_id) {
            console.log('❌ Missing from_account_id');
            return res.status(400).json({
                success: false,
                message: 'Source account ID is required'
            });
        }
        
        if (!to_account_number) {
            console.log('❌ Missing to_account_number');
            return res.status(400).json({
                success: false,
                message: 'Destination account number is required'
            });
        }
        
        const amountNum = parseFloat(amount);
        if (!amount || amountNum <= 0) {
            console.log('❌ Invalid amount:', amount);
            return res.status(400).json({
                success: false,
                message: 'Valid amount is required'
            });
        }
        
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();
            console.log('✅ Transaction started');
            
            // ⭐ ምንጭ አካውንት ማረጋገጥ
            console.log('🔍 Checking source account:', from_account_id);
            const [fromAccounts] = await connection.query(
                'SELECT id, balance, account_number FROM accounts WHERE id = ?',
                [from_account_id]
            );
            
            if (fromAccounts.length === 0) {
                console.log('❌ Source account not found');
                await connection.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Source account not found'
                });
            }
            console.log('✅ Source account found:', fromAccounts[0].account_number, 'Balance:', fromAccounts[0].balance);
            
            if (parseFloat(fromAccounts[0].balance) < amountNum) {
                console.log('❌ Insufficient balance:', fromAccounts[0].balance, '<', amountNum);
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient balance'
                });
            }
            
            // ⭐ መድረሻ አካውንት ማረጋገጥ (በaccount_number)
            console.log('🔍 Checking destination account:', to_account_number);
            const [toAccounts] = await connection.query(
                'SELECT id, account_number FROM accounts WHERE account_number = ?',
                [to_account_number]
            );
            
            if (toAccounts.length === 0) {
                console.log('❌ Destination account not found:', to_account_number);
                await connection.rollback();
                return res.status(404).json({
                    success: false,
                    message: `Destination account "${to_account_number}" not found. Please check the account number.`
                });
            }
            console.log('✅ Destination account found:', toAccounts[0].account_number);
            
            const to_account_id = toAccounts[0].id;
            
            // ⭐ አንድ አካውንት እንዳልሆነ ማረጋገጥ
            if (parseInt(from_account_id) === parseInt(to_account_id)) {
                console.log('❌ Cannot transfer to same account');
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Cannot transfer to the same account'
                });
            }
            
            const reference_number = 'TRF' + Date.now().toString().slice(-12);
            console.log('📝 Reference number:', reference_number);
            
            // ⭐ ቀሪ ሂሳቦችን ማሻሻል
            console.log('💰 Updating balances...');
            await connection.query(
                'UPDATE accounts SET balance = balance - ? WHERE id = ?',
                [amountNum, from_account_id]
            );
            await connection.query(
                'UPDATE accounts SET balance = balance + ? WHERE id = ?',
                [amountNum, to_account_id]
            );
            console.log('✅ Balances updated');
            
            // ⭐ ግብይቶችን መመዝገብ
            console.log('📝 Recording transactions...');
            await connection.query(
                `INSERT INTO transactions 
                 (account_id, transaction_type, amount, description, reference_number, status) 
                 VALUES (?, 'transfer', ?, ?, ?, 'completed')`,
                [from_account_id, -amountNum, description || `Transfer to ${to_account_number}`, reference_number]
            );
            await connection.query(
                `INSERT INTO transactions 
                 (account_id, transaction_type, amount, description, reference_number, status) 
                 VALUES (?, 'transfer', ?, ?, ?, 'completed')`,
                [to_account_id, amountNum, description || `Transfer from ${fromAccounts[0].account_number}`, reference_number]
            );
            console.log('✅ Transactions recorded');
            
            await connection.commit();
            console.log('✅ Transfer completed successfully');
            
            res.json({
                success: true,
                message: 'Transfer successful',
                data: {
                    reference_number,
                    amount: amountNum,
                    from_account: fromAccounts[0].account_number,
                    to_account: to_account_number
                }
            });
            
        } catch (error) {
            await connection.rollback();
            console.error('❌ Transaction error:', error);
            console.error('❌ Error message:', error.message);
            console.error('❌ Error stack:', error.stack);
            res.status(500).json({
                success: false,
                message: 'Transfer failed',
                error: error.message
            });
        } finally {
            connection.release();
            console.log('🔓 Connection released');
        }
        
    } catch (error) {
        console.error('❌ Transfer error:', error);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Transfer failed',
            error: error.message
        });
    }
});

module.exports = router;