import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axiosConfig';

function TellerDashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalCustomers: 0,
        activeAccounts: 0,
        todayTransactions: 0,
        todayVolume: 0
    });
    const [customers, setCustomers] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [selectedAccount, setSelectedAccount] = useState(null);

    // Modal states
    const [showCreateCustomer, setShowCreateCustomer] = useState(false);
    const [showCreateAccount, setShowCreateAccount] = useState(false);
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showCustomerDetails, setShowCustomerDetails] = useState(false);
    const [showAccountDetails, setShowAccountDetails] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        amount: '',
        toAccount: '',
        description: '',
        account_id: ''
    });
    const [newCustomer, setNewCustomer] = useState({
        full_name: '',
        email: '',
        password: '',
        phone: '',
        address: ''
    });
    const [newAccount, setNewAccount] = useState({
        user_id: '',
        account_type: 'savings',
        initial_deposit: ''
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        if (!['teller', 'admin'].includes(userData.role)) {
            toast.error('Teller access required');
            navigate('/dashboard');
            return;
        }

        fetchDashboardData();
    }, [navigate]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            
            const [statsRes, customersRes, accountsRes, transactionsRes] = await Promise.all([
                api.get('/dashboard/teller'),
                api.get('/teller/customers'),
                api.get('/teller/accounts'),
                api.get('/teller/transactions?limit=50')
            ]);

            console.log('📊 Stats:', statsRes.data);
            console.log('👥 Customers:', customersRes.data);
            console.log('🏦 Accounts:', accountsRes.data);
            console.log('📈 Transactions:', transactionsRes.data);

            if (statsRes.data && statsRes.data.success) {
                const data = statsRes.data.data || {};
                setStats({
                    totalCustomers: data.totalCustomers || 0,
                    activeAccounts: data.activeAccounts || 0,
                    todayTransactions: data.todayTransactions || 0,
                    todayVolume: data.todayVolume || 0
                });
            }
            
            if (customersRes.data && customersRes.data.success) {
                setCustomers(Array.isArray(customersRes.data.data) ? customersRes.data.data : []);
            }
            
            if (accountsRes.data && accountsRes.data.success) {
                setAccounts(Array.isArray(accountsRes.data.data) ? accountsRes.data.data : []);
            }
            
            if (transactionsRes.data && transactionsRes.data.success) {
                setTransactions(Array.isArray(transactionsRes.data.data) ? transactionsRes.data.data : []);
            }
            
        } catch (error) {
            console.error('❌ Error fetching teller data:', error);
            toast.error('Failed to fetch dashboard data');
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // CREATE CUSTOMER
    // ============================================
    const handleCreateCustomer = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/teller/customers', newCustomer);
            if (response.data.success) {
                toast.success('✅ Customer created successfully!');
                setShowCreateCustomer(false);
                setNewCustomer({ full_name: '', email: '', password: '', phone: '', address: '' });
                fetchDashboardData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create customer');
        }
    };

    // ============================================
    // CREATE ACCOUNT
    // ============================================
    const handleCreateAccount = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/teller/accounts', newAccount);
            if (response.data.success) {
                toast.success('✅ Account created successfully!');
                setShowCreateAccount(false);
                setNewAccount({ user_id: '', account_type: 'savings', initial_deposit: '' });
                fetchDashboardData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create account');
        }
    };

    // ============================================
    // DEPOSIT
    // ============================================
    const handleDeposit = async (e) => {
        e.preventDefault();
        if (!formData.account_id || !formData.amount || parseFloat(formData.amount) <= 0) {
            toast.error('Please select account and enter valid amount');
            return;
        }

        try {
            const response = await api.post('/teller/transactions/deposit', {
                account_id: formData.account_id,
                amount: parseFloat(formData.amount),
                description: formData.description || 'Deposit'
            });
            if (response.data.success) {
                toast.success('💰 Deposit successful!');
                setShowDepositModal(false);
                setFormData({ ...formData, amount: '', description: '', account_id: '' });
                fetchDashboardData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Deposit failed');
        }
    };

    // ============================================
    // WITHDRAW
    // ============================================
    const handleWithdraw = async (e) => {
        e.preventDefault();
        if (!formData.account_id || !formData.amount || parseFloat(formData.amount) <= 0) {
            toast.error('Please select account and enter valid amount');
            return;
        }

        try {
            const response = await api.post('/teller/transactions/withdraw', {
                account_id: formData.account_id,
                amount: parseFloat(formData.amount),
                description: formData.description || 'Withdrawal'
            });
            if (response.data.success) {
                toast.success('🏦 Withdrawal successful!');
                setShowWithdrawModal(false);
                setFormData({ ...formData, amount: '', description: '', account_id: '' });
                fetchDashboardData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Withdrawal failed');
        }
    };

    // ============================================
    // ⭐ TRANSFER - የተሻሻለ
    // ============================================
    const handleTransfer = async (e) => {
        e.preventDefault();
        
        console.log('📤 Teller Transfer form submitted:');
        console.log('  account_id:', formData.account_id);
        console.log('  toAccount:', formData.toAccount);
        console.log('  amount:', formData.amount);
        console.log('  description:', formData.description);
        
        // ⭐ ማረጋገጫ
        if (!formData.account_id) {
            toast.error('Please select a source account');
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

        try {
            const payload = {
                from_account_id: formData.account_id,
                to_account_number: formData.toAccount.trim(),
                amount: parseFloat(formData.amount),
                description: formData.description || 'Transfer'
            };
            
            console.log('📤 Sending transfer request:', payload);
            
            const response = await api.post('/teller/transactions/transfer', payload);
            
            console.log('📥 Transfer response:', response.data);
            
            if (response.data.success) {
                toast.success('📤 Transfer successful!');
                setShowTransferModal(false);
                setFormData({ ...formData, amount: '', toAccount: '', description: '', account_id: '' });
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
    // VIEW CUSTOMER DETAILS
    // ============================================
    const viewCustomerDetails = async (customerId) => {
        try {
            const response = await api.get(`/teller/customers/${customerId}`);
            if (response.data.success) {
                setSelectedCustomer(response.data.data);
                const accountsRes = await api.get(`/teller/accounts?user_id=${customerId}`);
                if (accountsRes.data.success) {
                    setSelectedCustomer({
                        ...response.data.data,
                        accounts: accountsRes.data.data
                    });
                }
                setShowCustomerDetails(true);
            }
        } catch (error) {
            toast.error('Failed to fetch customer details');
        }
    };

    // ============================================
    // VIEW ACCOUNT DETAILS
    // ============================================
    const viewAccountDetails = async (accountId) => {
        try {
            const response = await api.get(`/teller/accounts/${accountId}/balance`);
            if (response.data.success) {
                setSelectedAccount(response.data.data);
                setShowAccountDetails(true);
            }
        } catch (error) {
            toast.error('Failed to fetch account details');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        toast.info('Logged out successfully');
    };

    if (loading) {
        return <div style={styles.loading}>Loading Teller Dashboard...</div>;
    }

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>💳 Teller Dashboard</h1>
                    <p style={styles.subtitle}>Manage customers, accounts, and transactions</p>
                </div>
                <div style={styles.headerActions}>
                    <button onClick={() => setShowCreateCustomer(true)} style={styles.primaryButton}>
                        ➕ New Customer
                    </button>
                    <button onClick={() => setShowCreateAccount(true)} style={styles.primaryButton}>
                        ➕ New Account
                    </button>
                    <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
                </div>
            </div>

            {/* Stats Cards */}
            <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                    <div style={styles.statIcon}>👥</div>
                    <h3>{stats.totalCustomers || 0}</h3>
                    <p>Total Customers</p>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statIcon}>🏦</div>
                    <h3>{stats.activeAccounts || 0}</h3>
                    <p>Active Accounts</p>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statIcon}>📊</div>
                    <h3>{stats.todayTransactions || 0}</h3>
                    <p>Today's Transactions</p>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statIcon}>💰</div>
                    <h3>ETB {stats.todayVolume?.toLocaleString() || 0}</h3>
                    <p>Today's Volume</p>
                </div>
            </div>

            {/* Quick Actions */}
            <div style={styles.quickActions}>
                <h3>⚡ Quick Actions</h3>
                <div style={styles.actionGrid}>
                    <button onClick={() => setShowDepositModal(true)} style={styles.actionButton}>
                        💰 Deposit
                    </button>
                    <button onClick={() => setShowWithdrawModal(true)} style={{ ...styles.actionButton, backgroundColor: '#e53e3e' }}>
                        🏦 Withdraw
                    </button>
                    <button onClick={() => setShowTransferModal(true)} style={{ ...styles.actionButton, backgroundColor: '#805ad5' }}>
                        📤 Transfer
                    </button>
                    <button onClick={() => setShowCreateCustomer(true)} style={{ ...styles.actionButton, backgroundColor: '#38a169' }}>
                        👤 New Customer
                    </button>
                </div>
            </div>

            {/* Customers Table */}
            <div style={styles.card}>
                <h3>👥 Customers</h3>
                {customers.length === 0 ? (
                    <p style={styles.emptyState}>No customers yet</p>
                ) : (
                    <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.map((customer) => (
                                    <tr key={customer.id}>
                                        <td>#{customer.id}</td>
                                        <td><strong>{customer.full_name}</strong></td>
                                        <td>{customer.email}</td>
                                        <td>{customer.phone || '-'}</td>
                                        <td>
                                            <span style={customer.status === 'active' ? styles.activeBadge : styles.inactiveBadge}>
                                                {customer.status || 'active'}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => viewCustomerDetails(customer.id)}
                                                style={styles.viewButton}
                                            >
                                                👁️ View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Accounts Table */}
            <div style={styles.card}>
                <h3>🏦 Accounts</h3>
                {accounts.length === 0 ? (
                    <p style={styles.emptyState}>No accounts yet</p>
                ) : (
                    <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th>Account Number</th>
                                    <th>Customer</th>
                                    <th>Type</th>
                                    <th>Balance</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {accounts.slice(0, 10).map((account) => (
                                    <tr key={account.id}>
                                        <td>{account.account_number}</td>
                                        <td>{account.customer_name}</td>
                                        <td>{account.account_type}</td>
                                        <td>ETB {account.balance}</td>
                                        <td>
                                            <span style={account.status === 'active' ? styles.activeBadge : styles.inactiveBadge}>
                                                {account.status || 'active'}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => viewAccountDetails(account.id)}
                                                style={styles.viewButton}
                                            >
                                                👁️ View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Recent Transactions */}
            <div style={styles.card}>
                <h3>📈 Recent Transactions</h3>
                {transactions.length === 0 ? (
                    <p style={styles.emptyState}>No transactions yet</p>
                ) : (
                    <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Amount</th>
                                    <th>Description</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.slice(0, 10).map((tx) => (
                                    <tr key={tx.id}>
                                        <td>
                                            <span style={tx.transaction_type === 'deposit' ? styles.depositText : styles.withdrawText}>
                                                {tx.transaction_type}
                                            </span>
                                        </td>
                                        <td>{tx.amount} ETB</td>
                                        <td>{tx.description || '-'}</td>
                                        <td>
                                            <span style={tx.status === 'completed' ? styles.completedBadge : styles.pendingBadge}>
                                                {tx.status}
                                            </span>
                                        </td>
                                        <td>{new Date(tx.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Deposit Modal */}
            {showDepositModal && (
                <div style={styles.modal}>
                    <div style={styles.modalContent}>
                        <h2>💰 Deposit</h2>
                        <form onSubmit={handleDeposit}>
                            <div style={styles.formGroup}>
                                <label>Account</label>
                                <select
                                    value={formData.account_id}
                                    onChange={(e) => setFormData({...formData, account_id: e.target.value})}
                                    required
                                    style={styles.input}
                                >
                                    <option value="">Select Account</option>
                                    {accounts.map((acc) => (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.account_number} - {acc.customer_name} (ETB {acc.balance})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div style={styles.formGroup}>
                                <label>Amount (ETB)</label>
                                <input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                    placeholder="Enter amount"
                                    required
                                    min="1"
                                    style={styles.input}
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label>Description</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    placeholder="Optional description"
                                    style={styles.input}
                                />
                            </div>
                            <div style={styles.modalActions}>
                                <button type="submit" style={styles.primaryButton}>Deposit</button>
                                <button type="button" onClick={() => setShowDepositModal(false)} style={styles.secondaryButton}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Withdraw Modal */}
            {showWithdrawModal && (
                <div style={styles.modal}>
                    <div style={styles.modalContent}>
                        <h2>🏦 Withdraw</h2>
                        <form onSubmit={handleWithdraw}>
                            <div style={styles.formGroup}>
                                <label>Account</label>
                                <select
                                    value={formData.account_id}
                                    onChange={(e) => setFormData({...formData, account_id: e.target.value})}
                                    required
                                    style={styles.input}
                                >
                                    <option value="">Select Account</option>
                                    {accounts.map((acc) => (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.account_number} - {acc.customer_name} (ETB {acc.balance})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div style={styles.formGroup}>
                                <label>Amount (ETB)</label>
                                <input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                    placeholder="Enter amount"
                                    required
                                    min="1"
                                    max="100000"
                                    style={styles.input}
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label>Description</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    placeholder="Optional description"
                                    style={styles.input}
                                />
                            </div>
                            <div style={styles.modalActions}>
                                <button type="submit" style={{ ...styles.primaryButton, backgroundColor: '#e53e3e' }}>Withdraw</button>
                                <button type="button" onClick={() => setShowWithdrawModal(false)} style={styles.secondaryButton}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Transfer Modal */}
            {showTransferModal && (
                <div style={styles.modal}>
                    <div style={styles.modalContent}>
                        <h2>📤 Transfer</h2>
                        <form onSubmit={handleTransfer}>
                            <div style={styles.formGroup}>
                                <label>From Account</label>
                                <select
                                    value={formData.account_id}
                                    onChange={(e) => setFormData({...formData, account_id: e.target.value})}
                                    required
                                    style={styles.input}
                                >
                                    <option value="">Select Account</option>
                                    {accounts.map((acc) => (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.account_number} - {acc.customer_name} (ETB {acc.balance})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div style={styles.formGroup}>
                                <label>Destination Account Number</label>
                                <input
                                    type="text"
                                    value={formData.toAccount}
                                    onChange={(e) => setFormData({...formData, toAccount: e.target.value})}
                                    placeholder="Enter destination account number"
                                    required
                                    style={styles.input}
                                />
                                <small style={{ color: '#718096', fontSize: '12px' }}>
                                    Enter the account number (e.g., ACC1234567890)
                                </small>
                            </div>
                            <div style={styles.formGroup}>
                                <label>Amount (ETB)</label>
                                <input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                    placeholder="Enter amount"
                                    required
                                    min="1"
                                    style={styles.input}
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label>Description</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    placeholder="Optional description"
                                    style={styles.input}
                                />
                            </div>
                            <div style={styles.modalActions}>
                                <button type="submit" style={{ ...styles.primaryButton, backgroundColor: '#805ad5' }}>Transfer</button>
                                <button type="button" onClick={() => setShowTransferModal(false)} style={styles.secondaryButton}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Customer Modal */}
            {showCreateCustomer && (
                <div style={styles.modal}>
                    <div style={styles.modalContent}>
                        <h2>👤 Create New Customer</h2>
                        <form onSubmit={handleCreateCustomer}>
                            <div style={styles.formGroup}>
                                <label>Full Name *</label>
                                <input
                                    type="text"
                                    value={newCustomer.full_name}
                                    onChange={(e) => setNewCustomer({...newCustomer, full_name: e.target.value})}
                                    required
                                    style={styles.input}
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label>Email *</label>
                                <input
                                    type="email"
                                    value={newCustomer.email}
                                    onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                                    required
                                    style={styles.input}
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label>Password *</label>
                                <input
                                    type="password"
                                    value={newCustomer.password}
                                    onChange={(e) => setNewCustomer({...newCustomer, password: e.target.value})}
                                    required
                                    style={styles.input}
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label>Phone</label>
                                <input
                                    type="tel"
                                    value={newCustomer.phone}
                                    onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                                    style={styles.input}
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label>Address</label>
                                <input
                                    type="text"
                                    value={newCustomer.address}
                                    onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                                    style={styles.input}
                                />
                            </div>
                            <div style={styles.modalActions}>
                                <button type="submit" style={styles.primaryButton}>Create</button>
                                <button type="button" onClick={() => setShowCreateCustomer(false)} style={styles.secondaryButton}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Account Modal */}
            {showCreateAccount && (
                <div style={styles.modal}>
                    <div style={styles.modalContent}>
                        <h2>🏦 Create New Account</h2>
                        <form onSubmit={handleCreateAccount}>
                            <div style={styles.formGroup}>
                                <label>Customer *</label>
                                <select
                                    value={newAccount.user_id}
                                    onChange={(e) => setNewAccount({...newAccount, user_id: e.target.value})}
                                    required
                                    style={styles.input}
                                >
                                    <option value="">Select Customer</option>
                                    {customers.map((c) => (
                                        <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>
                                    ))}
                                </select>
                            </div>
                            <div style={styles.formGroup}>
                                <label>Account Type</label>
                                <select
                                    value={newAccount.account_type}
                                    onChange={(e) => setNewAccount({...newAccount, account_type: e.target.value})}
                                    style={styles.input}
                                >
                                    <option value="savings">Savings</option>
                                    <option value="checking">Checking</option>
                                    <option value="fixed">Fixed</option>
                                </select>
                            </div>
                            <div style={styles.formGroup}>
                                <label>Initial Deposit</label>
                                <input
                                    type="number"
                                    value={newAccount.initial_deposit}
                                    onChange={(e) => setNewAccount({...newAccount, initial_deposit: e.target.value})}
                                    style={styles.input}
                                    placeholder="0.00"
                                />
                            </div>
                            <div style={styles.modalActions}>
                                <button type="submit" style={styles.primaryButton}>Create</button>
                                <button type="button" onClick={() => setShowCreateAccount(false)} style={styles.secondaryButton}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Customer Details Modal */}
            {showCustomerDetails && selectedCustomer && (
                <div style={styles.modal}>
                    <div style={{ ...styles.modalContent, maxWidth: '600px' }}>
                        <h2>👤 Customer Details</h2>
                        <div style={styles.detailContainer}>
                            <div style={styles.detailRow}>
                                <strong>Name:</strong> <span>{selectedCustomer.full_name}</span>
                            </div>
                            <div style={styles.detailRow}>
                                <strong>Email:</strong> <span>{selectedCustomer.email}</span>
                            </div>
                            <div style={styles.detailRow}>
                                <strong>Phone:</strong> <span>{selectedCustomer.phone || 'N/A'}</span>
                            </div>
                            <div style={styles.detailRow}>
                                <strong>Address:</strong> <span>{selectedCustomer.address || 'N/A'}</span>
                            </div>
                            <div style={styles.detailRow}>
                                <strong>Status:</strong> 
                                <span style={selectedCustomer.status === 'active' ? styles.activeBadge : styles.inactiveBadge}>
                                    {selectedCustomer.status || 'active'}
                                </span>
                            </div>
                            <div style={styles.detailRow}>
                                <strong>Joined:</strong> <span>{new Date(selectedCustomer.created_at).toLocaleDateString()}</span>
                            </div>
                            {selectedCustomer.accounts && selectedCustomer.accounts.length > 0 && (
                                <div style={styles.detailRow}>
                                    <strong>Accounts:</strong>
                                    <div style={styles.accountList}>
                                        {selectedCustomer.accounts.map((acc) => (
                                            <div key={acc.id} style={styles.accountItem}>
                                                <span>{acc.account_number}</span>
                                                <span>ETB {acc.balance}</span>
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
                            <button type="button" onClick={() => setShowCustomerDetails(false)} style={styles.primaryButton}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Account Details Modal */}
            {showAccountDetails && selectedAccount && (
                <div style={styles.modal}>
                    <div style={{ ...styles.modalContent, maxWidth: '500px' }}>
                        <h2>🏦 Account Details</h2>
                        <div style={styles.detailContainer}>
                            <div style={styles.detailRow}>
                                <strong>Account Number:</strong> <span>{selectedAccount.account_number}</span>
                            </div>
                            <div style={styles.detailRow}>
                                <strong>Customer:</strong> <span>{selectedAccount.customer_name}</span>
                            </div>
                            <div style={styles.detailRow}>
                                <strong>Account Type:</strong> <span>{selectedAccount.account_type}</span>
                            </div>
                            <div style={styles.detailRow}>
                                <strong>Balance:</strong> <span style={styles.balanceAmount}>ETB {selectedAccount.balance}</span>
                            </div>
                            <div style={styles.detailRow}>
                                <strong>Currency:</strong> <span>{selectedAccount.currency || 'ETB'}</span>
                            </div>
                            <div style={styles.detailRow}>
                                <strong>Status:</strong> 
                                <span style={selectedAccount.status === 'active' ? styles.activeBadge : styles.inactiveBadge}>
                                    {selectedAccount.status || 'active'}
                                </span>
                            </div>
                            <div style={styles.detailRow}>
                                <strong>Created:</strong> <span>{new Date(selectedAccount.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div style={styles.modalActions}>
                            <button type="button" onClick={() => setShowAccountDetails(false)} style={styles.primaryButton}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    container: {
        padding: '20px',
        maxWidth: '1400px',
        margin: '0 auto',
        backgroundColor: '#f8f9fa',
        minHeight: '100vh'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: 'white',
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
        color: '#2d3748'
    },
    subtitle: {
        margin: '5px 0 0 0',
        color: '#718096',
        fontSize: '14px'
    },
    primaryButton: {
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
    },
    statCard: {
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        textAlign: 'center'
    },
    statIcon: {
        fontSize: '32px',
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
        fontWeight: '500'
    },
    card: {
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '20px'
    },
    tableWrapper: {
        overflowX: 'auto'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '14px'
    },
    viewButton: {
        padding: '4px 10px',
        backgroundColor: '#4299e1',
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
        zIndex: 1000
    },
    modalContent: {
        backgroundColor: 'white',
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
    detailContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
    },
    detailRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 0',
        borderBottom: '1px solid #e2e8f0'
    },
    balanceAmount: {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#38a169'
    },
    accountList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
        width: '100%'
    },
    accountItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '5px 10px',
        backgroundColor: '#f7fafc',
        borderRadius: '4px'
    },
    emptyState: {
        textAlign: 'center',
        padding: '20px',
        color: '#718096',
        fontSize: '14px'
    },
    loading: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '18px',
        color: '#4a5568'
    }
};

export default TellerDashboard;