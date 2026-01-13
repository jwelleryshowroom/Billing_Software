/**
 * Haptic Feedback Utility
 * Provides consistent vibration patterns for the application.
 * Safely checks for navigator.vibrate support.
 */

// Haptic Patterns (Strictly calibrated to user request)
const patterns = {
    hover: 30,    // 30ms for slide/hover
    light: 40,    // 40ms baseline
    medium: 50,   // 50ms for menu bar
    heavy: 65,    // 65ms for high impact
    success: 40,
    warning: [50, 40, 50],
    error: [60, 40, 60, 40, 60]
};

export const triggerHaptic = (type = 'light') => {
    // Check if vibration is supported
    if (typeof navigator === 'undefined' || !navigator.vibrate) {
        console.warn('Haptic feedback not supported by this browser/OS.');
        return { success: false, error: 'NOT_SUPPORTED' };
    }

    try {
        // DEBUG ALERT: Remove after testing
        // alert(`DEBUG: Triggering ${type} haptic`);
        let result = false;
        switch (type) {
            case 'hover':
                result = navigator.vibrate(patterns.hover);
                break;
            case 'light':
                result = navigator.vibrate(patterns.light);
                break;
            case 'medium':
                result = navigator.vibrate(patterns.medium);
                break;
            case 'heavy':
                result = navigator.vibrate(patterns.heavy);
                break;
            case 'success':
                result = navigator.vibrate(patterns.success);
                break;
            case 'warning':
                result = navigator.vibrate(patterns.warning);
                break;
            case 'error':
                result = navigator.vibrate(patterns.error);
                break;
            default:
                result = navigator.vibrate(10);
        }

        // Broadcast event for Debug Overlay
        window.dispatchEvent(new CustomEvent('haptic-triggered', {
            detail: { type, pattern: patterns[type] || type }
        }));

        // navigator.vibrate returns true if vibration was successful
        if (result) {
            return { success: true };
        } else {
            // This happens if the user hasn't interacted with the page yet 
            // OR if Battery Saver/OS is blocking it.
            return { success: false, error: 'BLOCKED_BY_OS_OR_USER' };
        }
    } catch (e) {
        console.error('Haptic feedback failed:', e);
        return { success: false, error: e.message };
    }
};

export default triggerHaptic;
