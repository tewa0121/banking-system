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

// ⭐ ፑልን በቀጥታ ፍጠር እና ኤክስፖርት አድርግ
const pool = mysql.createPool({
    ...dbConfig,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

console.log('✅ Database pool created with database:', DB_NAME);

// ============================================
// Test Connection
// ============================================
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

// ============================================
// Create All Tables
// ============================================
async function createTables() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('✅ Connected to database');

        // ============================================
        // 1. users table (with status and profile_image)
        // ============================================
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                full_name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                phone VARCHAR(20),
                address TEXT,
                role ENUM('customer', 'admin') DEFAULT 'customer',
                status ENUM('active', 'inactive') DEFAULT 'active',
                profile_image TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ "users" table created');

        // ============================================
        // 2. accounts table
        // ============================================
        await connection.query(`
            CREATE TABLE IF NOT EXISTS accounts (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                account_number VARCHAR(20) UNIQUE NOT NULL,
                account_type ENUM('savings', 'checking', 'fixed') DEFAULT 'savings',
                balance DECIMAL(15,2) DEFAULT 0.00,
                currency VARCHAR(3) DEFAULT 'ETB',
                status ENUM('active', 'inactive', 'closed') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ "accounts" table created');

        // ============================================
        // 3. transactions table
        // ============================================
        await connection.query(`
            CREATE TABLE IF NOT EXISTS transactions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                account_id INT NOT NULL,
                transaction_type ENUM('deposit', 'withdraw', 'transfer', 'payment') NOT NULL,
                amount DECIMAL(15,2) NOT NULL,
                description TEXT,
                reference_number VARCHAR(50) UNIQUE,
                status ENUM('pending', 'completed', 'failed', 'reversed') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ "transactions" table created');

        // ============================================
        // 4. transfers table
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
        // 5. audit_logs table
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
        // 6. notifications table
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
        // 7. settings table
        // ============================================
        await connection.query(`
            CREATE TABLE IF NOT EXISTS settings (
                id INT PRIMARY KEY AUTO_INCREMENT,
                interest_rate DECIMAL(5,2) DEFAULT 5.00,
                currency VARCHAR(10) DEFAULT 'ETB',
                transaction_limit DECIMAL(15,2) DEFAULT 100000,
                maintenance_mode BOOLEAN DEFAULT 0,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ "settings" table created');

        // ============================================
        // 8. Insert default settings if empty
        // ============================================
        const [settings] = await connection.query('SELECT * FROM settings');
        if (settings.length === 0) {
            await connection.query(`
                INSERT INTO settings (interest_rate, currency, transaction_limit, maintenance_mode)
                VALUES (5.00, 'ETB', 100000, 0)
            `);
            console.log('✅ Default settings inserted');
        }

        // ============================================
        // 9. Create default admin user if not exists
        // ============================================
        const [adminUsers] = await connection.query(`
            SELECT * FROM users WHERE email = 'admin@example.com'
        `);
        if (adminUsers.length === 0) {
            const bcrypt = require('bcryptjs');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);
            
            await connection.query(`
                INSERT INTO users (full_name, email, password_hash, role, status)
                VALUES ('Admin User', 'admin@example.com', ?, 'admin', 'active')
            `, [hashedPassword]);
            console.log('✅ Default admin user created (admin@example.com / admin123)');
        }

        console.log('🎉 All tables created successfully!');

    } catch (error) {
        console.error('❌ Error creating tables:', error.message);
        throw error;
    } finally {
        if (connection) connection.release();
    }
}

// ============================================
// Initialize Database
// ============================================
async function initializeDatabase() {
    const connected = await testConnection();
    if (connected) {
        await createTables();
        console.log('✅ All systems ready!');
    }
}

// Run initialization
initializeDatabase();

// ============================================
// Export
// ============================================
module.exports = {
    pool: pool,
    testConnection,
    createTables,
    initializeDatabase
};