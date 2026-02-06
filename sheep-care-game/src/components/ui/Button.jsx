import React from 'react';
import './Button.css';

/**
 * Reusable button with design system variants.
 * Maps to modal-btn-primary, modal-btn-secondary, btn-destructive, etc.
 */
export const Button = ({
    variant = 'primary',
    size = 'default',
    disabled = false,
    type = 'button',
    className = '',
    children,
    ...props
}) => {
    const variantClass = {
        primary: 'modal-btn-primary',
        secondary: 'modal-btn-secondary',
        destructive: 'modal-btn-primary btn-destructive',
        outline: 'modal-btn-secondary-outline',
        ghost: 'btn-ghost',
        success: 'modal-btn-primary btn-success',
    }[variant] || 'modal-btn-primary';

    const sizeClass = size === 'sm' ? 'btn--sm' : '';

    return (
        <button
            type={type}
            disabled={disabled}
            className={`${variantClass} ${sizeClass} ${className}`.trim()}
            {...props}
        >
            {children}
        </button>
    );
};
