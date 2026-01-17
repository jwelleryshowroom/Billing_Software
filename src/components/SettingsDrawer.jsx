import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/useTheme';
import { useAuth } from '../context/useAuth';
import { useInstall } from '../context/useInstall';
import { useSettings } from '../context/SettingsContext';
import RoleInfoModal from './RoleInfoModal';
import { Settings as SettingsIcon, Layout, Trophy, Smartphone, MousePointer2, Eye, Smile, X, Monitor, Info, Database, Check } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { motion, AnimatePresence } from 'framer-motion';

const SettingsDrawer = () => {
    const { dashboardMode, setDashboardMode, theme } = useTheme(); // [MODIFIED] Get theme
    const isDark = theme === 'dark'; // [NEW] Derive isDark
    const { role: _role } = useAuth();
    const { deferredPrompt, promptInstall } = useInstall();
    const {
        menuBarMode, setMenuBarMode,
        iconStyle, setIconStyle,
        showMenuLabels, setShowMenuLabels,
        showMilestoneModal, setShowMilestoneModal,
        isSettingsOpen, closeSettings,
        openData
    } = useSettings();

    const [showRoleInfo, setShowRoleInfo] = useState(false);

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

    // Helper for subtle borders and backgrounds based on theme
    const borderColor = 'var(--color-border)';
    const glassBg = isDark ? 'rgba(9, 9, 11, 0.8)' : 'rgba(255, 255, 255, 0.8)';

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 20002, display: 'flex', justifyContent: 'flex-end' }}>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeSettings}
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(4px)',
                }}
            />

            {/* Drawer Panel */}
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                style={{
                    width: '100%',
                    maxWidth: '450px',
                    height: '100%',
                    // [MODIFIED] deep glass background
                    background: isDark ? 'rgba(9, 9, 11, 0.6)' : 'rgba(255, 255, 255, 0.65)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderLeft: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)'}`,
                    // [MODIFIED] Shadow on border as requested
                    boxShadow: isDark
                        ? '-5px 0 30px rgba(0,0,0,0.5), inset 1px 0 0 rgba(255,255,255,0.1)'
                        : '-5px 0 30px rgba(0,0,0,0.1), inset 1px 0 0 rgba(255,255,255,0.5)',
                    position: 'relative',
                    zIndex: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '24px',
                    borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'transparent', // Let parent glass show through
                    zIndex: 20
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            background: 'var(--color-primary)',
                            padding: '10px', borderRadius: '14px',
                            color: 'white', display: 'flex',
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
                        }}>
                            <SettingsIcon size={24} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--color-text-main)', letterSpacing: '-0.5px' }}>Settings</h2>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Preferences & Controls</p>
                        </div>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                            triggerHaptic('light');
                            closeSettings();
                        }}
                        style={{
                            background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                            border: 'none', cursor: 'pointer',
                            color: 'var(--color-text-main)', display: 'flex', padding: '8px', borderRadius: '50%'
                        }}
                    >
                        <X size={20} />
                    </motion.button>
                </div>

                {/* Content - Scrollable */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px', paddingBottom: '100px' }} className="hide-scrollbar">

                    {/* Premium Role Badge */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            triggerHaptic('light');
                            setShowRoleInfo(true);
                        }}
                        style={{
                            marginBottom: '32px',
                            padding: '24px',
                            // [MODIFIED] Subtle/Elegant Tint based on Role
                            background: _role === 'admin'
                                ? (isDark ? 'linear-gradient(135deg, rgba(234, 179, 8, 0.1) 0%, rgba(234, 179, 8, 0.03) 100%)' : 'linear-gradient(135deg, rgba(254, 240, 138, 0.3) 0%, rgba(254, 240, 138, 0.05) 100%)') // Subtle Gold
                                : (_role === 'staff'
                                    ? (isDark ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.03) 100%)' : 'linear-gradient(135deg, rgba(191, 219, 254, 0.3) 0%, rgba(191, 219, 254, 0.05) 100%)') // Subtle Blue
                                    : (isDark ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.1) 0%, rgba(244, 63, 94, 0.03) 100%)' : 'linear-gradient(135deg, rgba(254, 205, 211, 0.3) 0%, rgba(254, 205, 211, 0.05) 100%)')), // Subtle Pink
                            borderRadius: '24px',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.4)'}`,
                            position: 'relative',
                            overflow: 'hidden',
                            boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.05)',
                            cursor: 'pointer'
                        }}
                    >
                        {/* Holographic Shine Effect - Subtle */}
                        <div style={{
                            position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%',
                            background: 'linear-gradient(45deg, transparent 40%, rgba(255, 255, 255, 0.2) 45%, transparent 50%)',
                            transform: 'rotate(25deg)', pointerEvents: 'none', opacity: 0.5
                        }}></div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                            <div style={{
                                padding: '6px 12px', borderRadius: '20px',
                                background: _role === 'admin' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                color: _role === 'admin' ? (isDark ? '#facc15' : '#b45309') : (isDark ? '#60a5fa' : '#1d4ed8'),
                                fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.5px',
                                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`
                            }}>
                                {_role === 'admin' ? 'ADMIN ACCESS' : 'STAFF MEMBER'}
                            </div>
                            <Info size={18} color="var(--color-text-muted)" />
                        </div>

                        <div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Current Profile</div>
                            <div style={{
                                fontSize: '2rem',
                                fontWeight: 800,
                                background: isDark
                                    ? 'linear-gradient(90deg, var(--color-text-main), var(--color-text-muted))'
                                    : 'linear-gradient(90deg, var(--color-text-main), var(--color-text-muted))',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                letterSpacing: '-1px'
                            }}>
                                {_role === 'admin' ? 'Munna Bhai' : _role === 'staff' ? 'Circuit' : 'Mamu'}
                            </div>
                        </div>
                    </motion.div>

                    {/* Section Title */}
                    {/* Section Title */}
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-main)', marginBottom: '16px', opacity: 0.8 }}>Interface</h3>

                    {/* Dashboard View Mode */}
                    <div style={{ marginBottom: '32px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            {[
                                { id: 'inline', label: 'Inline Form', icon: <Layout size={20} />, text: 'Efficient & Fast' },
                                { id: 'popup', label: 'Popup Modal', icon: <Monitor size={20} />, text: 'Focused View' }
                            ].map((option) => (
                                <motion.div
                                    key={option.id}
                                    onClick={() => setDashboardMode(option.id)}
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    style={{
                                        border: `2px solid ${dashboardMode === option.id
                                            ? 'var(--color-primary)'
                                            : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.4)')}`,
                                        borderRadius: '20px',
                                        padding: '16px',
                                        cursor: 'pointer',
                                        // [MODIFIED] Subtle Tint for Selection
                                        background: dashboardMode === option.id
                                            ? (isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.08)') // Subtle Green Tint
                                            : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.4)'),
                                        backdropFilter: 'blur(12px)',
                                        WebkitBackdropFilter: 'blur(12px)',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.05)'
                                    }}
                                >
                                    <div style={{ marginBottom: '12px', color: dashboardMode === option.id ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                                        {option.icon}
                                    </div>
                                    <div style={{ fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '4px' }}>{option.label}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{option.text}</div>

                                    {/* Visual Indicator of Mode */}
                                    <div style={{
                                        marginTop: '12px', height: '40px', background: 'var(--color-bg-secondary)', borderRadius: '8px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5,
                                        border: `1px solid ${borderColor}`
                                    }}>
                                        {option.id === 'inline' ? (
                                            <div style={{ width: '80%', height: '4px', background: 'var(--color-text-muted)', borderRadius: '2px' }} />
                                        ) : (
                                            <div style={{ width: '20px', height: '24px', background: 'var(--color-text-muted)', borderRadius: '4px', border: '1px solid currentColor' }} />
                                        )}
                                    </div>

                                    {dashboardMode === option.id && (
                                        <div style={{
                                            position: 'absolute', top: '12px', right: '12px',
                                            background: 'var(--color-primary)', borderRadius: '50%',
                                            width: '20px', height: '20px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                        }}>
                                            <Check size={12} color="white" />
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>


                    {/* Icon Style */}
                    <div style={{ marginBottom: '32px' }}>
                        <h4 style={{ color: 'var(--color-text-main)', margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 700 }}>Icon Style</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <motion.div
                                onClick={() => setIconStyle('mono')}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    border: `2px solid ${iconStyle === 'mono'
                                        ? 'var(--color-primary)'
                                        : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.4)')}`,
                                    borderRadius: '16px',
                                    padding: '16px',
                                    cursor: 'pointer',
                                    background: iconStyle === 'mono'
                                        ? (isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.08)') // Subtle Green Tint
                                        : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.4)'),
                                    backdropFilter: 'blur(12px)',
                                    WebkitBackdropFilter: 'blur(12px)',
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.05)'
                                }}
                            >
                                <div style={{ fontSize: '1.4rem', filter: 'grayscale(100%)' }}>🍕</div>
                                <div>
                                    <div style={{ fontWeight: 600, color: 'var(--color-text-main)', fontSize: '0.9rem' }}>Mono</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Minimalist</div>
                                </div>
                            </motion.div>

                            <motion.div
                                onClick={() => setIconStyle('emoji')}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    border: `2px solid ${iconStyle === 'emoji'
                                        ? 'var(--color-primary)'
                                        : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.4)')}`,
                                    borderRadius: '16px',
                                    padding: '16px',
                                    cursor: 'pointer',
                                    background: iconStyle === 'emoji'
                                        ? (isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.08)') // Subtle Green Tint
                                        : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.4)'),
                                    backdropFilter: 'blur(12px)',
                                    WebkitBackdropFilter: 'blur(12px)',
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.05)'
                                }}
                            >
                                <div style={{ fontSize: '1.4rem' }}>🍕</div>
                                <div>
                                    <div style={{ fontWeight: 600, color: 'var(--color-text-main)', fontSize: '0.9rem' }}>Emoji</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Vibrant</div>
                                </div>
                            </motion.div>
                        </div>
                    </div>


                    {/* Switches */}
                    <div style={{
                        background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.4)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        borderRadius: '24px',
                        padding: '8px',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.4)'}`
                    }}>

                        {/* Menu Labels */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: `1px solid ${borderColor}` }}>
                            <div>
                                <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>Menu Labels</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Show text labels in navigation</div>
                            </div>
                            <div
                                onClick={() => setShowMenuLabels(!showMenuLabels)}
                                style={{
                                    width: '44px', height: '24px',
                                    background: showMenuLabels ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                    borderRadius: '12px',
                                    position: 'relative', cursor: 'pointer',
                                    transition: 'background 0.3s'
                                }}
                            >
                                <motion.div
                                    animate={{ x: showMenuLabels ? 22 : 2 }}
                                    style={{
                                        width: '20px', height: '20px', background: 'white', borderRadius: '50%',
                                        position: 'absolute', top: '2px',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Immersive Mode */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px' }}>
                            <div>
                                <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>Immersive Mode</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Auto-hide navigation bar</div>
                            </div>
                            <div
                                onClick={() => setMenuBarMode(menuBarMode === 'disappearing' ? 'sticky' : 'disappearing')}
                                style={{
                                    width: '44px', height: '24px',
                                    background: menuBarMode === 'disappearing' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                    borderRadius: '12px',
                                    position: 'relative', cursor: 'pointer',
                                    transition: 'background 0.3s'
                                }}
                            >
                                <motion.div
                                    animate={{ x: menuBarMode === 'disappearing' ? 22 : 2 }}
                                    style={{
                                        width: '20px', height: '20px', background: 'white', borderRadius: '50%',
                                        position: 'absolute', top: '2px',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Sales Popups */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderTop: `1px solid ${borderColor}` }}>
                            <div>
                                <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>Sales Popups</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Celebrate milestones with confetti</div>
                            </div>
                            <div
                                onClick={() => setShowMilestoneModal(!showMilestoneModal)}
                                style={{
                                    width: '44px', height: '24px',
                                    background: showMilestoneModal ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                    borderRadius: '12px',
                                    position: 'relative', cursor: 'pointer',
                                    transition: 'background 0.3s'
                                }}
                            >
                                <motion.div
                                    animate={{ x: showMilestoneModal ? 22 : 2 }}
                                    style={{
                                        width: '20px', height: '20px', background: 'white', borderRadius: '50%',
                                        position: 'absolute', top: '2px',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* [NEW] Manage Data Section */}
                    {_role === 'admin' && (
                        <div style={{ marginTop: '32px' }}>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-main)', marginBottom: '16px', opacity: 0.8 }}>System</h3>
                            <motion.div
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => {
                                    triggerHaptic('light');
                                    openData();
                                    closeSettings();
                                }}
                                style={{
                                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : borderColor}`,
                                    borderRadius: '16px',
                                    padding: '16px',
                                    cursor: 'pointer',
                                    background: isDark ? 'rgba(255,255,255,0.03)' : 'var(--color-bg-secondary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px'
                                }}
                            >
                                <div style={{
                                    padding: '10px',
                                    borderRadius: '12px',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    color: '#ef4444'
                                }}>
                                    <Database size={20} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>Manage Database</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Backup, Restore & Reset</div>
                                </div>
                            </motion.div>
                        </div>
                    )}


                    {/* Install App Link */}
                    {deferredPrompt && (
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            style={{ marginTop: '32px' }}
                        >
                            <button
                                onClick={promptInstall}
                                style={{
                                    width: '100%', padding: '16px', borderRadius: '16px',
                                    background: 'var(--color-primary)',
                                    color: 'white', border: 'none',
                                    fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    boxShadow: '0 4px 15px rgba(37, 99, 235, 0.3)'
                                }}
                            >
                                <Smartphone size={18} />
                                Install App
                            </button>
                        </motion.div>
                    )}

                    {/* Version Footer */}
                    <div style={{ textAlign: 'center', marginTop: '40px' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Classic Confection</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>v1.8.6 • Enterprise Edition</div>
                    </div>
                </div>
            </motion.div>

            <style>{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
            <RoleInfoModal isOpen={showRoleInfo} onClose={() => setShowRoleInfo(false)} />
        </div>
    );
};

export default SettingsDrawer;
