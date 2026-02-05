import React from 'react';
import { Check } from 'lucide-react';
import './Checkbox.css';

/**
 * Custom checkbox that hides native UI and renders a styled box.
 */
export const Checkbox = ({
    checked,
    onChange,
    disabled = false,
    ariaLabel,
    className = '',
    id,
    name
}) => {
    return (
        <span className={`ui-checkbox ${className}`.trim()}>
            <input
                id={id}
                name={name}
                type="checkbox"
                className="ui-checkbox__input"
                checked={checked}
                onChange={onChange}
                disabled={disabled}
                aria-label={ariaLabel}
            />
            <span className="ui-checkbox__box" aria-hidden="true">
                <Check size={12} strokeWidth={3} />
            </span>
        </span>
    );
};
