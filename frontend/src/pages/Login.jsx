import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axiosConfig';

function Login() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [showDemo] = useState(true);

    // ⭐ ተጠቃሚ ቀድሞ ገብቶ ከሆነ ወደ ዳሽቦርድ ይውሰዱ
    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        if (token && user) {
            try {
                const userData = JSON.parse(user);
                const roleDashboardMap = {
                    admin: '/dashboard/admin',
                    teller: '/dashboard/teller',
                    accountant: '/dashboard/accountant',
                    auditor: '/dashboard/auditor',  // ⭐ አዲስ
                    customer: '/dashboard/customer'
                };
                const dashboardPath = roleDashboardMap[userData.role] || '/dashboard/customer';
                navigate(dashboardPath);
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        }
    }, [navigate]);

    // ⭐ ኢሜይል ማረጋገጫ (Email Validation)
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: ''
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const newErrors = {};
        
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!validateEmail(formData.email)) {
            newErrors.email = 'Please enter a valid email address (e.g., name@gmail.com)';
        }
        
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error('Please fix the errors before submitting');
            return;
        }

        setLoading(true);

        try {
            console.log('📥 Attempting login for:', formData.email);
            const response = await api.post('/auth/login', formData);
            
            console.log('📥 Login response:', response.data);
            
            if (response.data.success) {
                let token, user;
                
                if (response.data.data) {
                    token = response.data.data.token;
                    user = response.data.data.user;
                } else {
                    token = response.data.token;
                    user = response.data.user;
                }
                
                if (!token || !user) {
                    console.error('❌ Token or user missing in response:', response.data);
                    toast.error('Invalid response from server');
                    setLoading(false);
                    return;
                }
                
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                
                toast.success(`Welcome back, ${user.full_name}!`);
                
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
                
                setTimeout(() => {
                    navigate(dashboardPath);
                }, 500);
            } else {
                toast.error(response.data.message || 'Login failed');
            }
        } catch (error) {
            console.error('❌ Login error:', error);
            console.error('❌ Error response:', error.response?.data);
            
            if (error.response?.status === 401) {
                toast.error('Invalid email or password');
            } else if (error.response?.status === 403) {
                toast.error('Account is inactive. Please contact admin.');
            } else if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Login failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // ⭐ ፈጣን መግቢያ (Quick Login)
    const quickLogin = (email, password) => {
        setFormData({ email, password });
        setTimeout(() => {
            const form = document.querySelector('form');
            if (form) {
                const event = new Event('submit', { bubbles: true, cancelable: true });
                form.dispatchEvent(event);
            }
        }, 100);
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.logo}>
                    <span style={styles.logoIcon}>🏦</span>
                    <h2 style={styles.title}>Banking System</h2>
                </div>
                <p style={styles.subtitle}>Login to your account</p>
                
                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Email Address</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            style={{
                                ...styles.input,
                                borderColor: errors.email ? '#dc3545' : '#ddd'
                            }}
                            placeholder="Enter your email"
                            disabled={loading}
                        />
                        {errors.email && (
                            <span style={styles.errorText}>{errors.email}</span>
                        )}
                    </div>
                    
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            style={{
                                ...styles.input,
                                borderColor: errors.password ? '#dc3545' : '#ddd'
                            }}
                            placeholder="Enter your password"
                            disabled={loading}
                        />
                        {errors.password && (
                            <span style={styles.errorText}>{errors.password}</span>
                        )}
                    </div>
                    
                    <button 
                        type="submit" 
                        style={loading ? styles.buttonDisabled : styles.button} 
                        disabled={loading}
                    >
                        {loading ? (
                            <span style={styles.buttonContent}>
                                <span style={styles.buttonSpinner}></span>
                                Logging in...
                            </span>
                        ) : (
                            'Login'
                        )}
                    </button>
                </form>
                
                <div style={styles.links}>
                    <Link to="/register" style={styles.link}>Create an account</Link>
                    <Link to="/forgot-password" style={styles.link}>Forgot password?</Link>
                </div>
                
                {showDemo && (
                    <div style={styles.demo}>
                        <div style={styles.demoHeader}>
                            <span style={styles.demoIcon}>🔑</span>
                            <p style={styles.demoTitle}>Quick Login (Demo)</p>
                        </div>
                        <div style={styles.demoGrid}>
                            <button 
                                onClick={() => quickLogin('admin@gmail.com', 'admin123')}
                                style={styles.demoButton}
                            >
                                <span style={styles.demoRole}>🛡️ Admin</span>
                                <span style={styles.demoCreds}>admin@gmail.com</span>
                            </button>
                            <button 
                                onClick={() => quickLogin('teller@gmail.com', 'teller123')}
                                style={styles.demoButton}
                            >
                                <span style={styles.demoRole}>💳 Teller</span>
                                <span style={styles.demoCreds}>teller@gmail.com</span>
                            </button>
                            <button 
                                onClick={() => quickLogin('accountant@gmail.com', 'accountant123')}
                                style={styles.demoButton}
                            >
                                <span style={styles.demoRole}>📊 Accountant</span>
                                <span style={styles.demoCreds}>accountant@gmail.com</span>
                            </button>
                            <button 
                                onClick={() => quickLogin('auditor@gmail.com', 'auditor123')}
                                style={styles.demoButton}
                            >
                                <span style={styles.demoRole}>🔍 Auditor</span>
                                <span style={styles.demoCreds}>auditor@gmail.com</span>
                            </button>
                            <button 
                                onClick={() => quickLogin('customer@gmail.com', 'customer123')}
                                style={styles.demoButton}
                            >
                                <span style={styles.demoRole}>👤 Customer</span>
                                <span style={styles.demoCreds}>customer@gmail.com</span>
                            </button>
                        </div>
                    </div>
                )}
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
        backgroundColor: '#f0f4f8',
        padding: '20px'
    },
    card: {
        backgroundColor: 'white',
        padding: '40px 35px',
        borderRadius: '16px',
        boxShadow: '0 4px 30px rgba(0,0,0,0.08)',
        width: '100%',
        maxWidth: '420px'
    },
    logo: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        marginBottom: '4px'
    },
    logoIcon: {
        fontSize: '32px'
    },
    title: {
        fontSize: '26px',
        color: '#2d3748',
        margin: 0,
        fontWeight: '700'
    },
    subtitle: {
        fontSize: '14px',
        color: '#718096',
        textAlign: 'center',
        marginBottom: '28px',
        marginTop: '4px'
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '5px'
    },
    label: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#4a5568'
    },
    input: {
        padding: '12px 14px',
        border: '2px solid #e2e8f0',
        borderRadius: '8px',
        fontSize: '15px',
        transition: 'all 0.3s ease',
        outline: 'none',
        backgroundColor: 'white',
        color: '#2d3748'
    },
    button: {
        padding: '14px 24px',
        backgroundColor: '#4299e1',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        marginTop: '6px'
    },
    buttonDisabled: {
        padding: '14px 24px',
        backgroundColor: '#a0aec0',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'not-allowed',
        marginTop: '6px'
    },
    buttonContent: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px'
    },
    buttonSpinner: {
        border: '2px solid rgba(255,255,255,0.3)',
        borderTop: '2px solid white',
        borderRadius: '50%',
        width: '18px',
        height: '18px',
        animation: 'spin 0.8s linear infinite',
        display: 'inline-block'
    },
    links: {
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '16px',
        fontSize: '14px'
    },
    link: {
        color: '#4299e1',
        textDecoration: 'none',
        fontWeight: '500',
        transition: 'color 0.3s ease'
    },
    errorText: {
        color: '#dc3545',
        fontSize: '13px',
        marginTop: '3px'
    },
    demo: {
        marginTop: '24px',
        padding: '16px',
        backgroundColor: '#f7fafc',
        borderRadius: '12px',
        border: '1px solid #e2e8f0'
    },
    demoHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px'
    },
    demoIcon: {
        fontSize: '16px'
    },
    demoTitle: {
        fontSize: '13px',
        fontWeight: '600',
        color: '#4a5568',
        margin: 0
    },
    demoGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px'
    },
    demoButton: {
        padding: '10px 12px',
        backgroundColor: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        textAlign: 'left',
        fontSize: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px'
    },
    demoRole: {
        fontWeight: '600',
        color: '#2d3748',
        fontSize: '13px'
    },
    demoCreds: {
        color: '#718096',
        fontSize: '11px',
        wordBreak: 'break-all'
    }
};

// Add keyframe animation
const styleSheet = document.createElement("style");
styleSheet.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    input:focus {
        border-color: #4299e1 !important;
        box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.15) !important;
    }
    
    button:hover:not(:disabled) {
        background-color: #3182ce !important;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(66, 153, 225, 0.3);
    }
    
    .demo-button:hover {
        background-color: #edf2f7 !important;
        border-color: #4299e1 !important;
        transform: translateY(-1px);
    }
`;
document.head.appendChild(styleSheet);

export default Login;