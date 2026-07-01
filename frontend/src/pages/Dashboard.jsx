import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

function Dashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error('Please login first');
            navigate('/login');
            return;
        }

        const userData = localStorage.getItem('user');
        if (!userData) {
            toast.error('User data not found');
            navigate('/login');
            return;
        }

        try {
            const user = JSON.parse(userData);
            
            // ⭐ በሚና መሰረት ወደ ተገቢው ዳሽቦርድ ይውሰዱ
            const roleDashboardMap = {
                admin: '/dashboard/admin',
                teller: '/dashboard/teller',
                accountant: '/dashboard/accountant',
                auditor: '/dashboard/auditor',  // ⭐ አዲስ
                customer: '/dashboard/customer'
            };

            const dashboardPath = roleDashboardMap[user.role] || '/dashboard/customer';
            
            console.log(`👤 Redirecting ${user.role} to: ${dashboardPath}`);
            navigate(dashboardPath);
            
        } catch (error) {
            console.error('❌ Error parsing user data:', error);
            toast.error('Invalid user data');
            navigate('/login');
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.loadingCard}>
                    <div style={styles.spinner}></div>
                    <h2 style={styles.loadingText}>Loading your dashboard...</h2>
                    <p style={styles.loadingSubtext}>Please wait while we redirect you</p>
                </div>
            </div>
        );
    }

    return null;
}

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f0f4f8',
        margin: 0,
        padding: '20px'
    },
    loadingCard: {
        backgroundColor: 'white',
        padding: '50px 40px',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '400px',
        width: '100%'
    },
    spinner: {
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #4299e1',
        borderRadius: '50%',
        width: '50px',
        height: '50px',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 24px auto'
    },
    loadingText: {
        fontSize: '22px',
        color: '#2d3748',
        marginBottom: '8px',
        fontWeight: '600'
    },
    loadingSubtext: {
        fontSize: '14px',
        color: '#718096',
        margin: 0
    }
};

// Add keyframe animation
const styleSheet = document.createElement("style");
styleSheet.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(styleSheet);

export default Dashboard;