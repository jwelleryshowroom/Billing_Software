import React from 'react';
import { useTheme } from '../context/useTheme';
import { useAuth } from '../context/useAuth';
import { useInstall } from '../context/useInstall';
import { Settings as SettingsIcon, Layout, Smartphone, ArrowLeft } from 'lucide-react';

const Settings = ({ onClose }) => {
    const { dashboardMode, setDashboardMode } = useTheme();
    const { role: _role } = useAuth();
    const { deferredPrompt, promptInstall, isIOS, isStandalone } = useInstall();

    return (
        <div style={{ padding: '0 4px', height: '100%', overflowY: 'auto' }}>
            <div className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    {onClose && (
                        <button
                            onClick={onClose}
                            style={{
                                background: 'rgba(0,0,0,0.05)',
                                border: 'none',
                                color: 'var(--color-text-main)',
                                cursor: 'pointer',
                                padding: '8px',
                                borderRadius: '12px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
                            title="Back to Dashboard"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <h2 style={{ fontSize: '1.2rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                        <SettingsIcon size={20} /> App Settings
                    </h2>
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 600, marginBottom: '16px', color: 'var(--color-text-main)' }}>
                        Dashboard View Mode
                    </label>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        {/* Inline Mode Preview */}
                        <div
                            onClick={() => setDashboardMode('inline')}
                            style={{
                                cursor: 'pointer',
                                border: `2px solid ${dashboardMode === 'inline' ? 'var(--color-primary)' : 'transparent'}`,
                                borderRadius: '16px',
                                padding: '12px',
                                backgroundColor: 'var(--color-bg-secondary)',
                                transition: 'all 0.2s',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '10px', textAlign: 'center', color: dashboardMode === 'inline' ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                                <Layout size={16} style={{ display: 'inline', marginRight: '5px' }} /> Inline Form
                            </div>
                            {/* Wireframe Inline with animation */}
                            <div style={{
                                backgroundColor: 'var(--color-bg-surface)',
                                borderRadius: '8px',
                                padding: '8px',
                                height: '100px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px',
                                opacity: 0.8,
                                position: 'relative'
                            }}>
                                <div style={{ height: '20px', backgroundColor: 'var(--color-border)', borderRadius: '4px', width: '100%' }}></div>
                                <div className="wireframe-input" style={{ height: '12px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '4px', width: '80%' }}></div>
                                <div className="wireframe-input" style={{ height: '12px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '4px', width: '90%' }}></div>
                                <div style={{ height: '24px', backgroundColor: 'var(--color-primary)', borderRadius: '4px', width: '100%', marginTop: 'auto', opacity: 0.4 }}></div>

                                <style>{`
                                    @keyframes pulseInput {
                                        0%, 100% { opacity: 0.5; }
                                        50% { opacity: 1; }
                                    }
                                    .wireframe-input {
                                        animation: pulseInput 2s infinite ease-in-out;
                                    }
                                    .wireframe-input:nth-child(3) { animation-delay: 0.5s; }
                                `}</style>
                            </div>
                        </div>

                        {/* Popup Mode Preview */}
                        <div
                            onClick={() => setDashboardMode('popup')}
                            style={{
                                cursor: 'pointer',
                                border: `2px solid ${dashboardMode === 'popup' ? 'var(--color-primary)' : 'transparent'}`,
                                borderRadius: '16px',
                                padding: '12px',
                                backgroundColor: 'var(--color-bg-secondary)',
                                transition: 'all 0.2s',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '10px', textAlign: 'center', color: dashboardMode === 'popup' ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                                <Smartphone size={16} style={{ display: 'inline', marginRight: '5px' }} /> Popup Modal
                            </div>
                            {/* Wireframe Popup with animation */}
                            <div style={{
                                backgroundColor: 'var(--color-bg-surface)',
                                borderRadius: '8px',
                                padding: '8px',
                                height: '100px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px',
                                opacity: 0.8,
                                position: 'relative'
                            }}>
                                <div style={{ height: '20px', backgroundColor: 'var(--color-border)', borderRadius: '4px', width: '100%' }}></div>
                                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                                    <div className="wireframe-btn-green" style={{ backgroundColor: 'rgba(16, 185, 129, 0.4)', borderRadius: '4px' }}></div>
                                    <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', borderRadius: '4px' }}></div>
                                </div>

                                {/* The Popup Animation Overlay */}
                                <div className="wireframe-modal" style={{
                                    position: 'absolute',
                                    top: '20%', left: '10%', right: '10%', bottom: '10%',
                                    backgroundColor: 'var(--color-bg-surface)',
                                    borderRadius: '6px',
                                    border: '1px solid var(--color-border)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '6px',
                                    padding: '8px',
                                    zIndex: 10,
                                    transform: 'translateY(100%)',
                                    opacity: 0
                                }}>
                                    <div style={{ height: '8px', backgroundColor: 'var(--color-border)', borderRadius: '2px', width: '60%' }}></div>
                                    <div style={{ height: '15px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '2px', width: '100%' }}></div>
                                    <div style={{ height: '15px', backgroundColor: 'var(--color-primary)', borderRadius: '2px', width: '100%', marginTop: 'auto', opacity: 0.4 }}></div>
                                </div>

                                <style>{`
                                    @keyframes simulatePopup {
                                        0%, 10% { transform: translateY(40px); opacity: 0; }
                                        25%, 75% { transform: translateY(0); opacity: 1; }
                                        90%, 100% { transform: translateY(40px); opacity: 0; }
                                    }
                                    @keyframes simulateClick {
                                        0%, 10% { transform: scale(1); }
                                        15%, 20% { transform: scale(0.9); background-color: rgba(16, 185, 129, 0.8); }
                                        25%, 100% { transform: scale(1); }
                                    }
                                    .wireframe-modal {
                                        animation: simulatePopup 4s infinite cubic-bezier(0.34, 1.56, 0.64, 1);
                                    }
                                    .wireframe-btn-green {
                                        animation: simulateClick 4s infinite ease-out;
                                    }
                                `}</style>
                            </div>
                        </div>
                    </div>

                    <p style={{ marginTop: '20px', fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: '1.6', textAlign: 'center' }}>
                        {dashboardMode === 'inline'
                            ? "The form is always open for quick and easy writing."
                            : "Buttons open a popup form to keep your screen clean."}
                    </p>
                </div>



                {/* Manual Install Button (if not installed) */}
                {(!isStandalone) && (
                    <div className="card" style={{ marginTop: '20px', padding: '16px', backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <h3 style={{ fontSize: '1rem', margin: '0 0 4px', color: 'var(--color-text-main)' }}>Install App</h3>
                                <p style={{ fontSize: '0.8rem', margin: 0, color: 'var(--color-text-muted)' }}>
                                    {isIOS ? 'Add to Home Screen for the best experience.' : 'Install for quick access and offline mode.'}
                                </p>
                            </div>
                            <button
                                onClick={() => isIOS ? alert("To install on iOS: Tap the Share button ⬆️ and select 'Add to Home Screen'.") : promptInstall()}
                                disabled={!deferredPrompt && !isIOS}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: (!deferredPrompt && !isIOS) ? 'var(--color-text-muted)' : 'var(--color-primary)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    cursor: (!deferredPrompt && !isIOS) ? 'not-allowed' : 'pointer',
                                    opacity: (!deferredPrompt && !isIOS) ? 0.5 : 1
                                }}
                            >
                                {isIOS ? 'How to?' : 'Install'}
                            </button>
                        </div>
                    </div>
                )}

                <div style={{ padding: '24px', textAlign: 'center', opacity: 0.3 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>TCC App v1.0.6</div>
                    <div style={{ fontSize: '0.7rem' }}>© 2026 The Classic Confection</div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
