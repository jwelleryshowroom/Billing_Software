import React, { useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { ToastContext } from './ToastContextDef';
import { triggerHaptic } from '../utils/haptics';

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const toastsRef = React.useRef(toasts);

    React.useEffect(() => {
        toastsRef.current = toasts;
    }, [toasts]);

    const showToast = useCallback((message, type = 'info', action = null) => {
        // Prevent Spams: If same message exists, don't show again
        if (toastsRef.current.some(t => t.message === message)) {
            return;
        }

        const id = Date.now().toString();
        const newToast = { id, message, type, action };

        setToasts(prev => [...prev, newToast]);

        // Auto-remove after 4 seconds (slightly longer for action)
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="toast-container">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className="toast-item"
                        style={{
                            backgroundColor: toast.type === 'error' ? '#FEF2F2' : toast.type === 'success' ? '#F0FDF4' : 'var(--color-bg-surface)',
                            color: toast.type === 'error' ? '#991B1B' : toast.type === 'success' ? '#166534' : 'var(--color-text-main)',
                            border: `1px solid ${toast.type === 'error' ? '#FCA5A5' : toast.type === 'success' ? '#86EFAC' : 'var(--color-border)'}`,
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                            {toast.type === 'success' && <CheckCircle size={20} className="text-success" />}
                            {toast.type === 'error' && <AlertCircle size={20} className="text-danger" />}
                            {toast.type === 'info' && <Info size={20} style={{ color: 'var(--color-primary)' }} />}
                            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{toast.message}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {toast.action && (
                                <button
                                    onClick={() => {
                                        toast.action.onClick();
                                        removeToast(toast.id);
                                    }}
                                    style={{
                                        fontSize: '0.8rem',
                                        fontWeight: 700,
                                        color: 'var(--color-primary)',
                                        textTransform: 'uppercase',
                                        padding: '4px 8px',
                                        backgroundColor: 'var(--color-bg-body)',
                                        borderRadius: 'var(--radius-sm)'
                                    }}
                                >
                                    {toast.action.label}
                                </button>
                            )}
                            <button
                                onClick={() => removeToast(toast.id)}
                                style={{
                                    padding: '6px',
                                    marginLeft: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: toast.type === 'error' ? 'rgba(153, 27, 27, 0.1)' : toast.type === 'success' ? 'rgba(22, 101, 52, 0.1)' : 'rgba(255, 255, 255, 0.1)',
                                    color: 'inherit',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    border: 'none',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = toast.type === 'error' ? 'rgba(153, 27, 27, 0.2)' : toast.type === 'success' ? 'rgba(22, 101, 52, 0.2)' : 'rgba(255, 255, 255, 0.2)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = toast.type === 'error' ? 'rgba(153, 27, 27, 0.1)' : toast.type === 'success' ? 'rgba(22, 101, 52, 0.1)' : 'rgba(255, 255, 255, 0.1)'}
                            >
                                <X size={16} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <style>{`
                .toast-container {
                    position: fixed;
                    z-index: 9999;
                    padding: 16px;
                    width: auto;
                    max-width: 400px;
                    pointer-events: none;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    
                    /* Desktop: Top Right */
                    top: 20px;
                    right: 20px;
                    left: auto;
                    bottom: auto;
                }

                .toast-item {
                    pointer-events: auto;
                    padding: 12px 16px;
                    border-radius: var(--radius-md);
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }

                @keyframes slideDown {
                    from { transform: translateY(-100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                @media (max-width: 768px) {
                    .toast-container {
                        /* Mobile: Top Center */
                        top: 20px;
                        left: 50%;
                        transform: translateX(-50%);
                        right: auto;
                        width: 90%;
                    }
                }
            `}</style>
        </ToastContext.Provider>
    );
};
