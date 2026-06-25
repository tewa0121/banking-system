const { Account, Transaction } = require('../models');

// ============================================
// Bank Controller - Get bank list for transfers
// ============================================
exports.getBanks = async (req, res) => {
    try {
        const banks = [
            { id: 1, code: 'CBE', name: 'Commercial Bank of Ethiopia', shortName: 'CBE' },
            { id: 2, code: 'AWASH', name: 'Awash Bank', shortName: 'Awash' },
            { id: 3, code: 'DASHEN', name: 'Dashen Bank', shortName: 'Dashen' },
            { id: 4, code: 'WEGAGEN', name: 'Wegagen Bank', shortName: 'Wegagen' },
            { id: 5, code: 'UNITED', name: 'United Bank', shortName: 'United' },
            { id: 6, code: 'NIB', name: 'Nib International Bank', shortName: 'NIB' },
            { id: 7, code: 'ZEMEN', name: 'Zemen Bank', shortName: 'Zemen' },
            { id: 8, code: 'OROMIA', name: 'Oromia Bank', shortName: 'Oromia' },
            { id: 9, code: 'BUNA', name: 'Buna Bank', shortName: 'Buna' },
            { id: 10, code: 'ABAY', name: 'Abay Bank', shortName: 'Abay' },
            { id: 11, code: 'ADDIS', name: 'Addis International Bank', shortName: 'Addis' },
            { id: 12, code: 'SHABELLE', name: 'Shabelle Bank', shortName: 'Shabelle' }
        ];
        
        res.status(200).json({
            success: true,
            count: banks.length,
            data: banks
        });
    } catch (error) {
        console.error('Get banks error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get banks',
            error: error.message
        });
    }
};

// ============================================
// Bank Transfer - Transfer to external bank
// ============================================
exports.externalTransfer = async (req, res) => {
    try {
        const { from_account_id, bank_code, account_number, account_name, amount, description } = req.body;

        console.log('📥 External transfer request received:');
        console.log('  - from_account_id:', from_account_id);
        console.log('  - bank_code:', bank_code);
        console.log('  - account_number:', account_number);
        console.log('  - account_name:', account_name);
        console.log('  - amount:', amount);
        console.log('  - description:', description);

        // ⭐ Convert values to proper types
        const parsedFromAccountId = parseInt(from_account_id);
        const parsedAmount = parseFloat(amount);

        // Validate input
        const errors = [];
        if (!parsedFromAccountId || isNaN(parsedFromAccountId)) errors.push('Valid from_account_id is required');
        if (!bank_code) errors.push('bank_code is required');
        if (!account_number) errors.push('account_number is required');
        if (!account_name) errors.push('account_name is required');
        if (!parsedAmount || parsedAmount <= 0) errors.push('amount must be greater than 0');

        if (errors.length > 0) {
            console.log('❌ Validation errors:', errors);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors
            });
        }

        // Check account exists
        const account = await Account.findById(parsedFromAccountId);
        if (!account) {
            console.log('❌ Account not found:', parsedFromAccountId);
            return res.status(404).json({
                success: false,
                message: 'Account not found'
            });
        }

        console.log('✅ Account found:', account.account_number);
        console.log('💰 Current balance:', account.balance);

        // Check sufficient balance
        if (parseFloat(account.balance) < parsedAmount) {
            console.log('❌ Insufficient balance. Balance:', account.balance, 'Amount:', parsedAmount);
            return res.status(400).json({
                success: false,
                message: 'Insufficient balance'
            });
        }

        // Update balance
        const newBalance = parseFloat(account.balance) - parsedAmount;
        await Account.updateBalance(parsedFromAccountId, newBalance);
        console.log('✅ Balance updated. New balance:', newBalance);

        // Create transaction
        const transaction = await Transaction.create({
            account_id: parsedFromAccountId,
            transaction_type: 'transfer',
            amount: parsedAmount,
            description: description || `Transfer to ${account_name} (${bank_code})`,
            status: 'completed'
        });
        console.log('✅ Transaction created:', transaction.id);

        const updatedAccount = await Account.findById(parsedFromAccountId);

        res.status(200).json({
            success: true,
            message: 'External transfer successful',
            data: {
                account: updatedAccount,
                transaction: transaction,
                bank: bank_code,
                recipient: account_name
            }
        });

    } catch (error) {
        console.error('❌ External transfer error:', error);
        console.error('❌ Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'External transfer failed',
            error: error.message
        });
    }
};