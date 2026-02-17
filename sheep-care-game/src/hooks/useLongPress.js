import React, { useState, useRef, useCallback } from 'react';

/**
 * Custom hook to handle long press and click interactions.
 * Useful for touch devices where long press triggers selection mode.
 */
export const useLongPress = (onLongPress, onClick, { shouldPreventDefault = true, delay = 500 } = {}) => {
    const [longPressTriggered, setLongPressTriggered] = useState(false);
    const timeout = useRef();
    const target = useRef();
    const isMoved = useRef(false); // Track if movement occurred
    const isTouch = useRef(false); // Track if interaction is touch-based
    const startPos = useRef({ x: 0, y: 0 });

    const start = useCallback(
        (event) => {
            if (shouldPreventDefault && event.target) {
                target.current = event.target;
            }
            isMoved.current = false; // Reset movement flag

            // Track start position
            if (event.touches && event.touches[0]) {
                startPos.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
            } else {
                startPos.current = { x: event.clientX || 0, y: event.clientY || 0 };
            }

            setLongPressTriggered(false);
            timeout.current = setTimeout(() => {
                onLongPress(event);
                setLongPressTriggered(true);
            }, delay);
        },
        [onLongPress, delay, shouldPreventDefault]
    );

    const clear = useCallback(
        (event, shouldTriggerClick = true) => {
            timeout.current && clearTimeout(timeout.current);
            // Click should ONLY trigger if NO long press happened AND NO significant movement occurred
            if (shouldTriggerClick && !longPressTriggered && !isMoved.current && onClick) {
                onClick(event);
            }
            setLongPressTriggered(false);
            target.current = undefined;
        },
        [longPressTriggered, onClick]
    );

    return {
        onMouseDown: (e) => {
            if (isTouch.current) return;
            start(e);
        },
        onTouchStart: (e) => {
            isTouch.current = true;
            start(e);
        },
        onMouseUp: (e) => {
            if (isTouch.current) return;
            clear(e);
        },
        onMouseLeave: (e) => {
            if (isTouch.current) return;
            clear(e, false);
        },
        onTouchMove: (e) => {
            // Check for significant movement (> 10px) before cancelling click
            if (!isMoved.current && e.touches && e.touches[0]) {
                const x = e.touches[0].clientX;
                const y = e.touches[0].clientY;
                const dx = Math.abs(x - startPos.current.x);
                const dy = Math.abs(y - startPos.current.y);
                if (dx > 10 || dy > 10) {
                    isMoved.current = true; // Mark as moved only if threshold exceeded
                    clear(e, false);
                }
            } else if (!e.touches) {
                isMoved.current = true;
                clear(e, false);
            }
        },
        onTouchEnd: (e) => clear(e)
    };
};
