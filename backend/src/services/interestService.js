const { pool } = require('../config/database');
const { Account, Transaction } = require('../models');
const { createNotification } = require('../controllers/notificationController');

// ⭐ የወለድ መጠን (5% አመታዊ)
const ANNUAL_INTEREST_RATE = 0.05;
const MONTHLY_INTEREST_RATE = ANNUAL_INTEREST_RATE / 12;

// ============================================
// ወርሃዊ ወለድ ለሁሉም ተጠቃሚዎች አስላ
// ============================================
async function calculateMonthlyInterest() {
    try {
        console.log('📊 Starting monthly interest calculation...');
        
        // ሁሉንም ንቁ የሆኑ ቁጠባ (savings) አካውንቶች አምጣ
        const [accounts] = await pool.execute(`
            SELECT a.*, u.full_name, u.email 
            FROM accounts a
            JOIN users u ON a.user_id = u.id
            WHERE a.account_type = 'savings' 
            AND a.status = 'active'
            AND a.balance > 0
        `);

        console.log(`📊 Found ${accounts.length} eligible accounts`);

        let totalInterestApplied = 0;
        let results = [];

        for (const account of accounts) {
            try {
                // ወርሃዊ ወለድ አስላ
                const balance = parseFloat(account.balance);
                const monthlyInterest = balance * MONTHLY_INTEREST_RATE;
                
                if (monthlyInterest > 0) {
                    // አዲስ ቀሪ ሒሳብ
                    const newBalance = balance + monthlyInterest;
                    
                    // ቀሪ ሒሳብ አዘምን
                    await Account.updateBalance(account.id, newBalance);
                    
                    // የወለድ ግብይት መዝግብ
                    const transaction = await Transaction.create({
                        account_id: account.id,
                        transaction_type: 'deposit',
                        amount: monthlyInterest,
                        description: `Monthly interest (${(ANNUAL_INTEREST_RATE * 100)}% annual)`,
                        status: 'completed'
                    });
                    
                    // ⭐ ማሳወቂያ ላክ
                    await createNotification(
                        account.user_id,
                        '📈 Monthly Interest Added',
                        `You have earned ${monthlyInterest.toFixed(2)} ETB in monthly interest. New balance: ${newBalance.toFixed(2)} ETB`,
                        'success'
                    );
                    
                    totalInterestApplied += monthlyInterest;
                    results.push({
                        account_id: account.id,
                        account_number: account.account_number,
                        user_name: account.full_name,
                        balance: balance,
                        interest: monthlyInterest,
                        new_balance: newBalance
                    });
                    
                    console.log(`✅ Applied ${monthlyInterest.toFixed(2)} ETB interest to account ${account.account_number}`);
                }
            } catch (error) {
                console.error(`❌ Error processing account ${account.id}:`, error.message);
            }
        }

        console.log(`📊 Total interest applied: ${totalInterestApplied.toFixed(2)} ETB`);
        
        return {
            success: true,
            totalInterest: totalInterestApplied,
            accountsAffected: results.length,
            details: results
        };
        
    } catch (error) {
        console.error('❌ Monthly interest calculation error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ============================================
// ወርሃዊ ወለድ በራስ-ሰር ለማስኬድ (Cron Job)
// ============================================
async function runMonthlyInterestJob() {
    console.log('🔄 Running monthly interest job...');
    console.log(`📅 Date: ${new Date().toISOString()}`);
    
    const result = await calculateMonthlyInterest();
    
    if (result.success) {
        console.log(`✅ Monthly interest job completed. Total: ${result.totalInterest.toFixed(2)} ETB`);
    } else {
        console.error('❌ Monthly interest job failed:', result.error);
    }
    
    return result;
}

// ============================================
// ለአንድ የተወሰነ አካውንት ወለድ አስላ
// ============================================
async function calculateInterestForAccount(accountId) {
    try {
        const account = await Account.findById(accountId);
        if (!account) {
            return { success: false, message: 'Account not found' };
        }
        
        if (account.account_type !== 'savings') {
            return { success: false, message: 'Only savings accounts earn interest' };
        }
        
        if (account.status !== 'active') {
            return { success: false, message: 'Account is not active' };
        }
        
        const balance = parseFloat(account.balance);
        if (balance <= 0) {
            return { success: false, message: 'Balance must be greater than 0' };
        }
        
        const monthlyInterest = balance * MONTHLY_INTEREST_RATE;
        const yearlyInterest = balance * ANNUAL_INTEREST_RATE;
        
        return {
            success: true,
            data: {
                account_id: account.id,
                account_number: account.account_number,
                balance: balance,
                annual_rate: ANNUAL_INTEREST_RATE * 100,
                monthly_interest: monthlyInterest,
                yearly_interest: yearlyInterest
            }
        };
        
    } catch (error) {
        console.error('Calculate interest error:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// ወለድ መረጃ ማግኘት
// ============================================
function getInterestRateInfo() {
    return {
        annual_rate: ANNUAL_INTEREST_RATE * 100,
        monthly_rate: MONTHLY_INTEREST_RATE * 100,
        description: 'Interest is calculated monthly on savings accounts at 5% annual rate'
    };
}

module.exports = {
    calculateMonthlyInterest,
    runMonthlyInterestJob,
    calculateInterestForAccount,
    getInterestRateInfo,
    ANNUAL_INTEREST_RATE
};