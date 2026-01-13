import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useInstall } from '../context/useInstall';
import { triggerHaptic } from '../utils/haptics';

const Modal = ({ isOpen, onClose, title, children, zIndex = 10000 }) => {
    const { isStandalone } = useInstall();
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: zIndex,
            display: 'flex',
            alignItems: 'center', // Default center
            justifyContent: 'center',
            padding: '20px',
            // Mobile Specific Overrides via Class/Style
        }} className="modal-overlay">
            <style>{`
                .modal-overlay {
                    align-items: center;
                }
                @media (max-width: 600px) {
                    .modal-overlay {
                        align-items: flex-start !important; /* Top aligned */
                        padding-top: ${isStandalone ? '50px' : '10px'} !important; /* PWA: 50px, Web: 10px */
                    }
                }
            `}</style>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(4px)',
                    animation: 'fadeIn 0.2s ease-out'
                }}
            />

            {/* Content */}
            <div className="modal-content" style={{
                position: 'relative',
                width: '100%',
                maxWidth: '450px',
                backgroundColor: 'var(--color-bg-surface-transparent)',
                borderRadius: '24px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                border: '1px solid var(--color-border)',
                animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '95vh', // Increased max-height to fit more content
                backdropFilter: 'blur(12px)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '12px 20px', // Compact Header
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid var(--color-border)',
                    flexShrink: 0 // Prevent header from shrinking
                }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: 'var(--color-text-main)' }}>
                        {title}
                    </h2>
                    <button
                        onClick={() => {
                            triggerHaptic('hover');
                            onClose();
                        }}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--color-text-muted)',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                        }}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body - SCROLLABLE */}
                <div style={{
                    padding: '10px 20px',
                    overflowY: 'auto', // ENABLE SCROLLING
                    overscrollBehavior: 'contain',
                    flex: 1 // Take remaining height
                }}>
                    {children}
                </div>
            </div>

            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                /* Mobile Bottom Sheet Styles */
                
                /* Mobile Bottom Sheet Styles REMOVED in favor of Top Align */
                
            `}</style>
        </div>,
        document.body
    );
};

export default Modal;
