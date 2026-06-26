import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axiosConfig';

function NotificationBell() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        fetchNotifications();
        // Poll every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/notifications');
            if (response.data.success) {
                setNotifications(response.data.data || []);
                setUnreadCount(response.data.unreadCount || 0);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(notifications.map(n => 
                n.id === id ? { ...n, is_read: 1 } : n
            ));
            setUnreadCount(Math.max(0, unreadCount - 1));
        } catch (error) {
            toast.error('Failed to mark as read');
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(notifications.map(n => ({ ...n, is_read: 1 })));
            setUnreadCount(0);
            toast.success('All notifications marked as read');
        } catch (error) {
            toast.error('Failed to mark all as read');
        }
    };

    const deleteNotification = async (id) => {
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(notifications.filter(n => n.id !== id));
            if (notifications.find(n => n.id === id && !n.is_read)) {
                setUnreadCount(Math.max(0, unreadCount - 1));
            }
        } catch (error) {
            toast.error('Failed to delete notification');
        }
    };

    const getIcon = (type) => {
        switch(type) {
            case 'success': return '✅';
            case 'warning': return '⚠️';
            case 'error': return '❌';
            default: return 'ℹ️';
        }
    };

    const getColor = (type) => {
        switch(type) {
            case 'success': return '#28a745';
            case 'warning': return '#ffc107';
            case 'error': return '#dc3545';
            default: return '#007bff';
        }
    };

    return (
        <div style={styles.container} ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                style={styles.bellButton}
            >
                🔔
                {unreadCount > 0 && (
                    <span style={styles.badge}>{unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <div style={styles.dropdown}>
                    <div style={styles.dropdownHeader}>
                        <h4>Notifications</h4>
                        {unreadCount > 0 && (
                            <button onClick={markAllAsRead} style={styles.markAllBtn}>
                                Mark all as read
                            </button>
                        )}
                    </div>

                    {notifications.length === 0 ? (
                        <div style={styles.emptyState}>
                            <p>No notifications</p>
                        </div>
                    ) : (
                        <div style={styles.notificationList}>
                            {notifications.map((notif) => (
                                <div 
                                    key={notif.id} 
                                    style={{
                                        ...styles.notificationItem,
                                        backgroundColor: notif.is_read ? '#f8f9fa' : '#e3f2fd',
                                        borderLeft: `4px solid ${getColor(notif.type)}`
                                    }}
                                >
                                    <div style={styles.notificationContent}>
                                        <span style={styles.notifIcon}>
                                            {getIcon(notif.type)}
                                        </span>
                                        <div style={styles.notifText}>
                                            <div style={styles.notifTitle}>{notif.title}</div>
                                            <div style={styles.notifMessage}>{notif.message}</div>
                                            <div style={styles.notifTime}>
                                                {new Date(notif.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={styles.notifActions}>
                                        {!notif.is_read && (
                                            <button 
                                                onClick={() => markAsRead(notif.id)}
                                                style={styles.readBtn}
                                            >
                                                ✓
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => deleteNotification(notif.id)}
                                            style={styles.deleteBtn}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

const styles = {
    container: {
        position: 'relative',
        display: 'inline-block'
    },
    bellButton: {
        backgroundColor: 'transparent',
        border: 'none',
        fontSize: '24px',
        cursor: 'pointer',
        padding: '5px',
        position: 'relative',
        color: 'white'
    },
    badge: {
        position: 'absolute',
        top: '-5px',
        right: '-8px',
        backgroundColor: '#dc3545',
        color: 'white',
        borderRadius: '50%',
        padding: '2px 6px',
        fontSize: '11px',
        fontWeight: 'bold',
        minWidth: '18px',
        textAlign: 'center'
    },
    dropdown: {
        position: 'absolute',
        top: '45px',
        right: '0',
        width: '380px',
        maxHeight: '500px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 5px 20px rgba(0,0,0,0.2)',
        zIndex: 1000,
        overflow: 'hidden',
        border: '1px solid #eee'
    },
    dropdownHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px 20px',
        borderBottom: '1px solid #eee',
        backgroundColor: '#f8f9fa'
    },
    markAllBtn: {
        backgroundColor: 'transparent',
        border: 'none',
        color: '#007bff',
        cursor: 'pointer',
        fontSize: '12px'
    },
    notificationList: {
        maxHeight: '400px',
        overflowY: 'auto'
    },
    notificationItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 15px',
        borderBottom: '1px solid #eee',
        transition: 'background 0.2s'
    },
    notificationContent: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        flex: 1
    },
    notifIcon: {
        fontSize: '20px',
        marginTop: '2px'
    },
    notifText: {
        flex: 1
    },
    notifTitle: {
        fontWeight: '600',
        fontSize: '14px',
        color: '#333'
    },
    notifMessage: {
        fontSize: '13px',
        color: '#666',
        marginTop: '2px'
    },
    notifTime: {
        fontSize: '11px',
        color: '#999',
        marginTop: '4px'
    },
    notifActions: {
        display: 'flex',
        gap: '5px',
        alignItems: 'center'
    },
    readBtn: {
        backgroundColor: '#28a745',
        color: 'white',
        border: 'none',
        borderRadius: '50%',
        width: '22px',
        height: '22px',
        cursor: 'pointer',
        fontSize: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    deleteBtn: {
        backgroundColor: '#dc3545',
        color: 'white',
        border: 'none',
        borderRadius: '50%',
        width: '22px',
        height: '22px',
        cursor: 'pointer',
        fontSize: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    emptyState: {
        padding: '40px',
        textAlign: 'center',
        color: '#999'
    }
};

export default NotificationBell;