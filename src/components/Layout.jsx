import React, { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { useTheme } from '../context/useTheme';
import { LogOut, User, Settings, Database } from 'lucide-react';

const Header = ({ setCurrentView }) => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [showMenu, setShowMenu] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);

    React.useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    setDeferredPrompt(null);
                }
            });
        }
    };

    return (
        <header style={{
            padding: '8px 0', // Reduced from 16px
            marginBottom: '4px', // Reduced from 10px
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0 // Prevent header from shrinking
        }}>
            <div>
                <h1 style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: 'var(--color-primary)',
                    lineHeight: 1.2,
                    fontFamily: '"Playfair Display", serif',
                    letterSpacing: '-0.5px'
                }}>
                    The Classic Confection
                </h1>
                <p style={{
                    color: 'var(--color-text-muted)',
                    fontSize: '0.8rem',
                    margin: 0,
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                }}>
                    Sales & Expense Tracker
                </p>
            </div>

            <style>{`
                .header-btn {
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .header-btn:hover {
                    transform: scale(1.15);
                    z-index: 20;
                }
                .header-btn:active { transform: scale(0.95); }
                
                /* Text/Emoji Glow */
                .btn-text-glow:hover {
                    text-shadow: 0 0 12px var(--hover-glow);
                }
                
                /* Icon Glow */
                .btn-icon-glow:hover svg {
                    filter: drop-shadow(0 0 6px var(--hover-glow));
                }
            `}</style>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', margin: '-12px', position: 'relative', zIndex: 60 }}>
                <button
                    onClick={toggleTheme}
                    className="header-btn btn-text-glow"
                    style={{
                        '--hover-glow': theme === 'dark' ? '#FFD700' : '#F59E0B',
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                        border: '1px solid var(--color-border)',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.3rem'
                    }}
                    title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    {theme === 'dark' ? '🌙' : '☀️'}
                </button>
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="header-btn btn-icon-glow"
                        style={{
                            '--hover-glow': 'rgba(255,255,255,0.8)',
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--color-primary)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            border: 'none',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}
                    >
                        <User size={20} />
                    </button>

                    {showMenu && (
                        <div className="glass" style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: '8px',
                            borderRadius: 'var(--radius-md)',
                            boxShadow: 'var(--shadow-md)',
                            padding: '8px',
                            width: '200px',
                            zIndex: 1000
                        }}>
                            <div style={{ padding: '8px', borderBottom: '1px solid var(--color-border)', marginBottom: '8px' }}>
                                <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{user?.displayName || 'User'}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
                            </div>

                            {deferredPrompt && (
                                <button
                                    onClick={handleInstallClick}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        color: 'var(--color-primary)',
                                        fontSize: '0.9rem',
                                        borderRadius: 'var(--radius-sm)',
                                        justifyContent: 'flex-start',
                                        marginBottom: '4px',
                                        fontWeight: 600
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-body)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                        <polyline points="7 10 12 15 17 10"></polyline>
                                        <line x1="12" y1="15" x2="12" y2="3"></line>
                                    </svg>
                                    Install App
                                </button>
                            )}

                            <button
                                onClick={() => {
                                    setCurrentView('settings');
                                    setShowMenu(false);
                                }}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    color: 'var(--color-text-main)',
                                    fontSize: '0.9rem',
                                    borderRadius: 'var(--radius-sm)',
                                    justifyContent: 'flex-start',
                                    marginBottom: '4px'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-body)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <Settings size={16} />
                                App Settings
                            </button>

                            <button
                                onClick={() => {
                                    setCurrentView('data');
                                    setShowMenu(false);
                                }}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    color: 'var(--color-text-main)',
                                    fontSize: '0.9rem',
                                    borderRadius: 'var(--radius-sm)',
                                    justifyContent: 'flex-start',
                                    marginBottom: '4px'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-body)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <Database size={16} />
                                Manage Data
                            </button>

                            <button
                                onClick={logout}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    color: 'var(--color-danger)',
                                    fontSize: '0.9rem',
                                    borderRadius: 'var(--radius-sm)',
                                    justifyContent: 'flex-start'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-body)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <LogOut size={16} /> Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

const Layout = ({ children, setCurrentView }) => {
    return (
        <div className="container">
            <Header setCurrentView={setCurrentView} />
            <main style={{
                flex: 1,
                minHeight: 0, // Critical for nested scroll
                overflow: 'hidden', // Contain scrolling to children
                display: 'flex',
                flexDirection: 'column'
            }}>
                {children}
            </main>
        </div>
    );
};

export default Layout;
