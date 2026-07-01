import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axiosConfig';

function Register() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        address: ''
    });
    const [errors, setErrors] = useState({});

    const validateEmail = (email) => {
        // ⭐ Gmail ብቻ እንዲቀበል
        return email.endsWith('@gmail.com');
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
        
        // ⭐ ማረጋገጫ
        const newErrors = {};
        
        if (!formData.full_name) {
            newErrors.full_name = 'Full name is required';
        }
        
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!validateEmail(formData.email)) {
            newErrors.email = 'Only Gmail addresses are allowed (e.g., name@gmail.com)';
        }
        
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }
        
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error('Please fix the errors');
            return;
        }

        setLoading(true);

        try {
            const response = await api.post('/auth/register', {
                full_name: formData.full_name,
                email: formData.email,
                password: formData.password,
                phone: formData.phone || '',
                address: formData.address || ''
            });

            console.log('📥 Register response:', response.data);

            if (response.data.success) {
                toast.success('Account created successfully! Please login.');
                navigate('/login');
            } else {
                toast.error(response.data.message || 'Registration failed');
            }
        } catch (error) {
            console.error('❌ Register error:', error);
            
            if (error.response?.status === 400) {
                toast.error(error.response.data.message || 'Invalid data');
            } else if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Registration failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.logo}>
                    <span style={styles.logoIcon}>🏦</span>
                    <h2 style={styles.title}>Create Account</h2>
                </div>
                <p style={styles.subtitle}>Register to start banking</p>
                
                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Full Name *</label>
                        <input
                            type="text"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            style={{
                                ...styles.input,
                                borderColor: errors.full_name ? '#dc3545' : '#ddd'
                            }}
                            placeholder="Enter your full name"
                            disabled={loading}
                        />
                        {errors.full_name && (
                            <span style={styles.errorText}>{errors.full_name}</span>
                        )}
                    </div>
                    
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Email Address *</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            style={{
                                ...styles.input,
                                borderColor: errors.email ? '#dc3545' : '#ddd'
                            }}
                            placeholder="name@gmail.com"
                            disabled={loading}
                        />
                        {errors.email && (
                            <span style={styles.errorText}>{errors.email}</span>
                        )}
                    </div>
                    
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Password *</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            style={{
                                ...styles.input,
                                borderColor: errors.password ? '#dc3545' : '#ddd'
                            }}
                            placeholder="Min 6 characters"
                            disabled={loading}
                        />
                        {errors.password && (
                            <span style={styles.errorText}>{errors.password}</span>
                        )}
                    </div>
                    
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Confirm Password *</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            style={{
                                ...styles.input,
                                borderColor: errors.confirmPassword ? '#dc3545' : '#ddd'
                            }}
                            placeholder="Confirm your password"
                            disabled={loading}
                        />
                        {errors.confirmPassword && (
                            <span style={styles.errorText}>{errors.confirmPassword}</span>
                        )}
                    </div>
                    
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Phone Number</label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            style={styles.input}
                            placeholder="Enter your phone number"
                            disabled={loading}
                        />
                    </div>
                    
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Address</label>
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            style={styles.input}
                            placeholder="Enter your address"
                            disabled={loading}
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        style={loading ? styles.buttonDisabled : styles.button} 
                        disabled={loading}
                    >
                        {loading ? (
                            <span style={styles.buttonContent}>
                                <span style={styles.buttonSpinner}></span>
                                Creating Account...
                            </span>
                        ) : (
                            'Create Account'
                        )}
                    </button>
                </form>
                
                <p style={styles.linkText}>
                    Already have an account? <Link to="/login" style={styles.link}>Login</Link>
                </p>
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
        maxWidth: '450px'
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
        gap: '14px'
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
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
        color: '#2d3748',
        width: '100%',
        boxSizing: 'border-box'
    },
    button: {
        padding: '14px 24px',
        backgroundColor: '#38a169',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        marginTop: '10px'
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
        marginTop: '10px'
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
    linkText: {
        textAlign: 'center',
        marginTop: '20px',
        fontSize: '14px',
        color: '#4a5568'
    },
    link: {
        color: '#4299e1',
        textDecoration: 'none',
        fontWeight: '500'
    },
    errorText: {
        color: '#dc3545',
        fontSize: '13px',
        marginTop: '3px'
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
        background-color: #2f855a !important;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(56, 161, 105, 0.3);
    }
`;
document.head.appendChild(styleSheet);

export default Register;