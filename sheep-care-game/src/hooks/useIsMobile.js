import { useState, useEffect } from 'react';

/**
 * Custom hook to detect if the user is on a mobile device.
 * Uses 'pointer: coarse' media query as the primary indicator for touch/mobile devices.
 * 
 * @returns {boolean} True if the device is mobile/touch, false otherwise.
 */
export const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(pointer: coarse)').matches;
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Media query for coarse pointer (touch)
        const mediaQuery = window.matchMedia('(pointer: coarse)');

        // Handler to update state
        const handleChange = (e) => setIsMobile(e.matches);

        // Listen for changes
        // 'change' event support is broad, but addEventListener is safer approach for MediaQueryList
        // Some older browsers use addListener, but we target modern.
        mediaQuery.addEventListener('change', handleChange);

        // Cleanup
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    return isMobile;
};
