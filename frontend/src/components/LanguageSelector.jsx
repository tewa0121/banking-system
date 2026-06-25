import { useState, useEffect } from 'react';
import api from '../api/axiosConfig';

function LanguageSelector() {
    const [languages, setLanguages] = useState([]);
    const [currentLang, setCurrentLang] = useState('en');

    useEffect(() => {
        fetchLanguages();
        const savedLang = localStorage.getItem('language') || 'en';
        setCurrentLang(savedLang);
    }, []);

    const fetchLanguages = async () => {
        try {
            const response = await api.get('/languages/languages');
            if (response.data.success) {
                setLanguages(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch languages:', error);
        }
    };

    const changeLanguage = (code) => {
        setCurrentLang(code);
        localStorage.setItem('language', code);
        window.location.reload();
    };

    return (
        <div style={styles.container}>
            {languages.map((lang) => (
                <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    style={{
                        ...styles.button,
                        backgroundColor: currentLang === lang.code ? '#007bff' : 'transparent',
                        color: currentLang === lang.code ? 'white' : '#ccc'
                    }}
                    title={lang.name}
                >
                    {lang.flag}
                </button>
            ))}
        </div>
    );
}

const styles = {
    container: {
        display: 'flex',
        gap: '5px',
        alignItems: 'center',
        marginLeft: '10px'
    },
    button: {
        padding: '4px 8px',
        border: '1px solid #555',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px',
        transition: 'all 0.3s',
        background: 'transparent'
    }
};

export default LanguageSelector;