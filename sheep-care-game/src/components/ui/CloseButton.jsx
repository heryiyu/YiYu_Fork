import React from 'react';
import { X } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { useIsMobile } from '../../hooks/useIsMobile';
import './CloseButton.css';

/**
 * Reusable close/leave button for modals, search bars, and other interactive UI.
 * Renders a lucide X icon with consistent sizing and hit-area.
 * Supports ref forwarding for focus management.
 */
export const CloseButton = React.forwardRef(({
    ariaLabel = '關閉',
    onClick,
    size,
    className = '',
    variant = 'default',
    tooltip
}, ref) => {
    const iconSize = size ?? (variant === 'sm' ? 14 : 16);
    const tooltipContent = tooltip ?? ariaLabel;
    const isMobile = useIsMobile();

    const btn = (
        <button
            ref={ref}
            type="button"
            className={`close-btn ${variant === 'sm' ? 'close-btn--sm' : ''} ${className}`.trim()}
            onClick={onClick}
            aria-label={ariaLabel}
        >
            <X size={iconSize} strokeWidth={2.5} />
        </button>
    );
    // Explicitly bypass Tooltip wrapper on mobile
    return (tooltipContent && !isMobile) ? (
        <Tooltip content={tooltipContent} side="top">
            {btn}
        </Tooltip>
    ) : btn;
});
