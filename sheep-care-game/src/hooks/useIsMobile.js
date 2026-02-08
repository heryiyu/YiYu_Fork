import { useState, useEffect } from 'react';

/**
 * Custom hook to detect if the user is on a mobile device.
 * Uses 'pointer: coarse' media query as the primary indicator for touch/mobile devices.
 * 
 * @returns {boolean} True if the device is mobile/touch, false otherwise.
 */
export const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // Media query for coarse pointer (touch)
        const mediaQuery = window.matchMedia('(pointer: coarse)');

        // Handler to update state
        const handleChange = (e) => setIsMobile(e.matches);

        // Initial check
        setIsMobile(mediaQuery.matches);

        // Listen for changes
        mediaQuery.addEventListener('change', handleChange);

        // Cleanup
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    return isMobile;
};
