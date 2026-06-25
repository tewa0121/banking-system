import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axiosConfig';

function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [account, setAccount] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }

        fetchAccountData();
    }, []);

    useEffect(() => {
        if (account?.id) {
            fetchTransactionHistory();
        }
    }, [account]);

    const fetchAccountData = async () => {
        try {
            console.log('📥 Fetching account data...');
            const response = await api.get('/accounts/me');
            console.log('📥 Account response:', response.data);
            
            if (response.data.success) {
                setAccount(response.data.data);
                console.log('✅ Account loaded:', response.data.data);
            }
        } catch (error) {
            console.error('❌ Failed to fetch account data:', error);
            toast.error('Failed to fetch account data');
        }
    };

    const fetchTransactionHistory = async () => {
        try {
            if (!account?.id) {
                console.log('⚠️ No account ID yet');
                return;
            }
            
            console.log('📥 Fetching transactions for account:', account.id);
            const response = await api.get(`/transactions/history/${account.id}`);
            console.log('📥 Transactions response:', response.data);
            
            if (response.data.success) {
                const data = response.data.data;
                setTransactions(data.transactions || []);
                setSummary(data.summary || {
                    total_transactions: 0,
                    total_deposits: 0,
                    total_withdrawals: 0,
                    total_transfers: 0
                });
                console.log('✅ Transactions loaded:', data.transactions?.length || 0);
            }
        } catch (error) {
            console.error('❌ Failed to fetch transactions:', error);
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
                <h1>Dashboard</h1>
                <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
            </div>
            
            <div style={styles.card}>
                <h3>Welcome, {user?.full_name}!</h3>
                <p>Email: {user?.email}</p>
                <p>Role: {user?.role}</p>
            </div>

            {account && (
                <div style={styles.card}>
                    <h3>Account Information</h3>
                    <p>Account Number: {account.account_number}</p>
                    <p>Account Type: {account.account_type}</p>
                    <p style={styles.balance}>Balance: {account.balance} ETB</p>
                    <p>Status: {account.status}</p>
                </div>
            )}

            <div style={styles.actions}>
                <Link to="/deposit" style={styles.actionButton}>💰 Deposit</Link>
                <Link to="/withdraw" style={styles.actionButton}>🏦 Withdraw</Link>
                <Link to="/transfer" style={styles.actionButton}>📤 Transfer</Link>
                <Link to="/external-transfer" style={styles.actionButton}>🏦 External</Link>
                <Link to="/interest" style={styles.actionButton}>📈 Interest</Link>
            </div>

            {summary && (
                <div style={styles.card}>
                    <h4>Transaction Summary</h4>
                    <p>Total Transactions: {summary.total_transactions || 0}</p>
                    <p>Total Deposits: {summary.total_deposits || 0} ETB</p>
                    <p>Total Withdrawals: {summary.total_withdrawals || 0} ETB</p>
                    <p>Total Transfers: {summary.total_transfers || 0} ETB</p>
                </div>
            )}

            <div style={styles.card}>
                <h4>Recent Transactions</h4>
                {transactions.length === 0 ? (
                    <p>No transactions yet</p>
                ) : (
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Amount</th>
                                <th>Description</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.slice(0, 10).map((tx) => (
                                <tr key={tx.id}>
                                    <td style={tx.transaction_type === 'deposit' ? styles.deposit : styles.withdraw}>
                                        {tx.transaction_type}
                                    </td>
                                    <td>{tx.amount} ETB</td>
                                    <td>{tx.description || '-'}</td>
                                    <td>{new Date(tx.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

const styles = {
    container: {
        padding: '20px',
        maxWidth: '900px',
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
    card: {
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '20px'
    },
    balance: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#28a745'
    },
    actions: {
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
        flexWrap: 'wrap'
    },
    actionButton: {
        padding: '10px 20px',
        backgroundColor: '#007bff',
        color: 'white',
        textDecoration: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        border: 'none',
        fontSize: '16px',
        flex: '1',
        textAlign: 'center',
        minWidth: '100px'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '10px'
    },
    deposit: {
        color: '#28a745',
        fontWeight: 'bold'
    },
    withdraw: {
        color: '#dc3545',
        fontWeight: 'bold'
    },
    loading: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '18px'
    }
};

export default Dashboard;