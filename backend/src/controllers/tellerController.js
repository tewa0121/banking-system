const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

// ============================================
// Get Customers
// ============================================
exports.getCustomers = async (req, res) => {
    try {
        const [customers] = await pool.query(`
            SELECT id, full_name, email, phone, address, status, created_at 
            FROM users 
            WHERE role = 'customer'
            ORDER BY created_at DESC
        `);
        
        res.json({
            success: true,
            count: customers.length,
            data: customers
        });
    } catch (error) {
        console.error('Get customers error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get customers',
            error: error.message
        });
    }
};

// ============================================
// Get Customer by ID
// ============================================
exports.getCustomerById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [customers] = await pool.query(`
            SELECT id, full_name, email, phone, address, status, created_at 
            FROM users 
            WHERE id = ? AND role = 'customer'
        `, [id]);
        
        if (customers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }
        
        // የደንበኛውን አካውንቶች ማየት
        const [accounts] = await pool.query(`
            SELECT id, account_number, account_type, balance, currency, status 
            FROM accounts 
            WHERE user_id = ?
        `, [id]);
        
        res.json({
            success: true,
            data: {
                ...customers[0],
                accounts
            }
        });
    } catch (error) {
        console.error('Get customer error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get customer',
            error: error.message
        });
    }
};

// ============================================
// Create Customer
// ============================================
exports.createCustomer = async (req, res) => {
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
             VALUES (?, ?, ?, ?, ?, 'customer')`,
            [full_name, email, hashedPassword, phone, address]
        );
        
        // ማሳወቂያ ፍጠር
        await pool.query(
            `INSERT INTO notifications (user_id, title, message, type) 
             VALUES (?, 'Welcome to the Bank', 'Your account has been created successfully. Welcome to our banking system!', 'success')`,
            [result.insertId]
        );
        
        res.json({
            success: true,
            message: 'Customer created successfully',
            data: { id: result.insertId, email, role: 'customer' }
        });
    } catch (error) {
        console.error('Create customer error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create customer',
            error: error.message
        });
    }
};

// ============================================
// Get Accounts
// ============================================
exports.getAccounts = async (req, res) => {
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
// Create Account
// ============================================
exports.createAccount = async (req, res) => {
    try {
        const { user_id, account_type, initial_deposit } = req.body;
        
        // ተጠቃሚው መኖሩን ማረጋገጥ
        const [users] = await pool.query(
            'SELECT id FROM users WHERE id = ?',
            [user_id]
        );
        
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        const account_number = 'ACC' + Date.now().toString().slice(-10);
        
        const [result] = await pool.query(
            `INSERT INTO accounts (user_id, account_number, account_type, balance) 
             VALUES (?, ?, ?, ?)`,
            [user_id, account_number, account_type, initial_deposit || 0]
        );
        
        // ማሳወቂያ ፍጠር
        await pool.query(
            `INSERT INTO notifications (user_id, title, message, type) 
             VALUES (?, 'New Account Created', 'Your new account has been created successfully. Account number: ?', 'success')`,
            [user_id, account_number]
        );
        
        res.json({
            success: true,
            message: 'Account created successfully',
            data: {
                id: result.insertId,
                account_number
            }
        });
    } catch (error) {
        console.error('Create account error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create account',
            error: error.message
        });
    }
};

// ============================================
// Get Account Balance
// ============================================
exports.getAccountBalance = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [accounts] = await pool.query(`
            SELECT a.*, u.full_name as customer_name 
            FROM accounts a
            JOIN users u ON a.user_id = u.id
            WHERE a.id = ?
        `, [id]);
        
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
        console.error('Get balance error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get balance',
            error: error.message
        });
    }
};

// ============================================
// Deposit
// ============================================
exports.deposit = async (req, res) => {
    try {
        const { account_id, amount, description } = req.body;
        
        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be greater than 0'
            });
        }
        
        const [accounts] = await pool.query(
            'SELECT id, user_id FROM accounts WHERE id = ?',
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
        
        // ማሳወቂያ ፍጠር
        await pool.query(
            `INSERT INTO notifications (user_id, title, message, type) 
             VALUES (?, 'Deposit Successful', 'Amount ETB ${amount} has been deposited to your account. Reference: ${reference_number}', 'success')`,
            [accounts[0].user_id]
        );
        
        res.json({
            success: true,
            message: 'Deposit completed successfully',
            data: { reference_number, amount }
        });
    } catch (error) {
        console.error('Deposit error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to deposit',
            error: error.message
        });
    }
};

// ============================================
// Withdraw
// ============================================
exports.withdraw = async (req, res) => {
    try {
        const { account_id, amount, description } = req.body;
        
        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be greater than 0'
            });
        }
        
        const [accounts] = await pool.query(
            'SELECT id, user_id, balance FROM accounts WHERE id = ?',
            [account_id]
        );
        
        if (accounts.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Account not found'
            });
        }
        
        if (accounts[0].balance < amount) {
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
        
        // ማሳወቂያ ፍጠር
        await pool.query(
            `INSERT INTO notifications (user_id, title, message, type) 
             VALUES (?, 'Withdrawal Successful', 'Amount ETB ${amount} has been withdrawn from your account. Reference: ${reference_number}', 'info')`,
            [accounts[0].user_id]
        );
        
        res.json({
            success: true,
            message: 'Withdrawal completed successfully',
            data: { reference_number, amount }
        });
    } catch (error) {
        console.error('Withdraw error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to withdraw',
            error: error.message
        });
    }
};

// ============================================
// Transfer
// ============================================
exports.transfer = async (req, res) => {
    const { from_account_id, to_account_id, amount, description } = req.body;
    
    if (amount <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Amount must be greater than 0'
        });
    }
    
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const [fromAccounts] = await connection.query(
            'SELECT id, user_id, balance FROM accounts WHERE id = ?',
            [from_account_id]
        );
        
        if (fromAccounts.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Source account not found'
            });
        }
        
        if (fromAccounts[0].balance < amount) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Insufficient balance'
            });
        }
        
        const [toAccounts] = await connection.query(
            'SELECT id FROM accounts WHERE id = ?',
            [to_account_id]
        );
        
        if (toAccounts.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Destination account not found'
            });
        }
        
        const reference_number = 'TRF' + Date.now().toString().slice(-12);
        
        // ወጪ ግብይት
        await connection.query(
            `INSERT INTO transactions 
             (account_id, transaction_type, amount, description, reference_number, status) 
             VALUES (?, 'transfer', ?, ?, ?, 'completed')`,
            [from_account_id, -amount, `Transfer to ${to_account_id} - ${description || ''}`, reference_number]
        );
        
        // ገቢ ግብይት
        await connection.query(
            `INSERT INTO transactions 
             (account_id, transaction_type, amount, description, reference_number, status) 
             VALUES (?, 'transfer', ?, ?, ?, 'completed')`,
            [to_account_id, amount, `Transfer from ${from_account_id} - ${description || ''}`, reference_number]
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
        
        // ማሳወቂያዎች ፍጠር
        await pool.query(
            `INSERT INTO notifications (user_id, title, message, type) 
             VALUES (?, 'Transfer Sent', 'Amount ETB ${amount} transferred to account ${to_account_id}. Reference: ${reference_number}', 'info')`,
            [fromAccounts[0].user_id]
        );
        
        res.json({
            success: true,
            message: 'Transfer completed successfully',
            data: { reference_number, amount }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Transfer error:', error);
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
// Get Transactions
// ============================================
exports.getTransactions = async (req, res) => {
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
        
        res.json({
            success: true,
            count: transactions.length,
            data: transactions
        });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get transactions',
            error: error.message
        });
    }
};