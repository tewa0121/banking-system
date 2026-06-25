const { Account, Transaction } = require('../models');

// ============================================
// Generate Account Statement
// ============================================
exports.getAccountStatement = async (req, res) => {
    try {
        const { account_id } = req.params;
        const { startDate, endDate } = req.query;

        const account = await Account.findById(account_id);
        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Account not found'
            });
        }

        let query = 'SELECT * FROM transactions WHERE account_id = ?';
        const params = [account_id];

        if (startDate) {
            query += ' AND DATE(created_at) >= ?';
            params.push(startDate);
        }

        if (endDate) {
            query += ' AND DATE(created_at) <= ?';
            params.push(endDate);
        }

        query += ' ORDER BY created_at DESC';

        const { pool } = require('../config/database');
        const [transactions] = await pool.execute(query, params);

        // Calculate summary
        let totalDeposits = 0;
        let totalWithdrawals = 0;
        let totalTransfers = 0;

        transactions.forEach(tx => {
            if (tx.transaction_type === 'deposit') totalDeposits += parseFloat(tx.amount);
            else if (tx.transaction_type === 'withdraw') totalWithdrawals += parseFloat(tx.amount);
            else if (tx.transaction_type === 'transfer') totalTransfers += parseFloat(tx.amount);
        });

        res.status(200).json({
            success: true,
            data: {
                account: account,
                transactions: transactions,
                summary: {
                    totalDeposits,
                    totalWithdrawals,
                    totalTransfers,
                    netChange: totalDeposits - (totalWithdrawals + totalTransfers),
                    startBalance: parseFloat(account.balance) - (totalDeposits - totalWithdrawals - totalTransfers),
                    endBalance: parseFloat(account.balance)
                }
            }
        });
    } catch (error) {
        console.error('Get account statement error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate statement',
            error: error.message
        });
    }
};