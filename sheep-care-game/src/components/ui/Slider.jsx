import React from 'react';
import './Slider.css';

/**
 * Custom range slider (shadcn-inspired styling).
 */
export const Slider = ({
    value,
    min = 0,
    max = 100,
    step = 1,
    onChange,
    ariaLabel,
    className = '',
    disabled = false
}) => {
    return (
        <input
            type="range"
            className={`ui-slider ${className}`.trim()}
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={onChange}
            aria-label={ariaLabel}
            disabled={disabled}
        />
    );
};
