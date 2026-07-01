const { pool } = require('../config/database');

// ============================================
// ADMIN DASHBOARD
// ============================================
exports.getAdminDashboard = async (req, res) => {
    try {
        // አጠቃላይ ስታቲስቲክስ
        const [userStats] = await pool.query(`
            SELECT 
                COUNT(*) as total_users,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_users,
                SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_users,
                SUM(CASE WHEN role = 'customer' THEN 1 ELSE 0 END) as total_customers,
                SUM(CASE WHEN role = 'teller' THEN 1 ELSE 0 END) as total_tellers,
                SUM(CASE WHEN role = 'accountant' THEN 1 ELSE 0 END) as total_accountants,
                SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as total_admins
            FROM users
        `);

        // የአካውንት ስታቲስቲክስ
        const [accountStats] = await pool.query(`
            SELECT 
                COUNT(*) as total_accounts,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_accounts,
                SUM(CASE WHEN account_type = 'savings' THEN 1 ELSE 0 END) as savings_accounts,
                SUM(CASE WHEN account_type = 'checking' THEN 1 ELSE 0 END) as checking_accounts,
                SUM(CASE WHEN account_type = 'fixed' THEN 1 ELSE 0 END) as fixed_accounts,
                SUM(balance) as total_balance,
                AVG(balance) as average_balance
            FROM accounts
        `);

        // የግብይት ስታቲስቲክስ
        const [transactionStats] = await pool.query(`
            SELECT 
                COUNT(*) as total_transactions,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_transactions,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_transactions,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_transactions,
                SUM(CASE WHEN transaction_type = 'deposit' THEN amount ELSE 0 END) as total_deposits,
                SUM(CASE WHEN transaction_type = 'withdraw' THEN ABS(amount) ELSE 0 END) as total_withdrawals,
                SUM(CASE WHEN transaction_type = 'transfer' THEN ABS(amount) ELSE 0 END) as total_transfers
            FROM transactions
            WHERE status = 'completed'
        `);

        // የዛሬ ግብይቶች
        const [todayTransactions] = await pool.query(`
            SELECT 
                COUNT(*) as today_transactions,
                SUM(amount) as today_volume
            FROM transactions
            WHERE DATE(created_at) = CURDATE()
            AND status = 'completed'
        `);

        // የቅርብ ጊዜ ተጠቃሚዎች
        const [recentUsers] = await pool.query(`
            SELECT id, full_name, email, role, status, created_at
            FROM users
            ORDER BY created_at DESC
            LIMIT 10
        `);

        // የቅርብ ጊዜ ግብይቶች
        const [recentTransactions] = await pool.query(`
            SELECT 
                t.*,
                u.full_name as customer_name,
                a.account_number
            FROM transactions t
            JOIN accounts a ON t.account_id = a.id
            JOIN users u ON a.user_id = u.id
            ORDER BY t.created_at DESC
            LIMIT 10
        `);

        // በሳምንት ግብይቶች (Trend)
        const [weeklyTrend] = await pool.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as count,
                SUM(amount) as volume
            FROM transactions
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            AND status = 'completed'
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `);

        res.json({
            success: true,
            data: {
                summary: {
                    users: userStats[0],
                    accounts: accountStats[0],
                    transactions: transactionStats[0],
                    today: todayTransactions[0]
                },
                recent: {
                    users: recentUsers,
                    transactions: recentTransactions
                },
                trends: {
                    weekly: weeklyTrend
                },
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get admin dashboard',
            error: error.message
        });
    }
};

// ============================================
// TELLER DASHBOARD
// ============================================
exports.getTellerDashboard = async (req, res) => {
    try {
        // የዛሬ ስታቲስቲክስ
        const [todayStats] = await pool.query(`
            SELECT 
                COUNT(*) as total_transactions,
                SUM(CASE WHEN transaction_type = 'deposit' THEN amount ELSE 0 END) as total_deposits,
                SUM(CASE WHEN transaction_type = 'withdraw' THEN ABS(amount) ELSE 0 END) as total_withdrawals,
                COUNT(DISTINCT account_id) as active_accounts
            FROM transactions
            WHERE DATE(created_at) = CURDATE()
            AND status = 'completed'
        `);

        // አጠቃላይ ደንበኞች
        const [customerStats] = await pool.query(`
            SELECT 
                COUNT(*) as total_customers,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_customers
            FROM users
            WHERE role = 'customer'
        `);

        // አጠቃላይ አካውንቶች
        const [accountStats] = await pool.query(`
            SELECT 
                COUNT(*) as total_accounts,
                SUM(balance) as total_balance
            FROM accounts
            WHERE status = 'active'
        `);

        // የቅርብ ጊዜ ደንበኞች
        const [recentCustomers] = await pool.query(`
            SELECT id, full_name, email, phone, status, created_at
            FROM users
            WHERE role = 'customer'
            ORDER BY created_at DESC
            LIMIT 10
        `);

        // የቅርብ ጊዜ ግብይቶች
        const [recentTransactions] = await pool.query(`
            SELECT 
                t.*,
                u.full_name as customer_name,
                a.account_number
            FROM transactions t
            JOIN accounts a ON t.account_id = a.id
            JOIN users u ON a.user_id = u.id
            WHERE DATE(t.created_at) = CURDATE()
            ORDER BY t.created_at DESC
            LIMIT 10
        `);

        // ንቁ የሆኑ ደንበኞች (በመጨረሻ 24 ሰዓታት)
        const [activeCustomers] = await pool.query(`
            SELECT 
                COUNT(DISTINCT u.id) as active_count
            FROM users u
            JOIN accounts a ON u.id = a.user_id
            JOIN transactions t ON a.id = t.account_id
            WHERE u.role = 'customer'
            AND t.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        `);

        res.json({
            success: true,
            data: {
                summary: {
                    today: todayStats[0],
                    customers: customerStats[0],
                    accounts: accountStats[0],
                    active_customers: activeCustomers[0]?.active_count || 0
                },
                recent: {
                    customers: recentCustomers,
                    transactions: recentTransactions
                },
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Teller dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get teller dashboard',
            error: error.message
        });
    }
};

// ============================================
// ACCOUNTANT DASHBOARD
// ============================================
exports.getAccountantDashboard = async (req, res) => {
    try {
        // የዛሬ የሂሳብ ማጠቃለያ
        const [todaySummary] = await pool.query(`
            SELECT 
                COUNT(*) as total_transactions,
                SUM(CASE WHEN transaction_type = 'deposit' THEN amount ELSE 0 END) as total_deposits,
                SUM(CASE WHEN transaction_type = 'withdraw' THEN ABS(amount) ELSE 0 END) as total_withdrawals,
                SUM(CASE WHEN transaction_type = 'transfer' THEN ABS(amount) ELSE 0 END) as total_transfers,
                SUM(amount) as net_flow
            FROM transactions
            WHERE DATE(created_at) = CURDATE()
            AND status = 'completed'
        `);

        // ወርሃዊ ማጠቃለያ
        const [monthlySummary] = await pool.query(`
            SELECT 
                COUNT(*) as total_transactions,
                SUM(CASE WHEN transaction_type = 'deposit' THEN amount ELSE 0 END) as total_deposits,
                SUM(CASE WHEN transaction_type = 'withdraw' THEN ABS(amount) ELSE 0 END) as total_withdrawals,
                SUM(amount) as net_flow,
                AVG(amount) as average_transaction
            FROM transactions
            WHERE MONTH(created_at) = MONTH(CURDATE())
            AND YEAR(created_at) = YEAR(CURDATE())
            AND status = 'completed'
        `);

        // አጠቃላይ የአካውንት ቀሪ ሂሳብ
        const [balanceSummary] = await pool.query(`
            SELECT 
                SUM(balance) as total_balance,
                AVG(balance) as average_balance,
                MAX(balance) as highest_balance,
                MIN(balance) as lowest_balance,
                COUNT(*) as total_accounts
            FROM accounts
            WHERE status = 'active'
        `);

        // በአካውንት አይነት የተከፋፈለ
        const [balanceByType] = await pool.query(`
            SELECT 
                account_type,
                COUNT(*) as count,
                SUM(balance) as total_balance,
                AVG(balance) as average_balance
            FROM accounts
            WHERE status = 'active'
            GROUP BY account_type
        `);

        // ያልተጠናቀቁ ግብይቶች
        const [pendingTransactions] = await pool.query(`
            SELECT 
                COUNT(*) as pending_count,
                SUM(amount) as pending_amount
            FROM transactions
            WHERE status = 'pending'
        `);

        // የቅርብ ጊዜ ግብይቶች
        const [recentTransactions] = await pool.query(`
            SELECT 
                t.*,
                u.full_name as customer_name,
                a.account_number
            FROM transactions t
            JOIN accounts a ON t.account_id = a.id
            JOIN users u ON a.user_id = u.id
            ORDER BY t.created_at DESC
            LIMIT 10
        `);

        // በወር ግብይቶች (Last 6 months)
        const [monthlyTrend] = await pool.query(`
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as month,
                COUNT(*) as transaction_count,
                SUM(amount) as total_volume
            FROM transactions
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
            AND status = 'completed'
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month ASC
        `);

        res.json({
            success: true,
            data: {
                summary: {
                    today: todaySummary[0],
                    monthly: monthlySummary[0],
                    balances: balanceSummary[0],
                    pending: pendingTransactions[0]
                },
                by_type: balanceByType,
                recent_transactions: recentTransactions,
                trends: {
                    monthly: monthlyTrend
                },
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Accountant dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get accountant dashboard',
            error: error.message
        });
    }
};

// ============================================
// CUSTOMER DASHBOARD
// ============================================
exports.getCustomerDashboard = async (req, res) => {
    try {
        const userId = req.user.id;

        // የደንበኛው አጠቃላይ መረጃ
        const [userInfo] = await pool.query(`
            SELECT id, full_name, email, phone, status, profile_image, created_at
            FROM users
            WHERE id = ?
        `, [userId]);

        // የደንበኛው አካውንቶች
        const [accounts] = await pool.query(`
            SELECT 
                id, account_number, account_type, balance, 
                currency, status, created_at
            FROM accounts
            WHERE user_id = ?
            ORDER BY created_at DESC
        `, [userId]);

        // አጠቃላይ ቀሪ ሂሳብ
        const [totalBalance] = await pool.query(`
            SELECT 
                SUM(balance) as total_balance,
                COUNT(*) as total_accounts
            FROM accounts
            WHERE user_id = ? AND status = 'active'
        `, [userId]);

        // የቅርብ ጊዜ ግብይቶች
        const [recentTransactions] = await pool.query(`
            SELECT 
                t.*,
                a.account_number
            FROM transactions t
            JOIN accounts a ON t.account_id = a.id
            WHERE a.user_id = ?
            ORDER BY t.created_at DESC
            LIMIT 10
        `, [userId]);

        // ያልተነበቡ ማሳወቂያዎች
        const [unreadNotifications] = await pool.query(`
            SELECT COUNT(*) as unread_count
            FROM notifications
            WHERE user_id = ? AND is_read = 0
        `, [userId]);

        // የዛሬ ግብይቶች
        const [todayTransactions] = await pool.query(`
            SELECT 
                COUNT(*) as today_count,
                SUM(amount) as today_volume
            FROM transactions t
            JOIN accounts a ON t.account_id = a.id
            WHERE a.user_id = ?
            AND DATE(t.created_at) = CURDATE()
            AND t.status = 'completed'
        `, [userId]);

        // በአካውንት አይነት የተከፋፈለ ቀሪ ሂሳብ
        const [balanceByType] = await pool.query(`
            SELECT 
                account_type,
                COUNT(*) as count,
                SUM(balance) as total_balance
            FROM accounts
            WHERE user_id = ? AND status = 'active'
            GROUP BY account_type
        `, [userId]);

        res.json({
            success: true,
            data: {
                user: userInfo[0],
                summary: {
                    total_balance: totalBalance[0]?.total_balance || 0,
                    total_accounts: totalBalance[0]?.total_accounts || 0,
                    today_transactions: todayTransactions[0]?.today_count || 0,
                    today_volume: todayTransactions[0]?.today_volume || 0,
                    unread_notifications: unreadNotifications[0]?.unread_count || 0
                },
                accounts: accounts,
                balance_by_type: balanceByType,
                recent_transactions: recentTransactions,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Customer dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get customer dashboard',
            error: error.message
        });
    }
};