import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axiosConfig';

function AuditorDashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        auditLogs: 0,
        totalTransactions: 0,
        suspiciousTransactions: 0,
        totalUsers: 0
    });
    const [auditLogs, setAuditLogs] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [suspicious, setSuspicious] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showUserActivity, setShowUserActivity] = useState(false);
    const [userActivity, setUserActivity] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        if (!['auditor', 'admin'].includes(userData.role)) {
            toast.error('Auditor access required');
            navigate('/dashboard');
            return;
        }

        fetchDashboardData();
    }, [navigate]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            
            // ⭐ ሁሉንም ጥያቄዎች በአንድ ጊዜ ይላኩ
            const requests = [
                api.get('/dashboard/auditor'),
                api.get('/auditor/audit-logs'),
                api.get('/auditor/suspicious')
            ];
            
            // ⭐ transactions ጥያቄን በተለየ ሞክር (ስህተት ካለ አያቁም)
            let transactionsData = [];
            try {
                const transactionsRes = await api.get('/auditor/transactions');
                if (transactionsRes.data && transactionsRes.data.success) {
                    transactionsData = transactionsRes.data.data || [];
                }
            } catch (txError) {
                console.warn('⚠️ Could not fetch transactions:', txError.message);
                transactionsData = [];
            }
            
            const [statsRes, auditRes, suspiciousRes] = await Promise.all(requests);

            console.log('📊 Stats Response:', statsRes.data);
            console.log('📋 Audit Logs Response:', auditRes.data);
            console.log('⚠️ Suspicious Response:', suspiciousRes.data);
            console.log('📈 Transactions Response:', transactionsData);

            if (statsRes.data && statsRes.data.success) {
                const data = statsRes.data.data || {};
                setStats({
                    auditLogs: data.auditLogs || 0,
                    totalTransactions: data.totalTransactions || 0,
                    suspiciousTransactions: data.suspiciousTransactions || 0,
                    totalUsers: data.totalUsers || 0
                });
            }
            
            if (auditRes.data && auditRes.data.success) {
                setAuditLogs(Array.isArray(auditRes.data.data) ? auditRes.data.data : []);
            }
            
            if (suspiciousRes.data && suspiciousRes.data.success) {
                setSuspicious(Array.isArray(suspiciousRes.data.data) ? suspiciousRes.data.data : []);
            }
            
            // ⭐ transactions ን አስቀምጥ
            setTransactions(transactionsData);
            
        } catch (error) {
            console.error('❌ Error fetching auditor data:', error);
            toast.error('Failed to fetch some dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const viewUserActivity = async (userId) => {
        try {
            const response = await api.get(`/auditor/users/${userId}/activity`);
            if (response.data && response.data.success) {
                setUserActivity(response.data.data || []);
                setShowUserActivity(true);
            }
        } catch (error) {
            toast.error('Failed to fetch user activity');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        toast.info('Logged out successfully');
    };

    if (loading) {
        return <div style={styles.loading}>Loading Auditor Dashboard...</div>;
    }

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>🔍 Auditor Dashboard</h1>
                    <p style={styles.subtitle}>Monitor and audit all system activities</p>
                </div>
                <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
            </div>

            {/* Stats Cards */}
            <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                    <div style={styles.statIcon}>📋</div>
                    <h3>{stats.auditLogs}</h3>
                    <p>Audit Logs</p>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statIcon}>📊</div>
                    <h3>{stats.totalTransactions}</h3>
                    <p>Total Transactions</p>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statIcon}>⚠️</div>
                    <h3>{stats.suspiciousTransactions}</h3>
                    <p>Suspicious Transactions</p>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statIcon}>👥</div>
                    <h3>{stats.totalUsers}</h3>
                    <p>Total Users</p>
                </div>
            </div>

            {/* Suspicious Transactions */}
            <div style={styles.card}>
                <h3>⚠️ Suspicious Transactions</h3>
                {suspicious.length === 0 ? (
                    <p style={styles.emptyState}>No suspicious transactions found</p>
                ) : (
                    <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Account</th>
                                    <th>Customer</th>
                                    <th>Amount</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {suspicious.map((tx) => (
                                    <tr key={tx.id} style={styles.suspiciousRow}>
                                        <td>#{tx.id}</td>
                                        <td>{tx.account_number}</td>
                                        <td>{tx.customer_name}</td>
                                        <td style={styles.suspiciousAmount}>{tx.amount} ETB</td>
                                        <td>{tx.transaction_type}</td>
                                        <td>
                                            <span style={tx.status === 'completed' ? styles.completedBadge : styles.failedBadge}>
                                                {tx.status}
                                            </span>
                                        </td>
                                        <td>{new Date(tx.created_at).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Audit Logs */}
            <div style={styles.card}>
                <h3>📋 Recent Audit Logs</h3>
                {auditLogs.length === 0 ? (
                    <p style={styles.emptyState}>No audit logs yet</p>
                ) : (
                    <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Action</th>
                                    <th>Details</th>
                                    <th>IP Address</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {auditLogs.slice(0, 20).map((log) => (
                                    <tr key={log.id}>
                                        <td>
                                            <span 
                                                style={styles.userLink}
                                                onClick={() => log.user_id && viewUserActivity(log.user_id)}
                                            >
                                                {log.user_name || 'System'}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={styles.actionBadge}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td>{log.details || '-'}</td>
                                        <td>{log.ip_address || '-'}</td>
                                        <td>{new Date(log.created_at).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Recent Transactions - የተሻሻለ */}
            <div style={styles.card}>
                <h3>📊 Recent Transactions</h3>
                {transactions.length === 0 ? (
                    <p style={styles.emptyState}>No transactions yet</p>
                ) : (
                    <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Amount</th>
                                    <th>Customer</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.slice(0, 20).map((tx) => (
                                    <tr key={tx.id}>
                                        <td>
                                            <span style={tx.transaction_type === 'deposit' ? styles.depositText : styles.withdrawText}>
                                                {tx.transaction_type}
                                            </span>
                                        </td>
                                        <td>{tx.amount} ETB</td>
                                        <td>{tx.customer_name}</td>
                                        <td>
                                            <span style={tx.status === 'completed' ? styles.completedBadge : styles.pendingBadge}>
                                                {tx.status}
                                            </span>
                                        </td>
                                        <td>{new Date(tx.created_at).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* User Activity Modal */}
            {showUserActivity && (
                <div style={styles.modal}>
                    <div style={styles.modalContent}>
                        <h2>👤 User Activity</h2>
                        {userActivity.length === 0 ? (
                            <p>No activity found</p>
                        ) : (
                            <div style={styles.tableWrapper}>
                                <table style={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Action</th>
                                            <th>Details</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {userActivity.map((activity, index) => (
                                            <tr key={index}>
                                                <td>{activity.action}</td>
                                                <td>{activity.details || '-'}</td>
                                                <td>{new Date(activity.created_at).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <div style={styles.modalActions}>
                            <button onClick={() => setShowUserActivity(false)} style={styles.primaryButton}>Close</button>
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
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
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
    suspiciousRow: {
        backgroundColor: '#fff5f5'
    },
    suspiciousAmount: {
        color: '#e53e3e',
        fontWeight: 'bold'
    },
    userLink: {
        color: '#4299e1',
        cursor: 'pointer',
        textDecoration: 'underline'
    },
    actionBadge: {
        backgroundColor: '#805ad5',
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
    failedBadge: {
        backgroundColor: '#e53e3e',
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
        maxWidth: '800px',
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto'
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

export default AuditorDashboard;