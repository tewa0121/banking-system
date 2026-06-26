const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { generateReference } = require('../utils/helpers');

// ============================================
// ናሙና መረጃ ማስገቢያ
// ============================================
async function seedSampleData() {
    try {
        console.log('📊 Starting sample data seeding...');

        // ============================================
        // 1. ናሙና ተጠቃሚዎች
        // ============================================
        const users = [
            {
                full_name: 'Admin User',
                email: 'admin@example.com',
                password: 'admin123',
                phone: '0911000000',
                address: 'Addis Ababa',
                role: 'admin',
                status: 'active'
            },
            {
                full_name: 'Abebe Kebede',
                email: 'abebe@gmail.com',
                password: 'password123',
                phone: '0911000001',
                address: 'Addis Ababa',
                role: 'customer',
                status: 'active'
            },
            {
                full_name: 'Almaz Desta',
                email: 'almaz@gmail.com',
                password: 'password123',
                phone: '0911000002',
                address: 'Addis Ababa',
                role: 'customer',
                status: 'active'
            },
            {
                full_name: 'Tewachew Melaku',
                email: 'tewachewmelaku6@gmail.com',
                password: '123456',
                phone: '0911000003',
                address: 'Addis Ababa',
                role: 'customer',
                status: 'active'
            }
        ];

        for (const userData of users) {
            // ተጠቃሚው አስቀድሞ መኖሩን ፈትሽ
            const [existing] = await pool.execute(
                'SELECT id FROM users WHERE email = ?',
                [userData.email]
            );

            if (existing.length === 0) {
                const salt = await bcrypt.genSalt(10);
                const password_hash = await bcrypt.hash(userData.password, salt);

                const [result] = await pool.execute(`
                    INSERT INTO users (full_name, email, password_hash, phone, address, role, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [userData.full_name, userData.email, password_hash, userData.phone, userData.address, userData.role, userData.status]);

                console.log(`✅ User created: ${userData.full_name} (${userData.email})`);
            } else {
                console.log(`⏭️ User already exists: ${userData.email}`);
            }
        }

        // ============================================
        // 2. ናሙና አካውንቶች
        // ============================================
        const [allUsers] = await pool.execute('SELECT id, email FROM users');
        
        for (const user of allUsers) {
            const [existing] = await pool.execute(
                'SELECT id FROM accounts WHERE user_id = ?',
                [user.id]
            );

            if (existing.length === 0) {
                // የአካውንት ቁጥር አመንጭ
                const prefix = '1000';
                const [count] = await pool.execute('SELECT COUNT(*) as total FROM accounts');
                const number = String(count[0].total + 1).padStart(6, '0');
                const account_number = prefix + number;

                // የዘፈቀደ ቀሪ ሒሳብ
                const balance = Math.floor(Math.random() * 50000) + 1000;

                await pool.execute(`
                    INSERT INTO accounts (user_id, account_number, account_type, balance, status)
                    VALUES (?, ?, 'savings', ?, 'active')
                `, [user.id, account_number, balance]);

                console.log(`✅ Account created for: ${user.email} (${account_number})`);
            }
        }

        // ============================================
        // 3. ናሙና ግብይቶች
        // ============================================
        const [allAccounts] = await pool.execute('SELECT id, user_id FROM accounts');

        for (const account of allAccounts) {
            // የዘፈቀደ ግብይቶች ቁጥር (3-8)
            const numTransactions = Math.floor(Math.random() * 6) + 3;

            for (let i = 0; i < numTransactions; i++) {
                const types = ['deposit', 'withdraw', 'transfer'];
                const type = types[Math.floor(Math.random() * types.length)];
                const amount = Math.floor(Math.random() * 2000) + 100;
                const reference = generateReference('TXN');

                // ለtransfer ሌላ አካውንት ያስፈልጋል
                let toAccountId = null;
                if (type === 'transfer') {
                    const otherAccounts = allAccounts.filter(a => a.id !== account.id);
                    if (otherAccounts.length > 0) {
                        toAccountId = otherAccounts[Math.floor(Math.random() * otherAccounts.length)].id;
                    }
                }

                await pool.execute(`
                    INSERT INTO transactions (account_id, transaction_type, amount, description, reference_number, status)
                    VALUES (?, ?, ?, ?, ?, 'completed')
                `, [
                    account.id,
                    type,
                    amount,
                    `Sample ${type} transaction`,
                    reference
                ]);

                // transfer ከሆነ ተቀባይ ግብይት አክል
                if (type === 'transfer' && toAccountId) {
                    const ref = generateReference('TXN');
                    await pool.execute(`
                        INSERT INTO transactions (account_id, transaction_type, amount, description, reference_number, status)
                        VALUES (?, ?, ?, ?, ?, 'completed')
                    `, [
                        toAccountId,
                        'deposit',
                        amount,
                        `Received transfer`,
                        ref
                    ]);
                }
            }
            console.log(`✅ Transactions created for account: ${account.id}`);
        }

        // ============================================
        // 4. ናሙና ማሳወቂያዎች
        // ============================================
        const notificationTypes = ['info', 'success', 'warning', 'error'];
        const notificationTitles = [
            'Welcome to Banking System!',
            'New Feature Available',
            'Security Update',
            'Account Activity Alert',
            'Transaction Completed',
            'Monthly Statement Ready'
        ];

        for (const user of allUsers) {
            const numNotifications = Math.floor(Math.random() * 5) + 1;
            
            for (let i = 0; i < numNotifications; i++) {
                const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
                const title = notificationTitles[Math.floor(Math.random() * notificationTitles.length)];
                
                await pool.execute(`
                    INSERT INTO notifications (user_id, title, message, type, is_read)
                    VALUES (?, ?, ?, ?, ?)
                `, [
                    user.id,
                    title,
                    `This is a sample notification for ${user.email}`,
                    type,
                    Math.random() > 0.5 ? 0 : 1
                ]);
            }
        }
        console.log('✅ Sample notifications created');

        console.log('🎉 Sample data seeding completed successfully!');

    } catch (error) {
        console.error('❌ Sample data seeding error:', error);
    }
}

// ============================================
// ሁሉንም ናሙና መረጃ ማጥፋት
// ============================================
async function clearSampleData() {
    try {
        console.log('🗑️ Clearing sample data...');
        
        await pool.execute('DELETE FROM transactions');
        await pool.execute('DELETE FROM transfers');
        await pool.execute('DELETE FROM notifications');
        await pool.execute('DELETE FROM accounts');
        await pool.execute('DELETE FROM users WHERE role = "customer"');
        
        console.log('✅ Sample data cleared');
    } catch (error) {
        console.error('❌ Clear sample data error:', error);
    }
}

// ============================================
// አስወጣ
// ============================================
module.exports = {
    seedSampleData,
    clearSampleData
};