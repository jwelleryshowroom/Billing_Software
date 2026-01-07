import React, { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { useTheme } from '../context/useTheme';
import bgImage from '../assets/bakery_bg.png';

const Login = () => {
    const { login } = useAuth();
    const { theme } = useTheme();
    const [error, setError] = useState('');
    const isDark = theme === 'dark';

    const handleLogin = async () => {
        try {
            setError('');
            await login();
        } catch (err) {
            console.error(err);
            setError('Failed to sign in. Please check your internet or configuration.');
        }
    };

    return (
        <div style={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDark ? '#1a1a1a' : '#f5f1ed',
            backgroundImage: `url(${bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative'
        }}>
            {/* Theme-Adaptive Overlay */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(3px)'
            }}></div>

            <div className="card" style={{
                maxWidth: '420px',
                width: '90%',
                position: 'relative',
                zIndex: 10,
                backgroundColor: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '24px',
                padding: '40px 30px',
                boxShadow: isDark ? '0 20px 25px -5px rgba(0, 0, 0, 0.5)' : '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                textAlign: 'center',
                animation: 'fadeIn 0.6s ease-out',
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)'
            }}>
                <div style={{ marginBottom: '24px' }}>
                    <div style={{
                        fontSize: '2rem',
                        fontFamily: '"Playfair Display", serif',
                        fontWeight: 700,
                        color: isDark ? '#E0E0E0' : '#4a3b32',
                        lineHeight: 1.2,
                        marginBottom: '8px'
                    }}>
                        The Classic<br />Confection
                    </div>
                    <div style={{
                        color: isDark ? '#A0A0A0' : '#8c7e72',
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '2px'
                    }}>
                        Sales & Expense Tracker
                    </div>
                </div>

                <div style={{
                    height: '1px',
                    width: '60px',
                    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb',
                    margin: '0 auto 30px'
                }}></div>

                {error && (
                    <div style={{
                        backgroundColor: isDark ? 'rgba(220, 38, 38, 0.2)' : '#fee2e2',
                        color: isDark ? '#fca5a5' : '#991b1b',
                        padding: '12px',
                        borderRadius: '12px',
                        marginBottom: '24px',
                        fontSize: '0.9rem',
                        border: isDark ? '1px solid rgba(220, 38, 38, 0.3)' : '1px solid #fecaca'
                    }}>
                        {error}
                    </div>
                )}

                <button
                    onClick={handleLogin}
                    className="btn"
                    style={{
                        width: '100%',
                        backgroundColor: isDark ? '#2C2C2C' : '#ffffff',
                        color: isDark ? '#E0E0E0' : '#374151',
                        border: isDark ? '1px solid #444' : '1px solid #e5e7eb',
                        padding: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        borderRadius: '50px',
                        fontSize: '1rem',
                        fontWeight: 500,
                        transition: 'all 0.2s ease',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = isDark ? '#383838' : '#f9fafb';
                        e.currentTarget.style.borderColor = isDark ? '#555' : '#d1d5db';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = isDark ? '#2C2C2C' : '#ffffff';
                        e.currentTarget.style.borderColor = isDark ? '#444' : '#e5e7eb';
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                </button>
            </div>
        </div>
    );
};

export default Login;
