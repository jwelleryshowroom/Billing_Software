import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/useTheme';
import { useAuth } from '../context/useAuth';
import { useInstall } from '../context/useInstall';
import { useSettings } from '../context/SettingsContext';
import { Settings as SettingsIcon, Layout, Smartphone, MousePointer2, Eye, Smile, X, Monitor } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

const SettingsDrawer = () => {
    const { dashboardMode, setDashboardMode } = useTheme();
    const { role: _role } = useAuth();
    const { deferredPrompt, promptInstall } = useInstall();
    const {
        menuBarMode, setMenuBarMode,
        iconStyle, setIconStyle,
        showMenuLabels, setShowMenuLabels,
        hapticDebug, setHapticDebug,
        isSettingsOpen, closeSettings
    } = useSettings();

    // Prevent body scroll when open
    useEffect(() => {
        if (isSettingsOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isSettingsOpen]);

    if (!isSettingsOpen) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', justifyContent: 'flex-end' }}>
            {/* Backdrop */}
            <div
                onClick={closeSettings}
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(4px)',
                    animation: 'fadeIn 0.3s ease-out'
                }}
            />

            {/* Drawer Panel */}
            <div
                style={{
                    width: '100%',
                    maxWidth: '450px',
                    height: '100%',
                    background: 'var(--color-bg-surface)',
                    borderLeft: '1px solid var(--color-border)',
                    boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
                    position: 'relative',
                    zIndex: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'slideInRightDrawer 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    overflow: 'hidden'
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '24px',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'var(--color-bg-surface)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            background: 'var(--color-primary)',
                            padding: '8px', borderRadius: '12px',
                            color: 'white', display: 'flex'
                        }}>
                            <SettingsIcon size={24} />
                        </div>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>App Settings</h2>
                    </div>
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            closeSettings();
                        }}
                        style={{
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            color: 'var(--color-text-muted)', display: 'flex'
                        }}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }} className="hide-scrollbar">

                    {/* User Role Badge */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '32px',
                        padding: '20px',
                        backgroundColor: _role === 'admin' ? 'rgba(16, 185, 129, 0.1)' : _role === 'staff' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        borderRadius: '20px',
                        border: `1px solid ${_role === 'admin' ? 'rgba(16, 185, 129, 0.3)' : _role === 'staff' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '1px' }}>
                                Current Role
                            </div>
                            <div style={{
                                fontSize: '1.6rem',
                                fontWeight: 800,
                                marginTop: '4px',
                                color: _role === 'admin' ? 'var(--color-success)' : _role === 'staff' ? 'var(--color-primary)' : 'var(--color-danger)'
                            }}>
                                {_role === 'admin' ? 'Munna Bhai 🕶️' : _role === 'staff' ? 'Circuit 🔌' : 'Mamu 🤕'}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-main)', marginTop: '4px', fontStyle: 'italic', opacity: 0.8 }}>
                                {_role === 'admin' ? '(The Boss)' : _role === 'staff' ? '(Right Hand)' : '(Just Watching)'}
                            </div>
                        </div>
                    </div>

                    {/* Dashboard View Mode */}
                    <div className="setting-section" style={{ marginBottom: '32px' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', color: 'var(--color-text-main)' }}>Dashboard View Mode</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            {/* Inline Option */}
                            <div
                                onClick={() => {
                                    triggerHaptic('light');
                                    setDashboardMode('inline');
                                }}
                                style={{
                                    border: `2px solid ${dashboardMode === 'inline' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                    borderRadius: '16px',
                                    padding: '16px',
                                    cursor: 'pointer',
                                    background: dashboardMode === 'inline' ? 'rgba(34, 197, 94, 0.05)' : 'transparent',
                                    transition: 'all 0.2s',
                                    opacity: dashboardMode === 'inline' ? 1 : 0.7
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: dashboardMode === 'inline' ? 'var(--color-primary)' : 'var(--color-text-main)' }}>
                                    <Layout size={18} />
                                    <span style={{ fontWeight: 600 }}>Inline Form</span>
                                </div>
                                <div style={{ height: '60px', borderRadius: '8px', background: 'var(--color-bg-secondary)', display: 'flex', flexDirection: 'column', gap: '6px', padding: '8px' }}>
                                    <div style={{ width: '40%', height: '8px', background: 'var(--color-border)', borderRadius: '4px' }}></div>
                                    <div style={{ width: '100%', height: '24px', background: 'var(--color-primary)', borderRadius: '6px', opacity: 0.2 }}></div>
                                </div>
                            </div>

                            {/* Popup Option */}
                            <div
                                onClick={() => {
                                    triggerHaptic('light');
                                    setDashboardMode('popup');
                                }}
                                style={{
                                    border: `2px solid ${dashboardMode === 'popup' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                    borderRadius: '16px',
                                    padding: '16px',
                                    cursor: 'pointer',
                                    background: dashboardMode === 'popup' ? 'rgba(34, 197, 94, 0.05)' : 'transparent',
                                    transition: 'all 0.2s',
                                    opacity: dashboardMode === 'popup' ? 1 : 0.7
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: dashboardMode === 'popup' ? 'var(--color-primary)' : 'var(--color-text-main)' }}>
                                    <Monitor size={18} />
                                    <span style={{ fontWeight: 600 }}>Popup Modal</span>
                                </div>
                                <div style={{ height: '60px', borderRadius: '8px', background: 'var(--color-bg-secondary)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <div style={{
                                        width: '80%', height: '40px',
                                        background: 'var(--color-bg-surface)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '6px',
                                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                                        animation: dashboardMode === 'popup' ? 'popIn 2s infinite' : 'none'
                                    }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ width: '100%', height: '1px', background: 'var(--color-border)', marginBottom: '32px' }}></div>



                    {/* Icon Style */}
                    <div className="setting-section" style={{ marginBottom: '32px' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', color: 'var(--color-text-main)' }}>Icon Style</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div
                                onClick={() => setIconStyle('mono')}
                                style={{
                                    border: `2px solid ${iconStyle === 'mono' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                    borderRadius: '16px',
                                    padding: '16px',
                                    cursor: 'pointer',
                                    background: iconStyle === 'mono' ? 'rgba(34, 197, 94, 0.05)' : 'transparent'
                                }}
                            >
                                <div style={{ fontWeight: 600, color: iconStyle === 'mono' ? 'var(--color-primary)' : 'var(--color-text-main)' }}>Monochromatic</div>
                            </div>
                            <div
                                onClick={() => setIconStyle('emoji')}
                                style={{
                                    border: `2px solid ${iconStyle === 'emoji' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                    borderRadius: '16px',
                                    padding: '16px',
                                    cursor: 'pointer',
                                    background: iconStyle === 'emoji' ? 'rgba(34, 197, 94, 0.05)' : 'transparent'
                                }}
                            >
                                <div style={{ fontWeight: 600, color: iconStyle === 'emoji' ? 'var(--color-primary)' : 'var(--color-text-main)' }}>Modern Emoji</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ width: '100%', height: '1px', background: 'var(--color-border)', marginBottom: '32px' }}></div>

                    {/* Show Menu Labels */}
                    <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '4px' }}>Show Menu Labels</h3>
                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Hide text for a minimal look.</div>
                        </div>
                        <input
                            type="checkbox"
                            checked={showMenuLabels}
                            onChange={(e) => setShowMenuLabels(e.target.checked)}
                            style={{ width: '20px', height: '20px', accentColor: 'var(--color-primary)' }}
                        />
                    </div>

                    <div style={{ width: '100%', height: '1px', background: 'var(--color-border)', marginBottom: '32px' }}></div>

                    {/* Menu Bar Behavior */}
                    <div className="setting-section" style={{ marginBottom: '32px' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>Menu Bar Behavior</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div onClick={() => setMenuBarMode('sticky')} style={{ border: `2px solid ${menuBarMode === 'sticky' ? 'var(--color-primary)' : 'var(--color-border)'}`, borderRadius: '16px', padding: '16px', cursor: 'pointer' }}>Always Visible</div>
                            <div onClick={() => setMenuBarMode('disappearing')} style={{ border: `2px solid ${menuBarMode === 'disappearing' ? 'var(--color-primary)' : 'var(--color-border)'}`, borderRadius: '16px', padding: '16px', cursor: 'pointer' }}>Auto-Hide</div>
                        </div>
                    </div>

                    {/* Install App Link */}
                    {deferredPrompt && (
                        <div style={{ marginBottom: '32px' }}>
                            <button
                                onClick={promptInstall}
                                style={{
                                    width: '100%', padding: '16px', borderRadius: '16px',
                                    background: 'var(--color-primary)', color: 'white', border: 'none',
                                    fontWeight: 700, cursor: 'pointer'
                                }}
                            >
                                Install App to Home Screen
                            </button>
                        </div>
                    )}

                    {/* Version Footer */}
                    <div style={{ marginTop: 'auto', paddingTop: '20px', textAlign: 'center' }}>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                            The Classic Confection v1.5.0
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes slideInRightDrawer { from { transform: translateX(100%); } to { transform: translateX(0); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes popIn { 
                    0% { transform: scale(0.95); } 
                    50% { transform: scale(1.05); } 
                    100% { transform: scale(1); } 
                }
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

export default SettingsDrawer;
