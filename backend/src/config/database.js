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

// የግንኙነት ፈተሻ
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

// ሰንጠረዦችን መፍጠር
async function createTables() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('✅ Connected to database');

        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                full_name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                phone VARCHAR(20),
                address TEXT,
                role ENUM('customer', 'admin') DEFAULT 'customer',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ "users" table created');

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

        console.log('🎉 All tables created successfully!');

    } catch (error) {
        console.error('❌ Error creating tables:', error.message);
        throw error;
    } finally {
        if (connection) connection.release();
    }
}

// ሁሉንም አስጀምር
async function initializeDatabase() {
    const connected = await testConnection();
    if (connected) {
        await createTables();
        console.log('✅ All systems ready!');
    }
}

// መጀመሪያ ላይ አስጀምር
initializeDatabase();

// ⭐ pool ን ኤክስፖርት አድርግ
module.exports = {
    pool: pool,
    testConnection,
    createTables,
    initializeDatabase
};