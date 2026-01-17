import React, { useState, useCallback, useEffect, useRef } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { ToastContext } from './ToastContextDef';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './useTheme';

export const ToastProvider = ({ children }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [queue, setQueue] = useState([]);
    const [activeToast, setActiveToast] = useState(null);
    const timerRef = useRef(null);

    // Smart duplicate detection - checks both active and queued toasts
    const isDuplicate = useCallback((message) => {
        if (activeToast?.message === message) return true;
        return queue.some(t => t.message === message);
    }, [activeToast, queue]);

    const showToast = useCallback((message, type = 'info', action = null) => {
        // Reject duplicates
        if (isDuplicate(message)) {
            return;
        }

        const id = Date.now().toString();
        const newToast = { id, message, type, action };

        setQueue(prev => [...prev, newToast]);
    }, [isDuplicate]);

    const removeToast = useCallback(() => {
        setActiveToast(null);
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    // Queue processor - shows next toast when current finishes
    useEffect(() => {
        if (!activeToast && queue.length > 0) {
            // Small delay between toasts for smooth transition
            const nextTimer = setTimeout(() => {
                const [nextToast, ...rest] = queue;
                setQueue(rest);
                setActiveToast(nextToast);

                // Auto-dismiss after 3.5 seconds
                timerRef.current = setTimeout(() => {
                    removeToast();
                }, 3500);
            }, 200);

            return () => clearTimeout(nextTimer);
        }
    }, [activeToast, queue, removeToast]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, removeToast }}>
            {children}

            {/* Dynamic Island Container */}
            <div style={{
                position: 'fixed',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10000,
                pointerEvents: 'none'
            }}>
                <AnimatePresence mode="wait">
                    {activeToast && (
                        <DynamicIslandToast
                            key={activeToast.id}
                            toast={activeToast}
                            onDismiss={removeToast}
                            isDark={isDark}
                        />
                    )}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

const DynamicIslandToast = ({ toast, onDismiss, isDark }) => {
    const getIcon = () => {
        switch (toast.type) {
            case 'success': return <CheckCircle size={20} />;
            case 'error': return <AlertCircle size={20} />;
            default: return <Info size={20} />;
        }
    };

    const getColors = () => {
        if (isDark) {
            switch (toast.type) {
                case 'success': return { bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.3)', icon: '#4ade80', text: '#fff' };
                case 'error': return { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)', icon: '#f87171', text: '#fff' };
                default: return { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)', icon: '#60a5fa', text: '#fff' };
            }
        } else {
            switch (toast.type) {
                case 'success': return { bg: 'rgba(255, 255, 255, 0.95)', border: 'rgba(34, 197, 94, 0.2)', icon: '#16a34a', text: '#166534' };
                case 'error': return { bg: 'rgba(255, 255, 255, 0.95)', border: 'rgba(239, 68, 68, 0.2)', icon: '#dc2626', text: '#991b1b' };
                default: return { bg: 'rgba(255, 255, 255, 0.95)', border: 'rgba(59, 130, 246, 0.2)', icon: '#2563eb', text: '#1e40af' };
            }
        }
    };

    const colors = getColors();

    return (
        <motion.div
            initial={{ y: -100, scale: 0.85, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: -50, scale: 0.9, opacity: 0 }}
            transition={{
                type: "spring",
                damping: 25,
                stiffness: 400,
                duration: 0.3
            }}
            onClick={onDismiss}
            style={{
                pointerEvents: 'auto',
                cursor: 'pointer',
                minWidth: '320px',
                maxWidth: '420px',
                padding: '14px 20px',
                borderRadius: '28px',
                background: colors.bg,
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: `1px solid ${colors.border}`,
                boxShadow: isDark
                    ? '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    : '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                userSelect: 'none'
            }}
        >
            {/* Icon */}
            <div style={{
                color: colors.icon,
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0
            }}>
                {getIcon()}
            </div>

            {/* Message */}
            <div style={{
                flex: 1,
                fontSize: '0.9rem',
                fontWeight: 500,
                color: colors.text,
                lineHeight: '1.4'
            }}>
                {toast.message}
            </div>

            {/* Action Button (if provided) */}
            {toast.action && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        toast.action.onClick();
                        onDismiss();
                    }}
                    style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: colors.icon,
                        textTransform: 'uppercase',
                        padding: '6px 12px',
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                        borderRadius: '16px',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        flexShrink: 0
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                    }}
                >
                    {toast.action.label}
                </button>
            )}

            {/* Close button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDismiss();
                }}
                style={{
                    padding: '4px',
                    borderRadius: '50%',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: colors.text,
                    opacity: 0.6,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'opacity 0.2s',
                    flexShrink: 0
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                onMouseLeave={(e) => e.currentTarget.style.opacity = 0.6}
            >
                <X size={16} strokeWidth={2.5} />
            </button>
        </motion.div>
    );
};
