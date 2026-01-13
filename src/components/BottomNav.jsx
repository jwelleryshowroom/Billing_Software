import React, { useRef, useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, ShoppingBag, UtensilsCrossed } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../context/useTheme';

const BottomNav = () => {
    const { menuBarMode, iconStyle, showMenuLabels } = useSettings();
    const { theme } = useTheme();
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [isHovered, setIsHovered] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Config
    const baseSize = 48;
    const dockHeight = 64;
    const distanceLimit = 240;
    const scaleFactor = isMobile ? 1.5 : 2.4; // Slightly increased for mobile visibility
    const smoothing = isMobile ? 0.2 : 0.15; // Snappier on mobile

    const mouseX = useRef(null);
    const dockRef = useRef(null);
    const rafRef = useRef(null);
    const currentSizes = useRef([]);

    // Track hovered item index for tooltip
    const [hoveredIndex, setHoveredIndex] = useState(null);

    const navItems = [
        { path: '/', icon: LayoutDashboard, emoji: '🏠', label: 'Home' },
        { path: '/billing', icon: Receipt, emoji: '🧾', label: 'Billing' },
        { path: '/orders', icon: ShoppingBag, emoji: '🛍️', label: 'Orders' },
        { path: '/inventory', icon: UtensilsCrossed, emoji: '🍔', label: 'Menu' }
    ];

    const dockStyle = {
        light: {
            background: 'rgba(255, 255, 255, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1), inset 0 0 0 0.5px rgba(255,255,255,0.4)',
        },
        dark: {
            background: 'rgba(30, 30, 30, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), inset 0 0 0 0.5px rgba(255,255,255,0.1)',
        }
    };
    const currentTheme = dockStyle[theme] || dockStyle.light;

    useEffect(() => {
        if (currentSizes.current.length !== navItems.length) {
            currentSizes.current = new Array(navItems.length).fill(baseSize);
        }

        const animate = () => {
            if (dockRef.current) {
                const icons = dockRef.current.children;
                let allAtRest = true;

                for (let i = 0; i < icons.length; i++) {
                    const icon = icons[i];
                    const rect = icon.getBoundingClientRect();
                    const iconCenterX = rect.left + rect.width / 2;

                    let targetSize = baseSize;

                    if (menuBarMode === 'sticky' || isHovered) {
                        let distance = 0;
                        if (mouseX.current !== null) {
                            distance = Math.abs(mouseX.current - iconCenterX);
                        } else {
                            distance = 1000;
                        }

                        let val = 0;
                        if (distance < distanceLimit) {
                            val = 1 - (distance / distanceLimit);
                            val = Math.cos((1 - val) * Math.PI / 2);
                        }

                        targetSize = baseSize * (1 + (scaleFactor - 1) * val);
                    }

                    const currentSize = currentSizes.current[i];
                    const diff = targetSize - currentSize;
                    const newSize = currentSize + diff * smoothing;
                    currentSizes.current[i] = newSize;

                    icon.style.setProperty('--dock-size', `${newSize}px`);
                    icon.style.width = `${newSize}px`;
                    icon.style.height = `${newSize}px`;

                    if (Math.abs(diff) > 0.1) {
                        allAtRest = false;
                    }
                }

                if (!allAtRest || isHovered) {
                    rafRef.current = requestAnimationFrame(animate);
                }
            }
        };

        rafRef.current = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(rafRef.current);
    }, [menuBarMode, isHovered]);

    const lastHapticIndex = useRef(null);
    const touchStartIndex = useRef(null);

    const handleMouseMove = (e) => {
        mouseX.current = e.clientX;
    };

    const handleTouchStart = (e) => {
        const touch = e.touches[0];
        mouseX.current = touch.clientX;
        setIsHovered(true);

        // Detect which item we started on
        if (dockRef.current) {
            const icons = dockRef.current.children;
            for (let i = 0; i < icons.length; i++) {
                const rect = icons[i].getBoundingClientRect();
                if (touch.clientX >= rect.left && touch.clientX <= rect.right) {
                    touchStartIndex.current = i;
                    lastHapticIndex.current = i; // Mark as "vibrated" for sweep logic
                    break;
                }
            }
        }
    };

    const handleTouchMove = (e) => {
        const touch = e.touches[0];
        mouseX.current = touch.clientX;
        setIsHovered(true);

        // --- NEW: Detect Hover for Sweep Haptics ---
        if (dockRef.current) {
            const icons = dockRef.current.children;
            let currentItemIndex = null;

            for (let i = 0; i < icons.length; i++) {
                const rect = icons[i].getBoundingClientRect();
                if (touch.clientX >= rect.left && touch.clientX <= rect.right) {
                    currentItemIndex = i;
                    break;
                }
            }

            // Only trigger hover haptic if we move to a NEW item
            if (currentItemIndex !== null && currentItemIndex !== lastHapticIndex.current) {
                lastHapticIndex.current = currentItemIndex;
                setHoveredIndex(currentItemIndex);
                triggerHaptic('hover');
            } else if (currentItemIndex === null) {
                lastHapticIndex.current = null;
                setHoveredIndex(null);
            }
        }
    };

    const handleMouseLeave = () => {
        mouseX.current = null;
        setIsHovered(false);
        setHoveredIndex(null);
        lastHapticIndex.current = null;
        touchStartIndex.current = null;
    };

    const handleMouseEnter = () => {
        setIsHovered(true);
    };

    // Reset interaction on navigation - REMOVED to prevent jumpy effect

    // Handle Click Outside to Reset Menu
    useEffect(() => {
        const handleGlobalInteraction = (e) => {
            // Check if interaction is outside the dock container
            if (dockRef.current && !dockRef.current.contains(e.target)) {
                handleMouseLeave();
            }
        };

        // Listen for both touch and click to cover all bases
        document.addEventListener('touchstart', handleGlobalInteraction, { passive: true });
        document.addEventListener('click', handleGlobalInteraction);

        return () => {
            document.removeEventListener('touchstart', handleGlobalInteraction);
            document.removeEventListener('click', handleGlobalInteraction);
        };
    }, []);

    const isHidden = menuBarMode === 'disappearing' && !isHovered;

    return (
        <>
            {menuBarMode === 'disappearing' && (
                <div
                    onMouseEnter={handleMouseEnter}
                    style={{
                        position: 'fixed', bottom: 0, left: 0, right: 0,
                        height: '20px', zIndex: 9998,
                        display: isHidden ? 'block' : 'none'
                    }}
                />
            )}

            <div
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                style={{
                    position: 'fixed', bottom: 0, left: '50%',
                    transform: `translateX(-50%) translateY(${isHidden ? '100%' : '0%'})`,
                    zIndex: 9999,
                    transition: 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
                    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                    paddingBottom: '20px',
                    height: 'auto', pointerEvents: isHidden ? 'none' : 'auto'
                }}
            >
                <div
                    ref={dockRef}
                    style={{
                        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                        gap: '10px',
                        padding: '0 12px',
                        borderRadius: '20px',
                        backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
                        height: `${dockHeight}px`,
                        width: 'auto',
                        marginBottom: '0',
                        ...currentTheme
                    }}
                >


                    {navItems.map((item, index) => {
                        const isActive = location.pathname === item.path;

                        return (
                            <div
                                key={item.path}
                                onClick={() => {
                                    triggerHaptic('medium');
                                    navigate(item.path);
                                }}
                                className="dock-item"
                                onMouseEnter={() => {
                                    setHoveredIndex(index);
                                    triggerHaptic('hover');
                                }}
                                onMouseLeave={() => setHoveredIndex(null)}
                                style={{
                                    '--dock-size': `${baseSize}px`,

                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    textDecoration: 'none',
                                    borderRadius: '14px',
                                    width: 'var(--dock-size)',
                                    height: 'var(--dock-size)',
                                    cursor: 'pointer',

                                    backgroundColor: isActive
                                        ? (theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)')
                                        : (iconStyle === 'emoji' ? 'rgba(128,128,128, 0.15)' : 'transparent'),

                                    color: theme === 'dark' ? 'white' : 'var(--color-text-main)',
                                    position: 'relative',
                                    transition: 'background-color 0.2s',
                                    marginBottom: '8px',

                                    boxShadow: iconStyle === 'emoji' ? '0 2px 5px rgba(0,0,0,0.05)' : 'none',
                                    border: iconStyle === 'emoji' ? '1px solid rgba(255,255,255,0.1)' : 'none'
                                }}
                            >
                                <div style={{
                                    width: '100%', height: '100%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    pointerEvents: 'none'
                                }}>
                                    {iconStyle === 'emoji' ? (
                                        <span style={{
                                            lineHeight: 1,
                                            fontSize: 'calc(var(--dock-size) * 0.55)',
                                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                                        }}>
                                            {item.emoji}
                                        </span>
                                    ) : (
                                        <item.icon
                                            strokeWidth={2}
                                            style={{ width: '50%', height: '50%' }}
                                        />
                                    )}
                                </div>

                                {/* Active Indicator Dot */}
                                {isActive && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '-6px',
                                        width: '4px',
                                        height: '4px',
                                        borderRadius: '50%',
                                        backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.6)',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                                    }} />
                                )}

                                {/* Mac-style Tooltip */}
                                {(hoveredIndex === index) && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '-45px', // Float well above
                                        padding: '5px 10px',
                                        borderRadius: '6px',
                                        backgroundColor: theme === 'dark' ? 'rgba(220, 220, 220, 0.95)' : 'rgba(50, 50, 50, 0.9)',
                                        backdropFilter: 'blur(4px)',
                                        color: theme === 'dark' ? '#000' : '#fff',
                                        fontSize: '0.75rem',
                                        fontWeight: 500,
                                        pointerEvents: 'none',
                                        whiteSpace: 'nowrap',
                                        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                                        zIndex: 10000,
                                        animation: 'fadeIn 0.2s ease-out forwards',

                                        // Arrow
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {item.label}
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '-4px',
                                            left: '50%',
                                            transform: 'translateX(-50%) rotate(45deg)',
                                            width: '8px',
                                            height: '8px',
                                            backgroundColor: theme === 'dark' ? 'rgba(220, 220, 220, 0.95)' : 'rgba(50, 50, 50, 0.9)',
                                        }} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    <style>{`
                        @keyframes fadeIn {
                            from { opacity: 0; transform: translateY(5px); }
                            to { opacity: 1; transform: translateY(0); }
                        }
                    `}</style>
                </div>
            </div >
        </>
    );
};

export default BottomNav;
