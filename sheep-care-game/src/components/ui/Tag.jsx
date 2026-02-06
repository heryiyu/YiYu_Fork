import React from 'react';
import './Tag.css';

/**
 * Colored tag/chip for status labels and user-defined tags.
 * Use variant for semantic status, or pass color for custom tags.
 */
export const Tag = ({ name, color, variant, className = '', ...props }) => {
    const variantClass = variant ? `tag--${variant}` : (color ? '' : 'tag--custom');
    const style = color && !variant
        ? { background: color, color: 'var(--text-inverse)' }
        : undefined;

    return (
        <span
            className={`tag ${variantClass} ${className}`.trim()}
            style={style}
            {...props}
        >
            {name}
        </span>
    );
};
