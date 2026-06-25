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
                    profile_image: user.profile_image || null,
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

        if (!current_password || !new_password) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        if (new_password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters'
            });
        }

        const { pool } = require('../config/database');
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE id = ?',
            [user.id]
        );
        
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const fullUser = users[0];
        const isMatch = await bcrypt.compare(current_password, fullUser.password_hash);
        
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(new_password, salt);

        await pool.execute(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [newPasswordHash, user.id]
        );

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('❌ Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password',
            error: error.message
        });
    }
};

// ============================================
// ⭐ Upload Profile Image
// ============================================
exports.uploadProfileImage = async (req, res) => {
    try {
        const user = req.user;
        const { profile_image } = req.body;

        console.log('📥 Upload profile image for user:', user.id);
        console.log('📥 Image received:', profile_image ? 'YES' : 'NO');

        if (!profile_image) {
            return res.status(400).json({
                success: false,
                message: 'Profile image is required'
            });
        }

        const { pool } = require('../config/database');

        // Update the user's profile image
        const query = 'UPDATE users SET profile_image = ? WHERE id = ?';
        console.log('📥 Executing update for user:', user.id);
        
        const [result] = await pool.execute(query, [profile_image, user.id]);
        console.log('📥 Update result:', result);

        // Get the updated user
        const [rows] = await pool.execute(
            'SELECT profile_image FROM users WHERE id = ?',
            [user.id]
        );

        console.log('✅ Profile image updated successfully');

        res.status(200).json({
            success: true,
            message: 'Profile image uploaded successfully',
            data: {
                profile_image: rows[0]?.profile_image || null
            }
        });
    } catch (error) {
        console.error('❌ Upload profile image error:', error);
        console.error('❌ Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Failed to upload profile image',
            error: error.message
        });
    }
};