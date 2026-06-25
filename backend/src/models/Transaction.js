const { pool } = require('../config/database');

class Transaction {
    static async create(transactionData) {
        const { account_id, transaction_type, amount, description, status = 'pending' } = transactionData;
        
        const reference_number = this.generateReference();

        const query = `
            INSERT INTO transactions (account_id, transaction_type, amount, description, reference_number, status)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        const [result] = await pool.execute(query, [
            account_id, transaction_type, amount, description, reference_number, status
        ]);

        return this.findById(result.insertId);
    }

    static generateReference() {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `TXN-${timestamp}-${random}`;
    }

    static async findById(id) {
        const query = `
            SELECT t.*, a.account_number, u.full_name 
            FROM transactions t
            JOIN accounts a ON t.account_id = a.id
            JOIN users u ON a.user_id = u.id
            WHERE t.id = ?
        `;
        const [rows] = await pool.execute(query, [id]);
        return rows[0] || null;
    }

    static async findByAccountId(accountId, limit = 50) {
        try {
            console.log('📥 findByAccountId called with:', { accountId, limit });
            
            const query = `
                SELECT * FROM transactions 
                WHERE account_id = ? 
                ORDER BY created_at DESC 
                LIMIT ?
            `;
            const [rows] = await pool.execute(query, [accountId, parseInt(limit)]);
            
            console.log('📥 findByAccountId found:', rows.length, 'transactions');
            
            if (rows.length > 0) {
                console.log('📥 First transaction:', JSON.stringify(rows[0], null, 2));
            }
            
            return rows;
        } catch (error) {
            console.error('❌ findByAccountId error:', error);
            return [];
        }
    }

    static async updateStatus(transactionId, status) {
        const query = 'UPDATE transactions SET status = ? WHERE id = ?';
        await pool.execute(query, [status, transactionId]);
        return this.findById(transactionId);
    }

    // ⭐ ይህን ተግባር አክል
    static async getAccountSummary(accountId) {
        try {
            console.log('📥 getAccountSummary called for account:', accountId);
            
            const query = `
                SELECT 
                    COUNT(*) as total_transactions,
                    SUM(CASE WHEN transaction_type = 'deposit' THEN amount ELSE 0 END) as total_deposits,
                    SUM(CASE WHEN transaction_type = 'withdraw' THEN amount ELSE 0 END) as total_withdrawals,
                    SUM(CASE WHEN transaction_type = 'transfer' THEN amount ELSE 0 END) as total_transfers
                FROM transactions
                WHERE account_id = ? AND status = 'completed'
            `;
            const [rows] = await pool.execute(query, [accountId]);
            
            console.log('📥 getAccountSummary result:', rows[0]);
            
            return rows[0] || {
                total_transactions: 0,
                total_deposits: 0,
                total_withdrawals: 0,
                total_transfers: 0
            };
        } catch (error) {
            console.error('❌ getAccountSummary error:', error);
            return {
                total_transactions: 0,
                total_deposits: 0,
                total_withdrawals: 0,
                total_transfers: 0
            };
        }
    }
}

module.exports = Transaction;