import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axiosConfig';

function ExternalTransfer() {
    const navigate = useNavigate();
    const [banks, setBanks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        from_account_id: '',
        bank_code: '',
        account_number: '',
        account_name: '',
        amount: '',
        description: ''
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        fetchBanks();
        fetchAccountInfo();
    }, []);

    const fetchBanks = async () => {
        try {
            const response = await api.get('/banks/list');
            if (response.data.success) {
                setBanks(response.data.data);
            }
        } catch (error) {
            toast.error('Failed to fetch banks');
        }
    };

    const fetchAccountInfo = async () => {
        try {
            const response = await api.get('/accounts/me');
            if (response.data.success) {
                setFormData(prev => ({
                    ...prev,
                    from_account_id: response.data.data.id
                }));
            }
        } catch (error) {
            toast.error('Failed to fetch account info');
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.post('/banks/transfer', formData);
            if (response.data.success) {
                toast.success('Transfer successful!');
                navigate('/dashboard');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Transfer failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>🏦 External Bank Transfer</h2>

            <div style={styles.card}>
                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Select Bank</label>
                        <select
                            name="bank_code"
                            value={formData.bank_code}
                            onChange={handleChange}
                            style={styles.select}
                            required
                        >
                            <option value="">Select a bank...</option>
                            {banks.map((bank) => (
                                <option key={bank.id} value={bank.code}>
                                    {bank.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Recipient Account Number</label>
                        <input
                            type="text"
                            name="account_number"
                            value={formData.account_number}
                            onChange={handleChange}
                            style={styles.input}
                            placeholder="Enter account number"
                            required
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Recipient Account Name</label>
                        <input
                            type="text"
                            name="account_name"
                            value={formData.account_name}
                            onChange={handleChange}
                            style={styles.input}
                            placeholder="Enter account holder name"
                            required
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Amount (ETB)</label>
                        <input
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            style={styles.input}
                            placeholder="Enter amount"
                            required
                            min="0.01"
                            step="0.01"
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Description (Optional)</label>
                        <input
                            type="text"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            style={styles.input}
                            placeholder="Transfer description"
                        />
                    </div>

                    <button type="submit" style={styles.button} disabled={loading}>
                        {loading ? 'Processing...' : 'Transfer'}
                    </button>
                    <button 
                        type="button" 
                        style={styles.backButton} 
                        onClick={() => navigate('/dashboard')}
                    >
                        ⬅ Back to Dashboard
                    </button>
                </form>
            </div>
        </div>
    );
}

const styles = {
    container: {
        maxWidth: '600px',
        margin: '0 auto',
        padding: '20px'
    },
    title: {
        textAlign: 'center',
        marginBottom: '30px',
        color: '#333'
    },
    card: {
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '5px'
    },
    label: {
        fontSize: '14px',
        fontWeight: '500',
        color: '#555'
    },
    input: {
        padding: '10px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '16px'
    },
    select: {
        padding: '10px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '16px',
        backgroundColor: 'white'
    },
    button: {
        padding: '12px',
        backgroundColor: '#28a745',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontSize: '16px',
        cursor: 'pointer',
        marginTop: '10px'
    },
    backButton: {
        padding: '12px',
        backgroundColor: '#6c757d',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontSize: '16px',
        cursor: 'pointer',
        marginTop: '5px'
    }
};

export default ExternalTransfer;