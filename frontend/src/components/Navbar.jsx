import { Link } from 'react-router-dom';
import LanguageSelector from './LanguageSelector';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';
import SearchBar from './SearchBar';

function Navbar() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');

    if (!token) {
        return null;
    }

    return (
        <nav style={styles.nav}>
            <div style={styles.container}>
                <Link to="/dashboard" style={styles.logo} className="nav-logo">
                    🏦 Banking System
                </Link>
                <div style={styles.links}>
                    <SearchBar />
                    
                    {/* ⭐ ሁሉም አገናኞች ክላስ አላቸው */}
                    <Link to="/dashboard" style={styles.link} className="nav-link">Dashboard</Link>
                    <Link to="/deposit" style={styles.link} className="nav-link">Deposit</Link>
                    <Link to="/withdraw" style={styles.link} className="nav-link">Withdraw</Link>
                    <Link to="/transfer" style={styles.link} className="nav-link">Transfer</Link>
                    <Link to="/external-transfer" style={styles.link} className="nav-link">🏦 External</Link>
                    <Link to="/interest" style={styles.link} className="nav-link">Interest</Link>
                    <Link to="/reports" style={styles.link} className="nav-link">📊 Reports</Link>
                    
                    {user.role === 'admin' && (
                        <>
                            <Link to="/admin" style={styles.adminLink} className="nav-admin">👑 Admin</Link>
                            <Link to="/settings" style={styles.link} className="nav-link">⚙️ Settings</Link>
                        </>
                    )}
                    
                    <Link to="/profile" style={styles.link} className="nav-link">👤 Profile</Link>
                    
                    <div className="nav-icon">
                        <NotificationBell />
                    </div>
                    <div className="nav-icon">
                        <ThemeToggle />
                    </div>
                    <div className="nav-icon">
                        <LanguageSelector />
                    </div>
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
        boxSizing: 'border-box',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
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
        padding: '8px 14px',
        borderRadius: '6px',
        fontSize: '14px',
        whiteSpace: 'nowrap'
    },
    adminLink: {
        color: '#ffd700',
        textDecoration: 'none',
        padding: '8px 14px',
        borderRadius: '6px',
        fontSize: '14px',
        whiteSpace: 'nowrap',
        fontWeight: 'bold',
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        border: '1px solid rgba(255, 215, 0, 0.2)'
    }
};

export default Navbar;