const { pool } = require('../config/database');

// ============================================
// Create Audit Log
// ============================================
async function createAuditLog(userId, action, details, ipAddress = null) {
    try {
        await pool.execute(`
            INSERT INTO audit_logs (user_id, action, details, ip_address)
            VALUES (?, ?, ?, ?)
        `, [userId, action, details, ipAddress]);
        console.log(`✅ Audit log created: ${action} for user ${userId}`);
    } catch (error) {
        console.error('❌ Create audit log error:', error);
    }
}

// ============================================
// Get Audit Logs (Admin only)
// ============================================
exports.getAuditLogs = async (req, res) => {
    try {
        const [logs] = await pool.execute(`
            SELECT al.*, u.full_name, u.email
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.id
            ORDER BY al.created_at DESC
            LIMIT 100
        `);

        res.status(200).json({
            success: true,
            count: logs.length,
            data: logs
        });
    } catch (error) {
        console.error('Get audit logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get audit logs',
            error: error.message
        });
    }
};

// ============================================
// ⭐ Export all functions
// ============================================
module.exports = {
    createAuditLog,
    getAuditLogs: exports.getAuditLogs
};