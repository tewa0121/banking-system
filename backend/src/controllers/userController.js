const { User, Account } = require('../models');
const bcrypt = require('bcryptjs');

// ============================================
// Get User Profile
// ============================================
exports.getProfile = async (req, res) => {
    try {
        const user = req.user;
        console.log('📥 Get profile for user:', user.id);
        
        const account = await Account.findByUserId(user.id);

        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    full_name: user.full_name,
                    email: user.email,
                    phone: user.phone,
                    address: user.address,
                    role: user.role,
                    created_at: user.created_at
                },
                account: account
            }
        });
    } catch (error) {
        console.error('❌ Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get profile',
            error: error.message
        });
    }
};

// ============================================
// Update User Profile
// ============================================
exports.updateProfile = async (req, res) => {
    try {
        const user = req.user;
        const { full_name, phone, address } = req.body;

        console.log('📥 Update profile for user:', user.id);
        console.log('📥 Data:', { full_name, phone, address });

        const { pool } = require('../config/database');
        const query = `
            UPDATE users 
            SET full_name = ?, phone = ?, address = ? 
            WHERE id = ?
        `;
        
        await pool.execute(query, [full_name, phone, address, user.id]);
        
        const updatedUser = await User.findById(user.id);

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedUser
        });
    } catch (error) {
        console.error('❌ Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: error.message
        });
    }
};

// ============================================
// Change Password
// ============================================
exports.changePassword = async (req, res) => {
    try {
        const user = req.user;
        const { current_password, new_password } = req.body;

        console.log('📥 Change password request for user:', user.id);
        console.log('📥 Body:', { current_password: '***', new_password: '***' });

        // Check if passwords are provided
        if (!current_password || !new_password) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        // Check password length
        if (new_password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters'
            });
        }

        // Get full user with password_hash from database
        const { pool } = require('../config/database');
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE id = ?',
            [user.id]
        );
        
        console.log('📥 User found:', users.length > 0 ? 'Yes' : 'No');
        
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const fullUser = users[0];
        console.log('📥 Has password_hash:', fullUser.password_hash ? 'Yes' : 'No');

        // Verify current password using bcrypt
        let isMatch = false;
        try {
            isMatch = await bcrypt.compare(current_password, fullUser.password_hash);
            console.log('📥 Password match:', isMatch ? 'Yes' : 'No');
        } catch (compareError) {
            console.error('❌ bcrypt.compare error:', compareError);
            return res.status(500).json({
                success: false,
                message: 'Error verifying password'
            });
        }
        
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(new_password, salt);
        console.log('📥 New password hashed successfully');

        // Update password in database
        await pool.execute(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [newPasswordHash, user.id]
        );
        console.log('✅ Password updated successfully');

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('❌ Change password error:', error);
        console.error('❌ Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Failed to change password',
            error: error.message
        });
    }
};