import { Link } from 'react-router-dom';
import LanguageSelector from './LanguageSelector';

function Navbar() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');

    if (!token) {
        return null;
    }

    return (
        <nav style={styles.nav}>
            <div style={styles.container}>
                <Link to="/dashboard" style={styles.logo}>
                    🏦 Banking System
                </Link>
                <div style={styles.links}>
                    <Link to="/dashboard" style={styles.link}>Dashboard</Link>
                    <Link to="/deposit" style={styles.link}>Deposit</Link>
                    <Link to="/withdraw" style={styles.link}>Withdraw</Link>
                    <Link to="/transfer" style={styles.link}>Transfer</Link>
                    <Link to="/external-transfer" style={styles.link}>🏦 External</Link>
                    <Link to="/interest" style={styles.link}>Interest</Link>
                    
                    {/* ⭐ Reports - ለሁሉም ተጠቃሚዎች */}
                    <Link to="/reports" style={styles.link}>📊 Reports</Link>
                    
                    {/* ⭐ Admin እና Settings - ለአስተዳዳሪ ብቻ */}
                    {user.role === 'admin' && (
                        <>
                            <Link to="/admin" style={{...styles.link, color: '#ffd700', fontWeight: 'bold'}}>
                                👑 Admin
                            </Link>
                            <Link to="/settings" style={styles.link}>⚙️ Settings</Link>
                        </>
                    )}
                    
                    <Link to="/profile" style={styles.link}>👤 Profile</Link>
                    <LanguageSelector />
                </div>
            </div>
        </nav>
    );
}

const styles = {
    nav: {
        backgroundColor: '#2c3e50',
        padding: '15px 20px',
        marginBottom: '20px',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        width: '100%',
        boxSizing: 'border-box'
    },
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px'
    },
    logo: {
        color: 'white',
        fontSize: '20px',
        textDecoration: 'none',
        fontWeight: 'bold',
        whiteSpace: 'nowrap'
    },
    links: {
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
        flexWrap: 'wrap',
        justifyContent: 'flex-end'
    },
    link: {
        color: 'white',
        textDecoration: 'none',
        padding: '6px 10px',
        borderRadius: '4px',
        transition: 'background 0.3s',
        fontSize: '13px',
        whiteSpace: 'nowrap'
    }
};

export default Navbar;