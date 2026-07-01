const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    port: process.env.DB_PORT || 8889,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const DB_NAME = process.env.DB_NAME || 'banking_db';

const pool = mysql.createPool({
    ...dbConfig,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

console.log('✅ Database pool created with database:', DB_NAME);

async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connection successful');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
}

async function createTables() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('✅ Connected to database');

        // ============================================
        // 1. users table (All bank staff roles)
        // ============================================
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                full_name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                phone VARCHAR(20),
                address TEXT,
                role ENUM('admin', 'teller', 'accountant', 'auditor', 'customer') DEFAULT 'customer',
                status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
                profile_image TEXT,
                last_login TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ "users" table created with all bank staff roles');

        // ============================================
        // 2. branches table
        // ============================================
        await connection.query(`
            CREATE TABLE IF NOT EXISTS branches (
                id INT PRIMARY KEY AUTO_INCREMENT,
                branch_name VARCHAR(100) NOT NULL,
                branch_code VARCHAR(20) UNIQUE NOT NULL,
                address TEXT,
                phone VARCHAR(20),
                manager_id INT,
                status ENUM('active', 'inactive') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);
        console.log('✅ "branches" table created');

        // ============================================
        // 3. accounts table
        // ============================================
        await connection.query(`
            CREATE TABLE IF NOT EXISTS accounts (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                account_number VARCHAR(20) UNIQUE NOT NULL,
                account_type ENUM('savings', 'checking', 'fixed', 'business') DEFAULT 'savings',
                balance DECIMAL(15,2) DEFAULT 0.00,
                currency VARCHAR(3) DEFAULT 'ETB',
                branch_id INT,
                status ENUM('active', 'inactive', 'closed', 'frozen') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
            )
        `);
        console.log('✅ "accounts" table created');

        // ============================================
        // 4. transactions table
        // ============================================
        await connection.query(`
            CREATE TABLE IF NOT EXISTS transactions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                account_id INT NOT NULL,
                transaction_type ENUM('deposit', 'withdraw', 'transfer', 'payment', 'fee') NOT NULL,
                amount DECIMAL(15,2) NOT NULL,
                description TEXT,
                reference_number VARCHAR(50) UNIQUE,
                status ENUM('pending', 'completed', 'failed', 'reversed') DEFAULT 'pending',
                performed_by INT,
                branch_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
                FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
            )
        `);
        console.log('✅ "transactions" table created');

        // ============================================
        // 5. transfers table
        // ============================================
        await connection.query(`
            CREATE TABLE IF NOT EXISTS transfers (
                id INT PRIMARY KEY AUTO_INCREMENT,
                from_account_id INT NOT NULL,
                to_account_id INT NOT NULL,
                transaction_id INT NOT NULL,
                fee DECIMAL(10,2) DEFAULT 0.00,
                completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (from_account_id) REFERENCES accounts(id),
                FOREIGN KEY (to_account_id) REFERENCES accounts(id),
                FOREIGN KEY (transaction_id) REFERENCES transactions(id)
            )
        `);
        console.log('✅ "transfers" table created');

        // ============================================
        // 6. audit_logs table
        // ============================================
        await connection.query(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT,
                action VARCHAR(100),
                details TEXT,
                ip_address VARCHAR(45),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);
        console.log('✅ "audit_logs" table created');

        // ============================================
        // 7. notifications table
        // ============================================
        await connection.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
                is_read BOOLEAN DEFAULT 0,
                link VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ "notifications" table created');

        // ============================================
        // 8. settings table
        // ============================================
        await connection.query(`
            CREATE TABLE IF NOT EXISTS settings (
                id INT PRIMARY KEY AUTO_INCREMENT,
                interest_rate DECIMAL(5,2) DEFAULT 5.00,
                currency VARCHAR(10) DEFAULT 'ETB',
                transaction_limit DECIMAL(15,2) DEFAULT 100000,
                maintenance_mode BOOLEAN DEFAULT 0,
                withdrawal_fee DECIMAL(5,2) DEFAULT 0.00,
                transfer_fee DECIMAL(5,2) DEFAULT 0.00,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                updated_by INT,
                FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
            )
        `);
        console.log('✅ "settings" table created');

        // ============================================
        // 9. Insert default settings
        // ============================================
        const [settings] = await connection.query('SELECT * FROM settings');
        if (settings.length === 0) {
            await connection.query(`
                INSERT INTO settings (interest_rate, currency, transaction_limit, maintenance_mode, withdrawal_fee, transfer_fee)
                VALUES (5.00, 'ETB', 100000, 0, 0.00, 0.00)
            `);
            console.log('✅ Default settings inserted');
        }

        // ============================================
        // 10. Insert default branches
        // ============================================
        const [branches] = await connection.query('SELECT * FROM branches');
        if (branches.length === 0) {
            await connection.query(`
                INSERT INTO branches (branch_name, branch_code, address) VALUES
                ('Head Office', 'HO001', 'Addis Ababa, Ethiopia'),
                ('Bole Branch', 'BR002', 'Bole, Addis Ababa'),
                ('Piazza Branch', 'BR003', 'Piazza, Addis Ababa'),
                ('Megenagna Branch', 'BR004', 'Megenagna, Addis Ababa')
            `);
            console.log('✅ Default branches inserted');
        }

        // ============================================
        // 11. Create Default Users (All Roles)
        // ============================================
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);

        const defaultUsers = [
            {
                full_name: 'Admin User',
                email: 'admin@gmail.com',
                password: 'admin123',
                role: 'admin',
                status: 'active'
            },
            {
                full_name: 'Teller User',
                email: 'teller@gmail.com',
                password: 'teller123',
                role: 'teller',
                status: 'active'
            },
            {
                full_name: 'Accountant User',
                email: 'accountant@gmail.com',
                password: 'accountant123',
                role: 'accountant',
                status: 'active'
            },
            {
                full_name: 'Auditor User',
                email: 'auditor@gmail.com',
                password: 'auditor123',
                role: 'auditor',
                status: 'active'
            },
            {
                full_name: 'Customer User',
                email: 'customer@gmail.com',
                password: 'customer123',
                role: 'customer',
                status: 'active'
            }
        ];

        for (const userData of defaultUsers) {
            const [existing] = await connection.query(
                'SELECT * FROM users WHERE email = ?',
                [userData.email]
            );
            
            if (existing.length === 0) {
                const hashedPassword = await bcrypt.hash(userData.password, salt);
                await connection.query(`
                    INSERT INTO users (full_name, email, password_hash, role, status)
                    VALUES (?, ?, ?, ?, ?)
                `, [userData.full_name, userData.email, hashedPassword, userData.role, userData.status]);
                console.log(`✅ Default ${userData.role} user created (${userData.email} / ${userData.password})`);
            } else {
                console.log(`ℹ️ ${userData.role} user already exists (${userData.email})`);
            }
        }

        console.log('🎉 All tables verified/created successfully!');

    } catch (error) {
        console.error('❌ Error creating tables:', error.message);
        if (error.sql) {
            console.error('❌ SQL Query:', error.sql);
        }
        throw error;
    } finally {
        if (connection) connection.release();
    }
}

async function initializeDatabase() {
    const connected = await testConnection();
    if (connected) {
        await createTables();
        console.log('✅ All systems ready!');
    }
}

initializeDatabase();

module.exports = {
    pool: pool,
    testConnection,
    createTables,
    initializeDatabase
};