import React, { useEffect, useState } from 'react';
import { ThemeContext } from './ThemeContextDef';

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        // Check local storage or system preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) return savedTheme;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    const [dashboardMode, setDashboardMode] = useState(() => {
        const savedMode = localStorage.getItem('dashboardMode');
        return savedMode ? savedMode : 'inline'; // 'inline' or 'popup'
    });

    useEffect(() => {
        const root = document.documentElement;
        root.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('dashboardMode', dashboardMode);
    }, [dashboardMode]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, dashboardMode, setDashboardMode }}>
            {children}
        </ThemeContext.Provider>
    );
};
