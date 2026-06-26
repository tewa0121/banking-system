import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axiosConfig';

function UserDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [account, setAccount] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUserDetails();
    }, [id]);

    const fetchUserDetails = async () => {
        try {
            const response = await api.get(`/admin/users/${id}`);
            if (response.data.success) {
                setUser(response.data.data.user);
                setAccount(response.data.data.account);
            }
        } catch (error) {
            toast.error('Failed to fetch user details');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div style={styles.loading}>Loading...</div>;
    }

    if (!user) {
        return <div style={styles.error}>User not found</div>;
    }

    return (
        <div style={styles.container}>
            <h2>User Details</h2>
            <div style={styles.card}>
                <h3>{user.full_name}</h3>
                <p>Email: {user.email}</p>
                <p>Phone: {user.phone || 'N/A'}</p>
                <p>Role: {user.role}</p>
                <p>Status: {user.status}</p>
            </div>
            {account && (
                <div style={styles.card}>
                    <h4>Account Information</h4>
                    <p>Account Number: {account.account_number}</p>
                    <p>Balance: {account.balance} ETB</p>
                    <p>Type: {account.account_type}</p>
                </div>
            )}
            <button onClick={() => navigate('/admin')} style={styles.backBtn}>
                ⬅ Back to Admin Dashboard
            </button>
        </div>
    );
}

const styles = {
    container: { maxWidth: '800px', margin: '0 auto', padding: '20px' },
    card: { backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', marginBottom: '20px' },
    loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' },
    error: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: 'red' },
    backBtn: { padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }
};

export default UserDetails;