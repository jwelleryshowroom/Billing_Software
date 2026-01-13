import React, { useEffect, useState, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';

const HapticHUD = () => {
    const { hapticDebug } = useSettings();
    const [lastHaptic, setLastHaptic] = useState(null);
    const timeoutRef = useRef(null);

    useEffect(() => {
        const handleHaptic = (e) => {
            if (!hapticDebug) return;

            setLastHaptic(e.detail);

            // Clear existing timeout
            if (timeoutRef.current) clearTimeout(timeoutRef.current);

            // Hide after 3 seconds
            timeoutRef.current = setTimeout(() => {
                setLastHaptic(null);
            }, 3000);
        };

        window.addEventListener('haptic-triggered', handleHaptic);
        return () => {
            window.removeEventListener('haptic-triggered', handleHaptic);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [hapticDebug]);

    if (!hapticDebug || !lastHaptic) return null;

    const patternString = Array.isArray(lastHaptic.pattern)
        ? `[${lastHaptic.pattern.join(', ')}]`
        : `${lastHaptic.pattern}ms`;

    return (
        <div style={{
            position: 'fixed',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100000,
            background: 'rgba(0, 0, 0, 0.85)',
            color: '#00FF00',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontFamily: 'monospace',
            border: '1px solid #00FF00',
            boxShadow: '0 4px 12px rgba(0,255,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            pointerEvents: 'none',
            animation: 'slideInDownHUD 0.3s ease-out'
        }}>
            <span style={{ opacity: 0.7 }}>📳 HAPTIC:</span>
            <span style={{ fontWeight: 800 }}>{lastHaptic.type.toUpperCase()}</span>
            <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                {patternString}
            </span>

            <style>{`
                @keyframes slideInDownHUD {
                    from { transform: translate(-50%, -100%); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default HapticHUD;
