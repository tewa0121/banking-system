const interestService = require('../services/interestService');
const { adminOnly } = require('../middleware/auth');

// ============================================
// ለአንድ አካውንት ወለድ አስላ
// ============================================
exports.calculateInterest = async (req, res) => {
    try {
        const { accountId } = req.params;
        const result = await interestService.calculateInterestForAccount(accountId);
        
        if (!result.success) {
            return res.status(400).json(result);
        }
        
        res.status(200).json({
            success: true,
            data: result.data
        });
    } catch (error) {
        console.error('Calculate interest error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to calculate interest',
            error: error.message
        });
    }
};

// ============================================
// ወርሃዊ ወለድ በእጅ አስኬድ (Admin ብቻ)
// ============================================
exports.runMonthlyInterest = async (req, res) => {
    try {
        // Admin only check
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }
        
        const result = await interestService.runMonthlyInterestJob();
        
        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: 'Interest calculation failed',
                error: result.error
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Monthly interest calculated successfully',
            data: result
        });
    } catch (error) {
        console.error('Run monthly interest error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to run monthly interest',
            error: error.message
        });
    }
};

// ============================================
// የወለድ መጠን መረጃ ማግኘት
// ============================================
exports.getInterestRate = async (req, res) => {
    try {
        const info = interestService.getInterestRateInfo();
        res.status(200).json({
            success: true,
            data: info
        });
    } catch (error) {
        console.error('Get interest rate error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get interest rate info',
            error: error.message
        });
    }
};