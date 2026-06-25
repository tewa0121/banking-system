import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axiosConfig';

function Profile() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [profile, setProfile] = useState(null);
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        address: ''
    });
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: ''
    });
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/users/profile');
            if (response.data.success) {
                setProfile(response.data.data);
                setFormData({
                    full_name: response.data.data.user.full_name || '',
                    phone: response.data.data.user.phone || '',
                    address: response.data.data.user.address || ''
                });
            }
        } catch (error) {
            toast.error('Failed to fetch profile');
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({
            ...passwordData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.put('/users/profile', formData);
            if (response.data.success) {
                toast.success('Profile updated successfully');
                fetchProfile();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Update failed');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.put('/users/change-password', passwordData);
            if (response.data.success) {
                toast.success('Password changed successfully');
                setPasswordData({ current_password: '', new_password: '' });
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Password change failed');
        } finally {
            setLoading(false);
        }
    };

    // ⭐ Profile Image Upload with better error handling
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) {
            toast.error('No file selected');
            return;
        }

        console.log('📤 File selected:', {
            name: file.name,
            type: file.type,
            size: file.size
        });

        // Check file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        // Check file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.error('Image size must be less than 2MB');
            return;
        }

        setUploading(true);
        const loadingToast = toast.loading('Uploading image...');

        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            
            reader.onload = async () => {
                try {
                    const base64Image = reader.result;
                    console.log('📤 Image encoded, length:', base64Image.length);
                    
                    const response = await api.put('/users/profile-image', {
                        profile_image: base64Image
                    });
                    
                    console.log('📥 Response:', response.data);
                    
                    if (response.data.success) {
                        toast.update(loadingToast, {
                            render: 'Profile image uploaded successfully!',
                            type: 'success',
                            isLoading: false,
                            autoClose: 3000
                        });
                        fetchProfile();
                    } else {
                        toast.update(loadingToast, {
                            render: response.data.message || 'Upload failed',
                            type: 'error',
                            isLoading: false,
                            autoClose: 3000
                        });
                    }
                } catch (err) {
                    console.error('❌ Upload error:', err);
                    console.error('❌ Error response:', err.response?.data);
                    toast.update(loadingToast, {
                        render: err.response?.data?.message || 'Failed to upload image',
                        type: 'error',
                        isLoading: false,
                        autoClose: 3000
                    });
                }
            };
            
            reader.onerror = (error) => {
                console.error('❌ FileReader error:', error);
                toast.update(loadingToast, {
                    render: 'Failed to read image file',
                    type: 'error',
                    isLoading: false,
                    autoClose: 3000
                });
            };
        } catch (error) {
            console.error('❌ Upload error:', error);
            toast.error('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>My Profile</h2>

            {/* ⭐ Profile Image Section */}
            <div style={styles.imageSection}>
                <div style={styles.imageContainer}>
                    {profile?.user?.profile_image ? (
                        <img 
                            src={profile.user.profile_image} 
                            alt="Profile" 
                            style={styles.profileImage}
                        />
                    ) : (
                        <div style={styles.placeholderImage}>
                            <span style={styles.placeholderText}>📷</span>
                        </div>
                    )}
                </div>
                <button 
                    onClick={triggerFileInput} 
                    style={styles.uploadButton}
                    disabled={uploading}
                >
                    {uploading ? 'Uploading...' : 'Upload Photo'}
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    style={styles.hiddenInput}
                />
            </div>

            {profile && (
                <div style={styles.card}>
                    <p><strong>Email:</strong> {profile.user.email}</p>
                    <p><strong>Role:</strong> {profile.user.role}</p>
                    <p><strong>Joined:</strong> {new Date(profile.user.created_at).toLocaleDateString()}</p>
                </div>
            )}

            <div style={styles.card}>
                <h3>Update Profile</h3>
                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Full Name</label>
                        <input
                            type="text"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            style={styles.input}
                            required
                        />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Phone</label>
                        <input
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            style={styles.input}
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
                        />
                    </div>
                    <button type="submit" style={styles.button} disabled={loading}>
                        {loading ? 'Saving...' : 'Update Profile'}
                    </button>
                </form>
            </div>

            <div style={styles.card}>
                <h3>Change Password</h3>
                <form onSubmit={handlePasswordSubmit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Current Password</label>
                        <input
                            type="password"
                            name="current_password"
                            value={passwordData.current_password}
                            onChange={handlePasswordChange}
                            style={styles.input}
                            required
                        />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>New Password</label>
                        <input
                            type="password"
                            name="new_password"
                            value={passwordData.new_password}
                            onChange={handlePasswordChange}
                            style={styles.input}
                            required
                            minLength="6"
                        />
                    </div>
                    <button type="submit" style={styles.button} disabled={loading}>
                        {loading ? 'Changing...' : 'Change Password'}
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
        marginBottom: '20px',
        color: '#333',
        textAlign: 'center'
    },
    imageSection: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '20px'
    },
    imageContainer: {
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        overflow: 'hidden',
        border: '3px solid #1976d2',
        marginBottom: '10px',
        backgroundColor: '#f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    profileImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover'
    },
    placeholderImage: {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '40px',
        color: '#999'
    },
    placeholderText: {
        fontSize: '50px'
    },
    uploadButton: {
        padding: '8px 20px',
        backgroundColor: '#1976d2',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px'
    },
    hiddenInput: {
        display: 'none'
    },
    card: {
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '20px'
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
        backgroundColor: '#1976d2',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontSize: '16px',
        cursor: 'pointer',
        marginTop: '10px'
    },
    loading: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '18px'
    }
};

export default Profile;