import React, { useState, useEffect } from 'react';
import { PlusCircle, MinusCircle, ShieldAlert } from 'lucide-react';
import { useTransactions } from '../context/useTransactions';
import { useAuth } from '../context/useAuth';
import { useTheme } from '../context/useTheme';

const TransactionForm = ({ initialType = 'sale', onSuccess, onInputFocus }) => {
    const { addTransaction, transactions } = useTransactions();
    const { role } = useAuth();
    const { theme } = useTheme();
    const [accessDenied, setAccessDenied] = useState(false);
    const [type, setType] = useState(initialType); // 'sale' or 'expense'
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [titleError, setTitleError] = useState('');
    const [shake, setShake] = useState(false);

    // Check if we are in popup mode (based on onSuccess presence)
    const isPopup = !!onSuccess;

    // Sync type if prop changes (e.g. re-opening modal with different type)
    useEffect(() => {
        setType(initialType);
    }, [initialType]);

    // Smart Description Logic 🧠
    useEffect(() => {
        if (!transactions || transactions.length === 0) {
            setSuggestions([]);
            return;
        }

        const history = transactions.filter(t => t.type === type);
        const counts = {};

        // 2. Build Frequency Map
        history.forEach(t => {
            if (t.description) {
                const desc = t.description.trim();
                if (desc) {
                    counts[desc] = (counts[desc] || 0) + 1;
                }
            }
        });

        // 3. Filter & Sort
        const inputLower = description.toLowerCase().trim();

        const sorted = Object.entries(counts)
            .filter(([desc]) => {
                if (!inputLower) return true;
                return desc.toLowerCase().includes(inputLower);
            })
            .sort((a, b) => b[1] - a[1])
            .map(entry => entry[0])
            .slice(0, 5);

        setSuggestions(sorted);
    }, [transactions, type, description]);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (role === 'guest') {
            setAccessDenied(true);
            return;
        }

        // Custom Validation
        if (!amount || isNaN(parseFloat(amount))) {
            setTitleError('Please enter a valid amount');
            setShake(true);
            setTimeout(() => setShake(false), 500); // Remove shake class after animation
            return;
        }

        addTransaction({
            type,
            amount: parseFloat(amount),
            description: description || (type === 'sale' ? 'Sale' : 'Expense'),
            date: new Date().toISOString()
        });

        setAmount('');
        setDescription('');
        setTitleError('');

        if (onSuccess) {
            onSuccess();
        }
    };

    // Styles for Inline Mode (Standard)
    const inlineTabContainerStyle = {
        display: 'flex',
        backgroundColor: 'var(--color-bg-secondary)',
        borderRadius: '100px',
        padding: '4px',
        marginBottom: '16px', // Reduced from 24px
        position: 'relative'
    };

    const inlineTabStyle = (isActive, type) => ({
        flex: 1,
        padding: '8px', // Reduced from 10px
        borderRadius: '100px',
        backgroundColor: isActive ? (type === 'sale' ? 'var(--color-success)' : 'var(--color-danger)') : 'transparent',
        color: isActive ? 'white' : 'var(--color-text-muted)',
        border: 'none',
        boxShadow: isActive ? (type === 'sale' ? '0 4px 12px rgba(16, 185, 129, 0.3)' : '0 4px 12px rgba(239, 68, 68, 0.3)') : 'none',
        fontSize: '0.9rem', // Reduced slightly
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: isActive ? 1 : 0
    });

    const inlineButtonStyle = {
        width: '100%',
        marginTop: '8px',
        backgroundColor: type === 'sale' ? 'var(--color-success)' : 'var(--color-danger)',
        color: 'white',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
        opacity: 1
    };

    // Styles for Popup Mode (Glassy)
    const popupTabContainerStyle = {
        display: 'flex',
        backgroundColor: 'var(--color-bg-glass-tab)',
        borderRadius: '100px',
        padding: '4px',
        marginBottom: '10px',
        position: 'relative',
        border: '1px solid var(--color-border)'
    };

    const popupTabStyle = (isActive, type) => ({
        flex: 1,
        padding: '8px',
        borderRadius: '100px',
        backgroundColor: isActive ? (type === 'sale' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)') : 'transparent',
        color: isActive ? (type === 'sale' ? 'var(--color-success)' : '#F43F5E') : 'var(--color-text-muted)',
        border: 'none',
        boxShadow: 'none',
        fontSize: '0.9rem',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: isActive ? 1 : 0
    });

    const glassInputStyle = {
        background: type === 'sale'
            ? 'linear-gradient(145deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.02))'
            : 'linear-gradient(145deg, rgba(244, 63, 94, 0.1), rgba(244, 63, 94, 0.02))',
        border: type === 'sale'
            ? '1px solid rgba(16, 185, 129, 0.2)'
            : '1px solid rgba(244, 63, 94, 0.2)',
        backdropFilter: 'blur(10px)',
        color: 'var(--color-text-main)',
        transition: 'all 0.3s ease'
    };

    const popupButtonStyle = {
        width: '100%',
        marginTop: '8px',
        background: type === 'sale'
            ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
            : 'linear-gradient(135deg, #FB7185 0%, #E11D48 100%)',
        color: 'white',
        boxShadow: type === 'sale'
            ? '0 4px 15px -3px rgba(16, 185, 129, 0.4)'
            : '0 4px 15px -3px rgba(225, 29, 72, 0.4)',
        border: 'none',
        fontSize: '1rem',
        letterSpacing: '0.5px'
    };

    return (
        <div className={isPopup ? "" : "card"} style={isPopup ? {
            marginBottom: 0,
            border: 'none',
            boxShadow: 'none',
            padding: 0,
            backgroundColor: 'transparent',
            position: 'relative'
        } : { marginBottom: '16px', padding: '16px', position: 'relative' }}>
            {/* Tab-style Toggles */}
            <div style={isPopup ? popupTabContainerStyle : inlineTabContainerStyle}>
                <button
                    type="button"
                    onClick={() => setType('sale')}
                    style={isPopup ? popupTabStyle(type === 'sale', 'sale') : inlineTabStyle(type === 'sale', 'sale')}
                >
                    <PlusCircle size={18} strokeWidth={2.5} /> Daily Sale
                </button>
                <button
                    type="button"
                    onClick={() => setType('expense')}
                    style={isPopup ? popupTabStyle(type === 'expense', 'expense') : inlineTabStyle(type === 'expense', 'expense')}
                >
                    <MinusCircle size={18} strokeWidth={2.5} /> Expense
                </button>
            </div>

            <form onSubmit={handleSubmit} noValidate autoComplete="off">
                {isPopup && (
                    <style>
                        {`
                            .glass-input::placeholder {
                                color: var(--color-text-muted);
                                opacity: 0.7;
                            }
                        `}
                    </style>
                )}
                <div className={`input-group ${shake ? 'shake' : ''}`} style={{ position: 'relative', marginBottom: isPopup ? '12px' : '16px' }}>
                    {titleError && (
                        <div className="modern-tooltip" style={{ bottom: '100%', marginBottom: '8px' }}>
                            {titleError}
                        </div>
                    )}
                    <label className="input-label" style={isPopup ? { color: 'var(--color-text-main)', marginBottom: '4px', fontSize: '0.85rem' } : { marginBottom: '4px', fontSize: '0.85rem' }}>Amount (₹)</label>
                    <input
                        type="text" // 'number' type triggers autofill strip on Chrome. 'text' + inputMode is suppressed.
                        name="trx_amt_x8z"
                        id="amount_field"
                        className={`input-field ${isPopup ? 'glass-input' : ''}`}
                        style={isPopup ? glassInputStyle : {}}
                        placeholder="0"
                        value={amount}
                        onChange={(e) => {
                            const val = e.target.value;
                            // Regex: Allow empty, numbers, and single decimal
                            if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                setAmount(val);
                                if (titleError) setTitleError('');
                            }
                        }}
                        required
                        autoFocus={isPopup}
                        onFocus={() => onInputFocus?.()}
                        inputMode="decimal" // Forces numeric keypad with dot
                        pattern="[0-9]*"   // iOS fallback hint
                        autoComplete="off"
                        role="presentation"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        data-form-type="other"
                    />
                </div>

                <div className="input-group" style={{ marginBottom: isPopup ? '12px' : '16px' }}>
                    <label className="input-label" style={isPopup ? { color: 'var(--color-text-main)' } : { marginBottom: '4px', fontSize: '0.85rem' }}>Description (Optional)</label>
                    <input
                        type="search" // Change type to 'search' sometimes helps as browsers don't autofill search bars with addresses
                        name="trx_desc_q2w" // Random name
                        id="desc_field"
                        className={`input-field ${isPopup ? 'glass-input' : ''}`}
                        style={isPopup ? glassInputStyle : {}}
                        placeholder={type === 'sale' ? "e.g. Morning Sales" : "e.g. Vegetables, Rent"}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        onFocus={() => onInputFocus?.()}
                        autoComplete="off"
                        aria-autocomplete="list" // Hint that we provide our own list (chips)
                        autoCorrect="on"   // Keep "Text" correction
                        spellCheck="true"  // Keep spellcheck
                    />
                    {/* Smart Chips 🧠 */}
                    {suggestions.length > 0 && (
                        <div className="chip-scroll-container" style={{
                            display: 'flex',
                            gap: '8px',
                            marginTop: '8px',
                            overflowX: 'auto',
                            paddingBottom: '4px',
                            msOverflowStyle: 'none',  // IE and Edge
                            scrollbarWidth: 'none'  // Firefox
                        }}>
                            <style>{`
                                .chip-scroll-container::-webkit-scrollbar {
                                    display: none;
                                }
                            `}</style>
                            {suggestions.map((s, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => setDescription(s)}
                                    style={{
                                        whiteSpace: 'nowrap',
                                        padding: '6px 12px',
                                        borderRadius: '16px',
                                        border: '1px solid var(--color-border)',
                                        backgroundColor: isPopup ? 'rgba(255,255,255,0.1)' : 'var(--color-bg-surface)',
                                        color: 'var(--color-text-secondary)',
                                        fontSize: '0.8rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        backdropFilter: isPopup ? 'blur(4px)' : 'none'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.transform = 'scale(1.05)';
                                        e.target.style.backgroundColor = type === 'sale' ? 'var(--color-success)' : 'var(--color-danger)';
                                        e.target.style.color = 'white';
                                        e.target.style.borderColor = type === 'sale' ? 'var(--color-success)' : 'var(--color-danger)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.transform = 'scale(1)';
                                        e.target.style.backgroundColor = isPopup ? 'rgba(255,255,255,0.1)' : 'var(--color-bg-surface)';
                                        e.target.style.color = 'var(--color-text-secondary)';
                                        e.target.style.borderColor = 'var(--color-border)';
                                    }}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    className="btn" // Keep generic btn class, apply overrides
                    style={isPopup ? popupButtonStyle : inlineButtonStyle}
                >
                    Add {type === 'sale' ? 'Sale' : 'Expense'}
                </button>
            </form>

            {/* Access Denied Overlay */}
            {accessDenied && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: theme === 'dark' ? 'rgba(20, 20, 30, 0.92)' : 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 20,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    borderRadius: isPopup ? '0' : '24px',
                    textAlign: 'center',
                    padding: '20px'
                }}>
                    <ShieldAlert size={40} className="text-secondary" style={{ marginBottom: '12px' }} />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '8px' }}>Access Denied</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                        You can view data, but you cannot add anything.
                    </p>
                    <button
                        type="button"
                        onClick={() => setAccessDenied(false)}
                        className="btn btn-primary"
                        style={{ padding: '8px 24px', borderRadius: '12px', fontSize: '0.9rem' }}
                    >
                        Close
                    </button>
                </div>
            )}
        </div>
    );
};

export default TransactionForm;
