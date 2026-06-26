const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

// ============================================
// አስተዳዳሪ ተጠቃሚ መፍጠር
// ============================================
async function createAdminUser() {
    try {
        console.log('👑 Creating admin user...');

        const adminData = {
            full_name: 'Admin User',
            email: 'admin@example.com',
            password: 'admin123',
            phone: '0911000000',
            address: 'Addis Ababa',
            role: 'admin',
            status: 'active'
        };

        // አስቀድሞ መኖሩን ፈትሽ
        const [existing] = await pool.execute(
            'SELECT id FROM users WHERE email = ?',
            [adminData.email]
        );

        if (existing.length > 0) {
            console.log(`⏭️ Admin user already exists: ${adminData.email}`);
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(adminData.password, salt);

        const [result] = await pool.execute(`
            INSERT INTO users (full_name, email, password_hash, phone, address, role, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            adminData.full_name,
            adminData.email,
            password_hash,
            adminData.phone,
            adminData.address,
            adminData.role,
            adminData.status
        ]);

        console.log(`✅ Admin user created: ${adminData.email} / ${adminData.password}`);
        console.log('📝 Login with: admin@example.com / admin123');

    } catch (error) {
        console.error('❌ Admin user creation error:', error);
    }
}

// ============================================
// አስወጣ
// ============================================
module.exports = {
    createAdminUser
};