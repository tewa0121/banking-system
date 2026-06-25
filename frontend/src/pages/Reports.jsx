import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axiosConfig';

function Reports() {
    const navigate = useNavigate();
    const [accountId, setAccountId] = useState('');
    const [transactions, setTransactions] = useState([]);
    const [summary, setSummary] = useState(null);
    const [account, setAccount] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        fetchAccountInfo();
    }, []);

    const fetchAccountInfo = async () => {
        try {
            const response = await api.get('/accounts/me');
            if (response.data.success) {
                const acc = response.data.data;
                setAccount(acc);
                setAccountId(acc.id);
            }
        } catch (error) {
            toast.error('Failed to fetch account info');
        }
    };

    const generateStatement = async () => {
        if (!accountId) {
            toast.error('Please enter account ID');
            return;
        }

        setLoading(true);
        try {
            const response = await api.get(`/reports/statement/${accountId}`);
            if (response.data.success) {
                const data = response.data.data;
                setTransactions(data.transactions || []);
                setSummary(data.summary);
                toast.success('Statement generated successfully!');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to generate statement');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>📊 Account Statement</h2>

            <div style={styles.card}>
                <div style={styles.inputGroup}>
                    <label style={styles.label}>Account ID</label>
                    <input
                        type="number"
                        value={accountId}
                        onChange={(e) => setAccountId(e.target.value)}
                        style={styles.input}
                        placeholder="Enter account ID"
                    />
                    {account && (
                        <p style={styles.hint}>
                            Account: {account.account_number} (Balance: {account.balance} ETB)
                        </p>
                    )}
                </div>
                <button onClick={generateStatement} style={styles.button} disabled={loading}>
                    {loading ? 'Generating...' : 'Generate Statement'}
                </button>
            </div>

            {summary && (
                <div style={styles.summaryCard}>
                    <h3>Summary</h3>
                    <div style={styles.summaryGrid}>
                        <div>
                            <p>Start Balance</p>
                            <strong>{summary.startBalance.toFixed(2)} ETB</strong>
                        </div>
                        <div>
                            <p>Total Deposits</p>
                            <strong style={{color: '#28a745'}}>{summary.totalDeposits.toFixed(2)} ETB</strong>
                        </div>
                        <div>
                            <p>Total Withdrawals</p>
                            <strong style={{color: '#dc3545'}}>{summary.totalWithdrawals.toFixed(2)} ETB</strong>
                        </div>
                        <div>
                            <p>End Balance</p>
                            <strong style={{color: '#007bff'}}>{summary.endBalance.toFixed(2)} ETB</strong>
                        </div>
                    </div>
                </div>
            )}

            {transactions.length > 0 && (
                <div style={styles.card}>
                    <h4>Transactions ({transactions.length})</h4>
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
                            {transactions.map((tx) => (
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
                </div>
            )}

            <button onClick={() => navigate('/dashboard')} style={styles.backButton}>
                ⬅ Back to Dashboard
            </button>
        </div>
    );
}

const styles = {
    container: { maxWidth: '800px', margin: '0 auto', padding: '20px' },
    title: { textAlign: 'center', marginBottom: '30px', color: '#333' },
    card: { backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', marginBottom: '20px' },
    summaryCard: { backgroundColor: '#e3f2fd', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #bbdefb' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' },
    label: { fontSize: '14px', fontWeight: '500', color: '#555' },
    input: { padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px' },
    hint: { fontSize: '13px', color: '#666', marginTop: '5px' },
    button: { padding: '12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer', width: '100%' },
    backButton: { padding: '12px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer', width: '100%', marginTop: '10px' },
    summaryGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px' },
    deposit: { color: '#28a745', fontWeight: 'bold' },
    withdraw: { color: '#dc3545', fontWeight: 'bold' }
};

export default Reports;