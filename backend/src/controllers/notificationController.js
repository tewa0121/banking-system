const { pool } = require('../config/database');

// ============================================
// Create Notification Table
// ============================================
async function createNotificationTable() {
    try {
        await pool.execute(`
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
    } catch (error) {
        console.error('Create notifications table error:', error);
    }
}

// ============================================
// Get User Notifications
// ============================================
exports.getNotifications = async (req, res) => {
    try {
        const user = req.user;
        await createNotificationTable();

        const [notifications] = await pool.execute(`
            SELECT * FROM notifications 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT 50
        `, [user.id]);

        const [unreadCount] = await pool.execute(`
            SELECT COUNT(*) as count FROM notifications 
            WHERE user_id = ? AND is_read = 0
        `, [user.id]);

        res.status(200).json({
            success: true,
            data: notifications,
            unreadCount: unreadCount[0].count || 0
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get notifications',
            error: error.message
        });
    }
};

// ============================================
// Mark Notification as Read
// ============================================
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        await createNotificationTable();

        await pool.execute(`
            UPDATE notifications 
            SET is_read = 1 
            WHERE id = ? AND user_id = ?
        `, [id, user.id]);

        res.status(200).json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark as read',
            error: error.message
        });
    }
};

// ============================================
// Mark All Notifications as Read
// ============================================
exports.markAllAsRead = async (req, res) => {
    try {
        const user = req.user;

        await createNotificationTable();

        await pool.execute(`
            UPDATE notifications 
            SET is_read = 1 
            WHERE user_id = ? AND is_read = 0
        `, [user.id]);

        res.status(200).json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark all as read',
            error: error.message
        });
    }
};

// ============================================
// Delete Notification
// ============================================
exports.deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        await createNotificationTable();

        await pool.execute(`
            DELETE FROM notifications 
            WHERE id = ? AND user_id = ?
        `, [id, user.id]);

        res.status(200).json({
            success: true,
            message: 'Notification deleted'
        });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete notification',
            error: error.message
        });
    }
};

// ============================================
// Create Notification (Internal)
// ============================================
async function createNotification(userId, title, message, type = 'info', link = null) {
    try {
        await createNotificationTable();
        
        await pool.execute(`
            INSERT INTO notifications (user_id, title, message, type, link)
            VALUES (?, ?, ?, ?, ?)
        `, [userId, title, message, type, link]);
        
        console.log(`✅ Notification created for user ${userId}: ${title}`);
    } catch (error) {
        console.error('Create notification error:', error);
    }
}

// ============================================
// ⭐ Export all functions
// ============================================
module.exports = {
    getNotifications: exports.getNotifications,
    markAsRead: exports.markAsRead,
    markAllAsRead: exports.markAllAsRead,
    deleteNotification: exports.deleteNotification,
    createNotification: createNotification
};