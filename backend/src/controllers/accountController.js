const { Account } = require('../models');

// ============================================
// Get My Account
// ============================================
exports.getMyAccount = async (req, res) => {
    try {
        const user = req.user;
        console.log('🔍 Getting account for user:', user.id);
        
        const account = await Account.findByUserId(user.id);

        if (!account) {
            console.log('❌ Account not found for user:', user.id);
            return res.status(404).json({
                success: false,
                message: 'Account not found'
            });
        }

        console.log('✅ Account found:', account.account_number);
        res.status(200).json({
            success: true,
            data: account
        });

    } catch (error) {
        console.error('Get my account error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get account',
            error: error.message
        });
    }
};

// ============================================
// Get Account by ID
// ============================================
exports.getAccountById = async (req, res) => {
    try {
        const { id } = req.params;
        const account = await Account.findById(id);

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Account not found'
            });
        }

        res.status(200).json({
            success: true,
            data: account
        });

    } catch (error) {
        console.error('Get account by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get account',
            error: error.message
        });
    }
};