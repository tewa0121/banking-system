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

    // ⭐ የተሻሻለው findById - በትክክል ይሰራል
    static async findById(id) {
        try {
            console.log(`📊 Account.findById(${id}) called`);
            
            const query = `
                SELECT a.*, u.full_name, u.email 
                FROM accounts a
                JOIN users u ON a.user_id = u.id
                WHERE a.id = ?
            `;
            const [rows] = await pool.execute(query, [id]);
            
            if (rows.length > 0) {
                console.log(`✅ Account found: ${rows[0].account_number}, Balance: ${rows[0].balance}`);
            } else {
                console.log(`❌ Account ${id} not found`);
            }
            
            return rows[0] || null;
        } catch (error) {
            console.error('❌ Account.findById error:', error);
            throw error;
        }
    }

    static async findByUserId(userId) {
        try {
            console.log(`📊 Account.findByUserId(${userId}) called`);
            
            const query = 'SELECT * FROM accounts WHERE user_id = ?';
            const [rows] = await pool.execute(query, [userId]);
            
            if (rows.length > 0) {
                console.log(`✅ Account found for user ${userId}: ${rows[0].account_number}`);
            } else {
                console.log(`❌ No account found for user ${userId}`);
            }
            
            return rows[0] || null;
        } catch (error) {
            console.error('❌ Account.findByUserId error:', error);
            throw error;
        }
    }

    // ⭐ የተሻሻለው updateBalance - በትክክል ይሰራል
    static async updateBalance(accountId, newBalance) {
        try {
            console.log(`📊 Updating account ${accountId} balance to ${newBalance}`);
            
            const query = 'UPDATE accounts SET balance = ? WHERE id = ?';
            const [result] = await pool.execute(query, [newBalance, accountId]);
            
            if (result.affectedRows === 0) {
                console.log(`⚠️ Account ${accountId} not found!`);
                return null;
            }
            
            console.log(`✅ Account ${accountId} balance updated to ${newBalance}`);
            
            // Return updated account
            return this.findById(accountId);
        } catch (error) {
            console.error('❌ updateBalance error:', error);
            throw error;
        }
    }

    // ⭐ ሁሉንም አካውንቶች ማግኘት
    static async findAll() {
        try {
            const query = `
                SELECT a.*, u.full_name, u.email 
                FROM accounts a
                JOIN users u ON a.user_id = u.id
                ORDER BY a.created_at DESC
            `;
            const [rows] = await pool.execute(query);
            console.log(`📊 Found ${rows.length} accounts`);
            return rows;
        } catch (error) {
            console.error('Account.findAll error:', error);
            throw error;
        }
    }
}

module.exports = Account;