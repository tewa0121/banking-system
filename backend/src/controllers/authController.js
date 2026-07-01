const { pool } = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

// ============================================
// REGISTER
// ============================================
exports.register = async (req, res) => {
    try {
        console.log('📥 Register request received:', req.body.email);

        const { full_name, email, password, phone, address } = req.body;

        if (!full_name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Full name, email and password are required'
            });
        }

        // Gmail only validation
        if (!email.endsWith('@gmail.com')) {
            return res.status(400).json({
                success: false,
                message: 'Only Gmail addresses are allowed'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        // Check if user exists
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Create user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [result] = await pool.query(
            `INSERT INTO users (full_name, email, password_hash, phone, address, role) 
             VALUES (?, ?, ?, ?, ?, 'customer')`,
            [full_name, email, hashedPassword, phone || '', address || '']
        );

        // Create account for user
        const accountNumber = 'ACC' + Date.now().toString().slice(-10);
        await pool.query(
            `INSERT INTO accounts (user_id, account_number, account_type, balance) 
             VALUES (?, ?, 'savings', 0)`,
            [result.insertId, accountNumber]
        );

        const token = generateToken({ id: result.insertId, email, role: 'customer' });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: result.insertId,
                full_name,
                email,
                role: 'customer',
                status: 'active'
            }
        });

    } catch (error) {
        console.error('❌ Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    }
};

// ============================================
// LOGIN
// ============================================
exports.login = async (req, res) => {
    try {
        console.log('📥 Login request received:', req.body.email);

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Get user
        const [users] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const user = users[0];

        // Check status
        if (user.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Account is inactive. Please contact admin.'
            });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Update last login
        await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

        // Get user's accounts
        const [accounts] = await pool.query(
            'SELECT id, account_number, account_type, balance FROM accounts WHERE user_id = ?',
            [user.id]
        );

        const token = generateToken(user);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                role: user.role,
                status: user.status,
                phone: user.phone,
                address: user.address,
                profile_image: user.profile_image
            },
            accounts
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
};

// ============================================
// GET ME
// ============================================
exports.getMe = async (req, res) => {
    try {
        const [users] = await pool.query(
            `SELECT id, full_name, email, phone, address, role, status, 
                    profile_image, created_at, last_login 
             FROM users WHERE id = ?`,
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const [accounts] = await pool.query(
            'SELECT id, account_number, account_type, balance, currency, status FROM accounts WHERE user_id = ?',
            [req.user.id]
        );

        res.json({
            success: true,
            data: {
                user: users[0],
                accounts
            }
        });

    } catch (error) {
        console.error('❌ GetMe error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user data'
        });
    }
};

// ============================================
// UPDATE PROFILE
// ============================================
exports.updateProfile = async (req, res) => {
    try {
        const { full_name, phone, address } = req.body;

        await pool.query(
            'UPDATE users SET full_name = ?, phone = ?, address = ? WHERE id = ?',
            [full_name, phone, address, req.user.id]
        );

        res.json({
            success: true,
            message: 'Profile updated successfully'
        });

    } catch (error) {
        console.error('❌ Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile'
        });
    }
};

// ============================================
// CHANGE PASSWORD
// ============================================
exports.changePassword = async (req, res) => {
    try {
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

        const [users] = await pool.query(
            'SELECT password_hash FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const isMatch = await bcrypt.compare(current_password, users[0].password_hash);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(new_password, salt);

        await pool.query(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [hashedPassword, req.user.id]
        );

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('❌ Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password'
        });
    }
};

// ============================================
// LOGOUT
// ============================================
exports.logout = async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('❌ Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed'
        });
    }
};