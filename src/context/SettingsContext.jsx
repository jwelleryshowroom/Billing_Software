import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

export const SettingsProvider = ({ children }) => {
    // Menu Bar Mode: 'sticky' | 'disappearing'
    const [menuBarMode, setMenuBarMode] = useState(() => {
        return localStorage.getItem('menuBarMode') || 'sticky';
    });

    // Icon Style: 'mono' | 'emoji'
    const [iconStyle, setIconStyle] = useState(() => {
        return localStorage.getItem('iconStyle') || 'emoji';
    });

    // Show Labels: boolean
    const [showMenuLabels, setShowMenuLabels] = useState(() => {
        const saved = localStorage.getItem('showMenuLabels');
        return saved !== null ? JSON.parse(saved) : true;
    });

    // Global Settings Drawer Visibility
    const [isSettingsOpen, setIsSettingsOpen] = useState(() => {
        const saved = localStorage.getItem('isSettingsOpen');
        return saved !== null ? JSON.parse(saved) : false;
    });
    const openSettings = () => setIsSettingsOpen(true);
    const closeSettings = () => setIsSettingsOpen(false);

    // Haptic Debug Mode: boolean
    const [hapticDebug, setHapticDebug] = useState(() => {
        const saved = localStorage.getItem('hapticDebug');
        return saved !== null ? JSON.parse(saved) : false; // Default to false (hidden)
    });

    // Global Data Drawer Visibility
    const [isDataOpen, setIsDataOpen] = useState(false);
    const openData = () => setIsDataOpen(true);
    const closeData = () => setIsDataOpen(false);

    useEffect(() => {
        localStorage.setItem('menuBarMode', menuBarMode);
        localStorage.setItem('iconStyle', iconStyle);
        localStorage.setItem('showMenuLabels', JSON.stringify(showMenuLabels));
        localStorage.setItem('hapticDebug', JSON.stringify(hapticDebug));
        localStorage.setItem('isSettingsOpen', JSON.stringify(isSettingsOpen));
    }, [menuBarMode, iconStyle, showMenuLabels, hapticDebug, isSettingsOpen]);

    const value = {
        menuBarMode,
        setMenuBarMode,
        iconStyle,
        setIconStyle,
        showMenuLabels,
        setShowMenuLabels,
        hapticDebug,
        setHapticDebug,
        isSettingsOpen,
        openSettings,
        closeSettings,
        isDataOpen,
        openData,
        closeData
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};
