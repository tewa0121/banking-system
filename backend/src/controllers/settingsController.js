const { pool } = require('../config/database');

// ============================================
// Get System Settings
// ============================================
exports.getSettings = async (req, res) => {
    try {
        // Check if settings table exists, if not create it
        await createSettingsTable();

        const [rows] = await pool.execute('SELECT * FROM settings LIMIT 1');
        
        if (rows.length === 0) {
            // Create default settings
            await pool.execute(`
                INSERT INTO settings (interest_rate, currency, transaction_limit, maintenance_mode)
                VALUES (5.00, 'ETB', 100000, 0)
            `);
            const [newRows] = await pool.execute('SELECT * FROM settings LIMIT 1');
            return res.status(200).json({
                success: true,
                data: newRows[0]
            });
        }

        res.status(200).json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get settings',
            error: error.message
        });
    }
};

// ============================================
// Update System Settings
// ============================================
exports.updateSettings = async (req, res) => {
    try {
        const { interest_rate, currency, transaction_limit, maintenance_mode } = req.body;

        await createSettingsTable();

        await pool.execute(`
            UPDATE settings 
            SET interest_rate = ?, currency = ?, transaction_limit = ?, maintenance_mode = ?
        `, [interest_rate, currency, transaction_limit, maintenance_mode]);

        const [rows] = await pool.execute('SELECT * FROM settings LIMIT 1');

        res.status(200).json({
            success: true,
            message: 'Settings updated successfully',
            data: rows[0]
        });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update settings',
            error: error.message
        });
    }
};

// ============================================
// Create Settings Table
// ============================================
async function createSettingsTable() {
    try {
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS settings (
                id INT PRIMARY KEY AUTO_INCREMENT,
                interest_rate DECIMAL(5,2) DEFAULT 5.00,
                currency VARCHAR(10) DEFAULT 'ETB',
                transaction_limit DECIMAL(15,2) DEFAULT 100000,
                maintenance_mode BOOLEAN DEFAULT 0,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
    } catch (error) {
        console.error('Create settings table error:', error);
    }
}