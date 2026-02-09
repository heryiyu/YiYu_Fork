import React from 'react';
import { Tooltip } from './Tooltip';
import './IconButton.css';

/**
 * Ghost icon button for reorder, remove, edit, delete actions.
 */

/**
 * Wrapper for 2+ IconButtons placed together. Narrows the gap between them.
 * Rule: When IconButtons are grouped, use IconButtonGroup for consistent spacing.
 */
export const IconButtonGroup = ({ children, className = '', ...props }) => (
    <span className={`icon-btn-group ${className}`.trim()} role="group" {...props}>
        {children}
    </span>
);

export const IconButton = ({
    icon: Icon,
    ariaLabel,
    onClick,
    disabled = false,
    variant = 'default',
    className = '',
    size = 16,
    tooltip,
    tooltipSide = 'top',
    ...props
}) => {
    const variantClass = variant === 'danger' ? 'icon-btn--danger' : '';
    const tooltipContent = tooltip ?? ariaLabel;

    const btn = (
        <button
            type="button"
            className={`icon-btn ${variantClass} ${className}`.trim()}
            onClick={onClick}
            disabled={disabled}
            aria-label={ariaLabel}
            {...props}
        >
            {Icon ? <Icon size={size} strokeWidth={2.5} /> : null}
        </button>
    );

    return tooltipContent ? (
        <Tooltip content={tooltipContent} side={tooltipSide}>
            {btn}
        </Tooltip>
    ) : btn;
};
