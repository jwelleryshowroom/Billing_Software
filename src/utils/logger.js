import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

const LOG_COLLECTION = 'error_logs';

/**
 * Logs an error to Firestore with detailed metadata.
 * @param {Error} error - The error object
 * @param {Object} errorInfo - React error boundary info (component stack)
 * @param {Object} contextData - Additional context (user, action, etc.)
 */
export const logError = async (error, errorInfo = null, contextData = {}) => {
    // 1. Always log to Console (for Devs)
    console.error("🚨 APP ERROR CAUGHT:", error);
    if (errorInfo) console.error("Stack:", errorInfo.componentStack);

    // 2. Prepare Detailed Log Object
    const logData = {
        timestamp: new Date().toISOString(),
        message: error?.message || 'Unknown Error',
        stack: error?.stack || 'No Stack Trace',
        componentStack: errorInfo?.componentStack || null,

        // Context Info
        user: contextData.user ? {
            uid: contextData.user.uid,
            email: contextData.user.email,
            role: contextData.user.role || 'unknown'
        } : 'anonymous',

        // Device/Browser Info
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        url: window.location.href,

        // App Version (from env or manually updated string)
        appVersion: 'v1.5.0', // We should match this with package.json manually or via env

        // Custom Tags
        severity: contextData.severity || 'error', // 'error', 'warning', 'critical'
        handled: true
    };

    try {
        // 3. Fire & Forget to Firestore
        await addDoc(collection(db, LOG_COLLECTION), logData);
        console.log("✅ Error logged to Firestore:", logData.message);
    } catch (loggingError) {
        // Fallback if logging fails (e.g. offline)
        console.error("❌ Failed to send error log to DB:", loggingError);
    }
};

/**
 * Global Window Error Handler (for uncaught promises/exceptions)
 */
export const setupGlobalErrorListeners = (user = null) => {

    // Catch Standard JS Errors
    window.onerror = (message, source, lineno, colno, error) => {
        logError(error || new Error(message), { componentStack: `Global: ${source}:${lineno}:${colno}` }, { user, severity: 'critical' });
    };

    // Catch Unhandled Promise Rejections (Async errors)
    window.onunhandledrejection = (event) => {
        logError(event.reason || new Error('Unhandled Rejection'), null, { user, severity: 'critical' });
    };
};
