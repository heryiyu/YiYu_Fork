import React from 'react';
import { X } from 'lucide-react';
import './CloseButton.css';

/**
 * Reusable close/leave button for modals, search bars, and other interactive UI.
 * Renders a lucide X icon with consistent sizing and hit-area.
 */
export const CloseButton = ({
    ariaLabel = '關閉',
    onClick,
    size,
    className = '',
    variant = 'default'
}) => {
    const iconSize = size ?? (variant === 'sm' ? 14 : 16);
    return (
        <button
            type="button"
            className={`close-btn ${variant === 'sm' ? 'close-btn--sm' : ''} ${className}`.trim()}
            onClick={onClick}
            aria-label={ariaLabel}
        >
            <X size={iconSize} strokeWidth={2.5} />
        </button>
    );
};
