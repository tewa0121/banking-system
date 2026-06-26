const { User, Account } = require('../models');
const jwt = require('jsonwebtoken');
const { createNotification } = require('./notificationController');

const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

// ============================================
// Register - ምዝገባ
// ============================================
exports.register = async (req, res) => {
    try {
        const { full_name, email, password, phone, address } = req.body;

        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        const user = await User.create({
            full_name,
            email,
            password,
            phone,
            address
        });

        const account = await Account.create(user.id);
        const token = generateToken(user);

        // ⭐ Welcome notification for new user
        await createNotification(
            user.id,
            '🎉 Welcome to Banking System!',
            `Welcome ${full_name}! Your account has been created successfully. Account number: ${account.account_number}`,
            'success'
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                role: user.role
            },
            account
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    }
};

// ============================================
// Login - መግቢያ
// ============================================
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findByEmail(email);
        if (!user) {
            // ⭐ Failed login notification for security
            await createNotification(
                1, // Admin user ID (change this to your admin ID)
                '⚠️ Failed Login Attempt',
                `Failed login attempt for email: ${email}`,
                'error'
            );
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if user is inactive
        if (user.status === 'inactive') {
            await createNotification(
                user.id,
                '⛔ Account Deactivated',
                'Your account has been deactivated. Please contact admin for assistance.',
                'error'
            );
            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated. Please contact admin.'
            });
        }

        const isMatch = await User.comparePassword(password, user.password_hash);
        if (!isMatch) {
            await createNotification(
                user.id,
                '⚠️ Failed Login Attempt',
                'Someone attempted to login to your account with incorrect password.',
                'warning'
            );
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const account = await Account.findByUserId(user.id);
        const token = generateToken(user);

        // ⭐ Successful login notification
        await createNotification(
            user.id,
            '✅ Login Successful',
            `You have successfully logged in to your account.`,
            'success'
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                role: user.role
            },
            account
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
};

// ============================================
// Get Current User
// ============================================
exports.getMe = async (req, res) => {
    try {
        const user = req.user;
        const account = await Account.findByUserId(user.id);

        res.json({
            success: true,
            user,
            account
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get user data'
        });
    }
};