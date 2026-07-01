import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axiosConfig';

function CustomerDashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [darkMode, setDarkMode] = useState(false);
    const [language, setLanguage] = useState('en');

    // Modal states
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        amount: '',
        toAccount: '',
        description: '',
        account_id: ''
    });
    const [profileData, setProfileData] = useState({
        full_name: '',
        phone: '',
        address: ''
    });

    const safeNotifications = Array.isArray(notifications) ? notifications : [];

    const summary = {
        totalAccounts: accounts.length,
        totalBalance: accounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0),
        recentTransactions: transactions.length,
        unreadNotifications: safeNotifications.filter(n => !n.is_read).length
    };

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            
            const accountsRes = await api.get('/customer/accounts');
            if (accountsRes.data.success) {
                const accountsData = accountsRes.data.data || [];
                setAccounts(accountsData);
                if (accountsData.length > 0) {
                    setSelectedAccount(accountsData[0]);
                    setFormData(prev => ({
                        ...prev,
                        account_id: accountsData[0].id.toString()
                    }));
                    const txRes = await api.get(`/customer/accounts/${accountsData[0].id}/transactions?limit=20`);
                    if (txRes.data.success) {
                        setTransactions(txRes.data.data?.transactions || []);
                    }
                }
            }

            const notifRes = await api.get('/customer/notifications?limit=10');
            if (notifRes.data.success) {
                setNotifications(Array.isArray(notifRes.data.data) ? notifRes.data.data : []);
            }

        } catch (error) {
            console.error('Error fetching data:', error);
            if (error.response?.status === 403 || error.response?.status === 401) {
                toast.error('Session expired. Please login again.');
                navigate('/login');
            } else {
                toast.error('Failed to load dashboard');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        const userData = localStorage.getItem('user');
        if (userData) {
            const parsed = JSON.parse(userData);
            setUser(parsed);
            setProfileData({
                full_name: parsed.full_name || '',
                phone: parsed.phone || '',
                address: parsed.address || ''
            });
        }

        fetchDashboardData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate]);

    // ============================================
    // DEPOSIT
    // ============================================
    const handleDeposit = async (e) => {
        e.preventDefault();
        
        console.log('💰 Deposit - Selected Account:', selectedAccount);
        
        if (!selectedAccount) {
            toast.error('Please select an account first');
            return;
        }
        
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        try {
            const payload = {
                account_id: selectedAccount.id,
                amount: parseFloat(formData.amount),
                description: formData.description || 'Deposit'
            };
            
            console.log('📤 Sending deposit payload:', payload);
            
            const response = await api.post('/customer/deposit', payload);
            
            console.log('📥 Deposit response:', response.data);
            
            if (response.data.success) {
                toast.success(`💰 Deposit successful! New balance: ETB ${response.data.data.new_balance?.toFixed(2)}`);
                setShowDepositModal(false);
                setFormData({ ...formData, amount: '', description: '' });
                fetchDashboardData();
            } else {
                toast.error(response.data.message || 'Deposit failed');
            }
        } catch (error) {
            console.error('❌ Deposit error:', error);
            toast.error(error.response?.data?.message || 'Deposit failed');
        }
    };

    // ============================================
    // WITHDRAW
    // ============================================
    const handleWithdraw = async (e) => {
        e.preventDefault();
        
        console.log('🏦 Withdraw - Selected Account:', selectedAccount);
        
        if (!selectedAccount) {
            toast.error('Please select an account first');
            return;
        }
        
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }
        
        if (parseFloat(formData.amount) > parseFloat(selectedAccount.balance)) {
            toast.error('Insufficient balance');
            return;
        }

        try {
            const payload = {
                account_id: selectedAccount.id,
                amount: parseFloat(formData.amount),
                description: formData.description || 'Withdrawal'
            };
            
            console.log('📤 Sending withdraw payload:', payload);
            
            const response = await api.post('/customer/withdraw', payload);
            
            console.log('📥 Withdraw response:', response.data);
            
            if (response.data.success) {
                toast.success(`🏦 Withdrawal successful! New balance: ETB ${response.data.data.new_balance?.toFixed(2)}`);
                setShowWithdrawModal(false);
                setFormData({ ...formData, amount: '', description: '' });
                fetchDashboardData();
            } else {
                toast.error(response.data.message || 'Withdrawal failed');
            }
        } catch (error) {
            console.error('❌ Withdraw error:', error);
            toast.error(error.response?.data?.message || 'Withdrawal failed');
        }
    };

    // ============================================
    // ⭐ TRANSFER - የተሻሻለ
    // ============================================
    const handleTransfer = async (e) => {
        e.preventDefault();
        
        console.log('📤 Customer Transfer form submitted:');
        console.log('  Selected Account:', selectedAccount);
        console.log('  toAccount:', formData.toAccount);
        console.log('  amount:', formData.amount);
        console.log('  description:', formData.description);
        
        // ⭐ ማረጋገጫ
        if (!selectedAccount) {
            toast.error('Please select an account first');
            return;
        }
        
        if (!formData.toAccount || formData.toAccount.trim() === '') {
            toast.error('Please enter destination account number');
            return;
        }
        
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }
        
        if (parseFloat(formData.amount) > parseFloat(selectedAccount.balance)) {
            toast.error('Insufficient balance');
            return;
        }

        try {
            const payload = {
                from_account_id: selectedAccount.id,
                to_account_number: formData.toAccount.trim(),
                amount: parseFloat(formData.amount),
                description: formData.description || 'Transfer'
            };
            
            console.log('📤 Sending transfer payload:', payload);
            
            const response = await api.post('/customer/transfer', payload);
            
            console.log('📥 Transfer response:', response.data);
            
            if (response.data.success) {
                toast.success('📤 Transfer successful!');
                setShowTransferModal(false);
                setFormData({ ...formData, amount: '', toAccount: '', description: '' });
                fetchDashboardData();
            } else {
                toast.error(response.data.message || 'Transfer failed');
            }
        } catch (error) {
            console.error('❌ Transfer error:', error);
            console.error('❌ Error response:', error.response?.data);
            
            if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Transfer failed. Please try again.');
            }
        }
    };

    // ============================================
    // VIEW HISTORY
    // ============================================
    const fetchTransactionHistory = async (accountId) => {
        if (!accountId) {
            toast.error('Please select an account first');
            return;
        }
        
        try {
            const response = await api.get(`/customer/accounts/${accountId}/transactions?limit=50`);
            if (response.data.success) {
                setTransactions(response.data.data?.transactions || []);
                setShowHistoryModal(true);
            }
        } catch (error) {
            toast.error('Failed to fetch transaction history');
        }
    };

    // ============================================
    // UPDATE PROFILE
    // ============================================
    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            const response = await api.put('/customer/profile', profileData);
            if (response.data.success) {
                toast.success('✅ Profile updated successfully!');
                setShowProfileModal(false);
                const userData = JSON.parse(localStorage.getItem('user'));
                userData.full_name = profileData.full_name;
                userData.phone = profileData.phone;
                userData.address = profileData.address;
                localStorage.setItem('user', JSON.stringify(userData));
                setUser(userData);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        }
    };

    // ============================================
    // CHANGE PASSWORD
    // ============================================
    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        if (formData.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        try {
            const response = await api.put('/customer/profile/password', {
                current_password: formData.currentPassword,
                new_password: formData.newPassword
            });
            if (response.data.success) {
                toast.success('🔒 Password changed successfully!');
                setShowPasswordModal(false);
                setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to change password');
        }
    };

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
        document.body.style.backgroundColor = darkMode ? '#f8f9fa' : '#1a202c';
        document.body.style.color = darkMode ? '#2d3748' : '#f7fafc';
    };

    const changeLanguage = (lang) => {
        setLanguage(lang);
        toast.info(`Language changed to ${lang.toUpperCase()}`);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        toast.info('Logged out successfully');
    };

    const t = (key) => {
        const translations = {
            en: {
                welcome: 'Welcome',
                dashboard: 'Dashboard',
                deposit: 'Deposit',
                withdraw: 'Withdraw',
                transfer: 'Transfer',
                history: 'History',
                profile: 'Profile',
                logout: 'Logout',
                quickActions: 'Quick Actions',
                yourAccounts: 'Your Accounts',
                recentTransactions: 'Recent Transactions',
                notifications: 'Notifications',
                totalBalance: 'Total Balance',
                totalAccounts: 'Total Accounts'
            },
            am: {
                welcome: 'እንኳን ደህና መጡ',
                dashboard: 'ዳሽቦርድ',
                deposit: 'ገንዘብ ማስገባት',
                withdraw: 'ገንዘብ ማውጣት',
                transfer: 'ማስተላለፍ',
                history: 'ታሪክ',
                profile: 'መገለጫ',
                logout: 'ውጣ',
                quickActions: 'ፈጣን እርምጃዎች',
                yourAccounts: 'የእርስዎ አካውንቶች',
                recentTransactions: 'የቅርብ ግብይቶች',
                notifications: 'ማሳወቂያዎች',
                totalBalance: 'ጠቅላላ ቀሪ ሂሳብ',
                totalAccounts: 'ጠቅላላ አካውንቶች'
            },
            or: {
                welcome: 'Bagaa Nagaan',
                dashboard: 'Dashboordii',
                deposit: 'Kaa\'uu',
                withdraw: 'Baasuu',
                transfer: 'Sochoosuu',
                history: 'Seenaa',
                profile: 'Biyyoo',
                logout: 'Ba\'uu',
                quickActions: 'Tarkaanfii Dafaa',
                yourAccounts: 'Akauntota Keessan',
                recentTransactions: 'Sochoosaa Dhiyoo',
                notifications: 'Beeksisaa',
                totalBalance: 'Hamma Walii',
                totalAccounts: 'Akauntota Walii'
            }
        };
        return translations[language]?.[key] || key;
    };

    if (loading) {
        return <div style={styles.loading}>Loading...</div>;
    }

    return (
        <div style={{ ...styles.container, backgroundColor: darkMode ? '#1a202c' : '#f8f9fa' }}>
            {/* Header */}
            <div style={{ ...styles.header, backgroundColor: darkMode ? '#2d3748' : 'white' }}>
                <div>
                    <h1 style={{ ...styles.title, color: darkMode ? '#f7fafc' : '#2d3748' }}>
                        👤 {t('welcome')}, {user?.full_name}!
                    </h1>
                    <p style={{ ...styles.subtitle, color: darkMode ? '#a0aec0' : '#718096' }}>
                        {t('dashboard')}
                    </p>
                </div>
                <div style={styles.headerActions}>
                    <select 
                        value={language} 
                        onChange={(e) => changeLanguage(e.target.value)}
                        style={{ ...styles.languageSelect, backgroundColor: darkMode ? '#4a5568' : 'white', color: darkMode ? '#f7fafc' : '#2d3748' }}
                    >
                        <option value="en">🇬🇧 English</option>
                        <option value="am">🇪🇹 አማርኛ</option>
                        <option value="or">🇪🇹 Oromiffa</option>
                    </select>
                    <button onClick={toggleDarkMode} style={styles.themeButton}>
                        {darkMode ? '☀️' : '🌙'}
                    </button>
                    <button onClick={() => setShowProfileModal(true)} style={styles.profileButton}>
                        👤 {t('profile')}
                    </button>
                    <button onClick={handleLogout} style={styles.logoutButton}>
                        {t('logout')}
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div style={styles.statsGrid}>
                <div style={{ ...styles.statCard, backgroundColor: darkMode ? '#2d3748' : 'white' }}>
                    <div style={styles.statIcon}>🏦</div>
                    <h3 style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>{summary.totalAccounts}</h3>
                    <p style={{ color: darkMode ? '#a0aec0' : '#718096' }}>{t('totalAccounts')}</p>
                </div>
                <div style={{ ...styles.statCard, backgroundColor: darkMode ? '#2d3748' : 'white' }}>
                    <div style={styles.statIcon}>💰</div>
                    <h3 style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>ETB {summary.totalBalance.toLocaleString()}</h3>
                    <p style={{ color: darkMode ? '#a0aec0' : '#718096' }}>{t('totalBalance')}</p>
                </div>
                <div style={{ ...styles.statCard, backgroundColor: darkMode ? '#2d3748' : 'white' }}>
                    <div style={styles.statIcon}>📊</div>
                    <h3 style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>{summary.recentTransactions}</h3>
                    <p style={{ color: darkMode ? '#a0aec0' : '#718096' }}>{t('recentTransactions')}</p>
                </div>
                <div style={{ ...styles.statCard, backgroundColor: darkMode ? '#2d3748' : 'white' }}>
                    <div style={styles.statIcon}>🔔</div>
                    <h3 style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>{summary.unreadNotifications}</h3>
                    <p style={{ color: darkMode ? '#a0aec0' : '#718096' }}>{t('notifications')}</p>
                </div>
            </div>

            {/* Quick Actions */}
            <div style={styles.quickActions}>
                <h3 style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>{t('quickActions')}</h3>
                <div style={styles.actionGrid}>
                    <button 
                        onClick={() => {
                            if (selectedAccount) {
                                setShowDepositModal(true);
                            } else {
                                toast.error('Please select an account first');
                            }
                        }} 
                        style={styles.actionButton}
                    >
                        💰 {t('deposit')}
                    </button>
                    <button 
                        onClick={() => {
                            if (selectedAccount) {
                                setShowWithdrawModal(true);
                            } else {
                                toast.error('Please select an account first');
                            }
                        }} 
                        style={{ ...styles.actionButton, backgroundColor: '#e53e3e' }}
                    >
                        🏦 {t('withdraw')}
                    </button>
                    <button 
                        onClick={() => {
                            if (selectedAccount) {
                                setShowTransferModal(true);
                            } else {
                                toast.error('Please select an account first');
                            }
                        }} 
                        style={{ ...styles.actionButton, backgroundColor: '#805ad5' }}
                    >
                        📤 {t('transfer')}
                    </button>
                    <button 
                        onClick={() => {
                            if (selectedAccount) {
                                fetchTransactionHistory(selectedAccount.id);
                            } else {
                                toast.error('Please select an account first');
                            }
                        }} 
                        style={{ ...styles.actionButton, backgroundColor: '#38a169' }}
                    >
                        📋 {t('history')}
                    </button>
                </div>
            </div>

            {/* Accounts */}
            <div style={{ ...styles.card, backgroundColor: darkMode ? '#2d3748' : 'white' }}>
                <h3 style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>{t('yourAccounts')}</h3>
                <div style={styles.accountSelector}>
                    <select 
                        value={selectedAccount?.id || ''} 
                        onChange={(e) => {
                            const accountId = parseInt(e.target.value);
                            const acc = accounts.find(a => a.id === accountId);
                            setSelectedAccount(acc);
                            if (acc) {
                                setFormData(prev => ({
                                    ...prev,
                                    account_id: acc.id.toString()
                                }));
                            }
                            console.log('✅ Account selected:', acc);
                        }}
                        style={{ ...styles.accountSelect, backgroundColor: darkMode ? '#4a5568' : 'white', color: darkMode ? '#f7fafc' : '#2d3748' }}
                    >
                        <option value="">-- Select Account --</option>
                        {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>
                                {acc.account_number} - ETB {acc.balance}
                            </option>
                        ))}
                    </select>
                </div>
                <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Account</th>
                                <th style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Type</th>
                                <th style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Balance</th>
                                <th style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {accounts.map(acc => (
                                <tr key={acc.id}>
                                    <td style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>{acc.account_number}</td>
                                    <td style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>{acc.account_type}</td>
                                    <td style={parseFloat(acc.balance) > 0 ? styles.positiveAmount : styles.negativeAmount}>
                                        ETB {parseFloat(acc.balance).toLocaleString()}
                                    </td>
                                    <td>
                                        <span style={acc.status === 'active' ? styles.activeBadge : styles.inactiveBadge}>
                                            {acc.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recent Transactions */}
            <div style={{ ...styles.card, backgroundColor: darkMode ? '#2d3748' : 'white' }}>
                <h3 style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>{t('recentTransactions')}</h3>
                {transactions.length === 0 ? (
                    <p style={{ color: darkMode ? '#a0aec0' : '#718096' }}>No transactions yet</p>
                ) : (
                    <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Type</th>
                                    <th style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Amount</th>
                                    <th style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Description</th>
                                    <th style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.slice(0, 5).map(tx => (
                                    <tr key={tx.id}>
                                        <td>
                                            <span style={tx.transaction_type === 'deposit' ? styles.depositText : styles.withdrawText}>
                                                {tx.transaction_type}
                                            </span>
                                        </td>
                                        <td style={parseFloat(tx.amount) > 0 ? styles.positiveAmount : styles.negativeAmount}>
                                            {parseFloat(tx.amount).toLocaleString()} ETB
                                        </td>
                                        <td style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>{tx.description || '-'}</td>
                                        <td style={{ color: darkMode ? '#a0aec0' : '#718096' }}>{new Date(tx.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Notifications */}
            <div style={{ ...styles.card, backgroundColor: darkMode ? '#2d3748' : 'white' }}>
                <h3 style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>🔔 {t('notifications')}</h3>
                {safeNotifications.length === 0 ? (
                    <p style={{ color: darkMode ? '#a0aec0' : '#718096' }}>No notifications</p>
                ) : (
                    <div style={styles.notificationList}>
                        {safeNotifications.slice(0, 5).map(n => (
                            <div key={n.id} style={{
                                ...styles.notificationItem,
                                opacity: n.is_read ? 0.7 : 1,
                                borderLeft: n.is_read ? '3px solid #e2e8f0' : '3px solid #4299e1'
                            }}>
                                <div>
                                    <div style={styles.notificationHeader}>
                                        <span style={{ ...styles.notificationTitle, color: darkMode ? '#f7fafc' : '#2d3748' }}>
                                            {n.title}
                                        </span>
                                        <span style={{ ...styles.notificationDate, color: darkMode ? '#a0aec0' : '#718096' }}>
                                            {new Date(n.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p style={{ ...styles.notificationMessage, color: darkMode ? '#f7fafc' : '#4a5568' }}>
                                        {n.message}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Deposit Modal */}
            {showDepositModal && (
                <div style={styles.modal}>
                    <div style={{ ...styles.modalContent, backgroundColor: darkMode ? '#2d3748' : 'white' }}>
                        <h2 style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>💰 {t('deposit')}</h2>
                        <form onSubmit={handleDeposit}>
                            <div style={styles.formGroup}>
                                <label style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Account</label>
                                <div style={{ 
                                    padding: '10px 12px', 
                                    backgroundColor: darkMode ? '#4a5568' : '#f7fafc', 
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0',
                                    color: darkMode ? '#f7fafc' : '#2d3748'
                                }}>
                                    {selectedAccount?.account_number || 'No account selected'}
                                    <span style={{ float: 'right', fontWeight: 'bold', color: '#38a169' }}>
                                        Balance: ETB {selectedAccount?.balance?.toLocaleString() || 0}
                                    </span>
                                </div>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Amount (ETB)</label>
                                <input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                    placeholder="Enter amount"
                                    required
                                    min="1"
                                    step="0.01"
                                    style={{ ...styles.input, backgroundColor: darkMode ? '#4a5568' : 'white', color: darkMode ? '#f7fafc' : '#2d3748' }}
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Description</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    placeholder="Optional description"
                                    style={{ ...styles.input, backgroundColor: darkMode ? '#4a5568' : 'white', color: darkMode ? '#f7fafc' : '#2d3748' }}
                                />
                            </div>
                            <div style={styles.modalActions}>
                                <button type="submit" style={styles.primaryButton}>💳 Deposit</button>
                                <button type="button" onClick={() => setShowDepositModal(false)} style={styles.secondaryButton}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Withdraw Modal */}
            {showWithdrawModal && (
                <div style={styles.modal}>
                    <div style={{ ...styles.modalContent, backgroundColor: darkMode ? '#2d3748' : 'white' }}>
                        <h2 style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>🏦 {t('withdraw')}</h2>
                        <form onSubmit={handleWithdraw}>
                            <div style={styles.formGroup}>
                                <label style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Account</label>
                                <div style={{ 
                                    padding: '10px 12px', 
                                    backgroundColor: darkMode ? '#4a5568' : '#f7fafc', 
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0',
                                    color: darkMode ? '#f7fafc' : '#2d3748'
                                }}>
                                    {selectedAccount?.account_number || 'No account selected'}
                                    <span style={{ float: 'right', fontWeight: 'bold', color: '#38a169' }}>
                                        Balance: ETB {selectedAccount?.balance?.toLocaleString() || 0}
                                    </span>
                                </div>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Amount (ETB)</label>
                                <input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                    placeholder="Enter amount"
                                    required
                                    min="1"
                                    max={selectedAccount?.balance}
                                    step="0.01"
                                    style={{ ...styles.input, backgroundColor: darkMode ? '#4a5568' : 'white', color: darkMode ? '#f7fafc' : '#2d3748' }}
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Description</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    placeholder="Optional description"
                                    style={{ ...styles.input, backgroundColor: darkMode ? '#4a5568' : 'white', color: darkMode ? '#f7fafc' : '#2d3748' }}
                                />
                            </div>
                            <div style={styles.modalActions}>
                                <button type="submit" style={{ ...styles.primaryButton, backgroundColor: '#e53e3e' }}>🏦 Withdraw</button>
                                <button type="button" onClick={() => setShowWithdrawModal(false)} style={styles.secondaryButton}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Transfer Modal */}
            {showTransferModal && (
                <div style={styles.modal}>
                    <div style={{ ...styles.modalContent, backgroundColor: darkMode ? '#2d3748' : 'white' }}>
                        <h2 style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>📤 {t('transfer')}</h2>
                        <form onSubmit={handleTransfer}>
                            <div style={styles.formGroup}>
                                <label style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>From Account</label>
                                <div style={{ 
                                    padding: '10px 12px', 
                                    backgroundColor: darkMode ? '#4a5568' : '#f7fafc', 
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0',
                                    color: darkMode ? '#f7fafc' : '#2d3748'
                                }}>
                                    {selectedAccount?.account_number || 'No account selected'}
                                    <span style={{ float: 'right', fontWeight: 'bold', color: '#38a169' }}>
                                        Balance: ETB {selectedAccount?.balance?.toLocaleString() || 0}
                                    </span>
                                </div>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Destination Account Number</label>
                                <input
                                    type="text"
                                    value={formData.toAccount}
                                    onChange={(e) => setFormData({...formData, toAccount: e.target.value})}
                                    placeholder="Enter destination account number"
                                    required
                                    style={{ ...styles.input, backgroundColor: darkMode ? '#4a5568' : 'white', color: darkMode ? '#f7fafc' : '#2d3748' }}
                                />
                                <small style={{ color: darkMode ? '#a0aec0' : '#718096', fontSize: '12px' }}>
                                    Enter the account number (e.g., ACC1234567890)
                                </small>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Amount (ETB)</label>
                                <input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                    placeholder="Enter amount"
                                    required
                                    min="1"
                                    max={selectedAccount?.balance}
                                    step="0.01"
                                    style={{ ...styles.input, backgroundColor: darkMode ? '#4a5568' : 'white', color: darkMode ? '#f7fafc' : '#2d3748' }}
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Description</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    placeholder="Optional description"
                                    style={{ ...styles.input, backgroundColor: darkMode ? '#4a5568' : 'white', color: darkMode ? '#f7fafc' : '#2d3748' }}
                                />
                            </div>
                            <div style={styles.modalActions}>
                                <button type="submit" style={{ ...styles.primaryButton, backgroundColor: '#805ad5' }}>📤 Transfer</button>
                                <button type="button" onClick={() => setShowTransferModal(false)} style={styles.secondaryButton}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {showHistoryModal && (
                <div style={styles.modal}>
                    <div style={{ ...styles.modalContent, backgroundColor: darkMode ? '#2d3748' : 'white', maxWidth: '800px' }}>
                        <h2 style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>📋 Transaction History</h2>
                        {transactions.length === 0 ? (
                            <p style={{ color: darkMode ? '#a0aec0' : '#718096' }}>No transactions found</p>
                        ) : (
                            <div style={styles.tableWrapper}>
                                <table style={styles.table}>
                                    <thead>
                                        <tr>
                                            <th style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Type</th>
                                            <th style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Amount</th>
                                            <th style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Description</th>
                                            <th style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Status</th>
                                            <th style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.map(tx => (
                                            <tr key={tx.id}>
                                                <td>
                                                    <span style={tx.transaction_type === 'deposit' ? styles.depositText : styles.withdrawText}>
                                                        {tx.transaction_type}
                                                    </span>
                                                </td>
                                                <td style={parseFloat(tx.amount) > 0 ? styles.positiveAmount : styles.negativeAmount}>
                                                    {parseFloat(tx.amount).toLocaleString()} ETB
                                                </td>
                                                <td style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>{tx.description || '-'}</td>
                                                <td>
                                                    <span style={tx.status === 'completed' ? styles.completedBadge : styles.pendingBadge}>
                                                        {tx.status}
                                                    </span>
                                                </td>
                                                <td style={{ color: darkMode ? '#a0aec0' : '#718096' }}>{new Date(tx.created_at).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <div style={styles.modalActions}>
                            <button type="button" onClick={() => setShowHistoryModal(false)} style={styles.primaryButton}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Profile Modal */}
            {showProfileModal && (
                <div style={styles.modal}>
                    <div style={{ ...styles.modalContent, backgroundColor: darkMode ? '#2d3748' : 'white' }}>
                        <h2 style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>👤 Edit Profile</h2>
                        <form onSubmit={handleUpdateProfile}>
                            <div style={styles.formGroup}>
                                <label style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Full Name</label>
                                <input
                                    type="text"
                                    value={profileData.full_name}
                                    onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                                    required
                                    style={{ ...styles.input, backgroundColor: darkMode ? '#4a5568' : 'white', color: darkMode ? '#f7fafc' : '#2d3748' }}
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Phone</label>
                                <input
                                    type="tel"
                                    value={profileData.phone}
                                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                                    style={{ ...styles.input, backgroundColor: darkMode ? '#4a5568' : 'white', color: darkMode ? '#f7fafc' : '#2d3748' }}
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Address</label>
                                <input
                                    type="text"
                                    value={profileData.address}
                                    onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                                    style={{ ...styles.input, backgroundColor: darkMode ? '#4a5568' : 'white', color: darkMode ? '#f7fafc' : '#2d3748' }}
                                />
                            </div>
                            <div style={styles.modalActions}>
                                <button type="submit" style={styles.primaryButton}>Update</button>
                                <button type="button" onClick={() => setShowProfileModal(false)} style={styles.secondaryButton}>Cancel</button>
                            </div>
                        </form>
                        <div style={styles.divider}></div>
                        <button onClick={() => { setShowProfileModal(false); setShowPasswordModal(true); }} style={styles.passwordButton}>
                            🔒 Change Password
                        </button>
                    </div>
                </div>
            )}

            {/* Password Modal */}
            {showPasswordModal && (
                <div style={styles.modal}>
                    <div style={{ ...styles.modalContent, backgroundColor: darkMode ? '#2d3748' : 'white' }}>
                        <h2 style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>🔒 Change Password</h2>
                        <form onSubmit={handleChangePassword}>
                            <div style={styles.formGroup}>
                                <label style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Current Password</label>
                                <input
                                    type="password"
                                    value={formData.currentPassword}
                                    onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                                    required
                                    style={{ ...styles.input, backgroundColor: darkMode ? '#4a5568' : 'white', color: darkMode ? '#f7fafc' : '#2d3748' }}
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>New Password</label>
                                <input
                                    type="password"
                                    value={formData.newPassword}
                                    onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                                    required
                                    minLength="6"
                                    style={{ ...styles.input, backgroundColor: darkMode ? '#4a5568' : 'white', color: darkMode ? '#f7fafc' : '#2d3748' }}
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Confirm Password</label>
                                <input
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                                    required
                                    style={{ ...styles.input, backgroundColor: darkMode ? '#4a5568' : 'white', color: darkMode ? '#f7fafc' : '#2d3748' }}
                                />
                            </div>
                            <div style={styles.modalActions}>
                                <button type="submit" style={styles.primaryButton}>Change Password</button>
                                <button type="button" onClick={() => setShowPasswordModal(false)} style={styles.secondaryButton}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    container: {
        padding: '20px',
        maxWidth: '1200px',
        margin: '0 auto',
        minHeight: '100vh',
        transition: 'all 0.3s ease'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        flexWrap: 'wrap',
        gap: '10px'
    },
    headerActions: {
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
        flexWrap: 'wrap'
    },
    title: {
        margin: 0,
        fontSize: '24px',
        fontWeight: '700'
    },
    subtitle: {
        margin: '5px 0 0 0',
        fontSize: '14px'
    },
    languageSelect: {
        padding: '8px 12px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        fontSize: '14px',
        cursor: 'pointer'
    },
    themeButton: {
        padding: '8px 12px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        fontSize: '18px',
        cursor: 'pointer',
        backgroundColor: 'white'
    },
    profileButton: {
        padding: '10px 20px',
        backgroundColor: '#4299e1',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500'
    },
    logoutButton: {
        padding: '10px 24px',
        backgroundColor: '#e53e3e',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600'
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
    },
    statCard: {
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        textAlign: 'center'
    },
    statIcon: {
        fontSize: '28px',
        marginBottom: '8px'
    },
    quickActions: {
        marginBottom: '30px'
    },
    actionGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '10px'
    },
    actionButton: {
        padding: '15px',
        backgroundColor: '#4299e1',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'all 0.3s ease'
    },
    card: {
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '20px'
    },
    accountSelector: {
        marginBottom: '15px'
    },
    accountSelect: {
        padding: '10px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        fontSize: '14px',
        width: '100%',
        maxWidth: '300px'
    },
    tableWrapper: {
        overflowX: 'auto'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '14px'
    },
    activeBadge: {
        backgroundColor: '#38a169',
        color: 'white',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600'
    },
    inactiveBadge: {
        backgroundColor: '#e53e3e',
        color: 'white',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600'
    },
    depositText: {
        color: '#38a169',
        fontWeight: 'bold',
        textTransform: 'capitalize'
    },
    withdrawText: {
        color: '#e53e3e',
        fontWeight: 'bold',
        textTransform: 'capitalize'
    },
    positiveAmount: {
        color: '#38a169',
        fontWeight: 'bold'
    },
    negativeAmount: {
        color: '#e53e3e',
        fontWeight: 'bold'
    },
    completedBadge: {
        backgroundColor: '#38a169',
        color: 'white',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600'
    },
    pendingBadge: {
        backgroundColor: '#d69e2e',
        color: 'white',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600'
    },
    notificationList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
    },
    notificationItem: {
        padding: '12px 16px',
        backgroundColor: '#f7fafc',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.3s ease'
    },
    notificationHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '4px'
    },
    notificationTitle: {
        fontSize: '14px',
        fontWeight: '600'
    },
    notificationDate: {
        fontSize: '12px'
    },
    notificationMessage: {
        margin: 0,
        fontSize: '13px'
    },
    modal: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
    },
    modalContent: {
        padding: '30px',
        borderRadius: '12px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto'
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
        marginBottom: '15px'
    },
    input: {
        padding: '10px 12px',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        fontSize: '14px',
        width: '100%',
        boxSizing: 'border-box'
    },
    modalActions: {
        display: 'flex',
        gap: '10px',
        marginTop: '20px',
        justifyContent: 'flex-end'
    },
    primaryButton: {
        padding: '10px 24px',
        backgroundColor: '#4299e1',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500'
    },
    secondaryButton: {
        padding: '10px 24px',
        backgroundColor: '#e2e8f0',
        color: '#4a5568',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500'
    },
    passwordButton: {
        padding: '10px 24px',
        backgroundColor: '#805ad5',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        width: '100%',
        marginTop: '10px'
    },
    divider: {
        borderTop: '1px solid #e2e8f0',
        margin: '20px 0'
    },
    loading: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '18px'
    }
};

export default CustomerDashboard;