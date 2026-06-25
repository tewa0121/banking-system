const { pool } = require('../config/database');

class Account {
    static async create(userId, accountType = 'savings') {
        try {
            console.log('📝 Creating account for user:', userId);
            
            const accountNumber = await this.generateAccountNumber();
            console.log('🔑 Generated account number:', accountNumber);

            const query = `
                INSERT INTO accounts (user_id, account_number, account_type)
                VALUES (?, ?, ?)
            `;
            
            console.log('🔍 SQL:', query);
            console.log('🔍 Values:', [userId, accountNumber, accountType]);
            
            const [result] = await pool.execute(query, [userId, accountNumber, accountType]);
            console.log('✅ Account created with ID:', result.insertId);
            
            return this.findById(result.insertId);
        } catch (error) {
            console.error('❌ Account.create ERROR:', error);
            console.error('❌ Error message:', error.message);
            throw error;
        }
    }

    static async generateAccountNumber() {
        try {
            const prefix = '1000';
            const query = 'SELECT COUNT(*) as count FROM accounts';
            const [rows] = await pool.execute(query);
            const count = rows[0].count + 1;
            const number = String(count).padStart(6, '0');
            return prefix + number;
        } catch (error) {
            console.error('❌ generateAccountNumber error:', error);
            throw error;
        }
    }

    static async findById(id) {
        try {
            const query = `
                SELECT a.*, u.full_name, u.email 
                FROM accounts a
                JOIN users u ON a.user_id = u.id
                WHERE a.id = ?
            `;
            const [rows] = await pool.execute(query, [id]);
            return rows[0] || null;
        } catch (error) {
            console.error('Account.findById error:', error);
            throw error;
        }
    }

    static async findByUserId(userId) {
        try {
            const query = 'SELECT * FROM accounts WHERE user_id = ?';
            const [rows] = await pool.execute(query, [userId]);
            return rows[0] || null;
        } catch (error) {
            console.error('Account.findByUserId error:', error);
            throw error;
        }
    }

    static async updateBalance(accountId, newBalance) {
        try {
            const query = 'UPDATE accounts SET balance = ? WHERE id = ?';
            await pool.execute(query, [newBalance, accountId]);
            return this.findById(accountId);
        } catch (error) {
            console.error('Account.updateBalance error:', error);
            throw error;
        }
    }
}

module.exports = Account;