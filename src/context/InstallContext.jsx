import React, { useState, useEffect } from 'react';
import { InstallContext } from './InstallContextDef';

export const InstallProvider = ({ children }) => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if already installed
        const checkStandalone = window.matchMedia('(display-mode: standalone)').matches;
        setIsStandalone(checkStandalone);

        // Check iOS
        const checkIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const checkSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        setIsIOS((checkIOS || checkSafari) && !checkStandalone);

        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            console.log("InstallContext: captured beforeinstallprompt");
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const promptInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to install prompt: ${outcome}`);
        setDeferredPrompt(null);
    };

    return (
        <InstallContext.Provider value={{ deferredPrompt, promptInstall, isIOS, isStandalone }}>
            {children}
        </InstallContext.Provider>
    );
};
