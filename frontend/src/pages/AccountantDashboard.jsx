import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axiosConfig';

function AccountantDashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        todayTransactions: 0,
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalBalance: 0,
        pendingTransactions: 0
    });
    const [transactions, setTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [reportType, setReportType] = useState('daily');
    const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        if (!['accountant', 'admin'].includes(userData.role)) {
            toast.error('Accountant access required');
            navigate('/dashboard');
            return;
        }

        fetchDashboardData();
    }, [navigate]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            
            const [statsRes, transactionsRes, accountsRes] = await Promise.all([
                api.get('/dashboard/accountant'),
                api.get('/accountant/transactions?limit=50'),
                api.get('/accountant/accounts')
            ]);

            if (statsRes.data && statsRes.data.success) {
                const data = statsRes.data.data || {};
                setStats({
                    todayTransactions: data.todayTransactions || 0,
                    totalDeposits: data.totalDeposits || 0,
                    totalWithdrawals: data.totalWithdrawals || 0,
                    totalBalance: data.totalBalance || 0,
                    pendingTransactions: data.pendingTransactions || 0
                });
            }
            
            if (transactionsRes.data && transactionsRes.data.success) {
                setTransactions(Array.isArray(transactionsRes.data.data) ? transactionsRes.data.data : []);
            }
            
            if (accountsRes.data && accountsRes.data.success) {
                setAccounts(Array.isArray(accountsRes.data.data) ? accountsRes.data.data : []);
            }
            
        } catch (error) {
            console.error('❌ Error fetching accountant data:', error);
            toast.error('Failed to fetch dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const generateReport = async () => {
        try {
            const endpoint = reportType === 'daily' 
                ? `/accountant/reports/daily?date=${reportDate}`
                : `/accountant/reports/monthly?month=${new Date(reportDate).getMonth() + 1}&year=${new Date(reportDate).getFullYear()}`;
            
            const response = await api.get(endpoint);
            if (response.data && response.data.success) {
                setReportData(response.data.data);
                setShowReportModal(true);
                toast.success('Report generated successfully!');
            }
        } catch (error) {
            toast.error('Failed to generate report');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        toast.info('Logged out successfully');
    };

    if (loading) {
        return <div style={styles.loading}>Loading Accountant Dashboard...</div>;
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>📊 Accountant Dashboard</h1>
                    <p style={styles.subtitle}>Manage financial reports and accounts</p>
                </div>
                <div style={styles.headerActions}>
                    <button onClick={() => setShowReportModal(true)} style={styles.reportButton}>
                        📄 Generate Report
                    </button>
                    <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
                </div>
            </div>

            {/* Stats Cards */}
            <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                    <div style={styles.statIcon}>📊</div>
                    <h3>{stats.todayTransactions}</h3>
                    <p>Today's Transactions</p>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statIcon}>💰</div>
                    <h3>ETB {stats.totalDeposits?.toLocaleString() || 0}</h3>
                    <p>Total Deposits</p>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statIcon}>🏦</div>
                    <h3>ETB {stats.totalWithdrawals?.toLocaleString() || 0}</h3>
                    <p>Total Withdrawals</p>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statIcon}>🏛️</div>
                    <h3>ETB {stats.totalBalance?.toLocaleString() || 0}</h3>
                    <p>Total Balance</p>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statIcon}>⏳</div>
                    <h3>{stats.pendingTransactions}</h3>
                    <p>Pending Transactions</p>
                </div>
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

            {/* Accounts Overview */}
            <div style={styles.card}>
                <h3>🏦 Accounts Overview</h3>
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
                                </tr>
                            </thead>
                            <tbody>
                                {accounts.slice(0, 10).map((acc) => (
                                    <tr key={acc.id}>
                                        <td>{acc.account_number}</td>
                                        <td>{acc.customer_name || 'N/A'}</td>
                                        <td>{acc.account_type}</td>
                                        <td>ETB {acc.balance}</td>
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
                )}
            </div>

            {/* Report Modal */}
            {showReportModal && (
                <div style={styles.modal}>
                    <div style={styles.modalContent}>
                        <h2>📄 Generate Report</h2>
                        <div style={styles.formGroup}>
                            <label>Report Type</label>
                            <select 
                                value={reportType} 
                                onChange={(e) => setReportType(e.target.value)}
                                style={styles.input}
                            >
                                <option value="daily">Daily Report</option>
                                <option value="monthly">Monthly Report</option>
                            </select>
                        </div>
                        <div style={styles.formGroup}>
                            <label>Date</label>
                            <input
                                type="date"
                                value={reportDate}
                                onChange={(e) => setReportDate(e.target.value)}
                                style={styles.input}
                            />
                        </div>
                        <div style={styles.modalActions}>
                            <button onClick={generateReport} style={styles.primaryButton}>Generate</button>
                            <button onClick={() => setShowReportModal(false)} style={styles.secondaryButton}>Cancel</button>
                        </div>

                        {reportData && (
                            <div style={styles.reportPreview}>
                                <h3>📋 Report Preview</h3>
                                <pre style={styles.reportContent}>
                                    {JSON.stringify(reportData, null, 2)}
                                </pre>
                            </div>
                        )}
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
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    },
    headerActions: {
        display: 'flex',
        gap: '10px'
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
    reportButton: {
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
    reportPreview: {
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#f7fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
    },
    reportContent: {
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
        fontSize: '12px',
        maxHeight: '200px',
        overflow: 'auto'
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

export default AccountantDashboard;