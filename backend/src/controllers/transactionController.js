const { Account, Transaction } = require('../models');
const { createNotification } = require('./notificationController');
const { createAuditLog } = require('./auditController');
const { VAT_RATE, VAT_ACCOUNT_ID, MAX_TRANSFER_AMOUNT, MIN_TRANSFER_AMOUNT } = require('../config/constants');

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

        // ⭐ Create notification for user
        await createNotification(
            account.user_id,
            '💰 Deposit Successful',
            `You have deposited ${amount} ETB. New balance: ${newBalance.toFixed(2)} ETB`,
            'success'
        );

        // ⭐ Create audit log
        await createAuditLog(
            account.user_id,
            'DEPOSIT',
            `Deposited ${amount} ETB to account ${account.account_number}. New balance: ${newBalance.toFixed(2)} ETB`,
            req.ip || '127.0.0.1'
        );

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

        // ⭐ Create notification for user
        await createNotification(
            account.user_id,
            '🏦 Withdrawal Successful',
            `You have withdrawn ${amount} ETB. New balance: ${newBalance.toFixed(2)} ETB`,
            'warning'
        );

        // ⭐ Create audit log
        await createAuditLog(
            account.user_id,
            'WITHDRAW',
            `Withdrew ${amount} ETB from account ${account.account_number}. New balance: ${newBalance.toFixed(2)} ETB`,
            req.ip || '127.0.0.1'
        );

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
// Transfer - Send money to another account (with VAT)
// ============================================
exports.transfer = async (req, res) => {
    try {
        const { from_account_id, to_account_id, amount, description } = req.body;

        // ============================================
        // 1. መረጃ ማረጋገጫ (Validation)
        // ============================================
        if (!from_account_id || !to_account_id || !amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid accounts and amount are required'
            });
        }

        if (amount < MIN_TRANSFER_AMOUNT) {
            return res.status(400).json({
                success: false,
                message: `Minimum transfer amount is ${MIN_TRANSFER_AMOUNT} ETB`
            });
        }

        if (amount > MAX_TRANSFER_AMOUNT) {
            return res.status(400).json({
                success: false,
                message: `Maximum transfer amount is ${MAX_TRANSFER_AMOUNT} ETB`
            });
        }

        if (from_account_id === to_account_id) {
            return res.status(400).json({
                success: false,
                message: 'Cannot transfer to the same account'
            });
        }

        // ============================================
        // 2. አካውንቶችን መፈለግ
        // ============================================
        const fromAccount = await Account.findById(from_account_id);
        const toAccount = await Account.findById(to_account_id);

        if (!fromAccount) {
            await createNotification(
                req.user.id,
                '❌ Transfer Failed',
                `Source account ${from_account_id} not found.`,
                'error'
            );
            return res.status(404).json({
                success: false,
                message: 'Source account not found'
            });
        }

        if (!toAccount) {
            await createNotification(
                req.user.id,
                '❌ Transfer Failed',
                `Destination account ${to_account_id} not found.`,
                'error'
            );
            return res.status(404).json({
                success: false,
                message: 'Destination account not found'
            });
        }

        if (fromAccount.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Source account is not active'
            });
        }

        // ============================================
        // 3. VAT ስሌት
        // ============================================
        const vatAmount = parseFloat(amount) * VAT_RATE;
        const totalDeduction = parseFloat(amount) + vatAmount;

        if (parseFloat(fromAccount.balance) < totalDeduction) {
            const shortAmount = totalDeduction - parseFloat(fromAccount.balance);
            await createNotification(
                fromAccount.user_id,
                '⚠️ Insufficient Balance',
                `You need ${totalDeduction.toFixed(2)} ETB (${amount} ETB + ${vatAmount.toFixed(2)} ETB VAT). You are short by ${shortAmount.toFixed(2)} ETB.`,
                'warning'
            );
            return res.status(400).json({
                success: false,
                message: `Insufficient balance. You need ${totalDeduction.toFixed(2)} ETB (${amount} ETB + ${vatAmount.toFixed(2)} ETB VAT)`
            });
        }

        // ============================================
        // 4. ቀሪ ሒሳብ ማሻሻል
        // ============================================
        const fromNewBalance = parseFloat(fromAccount.balance) - totalDeduction;
        const toNewBalance = parseFloat(toAccount.balance) + parseFloat(amount);

        await Account.updateBalance(from_account_id, fromNewBalance);
        await Account.updateBalance(to_account_id, toNewBalance);

        // ============================================
        // 5. ግብይት መመዝገብ
        // ============================================
        const transaction = await Transaction.create({
            account_id: from_account_id,
            transaction_type: 'transfer',
            amount: totalDeduction,
            description: description || 
                `Transfer to ${toAccount.account_number} | Amount: ${amount} ETB | VAT: ${vatAmount.toFixed(2)} ETB | Total: ${totalDeduction.toFixed(2)} ETB`,
            status: 'completed'
        });

        // ============================================
        // 6. VAT መመዝገብ (ወደ VAT አካውንት)
        // ============================================
        try {
            const vatAccount = await Account.findById(VAT_ACCOUNT_ID);
            if (vatAccount) {
                const vatNewBalance = parseFloat(vatAccount.balance) + vatAmount;
                await Account.updateBalance(VAT_ACCOUNT_ID, vatNewBalance);
                console.log(`💰 VAT of ${vatAmount.toFixed(2)} ETB transferred to VAT account`);
            } else {
                console.warn(`⚠️ VAT Account (ID: ${VAT_ACCOUNT_ID}) not found. VAT: ${vatAmount.toFixed(2)} ETB needs manual collection.`);
            }
        } catch (vatError) {
            console.error('VAT transfer error:', vatError);
        }

        // ============================================
        // 7. Transfer መመዝገብ
        // ============================================
        const { pool } = require('../config/database');
        await pool.execute(`
            INSERT INTO transfers (from_account_id, to_account_id, transaction_id, fee)
            VALUES (?, ?, ?, ?)
        `, [from_account_id, to_account_id, transaction.id, vatAmount]);
        console.log(`✅ Transfer recorded with VAT: ${vatAmount.toFixed(2)} ETB`);

        const updatedFromAccount = await Account.findById(from_account_id);
        const updatedToAccount = await Account.findById(to_account_id);

        // ============================================
        // 8. ማሳወቂያዎች
        // ============================================
        await createNotification(
            fromAccount.user_id,
            '📤 Transfer Sent',
            `You have sent ${amount} ETB to ${toAccount.account_number}. VAT: ${vatAmount.toFixed(2)} ETB (15%). Total deducted: ${totalDeduction.toFixed(2)} ETB. New balance: ${fromNewBalance.toFixed(2)} ETB`,
            'info'
        );

        await createNotification(
            toAccount.user_id,
            '📥 Transfer Received',
            `You have received ${amount} ETB from ${fromAccount.account_number}. New balance: ${toNewBalance.toFixed(2)} ETB`,
            'success'
        );

        await createNotification(
            1,
            '💰 VAT Collected',
            `VAT of ${vatAmount.toFixed(2)} ETB collected from transfer ${transaction.id} (From: ${fromAccount.account_number} To: ${toAccount.account_number})`,
            'success'
        );

        // ============================================
        // 9. Audit Logs
        // ============================================
        await createAuditLog(
            fromAccount.user_id,
            'TRANSFER_SENT',
            `Sent ${amount} ETB to ${toAccount.account_number}. VAT: ${vatAmount.toFixed(2)} ETB. Total: ${totalDeduction.toFixed(2)} ETB. Balance: ${fromNewBalance.toFixed(2)} ETB`,
            req.ip || '127.0.0.1'
        );

        await createAuditLog(
            toAccount.user_id,
            'TRANSFER_RECEIVED',
            `Received ${amount} ETB from ${fromAccount.account_number}. Balance: ${toNewBalance.toFixed(2)} ETB`,
            req.ip || '127.0.0.1'
        );

        // ============================================
        // 10. ምላሽ
        // ============================================
        res.status(200).json({
            success: true,
            message: 'Transfer successful',
            data: {
                from_account: updatedFromAccount,
                to_account: updatedToAccount,
                transaction: transaction,
                vat: {
                    rate: VAT_RATE * 100,
                    amount: vatAmount,
                    total_deducted: totalDeduction,
                    collected_by: VAT_ACCOUNT_ID
                }
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

// ============================================
// Get Transaction History
// ============================================
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

        const transactions = await Transaction.findByAccountId(account_id, limit);
        console.log('📥 Found transactions in DB:', transactions.length);

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