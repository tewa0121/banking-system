import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axiosConfig';

function Settings() {
    const navigate = useNavigate();
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        interest_rate: '',
        currency: 'ETB',
        transaction_limit: '',
        maintenance_mode: false
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.role !== 'admin') {
            toast.error('Admin access required');
            navigate('/dashboard');
            return;
        }

        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/settings');
            if (response.data.success) {
                setSettings(response.data.data);
                setFormData({
                    interest_rate: response.data.data.interest_rate || '',
                    currency: response.data.data.currency || 'ETB',
                    transaction_limit: response.data.data.transaction_limit || '',
                    maintenance_mode: response.data.data.maintenance_mode || false
                });
            }
        } catch (error) {
            toast.error('Failed to fetch settings');
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.put('/settings', formData);
            if (response.data.success) {
                toast.success('Settings updated successfully!');
                fetchSettings();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update settings');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>⚙️ System Settings</h2>

            <div style={styles.card}>
                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Interest Rate (%)</label>
                        <input
                            type="number"
                            name="interest_rate"
                            value={formData.interest_rate}
                            onChange={handleChange}
                            style={styles.input}
                            step="0.01"
                            required
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Currency</label>
                        <select
                            name="currency"
                            value={formData.currency}
                            onChange={handleChange}
                            style={styles.select}
                        >
                            <option value="ETB">ETB - Ethiopian Birr</option>
                            <option value="USD">USD - US Dollar</option>
                            <option value="EUR">EUR - Euro</option>
                            <option value="GBP">GBP - British Pound</option>
                        </select>
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Transaction Limit</label>
                        <input
                            type="number"
                            name="transaction_limit"
                            value={formData.transaction_limit}
                            onChange={handleChange}
                            style={styles.input}
                            required
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                name="maintenance_mode"
                                checked={formData.maintenance_mode}
                                onChange={handleChange}
                            />
                            Maintenance Mode
                        </label>
                        <p style={styles.hint}>
                            {formData.maintenance_mode ? 
                                '⚠️ System is in maintenance mode. Users cannot login.' : 
                                '✅ System is running normally.'}
                        </p>
                    </div>

                    <button type="submit" style={styles.button} disabled={loading}>
                        {loading ? 'Saving...' : 'Save Settings'}
                    </button>
                </form>
            </div>

            <button onClick={() => navigate('/admin')} style={styles.backButton}>
                ⬅ Back to Admin Dashboard
            </button>
        </div>
    );
}

const styles = {
    container: { maxWidth: '600px', margin: '0 auto', padding: '20px' },
    title: { textAlign: 'center', marginBottom: '30px', color: '#333' },
    card: { backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
    form: { display: 'flex', flexDirection: 'column', gap: '20px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
    label: { fontSize: '14px', fontWeight: '500', color: '#555' },
    input: { padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px' },
    select: { padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px', backgroundColor: 'white' },
    checkboxLabel: { fontSize: '14px', fontWeight: '500', color: '#555', display: 'flex', alignItems: 'center', gap: '10px' },
    hint: { fontSize: '13px', color: '#666', marginTop: '5px' },
    button: { padding: '12px', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer', marginTop: '10px' },
    backButton: { padding: '12px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer', width: '100%', marginTop: '10px' }
};

export default Settings;