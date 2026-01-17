import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

// Default Configurations
const DEFAULT_MOBILE_SETTINGS = {
    menuBarMode: 'disappearing',
    iconStyle: 'emoji',
    showMenuLabels: false,
    showMilestoneModal: false, // Changed to OFF by default
    homeLayoutMode: 'bento'
};

const DEFAULT_DESKTOP_SETTINGS = {
    menuBarMode: 'disappearing',
    iconStyle: 'emoji',
    showMenuLabels: true,
    showMilestoneModal: false, // Changed to OFF by default
    homeLayoutMode: 'bento'
};

export const SettingsProvider = ({ children }) => {
    // 1. Device Detection
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 2. Load Profiles from LocalStorage
    const [mobileSettings, setMobileSettings] = useState(() => {
        const saved = localStorage.getItem('settings_mobile');
        return saved ? { ...DEFAULT_MOBILE_SETTINGS, ...JSON.parse(saved) } : DEFAULT_MOBILE_SETTINGS;
    });

    const [desktopSettings, setDesktopSettings] = useState(() => {
        const saved = localStorage.getItem('settings_desktop');
        return saved ? { ...DEFAULT_DESKTOP_SETTINGS, ...JSON.parse(saved) } : DEFAULT_DESKTOP_SETTINGS;
    });

    // 3. Persist Changes
    useEffect(() => {
        localStorage.setItem('settings_mobile', JSON.stringify(mobileSettings));
    }, [mobileSettings]);

    useEffect(() => {
        localStorage.setItem('settings_desktop', JSON.stringify(desktopSettings));
    }, [desktopSettings]);

    // 4. Resolve Current Settings based on Device
    const currentSettings = isMobile ? mobileSettings : desktopSettings;
    const updateSettings = isMobile ? setMobileSettings : setDesktopSettings;

    // Helper to update specific key
    const updateSetting = (key, value) => {
        updateSettings(prev => ({ ...prev, [key]: value }));
    };

    // 5. Global / Shared Settings (NOT device specific)
    const [hapticDebug, setHapticDebug] = useState(() => {
        const saved = localStorage.getItem('hapticDebug');
        return saved !== null ? JSON.parse(saved) : false;
    });

    useEffect(() => {
        localStorage.setItem('hapticDebug', JSON.stringify(hapticDebug));
    }, [hapticDebug]);

    // Drawer States (Ephemeral)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const openSettings = () => setIsSettingsOpen(true);
    const closeSettings = () => setIsSettingsOpen(false);

    const [isDataOpen, setIsDataOpen] = useState(false);
    const openData = () => setIsDataOpen(true);
    const closeData = () => setIsDataOpen(false);

    const [navVisible, setNavVisible] = useState(true);

    const value = {
        // Exposed Values (Proxied to current profile)
        menuBarMode: currentSettings.menuBarMode,
        setMenuBarMode: (val) => updateSetting('menuBarMode', val),

        iconStyle: currentSettings.iconStyle,
        setIconStyle: (val) => updateSetting('iconStyle', val),

        showMenuLabels: currentSettings.showMenuLabels,
        setShowMenuLabels: (val) => updateSetting('showMenuLabels', val),

        showMilestoneModal: currentSettings.showMilestoneModal,
        setShowMilestoneModal: (val) => updateSetting('showMilestoneModal', val),

        homeLayoutMode: currentSettings.homeLayoutMode,
        setHomeLayoutMode: (val) => updateSetting('homeLayoutMode', val),

        // Global
        hapticDebug,
        setHapticDebug,
        isSettingsOpen,
        openSettings,
        closeSettings,
        isDataOpen,
        openData,
        closeData,
        navVisible,
        setNavVisible,

        // Meta
        isMobile
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};
