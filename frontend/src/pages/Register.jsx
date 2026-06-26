import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axiosConfig';

function Register() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        address: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // ⭐ ኢሜይል ማረጋገጫ - @gmail.com ብቻ
    const validateEmail = (email) => {
        if (!email) return false;
        
        // ትክክለኛ የኢሜይል ቅርጸት መሆኑን ፈትሽ
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return false;
        }
        
        // ⭐ @gmail.com መሆኑን ፈትሽ
        if (!email.endsWith('@gmail.com')) {
            return false;
        }
        
        return true;
    };

    // ⭐ የይለፍ ቃል ማረጋገጫ
    const validatePassword = (password) => {
        if (password.length < 6) {
            return 'Password must be at least 6 characters';
        }
        
        const letterNumberRegex = /^[A-Za-z0-9]+$/;
        if (!letterNumberRegex.test(password)) {
            return 'Password must contain only letters and numbers';
        }
        
        if (!/[A-Za-z]/.test(password)) {
            return 'Password must contain at least one letter';
        }
        
        if (!/[0-9]/.test(password)) {
            return 'Password must contain at least one number';
        }
        
        return null;
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
        
        if (!formData.full_name) {
            newErrors.full_name = 'Full name is required';
        } else if (formData.full_name.length < 2) {
            newErrors.full_name = 'Full name must be at least 2 characters';
        }
        
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!validateEmail(formData.email)) {
            newErrors.email = 'Please use a valid Gmail address (e.g., name@gmail.com)';
        }
        
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else {
            const passwordError = validatePassword(formData.password);
            if (passwordError) {
                newErrors.password = passwordError;
            }
        }
        
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);

        try {
            const response = await api.post('/auth/register', {
                full_name: formData.full_name,
                email: formData.email,
                password: formData.password,
                phone: formData.phone,
                address: formData.address
            });
            
            if (response.data.success) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                toast.success('Registration successful!');
                navigate('/dashboard');
            }
        } catch (error) {
            // ⭐ ድጋሜ ኢሜል ከሆነ
            if (error.response?.data?.message === 'Email already registered') {
                toast.error('This email is already registered. Please use a different email.');
            } else {
                toast.error(error.response?.data?.message || 'Registration failed');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>Register</h2>
                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Full Name</label>
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
                            required
                        />
                        {errors.full_name && (
                            <span style={styles.errorText}>{errors.full_name}</span>
                        )}
                    </div>
                    
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            style={{
                                ...styles.input,
                                borderColor: errors.email ? '#dc3545' : '#ddd'
                            }}
                            placeholder="Enter your Gmail (name@gmail.com)"
                            required
                        />
                        {errors.email && (
                            <span style={styles.errorText}>{errors.email}</span>
                        )}
                        <span style={styles.hint}>Only Gmail addresses are accepted</span>
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
                            placeholder="Letters and numbers only (min 6)"
                            required
                        />
                        {errors.password && (
                            <span style={styles.errorText}>{errors.password}</span>
                        )}
                    </div>
                    
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Confirm Password</label>
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
                            required
                        />
                        {errors.confirmPassword && (
                            <span style={styles.errorText}>{errors.confirmPassword}</span>
                        )}
                    </div>
                    
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Phone (Optional)</label>
                        <input
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            style={styles.input}
                            placeholder="Enter your phone number"
                        />
                    </div>
                    
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Address (Optional)</label>
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            style={styles.input}
                            placeholder="Enter your address"
                        />
                    </div>
                    
                    <button type="submit" style={styles.button} disabled={loading}>
                        {loading ? 'Loading...' : 'Register'}
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
        backgroundColor: '#f5f5f5'
    },
    card: {
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '450px'
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
        fontSize: '16px',
        transition: 'border-color 0.3s'
    },
    button: {
        padding: '12px',
        backgroundColor: '#1976d2',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontSize: '16px',
        cursor: 'pointer',
        marginTop: '10px'
    },
    linkText: {
        textAlign: 'center',
        marginTop: '20px',
        color: '#666'
    },
    link: {
        color: '#1976d2',
        textDecoration: 'none'
    },
    errorText: {
        color: '#dc3545',
        fontSize: '13px',
        marginTop: '3px'
    },
    hint: {
        color: '#888',
        fontSize: '12px',
        marginTop: '3px'
    }
};

export default Register;