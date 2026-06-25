import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axiosConfig';

function InterestCalculator() {
    const navigate = useNavigate();
    const [accountId, setAccountId] = useState('');
    const [interestData, setInterestData] = useState(null);
    const [rateInfo, setRateInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [account, setAccount] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        fetchAccountInfo();
        fetchRateInfo();
    }, [navigate]);

    const fetchAccountInfo = async () => {
        try {
            const response = await api.get('/accounts/me');
            if (response.data.success) {
                const accountData = response.data.data;
                setAccount(accountData);
                setAccountId(accountData.id);
            }
        } catch (error) {
            toast.error('Failed to fetch account info');
        }
    };

    const fetchRateInfo = async () => {
        try {
            const response = await api.get('/interest/info');
            if (response.data.success) {
                setRateInfo(response.data.data);
            }
        } catch (error) {
            toast.error('Failed to fetch rate info');
        }
    };

    const handleCalculate = async () => {
        if (!accountId) {
            toast.error('Please enter an account ID');
            return;
        }

        setLoading(true);
        try {
            const response = await api.get(`/interest/calculate/${accountId}`);
            if (response.data.success) {
                setInterestData(response.data.data);
                toast.success('Interest calculated successfully!');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Calculation failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>💰 Interest Calculator</h2>

            {rateInfo && (
                <div style={styles.infoCard}>
                    <h4>📊 Interest Rate Information</h4>
                    <p>Annual Rate: <strong>{rateInfo.annual_rate}%</strong></p>
                    <p>Monthly Rate: <strong>{rateInfo.monthly_rate.toFixed(2)}%</strong></p>
                    <p style={styles.infoText}>{rateInfo.description}</p>
                </div>
            )}

            <div style={styles.card}>
                <h3>Calculate Your Interest</h3>
                <div style={styles.inputGroup}>
                    <label style={styles.label}>Account ID</label>
                    <input
                        type="number"
                        value={accountId}
                        onChange={(e) => setAccountId(e.target.value)}
                        style={styles.input}
                        placeholder="Enter account ID"
                        disabled={loading}
                    />
                    {account && (
                        <p style={styles.hint}>
                            Your account: {account.account_number} (Balance: {account.balance} ETB)
                        </p>
                    )}
                </div>
                <button 
                    onClick={handleCalculate} 
                    style={styles.button}
                    disabled={loading}
                >
                    {loading ? 'Calculating...' : 'Calculate Interest'}
                </button>
            </div>

            {interestData && (
                <div style={styles.resultCard}>
                    <h3>📈 Interest Calculation Result</h3>
                    <div style={styles.resultGrid}>
                        <div style={styles.resultItem}>
                            <p style={styles.resultLabel}>Account Number</p>
                            <strong style={styles.resultValue}>{interestData.account_number}</strong>
                        </div>
                        <div style={styles.resultItem}>
                            <p style={styles.resultLabel}>Current Balance</p>
                            <strong style={styles.resultValue}>{interestData.balance.toFixed(2)} {interestData.currency}</strong>
                        </div>
                        <div style={styles.resultItem}>
                            <p style={styles.resultLabel}>Annual Rate</p>
                            <strong style={styles.resultValue}>{interestData.annual_rate}%</strong>
                        </div>
                        <div style={styles.resultItem}>
                            <p style={styles.resultLabel}>Monthly Interest</p>
                            <strong style={{...styles.resultValue, color: '#2e7d32', fontSize: '20px'}}>
                                {interestData.monthly_interest.toFixed(2)} {interestData.currency}
                            </strong>
                        </div>
                        <div style={styles.resultItem}>
                            <p style={styles.resultLabel}>Yearly Interest</p>
                            <strong style={{...styles.resultValue, color: '#1b5e20', fontSize: '20px'}}>
                                {interestData.yearly_interest.toFixed(2)} {interestData.currency}
                            </strong>
                        </div>
                    </div>
                </div>
            )}

            <div style={styles.buttonGroup}>
                <button 
                    onClick={() => navigate('/dashboard')} 
                    style={styles.backButton}
                >
                    ⬅ Back to Dashboard
                </button>
                <button 
                    onClick={handleCalculate} 
                    style={styles.refreshButton}
                    disabled={loading}
                >
                    🔄 Refresh
                </button>
            </div>
        </div>
    );
}

const styles = {
    container: {
        maxWidth: '750px',
        margin: '0 auto',
        padding: '30px 20px'
    },
    title: {
        textAlign: 'center',
        marginBottom: '30px',
        color: '#1a237e',
        fontSize: '28px'
    },
    card: {
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '12px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        marginBottom: '20px'
    },
    infoCard: {
        backgroundColor: '#e3f2fd',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '20px',
        border: '1px solid #bbdefb'
    },
    infoText: {
        color: '#0d47a1',
        marginTop: '8px',
        fontSize: '14px'
    },
    resultCard: {
        backgroundColor: '#e8f5e9',
        padding: '25px',
        borderRadius: '12px',
        marginBottom: '20px',
        border: '1px solid #c8e6c9'
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        marginBottom: '15px'
    },
    label: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#333'
    },
    input: {
        padding: '12px 15px',
        border: '2px solid #ddd',
        borderRadius: '8px',
        fontSize: '16px',
        width: '100%',
        transition: 'border-color 0.3s'
    },
    hint: {
        fontSize: '13px',
        color: '#666',
        marginTop: '5px'
    },
    button: {
        padding: '14px 30px',
        backgroundColor: '#1976d2',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        cursor: 'pointer',
        width: '100%',
        fontWeight: '600',
        transition: 'background 0.3s'
    },
    buttonGroup: {
        display: 'flex',
        gap: '10px',
        marginTop: '10px'
    },
    backButton: {
        padding: '12px 25px',
        backgroundColor: '#6c757d',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '15px',
        cursor: 'pointer',
        flex: '1',
        transition: 'background 0.3s'
    },
    refreshButton: {
        padding: '12px 25px',
        backgroundColor: '#28a745',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '15px',
        cursor: 'pointer',
        flex: '1',
        transition: 'background 0.3s'
    },
    resultGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '15px',
        marginTop: '15px'
    },
    resultItem: {
        backgroundColor: 'white',
        padding: '15px',
        borderRadius: '8px',
        textAlign: 'center'
    },
    resultLabel: {
        fontSize: '13px',
        color: '#666',
        marginBottom: '5px'
    },
    resultValue: {
        fontSize: '18px',
        color: '#1a237e'
    }
};

export default InterestCalculator;