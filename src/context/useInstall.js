import { useContext } from 'react';
import { InstallContext } from './InstallContextDef';

export const useInstall = () => {
    const context = useContext(InstallContext);
    if (!context) {
        throw new Error('useInstall must be used within an InstallProvider');
    }
    return context;
};
