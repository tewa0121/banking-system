const { Account } = require('../models');

// Interest rate configuration
const INTEREST_RATE = 0.05; // 5% annual interest

// ============================================
// Calculate interest for a specific account
// ============================================
async function calculateAccountInterest(accountId) {
    try {
        console.log('📊 Calculating interest for account:', accountId);

        // Get account
        const account = await Account.findById(accountId);
        if (!account) {
            return { 
                success: false, 
                message: 'Account not found' 
            };
        }

        // Only savings accounts earn interest
        if (account.account_type !== 'savings') {
            return { 
                success: false, 
                message: 'Only savings accounts earn interest' 
            };
        }

        // Check if balance is greater than 0
        const balance = parseFloat(account.balance);
        if (balance <= 0) {
            return { 
                success: false, 
                message: 'Balance must be greater than 0 to earn interest' 
            };
        }

        // Calculate monthly interest (annual rate / 12)
        const monthlyRate = INTEREST_RATE / 12;
        const monthlyInterest = balance * monthlyRate;

        // Calculate yearly interest
        const yearlyInterest = balance * INTEREST_RATE;

        return {
            success: true,
            data: {
                account_id: account.id,
                account_number: account.account_number,
                balance: balance,
                annual_rate: INTEREST_RATE * 100,
                monthly_interest: monthlyInterest,
                yearly_interest: yearlyInterest,
                currency: account.currency || 'ETB'
            }
        };

    } catch (error) {
        console.error('❌ Calculate interest error:', error);
        return { 
            success: false, 
            message: 'Failed to calculate interest',
            error: error.message 
        };
    }
}

// ============================================
// Get interest rate information
// ============================================
function getInterestRateInfo() {
    return {
        annual_rate: INTEREST_RATE * 100,
        monthly_rate: (INTEREST_RATE / 12) * 100,
        description: 'Interest is calculated monthly on savings accounts'
    };
}

module.exports = {
    calculateAccountInterest,
    getInterestRateInfo,
    INTEREST_RATE
};