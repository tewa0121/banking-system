const { Account, Transaction } = require('../models');

// ============================================
// Deposit - Add money to account
// ============================================
exports.deposit = async (req, res) => {
    try {
        const { account_id, amount, description } = req.body;

        if (!account_id || !amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid account ID and amount are required'
            });
        }

        const account = await Account.findById(account_id);
        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Account not found'
            });
        }

        const newBalance = parseFloat(account.balance) + parseFloat(amount);
        await Account.updateBalance(account_id, newBalance);

        const transaction = await Transaction.create({
            account_id: account_id,
            transaction_type: 'deposit',
            amount: amount,
            description: description || 'Deposit',
            status: 'completed'
        });

        const updatedAccount = await Account.findById(account_id);

        res.status(200).json({
            success: true,
            message: 'Deposit successful',
            data: {
                account: updatedAccount,
                transaction: transaction
            }
        });

    } catch (error) {
        console.error('Deposit error:', error);
        res.status(500).json({
            success: false,
            message: 'Deposit failed',
            error: error.message
        });
    }
};

// ============================================
// Withdraw - Remove money from account
// ============================================
exports.withdraw = async (req, res) => {
    try {
        const { account_id, amount, description } = req.body;

        if (!account_id || !amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid account ID and amount are required'
            });
        }

        const account = await Account.findById(account_id);
        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Account not found'
            });
        }

        if (parseFloat(account.balance) < parseFloat(amount)) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient balance'
            });
        }

        const newBalance = parseFloat(account.balance) - parseFloat(amount);
        await Account.updateBalance(account_id, newBalance);

        const transaction = await Transaction.create({
            account_id: account_id,
            transaction_type: 'withdraw',
            amount: amount,
            description: description || 'Withdrawal',
            status: 'completed'
        });

        const updatedAccount = await Account.findById(account_id);

        res.status(200).json({
            success: true,
            message: 'Withdrawal successful',
            data: {
                account: updatedAccount,
                transaction: transaction
            }
        });

    } catch (error) {
        console.error('Withdraw error:', error);
        res.status(500).json({
            success: false,
            message: 'Withdrawal failed',
            error: error.message
        });
    }
};

// ============================================
// Transfer - Send money to another account
// ============================================
exports.transfer = async (req, res) => {
    try {
        const { from_account_id, to_account_id, amount, description } = req.body;

        if (!from_account_id || !to_account_id || !amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid accounts and amount are required'
            });
        }

        if (from_account_id === to_account_id) {
            return res.status(400).json({
                success: false,
                message: 'Cannot transfer to the same account'
            });
        }

        const fromAccount = await Account.findById(from_account_id);
        const toAccount = await Account.findById(to_account_id);

        if (!fromAccount) {
            return res.status(404).json({
                success: false,
                message: 'Source account not found'
            });
        }

        if (!toAccount) {
            return res.status(404).json({
                success: false,
                message: 'Destination account not found'
            });
        }

        if (parseFloat(fromAccount.balance) < parseFloat(amount)) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient balance'
            });
        }

        const fromNewBalance = parseFloat(fromAccount.balance) - parseFloat(amount);
        const toNewBalance = parseFloat(toAccount.balance) + parseFloat(amount);

        await Account.updateBalance(from_account_id, fromNewBalance);
        await Account.updateBalance(to_account_id, toNewBalance);

        const transaction = await Transaction.create({
            account_id: from_account_id,
            transaction_type: 'transfer',
            amount: amount,
            description: description || `Transfer to account ${toAccount.account_number}`,
            status: 'completed'
        });

        const updatedFromAccount = await Account.findById(from_account_id);
        const updatedToAccount = await Account.findById(to_account_id);

        res.status(200).json({
            success: true,
            message: 'Transfer successful',
            data: {
                from_account: updatedFromAccount,
                to_account: updatedToAccount,
                transaction: transaction
            }
        });

    } catch (error) {
        console.error('Transfer error:', error);
        res.status(500).json({
            success: false,
            message: 'Transfer failed',
            error: error.message
        });
    }
};

exports.getTransactionHistory = async (req, res) => {
    try {
        const { account_id } = req.params;
        const { limit = 50 } = req.query;

        console.log('📥 Transaction history request for account:', account_id);

        if (!account_id) {
            return res.status(400).json({
                success: false,
                message: 'Account ID is required'
            });
        }

        const account = await Account.findById(account_id);
        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Account not found'
            });
        }

        // ⭐ ግብይቶቹን አምጣ
        const transactions = await Transaction.findByAccountId(account_id, limit);
        console.log('📥 Found transactions in DB:', transactions.length);
        console.log('📥 Transactions data:', JSON.stringify(transactions, null, 2));

        const summary = await Transaction.getAccountSummary(account_id);
        console.log('📥 Summary:', JSON.stringify(summary, null, 2));

        res.status(200).json({
            success: true,
            data: {
                account: account,
                transactions: transactions || [],
                summary: summary || { 
                    total_transactions: 0, 
                    total_deposits: 0, 
                    total_withdrawals: 0, 
                    total_transfers: 0 
                }
            }
        });

    } catch (error) {
        console.error('❌ Get transaction history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get transaction history',
            error: error.message
        });
    }
};

// ============================================
// Get Transaction by ID
// ============================================
exports.getTransactionById = async (req, res) => {
    try {
        const { id } = req.params;

        const transaction = await Transaction.findById(id);
        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        res.status(200).json({
            success: true,
            data: transaction
        });

    } catch (error) {
        console.error('Get transaction by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get transaction',
            error: error.message
        });
    }
};
// ============================================
// Get Filtered Transaction History
// ============================================
exports.getFilteredTransactions = async (req, res) => {
    try {
        const { account_id } = req.params;
        const { type, startDate, endDate, minAmount, maxAmount, limit = 50 } = req.query;

        if (!account_id) {
            return res.status(400).json({
                success: false,
                message: 'Account ID is required'
            });
        }

        const account = await Account.findById(account_id);
        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Account not found'
            });
        }

        let query = 'SELECT * FROM transactions WHERE account_id = ?';
        const params = [account_id];

        if (type && type !== 'all') {
            query += ' AND transaction_type = ?';
            params.push(type);
        }

        if (startDate) {
            query += ' AND DATE(created_at) >= ?';
            params.push(startDate);
        }

        if (endDate) {
            query += ' AND DATE(created_at) <= ?';
            params.push(endDate);
        }

        if (minAmount) {
            query += ' AND amount >= ?';
            params.push(minAmount);
        }

        if (maxAmount) {
            query += ' AND amount <= ?';
            params.push(maxAmount);
        }

        query += ' ORDER BY created_at DESC LIMIT ?';
        params.push(parseInt(limit));

        const { pool } = require('../config/database');
        const [transactions] = await pool.execute(query, params);

        res.status(200).json({
            success: true,
            count: transactions.length,
            data: transactions
        });
    } catch (error) {
        console.error('Get filtered transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get transactions',
            error: error.message
        });
    }
};