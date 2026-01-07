import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { useTheme } from '../context/useTheme';
import { useAuth } from '../context/useAuth';

const InstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isVisible, setIsVisible] = useState(() => {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        if (isStandalone) return false;

        const checkIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const checkSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        return (checkIOS || checkSafari);
    });
    const { theme } = useTheme();
    const { user } = useAuth();
    const isDark = theme === 'dark';

    const [isIOS] = useState(() => {
        const checkIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const checkSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        return (checkIOS || checkSafari) && !isStandalone;
    });

    useEffect(() => {

        const handler = (e) => {
            // Prevent Chrome 67 and later from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Show the prompt
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            // Should theoretically not happen for Android/Chrome unless clicked manually
            return;
        }

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        await deferredPrompt.userChoice;

        // We no longer need the prompt. Clear it and hide UI
        setDeferredPrompt(null);
        setIsVisible(false);
    };

    if (!isVisible || !user) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'calc(100% - 32px)',
            maxWidth: '360px', /* Smaller width */
            zIndex: 1000,
            backgroundColor: isDark ? 'rgba(44, 27, 24, 0.95)' : 'rgba(255, 248, 225, 0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            color: isDark ? '#FDFBF7' : '#3E2723',
            padding: '12px', /* Tighter padding */
            borderRadius: '20px',
            boxShadow: isDark ? '0 10px 40px rgba(0,0,0,0.6)' : '0 10px 40px rgba(62, 39, 35, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(62, 39, 35, 0.1)',
            animation: 'slideUp 0.6s cubic-bezier(0.22, 1, 0.36, 1)'
        }}>
            <style>
                {`
                    @keyframes slideUp {
                        from { transform: translate(-50%, 100px); opacity: 0; }
                        to { transform: translate(-50%, 0); opacity: 1; }
                    }
                `}
            </style>

            {/* Adaptive Icon */}
            <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FDFBF7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
                overflow: 'hidden'
            }}>
                <img
                    src={isDark ? "/logo-dark-transparent.png" : "/logo-light.png"}
                    alt="App Icon"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transform: 'scale(1.35)' /* Significant zoom to focus on "TCC" */
                    }}
                />
            </div>

            <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 2px', fontSize: '0.95rem', fontWeight: '700' }}>{isIOS ? 'Install for iOS' : 'Install App'}</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8, lineHeight: '1.2' }}>{isIOS ? 'Tap Share ⬆️ then "Add to Home"' : 'Quick access to dashboard.'}</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {!isIOS && (
                    <button
                        onClick={handleInstallClick}
                        className="btn btn-primary"
                        style={{
                            padding: '10px 20px',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            backgroundColor: isDark ? '#FFD700' : '#8B4513', // Adaptive: Gold on Dark, Brand Brown on Light
                            color: isDark ? '#3E2723' : '#FFFFFF', // Text: Chocolate on Dark, White on Light
                            border: 'none',
                            borderRadius: '50px', // Pill shape
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            boxShadow: isDark ? '0 4px 15px rgba(255, 215, 0, 0.3)' : '0 4px 15px rgba(62, 39, 35, 0.3)'
                        }}
                    >
                        Install Now
                    </button>
                )}

                <button
                    onClick={() => setIsVisible(false)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'inherit',
                        cursor: 'pointer',
                        padding: '8px',
                        opacity: 0.6
                    }}
                >
                    <X size={20} />
                </button>
            </div>
        </div>
    );
};

export default InstallPrompt;
