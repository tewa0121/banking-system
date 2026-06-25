const { User } = require('../models');
const crypto = require('crypto');

// In production, use a proper email service like Nodemailer
// This is a simplified version

// ============================================
// Forgot Password - Request Reset
// ============================================
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(20).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // 1 hour

        const { pool } = require('../config/database');
        await pool.execute(
            'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?',
            [resetToken, resetTokenExpiry, user.id]
        );

        // In production: Send email with reset link
        // For now, return token in response
        res.status(200).json({
            success: true,
            message: 'Password reset token generated',
            reset_token: resetToken // In production, send via email
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process request',
            error: error.message
        });
    }
};

// ============================================
// Reset Password
// ============================================
exports.resetPassword = async (req, res) => {
    try {
        const { reset_token, new_password } = req.body;

        const { pool } = require('../config/database');
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > ?',
            [reset_token, Date.now()]
        );

        if (users.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        const user = users[0];

        // Hash new password
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(new_password, salt);

        await pool.execute(
            'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
            [newPasswordHash, user.id]
        );

        res.status(200).json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reset password',
            error: error.message
        });
    }
};