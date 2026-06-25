const bcrypt = require('bcryptjs');

// ⭐ pool ን ከ database.js አምጣ
const { pool } = require('../config/database');

class User {
    static async create(userData) {
        const { full_name, email, password, phone, address, role = 'customer' } = userData;
        
        console.log('📝 Creating user with data:', { full_name, email, phone, address, role });
        
        try {
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);

            const query = `
                INSERT INTO users (full_name, email, password_hash, phone, address, role, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            
            console.log('🔍 SQL:', query);
            
            // ⭐ pool ን ተጠቀም - status ን 'active' አድርገን እናስገባለን
            const [result] = await pool.execute(query, [
                full_name, email, password_hash, phone, address, role, 'active'
            ]);
            
            console.log('✅ User created with ID:', result.insertId);
            return this.findById(result.insertId);
        } catch (error) {
            console.error('❌ User.create ERROR:', error.message);
            throw error;
        }
    }

    static async findByEmail(email) {
        try {
            console.log('🔍 Finding user by email:', email);
            const query = 'SELECT * FROM users WHERE email = ?';
            
            // ⭐ pool ን ተጠቀም
            const [rows] = await pool.execute(query, [email]);
            console.log('✅ Found user:', rows[0] ? 'Yes' : 'No');
            return rows[0] || null;
        } catch (error) {
            console.error('❌ User.findByEmail error:', error.message);
            throw error;
        }
    }

    // ⭐ findById - ፕሮፋይል ፎቶ እና status ያካትታል
    static async findById(id) {
        try {
            const query = 'SELECT id, full_name, email, phone, address, role, status, profile_image, created_at FROM users WHERE id = ?';
            const [rows] = await pool.execute(query, [id]);
            return rows[0] || null;
        } catch (error) {
            console.error('User.findById error:', error.message);
            throw error;
        }
    }

    static async comparePassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    // ⭐ findAll - ፕሮፋይል ፎቶ እና status ያካትታል
    static async findAll() {
        try {
            const query = 'SELECT id, full_name, email, phone, address, role, status, profile_image, created_at FROM users ORDER BY created_at DESC';
            const [rows] = await pool.execute(query);
            return rows;
        } catch (error) {
            console.error('User.findAll error:', error.message);
            return [];
        }
    }

    // ⭐ ተጠቃሚዎችን በstatus ማጣራት
    static async findByStatus(status) {
        try {
            const query = 'SELECT id, full_name, email, phone, address, role, status, profile_image, created_at FROM users WHERE status = ? ORDER BY created_at DESC';
            const [rows] = await pool.execute(query, [status]);
            return rows;
        } catch (error) {
            console.error('User.findByStatus error:', error.message);
            return [];
        }
    }
}

module.exports = User;