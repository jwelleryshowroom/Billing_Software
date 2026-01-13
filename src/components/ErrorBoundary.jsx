import React from 'react';
import { logError } from '../utils/logger';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log the error to our custom logger
        // We accept 'user' as a prop to pass it to the logger
        logError(error, errorInfo, { user: this.props.user });
    }

    handleReload = () => {
        // Hard Reload to clear any bad state
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    height: '100vh',
                    width: '100vw',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--color-bg-primary)',
                    color: 'var(--color-text-primary)',
                    padding: '24px',
                    textAlign: 'center'
                }}>
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        padding: '24px',
                        borderRadius: '50%',
                        marginBottom: '24px'
                    }}>
                        <AlertTriangle size={64} color="#EF4444" />
                    </div>

                    <h1 style={{ fontSize: '1.8rem', marginBottom: '16px', fontWeight: 800 }}>
                        Something went wrong
                    </h1>

                    <p style={{
                        color: 'var(--color-text-muted)',
                        marginBottom: '32px',
                        maxWidth: '400px',
                        lineHeight: '1.6'
                    }}>
                        Don't worry, we've already logged this error and notified the team.
                        Please try reloading the app.
                    </p>

                    <div style={{ display: 'flex', gap: '16px' }}>
                        <button
                            onClick={this.handleReload}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 24px',
                                background: 'var(--color-primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '1rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                            }}
                        >
                            <RefreshCw size={20} /> Reload App
                        </button>

                        <button
                            onClick={() => window.location.href = '/'}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 24px',
                                background: 'transparent',
                                color: 'var(--color-text-main)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '12px',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            <Home size={20} /> Go Home
                        </button>
                    </div>

                    <div style={{ marginTop: '48px', fontSize: '0.8rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                        Error ID: {new Date().getTime().toString().slice(-6)}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
