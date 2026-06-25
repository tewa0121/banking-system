const router = require('express').Router();
const { protect } = require('../middleware/auth');
const interestService = require('../services/interestService');

// ============================================
// Calculate interest for an account
// ============================================
router.get('/calculate/:accountId', protect, async (req, res) => {
    try {
        const { accountId } = req.params;
        
        const result = await interestService.calculateAccountInterest(accountId);
        
        if (!result.success) {
            return res.status(400).json(result);
        }
        
        res.status(200).json({
            success: true,
            data: result.data
        });
        
    } catch (error) {
        console.error('❌ Interest calculation route error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to calculate interest',
            error: error.message
        });
    }
});

// ============================================
// Get interest rate information
// ============================================
router.get('/info', protect, async (req, res) => {
    try {
        const info = interestService.getInterestRateInfo();
        res.status(200).json({
            success: true,
            data: info
        });
    } catch (error) {
        console.error('❌ Get interest info error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get interest information',
            error: error.message
        });
    }
});

module.exports = router;