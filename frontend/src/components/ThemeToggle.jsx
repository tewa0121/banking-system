import { useTheme } from '../context/ThemeContext';

function ThemeToggle() {
    const { darkMode, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            style={{
                ...styles.button,
                backgroundColor: darkMode ? '#2a2a4a' : '#f0f0f0',
                color: darkMode ? '#ffffff' : '#333333',
                border: darkMode ? '1px solid #4a4a6a' : '1px solid #cccccc'
            }}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
            {darkMode ? '🌙 Dark' : '☀️ Light'}
        </button>
    );
}

const styles = {
    button: {
        padding: '6px 14px',
        borderRadius: '20px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: '500',
        transition: 'all 0.3s ease',
        border: 'none'
    }
};

export default ThemeToggle;