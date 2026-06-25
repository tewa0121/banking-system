import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axiosConfig';

function AdminDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

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
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [statsRes, usersRes, transactionsRes] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/users'),
                api.get('/admin/transactions?limit=50')
            ]);

            if (statsRes.data.success) setStats(statsRes.data.data);
            if (usersRes.data.success) setUsers(usersRes.data.data);
            if (transactionsRes.data.success) setTransactions(transactionsRes.data.data);
        } catch (error) {
            toast.error('Failed to fetch admin data');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        toast.info('Logged out successfully');
    };

    if (loading) {
        return <div style={styles.loading}>Loading...</div>;
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1>Admin Dashboard</h1>
                <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div style={styles.statsGrid}>
                    <div style={styles.statCard}>
                        <h3>{stats.totalUsers}</h3>
                        <p>Total Users</p>
                    </div>
                    <div style={styles.statCard}>
                        <h3>{stats.totalAccounts}</h3>
                        <p>Total Accounts</p>
                    </div>
                    <div style={styles.statCard}>
                        <h3>{stats.totalTransactions}</h3>
                        <p>Total Transactions</p>
                    </div>
                    <div style={styles.statCard}>
                        <h3>{stats.totalBalance} ETB</h3>
                        <p>Total Balance</p>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div style={styles.tabs}>
                <button 
                    style={activeTab === 'overview' ? styles.activeTab : styles.tab}
                    onClick={() => setActiveTab('overview')}
                >
                    Overview
                </button>
                <button 
                    style={activeTab === 'users' ? styles.activeTab : styles.tab}
                    onClick={() => setActiveTab('users')}
                >
                    Users ({users.length})
                </button>
                <button 
                    style={activeTab === 'transactions' ? styles.activeTab : styles.tab}
                    onClick={() => setActiveTab('transactions')}
                >
                    Transactions ({transactions.length})
                </button>
            </div>

            {/* Users Table */}
            {activeTab === 'users' && (
                <div style={styles.tableContainer}>
                    <h3>All Users</h3>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td>{user.id}</td>
                                    <td>{user.full_name}</td>
                                    <td>{user.email}</td>
                                    <td>
                                        <span style={user.role === 'admin' ? styles.adminBadge : styles.userBadge}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Transactions Table */}
            {activeTab === 'transactions' && (
                <div style={styles.tableContainer}>
                    <h3>Recent Transactions</h3>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Account</th>
                                <th>User</th>
                                <th>Type</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((tx) => (
                                <tr key={tx.id}>
                                    <td>{tx.id}</td>
                                    <td>{tx.account_number}</td>
                                    <td>{tx.full_name}</td>
                                    <td>
                                        <span style={tx.transaction_type === 'deposit' ? styles.depositText : styles.withdrawText}>
                                            {tx.transaction_type}
                                        </span>
                                    </td>
                                    <td>{tx.amount} ETB</td>
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

            {/* Overview Tab */}
            {activeTab === 'overview' && stats && (
                <div style={styles.overview}>
                    <div style={styles.card}>
                        <h4>Recent Transactions</h4>
                        {stats.recentTransactions?.length === 0 ? (
                            <p>No recent transactions</p>
                        ) : (
                            <ul style={styles.transactionList}>
                                {stats.recentTransactions?.slice(0, 5).map((tx) => (
                                    <li key={tx.id}>
                                        <span>{tx.full_name}</span>
                                        <span style={tx.transaction_type === 'deposit' ? styles.depositText : styles.withdrawText}>
                                            {tx.transaction_type}
                                        </span>
                                        <span>{tx.amount} ETB</span>
                                    </li>
                                ))}
                            </ul>
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
        maxWidth: '1200px',
        margin: '0 auto'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px'
    },
    logoutButton: {
        padding: '10px 20px',
        backgroundColor: '#dc3545',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
    },
    statCard: {
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        textAlign: 'center'
    },
    tabs: {
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
        flexWrap: 'wrap'
    },
    tab: {
        padding: '10px 20px',
        backgroundColor: '#f8f9fa',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
    },
    activeTab: {
        padding: '10px 20px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
    },
    tableContainer: {
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        overflowX: 'auto'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '10px'
    },
    adminBadge: {
        backgroundColor: '#dc3545',
        color: 'white',
        padding: '3px 8px',
        borderRadius: '4px',
        fontSize: '12px'
    },
    userBadge: {
        backgroundColor: '#28a745',
        color: 'white',
        padding: '3px 8px',
        borderRadius: '4px',
        fontSize: '12px'
    },
    depositText: {
        color: '#28a745',
        fontWeight: 'bold'
    },
    withdrawText: {
        color: '#dc3545',
        fontWeight: 'bold'
    },
    completedBadge: {
        backgroundColor: '#28a745',
        color: 'white',
        padding: '3px 8px',
        borderRadius: '4px',
        fontSize: '12px'
    },
    pendingBadge: {
        backgroundColor: '#ffc107',
        color: 'black',
        padding: '3px 8px',
        borderRadius: '4px',
        fontSize: '12px'
    },
    overview: {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '20px'
    },
    card: {
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    },
    transactionList: {
        listStyle: 'none',
        padding: 0
    },
    loading: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '18px'
    }
};

export default AdminDashboard;