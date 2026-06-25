import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axiosConfig';

function Withdraw() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        account_id: '',
        amount: '',
        description: ''
    });
    const [loading, setLoading] = useState(false);

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
            const response = await api.post('/transactions/withdraw', {
                account_id: parseInt(formData.account_id),
                amount: parseFloat(formData.amount),
                description: formData.description || 'Withdrawal'
            });

            if (response.data.success) {
                toast.success('Withdrawal successful!');
                navigate('/dashboard');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Withdrawal failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>Withdraw</h2>
                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Account ID</label>
                        <input
                            type="number"
                            name="account_id"
                            value={formData.account_id}
                            onChange={handleChange}
                            style={styles.input}
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
                            placeholder="e.g., ATM withdrawal"
                        />
                    </div>
                    <button type="submit" style={styles.button} disabled={loading}>
                        {loading ? 'Processing...' : 'Withdraw'}
                    </button>
                    <button 
                        type="button" 
                        style={styles.backButton} 
                        onClick={() => navigate('/dashboard')}
                    >
                        Back to Dashboard
                    </button>
                </form>
            </div>
        </div>
    );
}

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5'
    },
    card: {
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px'
    },
    title: {
        textAlign: 'center',
        marginBottom: '30px',
        color: '#333'
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
    button: {
        padding: '12px',
        backgroundColor: '#dc3545',
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

export default Withdraw;