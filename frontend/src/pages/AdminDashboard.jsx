import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axiosConfig';

function AdminDashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [settings, setSettings] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [darkMode, setDarkMode] = useState(false);
    const [language, setLanguage] = useState('en');
    const [updating, setUpdating] = useState(false);

    // Settings form
    const [settingsData, setSettingsData] = useState({
        interest_rate: 5.00,
        transaction_limit: 100000,
        maintenance_mode: false,
        currency: 'ETB'
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        if (userData.role !== 'admin') {
            toast.error('Admin access required');
            navigate('/dashboard');
            return;
        }

        fetchDashboardData();
        fetchSettings();
    }, [navigate]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [statsRes, usersRes, transactionsRes, accountsRes] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/users'),
                api.get('/admin/transactions?limit=50'),
                api.get('/admin/accounts')
            ]);

            if (statsRes.data.success) setStats(statsRes.data.data);
            if (usersRes.data.success) setUsers(usersRes.data.data);
            if (transactionsRes.data.success) setTransactions(transactionsRes.data.data);
            if (accountsRes.data.success) setAccounts(accountsRes.data.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to fetch dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const response = await api.get('/admin/settings');
            if (response.data.success && response.data.data) {
                setSettings(response.data.data);
                setSettingsData({
                    interest_rate: response.data.data.interest_rate || 5.00,
                    transaction_limit: response.data.data.transaction_limit || 100000,
                    maintenance_mode: response.data.data.maintenance_mode || false,
                    currency: response.data.data.currency || 'ETB'
                });
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    };

    // ============================================
    // UPDATE USER STATUS
    // ============================================
    const handleStatusToggle = async (userId, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        
        try {
            const response = await api.put(`/admin/users/${userId}/status`, {
                status: newStatus
            });
            
            if (response.data.success) {
                toast.success(`User status updated to ${newStatus}`);
                fetchDashboardData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    // ============================================
    // UPDATE USER ROLE
    // ============================================
    const handleRoleChange = async (userId, newRole) => {
        try {
            const response = await api.put(`/admin/users/${userId}/role`, {
                role: newRole
            });
            
            if (response.data.success) {
                toast.success(`User role updated to ${newRole}`);
                fetchDashboardData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update role');
        }
    };

    // ============================================
    // DELETE USER
    // ============================================
    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        
        try {
            const response = await api.delete(`/admin/users/${userId}`);
            if (response.data.success) {
                toast.success('User deleted successfully');
                fetchDashboardData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete user');
        }
    };

    // ============================================
    // ⭐ UPDATE SETTINGS - የተሻሻለ
    // ============================================
    const handleUpdateSettings = async (e) => {
        e.preventDefault();
        setUpdating(true);
        
        try {
            console.log('📤 Sending settings update:', settingsData);
            
            // ⭐ ሁሉንም ባዶ እሴቶች ያስተካክሉ
            const payload = {
                interest_rate: settingsData.interest_rate || 5.00,
                transaction_limit: settingsData.transaction_limit || 100000,
                maintenance_mode: settingsData.maintenance_mode || false,
                currency: settingsData.currency || 'ETB'
            };
            
            const response = await api.put('/admin/settings', payload);
            console.log('📥 Settings update response:', response.data);
            
            if (response.data.success) {
                toast.success('✅ Settings updated successfully!');
                setShowSettingsModal(false);
                // አዲሱን መረጃ ያስቀምጡ
                if (response.data.data) {
                    setSettings(response.data.data);
                    setSettingsData({
                        interest_rate: response.data.data.interest_rate || 5.00,
                        transaction_limit: response.data.data.transaction_limit || 100000,
                        maintenance_mode: response.data.data.maintenance_mode || false,
                        currency: response.data.data.currency || 'ETB'
                    });
                }
                fetchSettings();
            } else {
                toast.error(response.data.message || 'Failed to update settings');
            }
        } catch (error) {
            console.error('❌ Update settings error:', error);
            console.error('❌ Error response:', error.response?.data);
            
            if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Failed to update settings. Please try again.');
            }
        } finally {
            setUpdating(false);
        }
    };

    // ============================================
    // VIEW USER PROFILE
    // ============================================
    const viewUserProfile = async (userId) => {
        try {
            const response = await api.get(`/admin/users/${userId}`);
            if (response.data.success) {
                setSelectedUser(response.data.data);
                setShowUserModal(true);
            }
        } catch (error) {
            toast.error('Failed to fetch user details');
        }
    };

    // ============================================
    // TOGGLE THEME
    // ============================================
    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
        document.body.style.backgroundColor = darkMode ? '#f8f9fa' : '#1a202c';
    };

    // ============================================
    // CHANGE LANGUAGE
    // ============================================
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

    if (loading) {
        return <div style={styles.loading}>Loading admin dashboard...</div>;
    }

    return (
        <div style={{ ...styles.container, backgroundColor: darkMode ? '#1a202c' : '#f8f9fa' }}>
            {/* Header */}
            <div style={{ ...styles.header, backgroundColor: darkMode ? '#2d3748' : 'white' }}>
                <div>
                    <h1 style={{ ...styles.title, color: darkMode ? '#f7fafc' : '#2d3748' }}>
                        🛡️ Admin Dashboard
                    </h1>
                    <p style={{ ...styles.subtitle, color: darkMode ? '#a0aec0' : '#718096' }}>
                        Manage users, accounts, and system settings
                    </p>
                </div>
                <div style={styles.headerActions}>
                    {/* Language Selector */}
                    <select 
                        value={language} 
                        onChange={(e) => changeLanguage(e.target.value)}
                        style={{ ...styles.languageSelect, backgroundColor: darkMode ? '#4a5568' : 'white', color: darkMode ? '#f7fafc' : '#2d3748' }}
                    >
                        <option value="en">🇬🇧 English</option>
                        <option value="am">🇪🇹 አማርኛ</option>
                        <option value="or">🇪🇹 Oromiffa</option>
                    </select>

                    {/* Theme Toggle */}
                    <button onClick={toggleDarkMode} style={styles.themeButton}>
                        {darkMode ? '☀️' : '🌙'}
                    </button>

                    {/* Settings Button */}
                    <button onClick={() => setShowSettingsModal(true)} style={styles.settingsButton}>
                        ⚙️ Settings
                    </button>

                    <button onClick={handleLogout} style={styles.logoutButton}>
                        Logout
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div style={styles.statsGrid}>
                    <div style={{ ...styles.statCard, backgroundColor: darkMode ? '#2d3748' : 'white' }}>
                        <div style={styles.statIcon}>👥</div>
                        <h3 style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>{stats.totalUsers || 0}</h3>
                        <p style={{ color: darkMode ? '#a0aec0' : '#718096' }}>Total Users</p>
                    </div>
                    <div style={{ ...styles.statCard, backgroundColor: darkMode ? '#2d3748' : 'white' }}>
                        <div style={styles.statIcon}>🟢</div>
                        <h3 style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>{stats.activeUsers || 0}</h3>
                        <p style={{ color: darkMode ? '#a0aec0' : '#718096' }}>Active Users</p>
                    </div>
                    <div style={{ ...styles.statCard, backgroundColor: darkMode ? '#2d3748' : 'white' }}>
                        <div style={styles.statIcon}>🏦</div>
                        <h3 style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>{stats.totalAccounts || 0}</h3>
                        <p style={{ color: darkMode ? '#a0aec0' : '#718096' }}>Total Accounts</p>
                    </div>
                    <div style={{ ...styles.statCard, backgroundColor: darkMode ? '#2d3748' : 'white' }}>
                        <div style={styles.statIcon}>💰</div>
                        <h3 style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>ETB {stats.totalBalance?.toLocaleString() || 0}</h3>
                        <p style={{ color: darkMode ? '#a0aec0' : '#718096' }}>Total Balance</p>
                    </div>
                    <div style={{ ...styles.statCard, backgroundColor: darkMode ? '#2d3748' : 'white' }}>
                        <div style={styles.statIcon}>📊</div>
                        <h3 style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>{stats.totalTransactions || 0}</h3>
                        <p style={{ color: darkMode ? '#a0aec0' : '#718096' }}>Total Transactions</p>
                    </div>
                    <div style={{ ...styles.statCard, backgroundColor: darkMode ? '#2d3748' : 'white' }}>
                        <div style={styles.statIcon}>📈</div>
                        <h3 style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>{stats.todayTransactions || 0}</h3>
                        <p style={{ color: darkMode ? '#a0aec0' : '#718096' }}>Today's Transactions</p>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div style={styles.tabs}>
                <button 
                    style={activeTab === 'overview' ? { ...styles.activeTab, backgroundColor: darkMode ? '#4299e1' : '#4299e1' } : { ...styles.tab, backgroundColor: darkMode ? '#2d3748' : 'white', color: darkMode ? '#f7fafc' : '#4a5568' }}
                    onClick={() => setActiveTab('overview')}
                >
                    📊 Overview
                </button>
                <button 
                    style={activeTab === 'users' ? { ...styles.activeTab, backgroundColor: darkMode ? '#4299e1' : '#4299e1' } : { ...styles.tab, backgroundColor: darkMode ? '#2d3748' : 'white', color: darkMode ? '#f7fafc' : '#4a5568' }}
                    onClick={() => setActiveTab('users')}
                >
                    👥 Users ({users.length})
                </button>
                <button 
                    style={activeTab === 'accounts' ? { ...styles.activeTab, backgroundColor: darkMode ? '#4299e1' : '#4299e1' } : { ...styles.tab, backgroundColor: darkMode ? '#2d3748' : 'white', color: darkMode ? '#f7fafc' : '#4a5568' }}
                    onClick={() => setActiveTab('accounts')}
                >
                    🏦 Accounts ({accounts.length})
                </button>
                <button 
                    style={activeTab === 'transactions' ? { ...styles.activeTab, backgroundColor: darkMode ? '#4299e1' : '#4299e1' } : { ...styles.tab, backgroundColor: darkMode ? '#2d3748' : 'white', color: darkMode ? '#f7fafc' : '#4a5568' }}
                    onClick={() => setActiveTab('transactions')}
                >
                    📈 Transactions ({transactions.length})
                </button>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && stats && (
                <div style={styles.overview}>
                    <div style={{ ...styles.card, backgroundColor: darkMode ? '#2d3748' : 'white' }}>
                        <h3 style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>📋 Quick Overview</h3>
                        <div style={styles.overviewGrid}>
                            <div style={styles.overviewItem}>
                                <span style={{ color: darkMode ? '#a0aec0' : '#718096' }}>Active Users:</span>
                                <strong style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>{stats.activeUsers || 0}</strong>
                            </div>
                            <div style={styles.overviewItem}>
                                <span style={{ color: darkMode ? '#a0aec0' : '#718096' }}>Active Accounts:</span>
                                <strong style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>{stats.activeAccounts || 0}</strong>
                            </div>
                            <div style={styles.overviewItem}>
                                <span style={{ color: darkMode ? '#a0aec0' : '#718096' }}>Today's Transactions:</span>
                                <strong style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>{stats.todayTransactions || 0}</strong>
                            </div>
                            <div style={styles.overviewItem}>
                                <span style={{ color: darkMode ? '#a0aec0' : '#718096' }}>System Status:</span>
                                <strong style={{ color: settings?.maintenance_mode ? '#e53e3e' : '#38a169' }}>
                                    {settings?.maintenance_mode ? '🔧 Maintenance' : '✅ Operational'}
                                </strong>
                            </div>
                        </div>
                    </div>

                    <div style={{ ...styles.card, backgroundColor: darkMode ? '#2d3748' : 'white' }}>
                        <h3 style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>📈 Recent Activity</h3>
                        {stats.recentTransactions?.length === 0 ? (
                            <p style={{ color: darkMode ? '#a0aec0' : '#718096' }}>No recent transactions</p>
                        ) : (
                            <ul style={styles.transactionList}>
                                {stats.recentTransactions?.slice(0, 10).map((tx) => (
                                    <li key={tx.id} style={{ ...styles.transactionItem, borderColor: darkMode ? '#4a5568' : '#edf2f7' }}>
                                        <span style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>{tx.full_name}</span>
                                        <span style={tx.transaction_type === 'deposit' ? styles.depositText : styles.withdrawText}>
                                            {tx.transaction_type}
                                        </span>
                                        <span style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>{tx.amount} ETB</span>
                                        <span style={{ color: darkMode ? '#a0aec0' : '#718096', fontSize: '12px' }}>
                                            {new Date(tx.created_at).toLocaleDateString()}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div style={{ ...styles.tableContainer, backgroundColor: darkMode ? '#2d3748' : 'white' }}>
                    <h3 style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>👥 All Users</h3>
                    <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>ID</th>
                                    <th style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Name</th>
                                    <th style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Email</th>
                                    <th style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Role</th>
                                    <th style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Status</th>
                                    <th style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id}>
                                        <td style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>#{user.id}</td>
                                        <td style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}><strong>{user.full_name}</strong></td>
                                        <td style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>{user.email}</td>
                                        <td>
                                            <select 
                                                value={user.role} 
                                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                style={{ ...styles.roleSelect, backgroundColor: darkMode ? '#4a5568' : 'white', color: darkMode ? '#f7fafc' : '#2d3748' }}
                                            >
                                                <option value="customer">Customer</option>
                                                <option value="teller">Teller</option>
                                                <option value="accountant">Accountant</option>
                                                <option value="auditor">Auditor</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </td>
                                        <td>
                                            <span style={user.status === 'active' ? styles.activeBadge : styles.inactiveBadge}>
                                                {user.status || 'active'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={styles.actionButtons}>
                                                <button 
                                                    onClick={() => viewUserProfile(user.id)}
                                                    style={styles.viewButton}
                                                >
                                                    👁️
                                                </button>
                                                <button
                                                    onClick={() => handleStatusToggle(user.id, user.status || 'active')}
                                                    style={user.status === 'active' ? styles.deactivateButton : styles.activateButton}
                                                >
                                                    {user.status === 'active' ? '🔴' : '🟢'}
                                                </button>
                                                {user.role !== 'admin' && (
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        style={styles.deleteButton}
                                                    >
                                                        🗑️
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Accounts Tab */}
            {activeTab === 'accounts' && (
                <div style={{ ...styles.tableContainer, backgroundColor: darkMode ? '#2d3748' : 'white' }}>
                    <h3 style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>🏦 All Accounts</h3>
                    <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Account</th>
                                    <th style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Customer</th>
                                    <th style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Type</th>
                                    <th style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Balance</th>
                                    <th style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {accounts.map((acc) => (
                                    <tr key={acc.id}>
                                        <td style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>{acc.account_number}</td>
                                        <td style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>{acc.customer_name || 'N/A'}</td>
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
            )}

            {/* Transactions Tab */}
            {activeTab === 'transactions' && (
                <div style={{ ...styles.tableContainer, backgroundColor: darkMode ? '#2d3748' : 'white' }}>
                    <h3 style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>📈 All Transactions</h3>
                    <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>ID</th>
                                    <th style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Account</th>
                                    <th style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>User</th>
                                    <th style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Type</th>
                                    <th style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Amount</th>
                                    <th style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Status</th>
                                    <th style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((tx) => (
                                    <tr key={tx.id}>
                                        <td style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>#{tx.id}</td>
                                        <td style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>{tx.account_number}</td>
                                        <td style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>{tx.full_name}</td>
                                        <td>
                                            <span style={tx.transaction_type === 'deposit' ? styles.depositText : styles.withdrawText}>
                                                {tx.transaction_type}
                                            </span>
                                        </td>
                                        <td style={parseFloat(tx.amount) > 0 ? styles.positiveAmount : styles.negativeAmount}>
                                            {tx.amount} ETB
                                        </td>
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
                </div>
            )}

            {/* User Profile Modal */}
            {showUserModal && selectedUser && (
                <div style={styles.modal}>
                    <div style={{ ...styles.modalContent, backgroundColor: darkMode ? '#2d3748' : 'white', maxWidth: '600px' }}>
                        <h2 style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>👤 User Profile</h2>
                        <div style={styles.profileContainer}>
                            <div style={styles.profileField}>
                                <strong style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Full Name:</strong>
                                <span style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>{selectedUser.full_name}</span>
                            </div>
                            <div style={styles.profileField}>
                                <strong style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Email:</strong>
                                <span style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>{selectedUser.email}</span>
                            </div>
                            <div style={styles.profileField}>
                                <strong style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Phone:</strong>
                                <span style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>{selectedUser.phone || 'Not provided'}</span>
                            </div>
                            <div style={styles.profileField}>
                                <strong style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Address:</strong>
                                <span style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>{selectedUser.address || 'Not provided'}</span>
                            </div>
                            <div style={styles.profileField}>
                                <strong style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Role:</strong>
                                <span style={{ ...styles.roleBadge, backgroundColor: selectedUser.role === 'admin' ? '#e53e3e' : '#4299e1' }}>
                                    {selectedUser.role}
                                </span>
                            </div>
                            <div style={styles.profileField}>
                                <strong style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Status:</strong>
                                <span style={selectedUser.status === 'active' ? styles.activeBadge : styles.inactiveBadge}>
                                    {selectedUser.status || 'active'}
                                </span>
                            </div>
                            <div style={styles.profileField}>
                                <strong style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Joined:</strong>
                                <span style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>
                                    {new Date(selectedUser.created_at).toLocaleString()}
                                </span>
                            </div>
                            {selectedUser.last_login && (
                                <div style={styles.profileField}>
                                    <strong style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Last Login:</strong>
                                    <span style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>
                                        {new Date(selectedUser.last_login).toLocaleString()}
                                    </span>
                                </div>
                            )}
                            {selectedUser.accounts && selectedUser.accounts.length > 0 && (
                                <div style={styles.profileField}>
                                    <strong style={{ color: darkMode ? '#a0aec0' : '#4a5568' }}>Accounts:</strong>
                                    <div style={styles.profileAccounts}>
                                        {selectedUser.accounts.map((acc) => (
                                            <div key={acc.id} style={{ ...styles.profileAccount, backgroundColor: darkMode ? '#4a5568' : '#f7fafc' }}>
                                                <span style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>{acc.account_number}</span>
                                                <span style={{ color: darkMode ? '#f7fafc' : '#2d3748' }}>ETB {acc.balance}</span>
                                                <span style={acc.status === 'active' ? styles.activeBadge : styles.inactiveBadge}>
                                                    {acc.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div style={styles.modalActions}>
                            <button type="button" onClick={() => setShowUserModal(false)} style={styles.primaryButton}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ⭐ Settings Modal - የተሻሻለ */}
            {showSettingsModal && (
                <div style={styles.modal} onClick={(e) => {
                    if (e.target === e.currentTarget) {
                        setShowSettingsModal(false);
                    }
                }}>
                    <div style={{ ...styles.modalContent, backgroundColor: darkMode ? '#2d3748' : 'white', maxWidth: '550px' }}>
                        <h2 style={{ color: darkMode ? '#f7fafc' : '#2d3748', marginBottom: '20px' }}>
                            ⚙️ System Settings
                        </h2>
                        <form onSubmit={handleUpdateSettings}>
                            <div style={styles.formGroup}>
                                <label style={{ color: darkMode ? '#a0aec0' : '#4a5568', fontWeight: '600' }}>
                                    Interest Rate (%)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={settingsData.interest_rate || 5.00}
                                    onChange={(e) => setSettingsData({
                                        ...settingsData, 
                                        interest_rate: parseFloat(e.target.value) || 0
                                    })}
                                    style={{ 
                                        ...styles.input, 
                                        backgroundColor: darkMode ? '#4a5568' : 'white', 
                                        color: darkMode ? '#f7fafc' : '#2d3748',
                                        border: '1px solid #e2e8f0'
                                    }}
                                    required
                                />
                                <small style={{ color: '#718096', fontSize: '11px' }}>
                                    Current: {settings?.interest_rate || 5.00}%
                                </small>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={{ color: darkMode ? '#a0aec0' : '#4a5568', fontWeight: '600' }}>
                                    Transaction Limit (ETB)
                                </label>
                                <input
                                    type="number"
                                    step="1000"
                                    min="1000"
                                    value={settingsData.transaction_limit || 100000}
                                    onChange={(e) => setSettingsData({
                                        ...settingsData, 
                                        transaction_limit: parseFloat(e.target.value) || 0
                                    })}
                                    style={{ 
                                        ...styles.input, 
                                        backgroundColor: darkMode ? '#4a5568' : 'white', 
                                        color: darkMode ? '#f7fafc' : '#2d3748',
                                        border: '1px solid #e2e8f0'
                                    }}
                                    required
                                />
                                <small style={{ color: '#718096', fontSize: '11px' }}>
                                    Current: ETB {settings?.transaction_limit?.toLocaleString() || '100,000'}
                                </small>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={{ color: darkMode ? '#a0aec0' : '#4a5568', fontWeight: '600' }}>
                                    Currency
                                </label>
                                <select
                                    value={settingsData.currency || 'ETB'}
                                    onChange={(e) => setSettingsData({
                                        ...settingsData, 
                                        currency: e.target.value
                                    })}
                                    style={{ 
                                        ...styles.input, 
                                        backgroundColor: darkMode ? '#4a5568' : 'white', 
                                        color: darkMode ? '#f7fafc' : '#2d3748',
                                        border: '1px solid #e2e8f0',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="ETB">🇪🇹 ETB - Ethiopian Birr</option>
                                    <option value="USD">🇺🇸 USD - US Dollar</option>
                                    <option value="EUR">🇪🇺 EUR - Euro</option>
                                    <option value="GBP">🇬🇧 GBP - British Pound</option>
                                </select>
                                <small style={{ color: '#718096', fontSize: '11px' }}>
                                    Current: {settings?.currency || 'ETB'}
                                </small>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={{ color: darkMode ? '#a0aec0' : '#4a5568', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <input
                                        type="checkbox"
                                        checked={settingsData.maintenance_mode || false}
                                        onChange={(e) => setSettingsData({
                                            ...settingsData, 
                                            maintenance_mode: e.target.checked
                                        })}
                                        style={{ 
                                            width: '18px', 
                                            height: '18px', 
                                            cursor: 'pointer',
                                            accentColor: '#4299e1'
                                        }}
                                    />
                                    <span>Maintenance Mode</span>
                                </label>
                                <p style={{ 
                                    color: settingsData.maintenance_mode ? '#e53e3e' : '#38a169', 
                                    fontSize: '13px', 
                                    marginTop: '4px',
                                    fontWeight: '500'
                                }}>
                                    {settingsData.maintenance_mode ? '🔧 System is in maintenance mode' : '✅ System is operational'}
                                </p>
                                {settingsData.maintenance_mode && (
                                    <p style={{ color: '#718096', fontSize: '12px', marginTop: '2px' }}>
                                        ⚠️ Users will not be able to perform transactions
                                    </p>
                                )}
                            </div>

                            <div style={styles.modalActions}>
                                <button 
                                    type="submit" 
                                    disabled={updating} 
                                    style={updating ? styles.buttonDisabled : styles.primaryButton}
                                >
                                    {updating ? (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{
                                                border: '2px solid rgba(255,255,255,0.3)',
                                                borderTop: '2px solid white',
                                                borderRadius: '50%',
                                                width: '16px',
                                                height: '16px',
                                                animation: 'spin 0.8s linear infinite',
                                                display: 'inline-block'
                                            }}></span>
                                            Saving...
                                        </span>
                                    ) : (
                                        '💾 Save Settings'
                                    )}
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setShowSettingsModal(false)} 
                                    style={styles.secondaryButton}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================
// STYLES
// ============================================
const styles = {
    container: {
        padding: '20px',
        maxWidth: '1400px',
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
        fontSize: '28px',
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
    settingsButton: {
        padding: '10px 20px',
        backgroundColor: '#805ad5',
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
    },
    statCard: {
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        textAlign: 'center'
    },
    statIcon: {
        fontSize: '32px',
        marginBottom: '8px'
    },
    tabs: {
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
        flexWrap: 'wrap'
    },
    tab: {
        padding: '12px 24px',
        border: '2px solid #e2e8f0',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'all 0.3s ease'
    },
    activeTab: {
        padding: '12px 24px',
        color: 'white',
        border: '2px solid #4299e1',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'all 0.3s ease'
    },
    tableContainer: {
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        overflowX: 'auto'
    },
    tableWrapper: {
        overflowX: 'auto'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '14px'
    },
    overview: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px'
    },
    card: {
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    },
    overviewGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '15px',
        marginTop: '10px'
    },
    overviewItem: {
        display: 'flex',
        flexDirection: 'column',
        padding: '10px',
        backgroundColor: '#f7fafc',
        borderRadius: '8px'
    },
    transactionList: {
        listStyle: 'none',
        padding: 0,
        margin: 0
    },
    transactionItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 0',
        borderBottom: '1px solid #edf2f7'
    },
    roleSelect: {
        padding: '4px 8px',
        borderRadius: '4px',
        border: '1px solid #e2e8f0',
        cursor: 'pointer',
        fontSize: '12px'
    },
    actionButtons: {
        display: 'flex',
        gap: '5px',
        alignItems: 'center'
    },
    viewButton: {
        padding: '4px 8px',
        backgroundColor: '#4299e1',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '12px'
    },
    deactivateButton: {
        padding: '4px 8px',
        backgroundColor: '#e53e3e',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '12px'
    },
    activateButton: {
        padding: '4px 8px',
        backgroundColor: '#38a169',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '12px'
    },
    deleteButton: {
        padding: '4px 8px',
        backgroundColor: '#c53030',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '12px'
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
    roleBadge: {
        color: 'white',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
        textTransform: 'capitalize'
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
        zIndex: 1000,
        padding: '20px'
    },
    modalContent: {
        padding: '30px',
        borderRadius: '12px',
        maxWidth: '500px',
        width: '100%',
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
    buttonDisabled: {
        padding: '10px 24px',
        backgroundColor: '#a0aec0',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'not-allowed',
        fontSize: '14px',
        fontWeight: '500'
    },
    profileContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
    },
    profileField: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 0',
        borderBottom: '1px solid #e2e8f0'
    },
    profileAccounts: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        width: '100%'
    },
    profileAccount: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px',
        borderRadius: '6px'
    },
    loading: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '18px'
    }
};

// Add keyframe animation for spinner
const styleSheet = document.createElement("style");
styleSheet.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(styleSheet);

export default AdminDashboard;