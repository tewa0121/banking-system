const { User, Account } = require('../models');
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

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

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const isMatch = await User.comparePassword(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const account = await Account.findByUserId(user.id);
        const token = generateToken(user);

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