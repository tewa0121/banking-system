import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axiosConfig';

function SearchBar() {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const searchRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            if (query.length >= 2) {
                performSearch();
            } else {
                setResults(null);
                setIsOpen(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounce);
    }, [query]);

    const performSearch = async () => {
        if (query.length < 2) return;

        setLoading(true);
        try {
            const response = await api.get(`/search/global?query=${encodeURIComponent(query)}`);
            if (response.data.success) {
                setResults(response.data.data);
                setIsOpen(true);
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleResultClick = (type, id) => {
        setIsOpen(false);
        setQuery('');
        setResults(null);

        if (type === 'user') {
            navigate(`/admin/users/${id}`);
        } else if (type === 'account') {
            navigate(`/admin/accounts/${id}`);
        } else if (type === 'transaction') {
            navigate(`/admin/transactions/${id}`);
        }
    };

    return (
        <div style={styles.container} ref={searchRef}>
            <div style={styles.searchBox}>
                <span style={styles.icon}>🔍</span>
                <input
                    type="text"
                    placeholder="Search users, accounts, transactions..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length >= 2 && setIsOpen(true)}
                    style={styles.input}
                />
                {loading && <span style={styles.loading}>...</span>}
            </div>

            {isOpen && results && (
                <div style={styles.dropdown}>
                    {/* Users */}
                    {results.users && results.users.length > 0 && (
                        <div style={styles.section}>
                            <div style={styles.sectionTitle}>👤 Users</div>
                            {results.users.map((user) => (
                                <div
                                    key={user.id}
                                    style={styles.resultItem}
                                    onClick={() => handleResultClick('user', user.id)}
                                >
                                    <div style={styles.resultName}>{user.full_name}</div>
                                    <div style={styles.resultEmail}>{user.email}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Accounts */}
                    {results.accounts && results.accounts.length > 0 && (
                        <div style={styles.section}>
                            <div style={styles.sectionTitle}>🏦 Accounts</div>
                            {results.accounts.map((account) => (
                                <div
                                    key={account.id}
                                    style={styles.resultItem}
                                    onClick={() => handleResultClick('account', account.id)}
                                >
                                    <div style={styles.resultName}>{account.account_number}</div>
                                    <div style={styles.resultEmail}>Owner: {account.owner}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Transactions */}
                    {results.transactions && results.transactions.length > 0 && (
                        <div style={styles.section}>
                            <div style={styles.sectionTitle}>📊 Transactions</div>
                            {results.transactions.map((tx) => (
                                <div
                                    key={tx.id}
                                    style={styles.resultItem}
                                    onClick={() => handleResultClick('transaction', tx.id)}
                                >
                                    <div style={styles.resultName}>
                                        {tx.transaction_type} - {tx.amount} ETB
                                    </div>
                                    <div style={styles.resultEmail}>{tx.description}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!results.users?.length && !results.accounts?.length && !results.transactions?.length && (
                        <div style={styles.emptyState}>
                            <p>No results found for "{query}"</p>
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
        display: 'inline-block',
        width: '300px'
    },
    searchBox: {
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: '20px',
        padding: '8px 15px',
        border: '1px solid rgba(255,255,255,0.2)',
        transition: 'all 0.3s'
    },
    icon: {
        color: '#999',
        marginRight: '8px'
    },
    input: {
        background: 'transparent',
        border: 'none',
        color: 'white',
        outline: 'none',
        width: '100%',
        fontSize: '14px'
    },
    loading: {
        color: '#999',
        fontSize: '14px',
        marginLeft: '5px'
    },
    dropdown: {
        position: 'absolute',
        top: '45px',
        left: '0',
        right: '0',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 5px 20px rgba(0,0,0,0.2)',
        maxHeight: '400px',
        overflowY: 'auto',
        zIndex: 1000,
        border: '1px solid #eee'
    },
    section: {
        padding: '10px 0',
        borderBottom: '1px solid #eee'
    },
    sectionTitle: {
        padding: '5px 15px',
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#666',
        textTransform: 'uppercase'
    },
    resultItem: {
        padding: '8px 15px',
        cursor: 'pointer',
        transition: 'background 0.2s',
        borderBottom: '1px solid #f5f5f5'
    },
    resultName: {
        fontSize: '14px',
        fontWeight: '500',
        color: '#333'
    },
    resultEmail: {
        fontSize: '12px',
        color: '#888'
    },
    emptyState: {
        padding: '30px',
        textAlign: 'center',
        color: '#999'
    }
};

export default SearchBar;