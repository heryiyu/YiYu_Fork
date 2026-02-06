import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import './Tooltip.css';

/**
 * Shadcn-style Tooltip: accessible, animated tooltip on hover.
 * Renders via Portal to document.body so it's never clipped by overflow.
 */
export const Tooltip = ({ children, content, side = 'top', delayDuration = 300 }) => {
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0, transform: 'translate(-50%, -100%)' });
    const timeoutRef = useRef(null);
    const triggerRef = useRef(null);

    const updatePosition = useCallback(() => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const gap = 6;
        let top, left, transform;
        switch (side) {
            case 'top':
                top = rect.top - gap;
                left = rect.left + rect.width / 2;
                transform = 'translate(-50%, -100%)';
                break;
            case 'bottom':
                top = rect.bottom + gap;
                left = rect.left + rect.width / 2;
                transform = 'translate(-50%, 0)';
                break;
            case 'left':
                top = rect.top + rect.height / 2;
                left = rect.left - gap;
                transform = 'translate(-100%, -50%)';
                break;
            case 'right':
                top = rect.top + rect.height / 2;
                left = rect.right + gap;
                transform = 'translate(0, -50%)';
                break;
            default:
                top = rect.top - gap;
                left = rect.left + rect.width / 2;
                transform = 'translate(-50%, -100%)';
        }
        setPosition({ top, left, transform });
    }, [side]);

    const handleOpen = () => {
        timeoutRef.current = setTimeout(() => {
            updatePosition();
            setOpen(true);
        }, delayDuration);
    };

    const handleClose = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setOpen(false);
    };

    useEffect(() => {
        if (!open) return;
        const raf = requestAnimationFrame(() => updatePosition());
        return () => cancelAnimationFrame(raf);
    }, [open, updatePosition]);

    useEffect(() => {
        if (!open) return;
        const onScrollOrResize = () => requestAnimationFrame(() => updatePosition());
        window.addEventListener('scroll', onScrollOrResize, true);
        window.addEventListener('resize', onScrollOrResize);
        return () => {
            window.removeEventListener('scroll', onScrollOrResize, true);
            window.removeEventListener('resize', onScrollOrResize);
        };
    }, [open, updatePosition]);

    useEffect(() => () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }, []);

    const tooltipEl = open && (
        <span
            className={`tooltip-content tooltip-content--portal`}
            role="tooltip"
            style={{
                position: 'fixed',
                top: position.top,
                left: position.left,
                transform: position.transform || 'translate(-50%, -100%)',
                margin: 0,
            }}
        >
            {content}
        </span>
    );

    const onPointerEnter = (e) => {
        if (e.pointerType === 'touch') return;
        handleOpen();
    };

    return (
        <span
            ref={triggerRef}
            className="tooltip-root"
            onPointerEnter={onPointerEnter}
            onPointerLeave={handleClose}
            onPointerDown={handleClose}
            onFocus={() => {
                // Only show focus tooltip if the device supports hover (likely mouse/keyboard)
                if (window.matchMedia('(hover: hover)').matches) handleOpen();
            }}
            onBlur={handleClose}
        >
            {children}
            {tooltipEl && ReactDOM.createPortal(tooltipEl, document.body)}
        </span>
    );
};
