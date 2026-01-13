import React, { useState } from 'react';
import Layout from './Layout';
import { useNavigate } from 'react-router-dom';
import Dashboard from './Dashboard';
import { LayoutDashboard, FileBarChart } from 'lucide-react';
import { useTheme } from '../context/useTheme';
import { triggerHaptic } from '../utils/haptics';

// Lazy Load Heavy Components
const Reports = React.lazy(() => import('./Reports'));
const Analytics = React.lazy(() => import('./Analytics'));
const DataManagement = React.lazy(() => import('./DataManagement'));

// Simple Suspense Fallback
const LoadingFallback = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '300px' }}>
        <div className="spinner"></div>
    </div>
);

const Home = () => {
    const { theme } = useTheme();
    // Local state to manage the "view" within the Home tab
    // mirroring the previous App.jsx behavior
    const [currentView, setCurrentView] = useState(() => {
        return localStorage.getItem('last_view') || 'dashboard';
    });

    // Save view to local storage
    React.useEffect(() => {
        localStorage.setItem('last_view', currentView);
    }, [currentView]);

    const navigate = useNavigate();

    // Redirection Logic: Desktop -> Billing (Once per session)
    React.useEffect(() => {
        const isDesktop = window.innerWidth > 768;
        const hasRedirected = sessionStorage.getItem('desktop_redirect_done');

        if (isDesktop && !hasRedirected) {
            sessionStorage.setItem('desktop_redirect_done', 'true');
            navigate('/billing');
        }
    }, [navigate]);
    const getGlow = () => theme === 'dark'
        ? '0 0 15px -4px rgba(255, 255, 255, 0.1)'
        : '0 0 20px -5px var(--color-primary-light), 0 4px 10px rgba(0,0,0,0.1)';

    return (
        <Layout setCurrentView={setCurrentView}>
            {/* Modern Pill Navigation - Restored for Home Tab */}
            <div style={{
                display: 'flex',
                marginBottom: '20px',
                marginTop: '8px',
                backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.5)',
                padding: '4px',
                borderRadius: '999px',
                position: 'sticky',
                top: '20px',
                zIndex: 50,
                backdropFilter: 'blur(12px)',
                border: '1px solid var(--color-border)'
            }}>
                <button
                    onClick={() => {
                        triggerHaptic('light');
                        setCurrentView('dashboard');
                    }}
                    style={{
                        flex: 1,
                        padding: '12px 12px',
                        borderRadius: '999px',
                        backgroundColor: currentView === 'dashboard' ? 'var(--color-bg-surface-transparent)' : 'transparent',
                        color: currentView === 'dashboard' ? 'var(--color-text-main)' : 'var(--color-text-muted)',
                        fontSize: '1rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        border: '1px solid',
                        borderColor: currentView === 'dashboard' ? 'var(--color-border)' : 'transparent',
                        boxShadow: currentView === 'dashboard' ? getGlow() : 'none',
                        backdropFilter: currentView === 'dashboard' ? 'blur(12px)' : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                >
                    <LayoutDashboard size={18} /> Dashboard
                </button>

                <button
                    onClick={() => {
                        triggerHaptic('light');
                        setCurrentView('reports');
                    }}
                    style={{
                        flex: 1,
                        padding: '12px 12px',
                        borderRadius: '999px',
                        backgroundColor: (currentView === 'reports' || currentView === 'analytics') ? 'var(--color-bg-surface-transparent)' : 'transparent',
                        color: (currentView === 'reports' || currentView === 'analytics') ? 'var(--color-text-main)' : 'var(--color-text-muted)',
                        fontSize: '1rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        border: '1px solid',
                        borderColor: (currentView === 'reports' || currentView === 'analytics') ? 'var(--color-border)' : 'transparent',
                        boxShadow: (currentView === 'reports' || currentView === 'analytics') ? getGlow() : 'none',
                        backdropFilter: (currentView === 'reports' || currentView === 'analytics') ? 'blur(12px)' : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                >
                    <FileBarChart size={18} /> Reports
                </button>
            </div>

            {/* Content Area */}
            {currentView === 'dashboard' && <Dashboard />}

            <React.Suspense fallback={<LoadingFallback />}>
                {(currentView === 'reports' || currentView === 'analytics') && <Reports setCurrentView={setCurrentView} />}

                <div className={`analytics-overlay ${currentView === 'analytics' ? 'active' : ''}`}>
                    {currentView === 'analytics' && <Analytics setCurrentView={setCurrentView} />}
                </div>
            </React.Suspense>

            <style>{`
            .analytics-overlay {
                position: fixed;
                inset: 0;
                background-color: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(4px);
                z-index: 100;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            .analytics-overlay.active {
                opacity: 1;
                visibility: visible;
            }
            `}</style>
        </Layout>
    );
};

export default Home;
