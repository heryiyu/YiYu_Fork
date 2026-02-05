import React from 'react';
import { Info } from 'lucide-react';

export const ModalHint = ({ children, className = '', style = {}, role = 'note', ariaLive = 'polite' }) => {
    return (
        <div
            className={`modal-hint-box ${className}`.trim()}
            role={role}
            aria-live={ariaLive}
            style={style}
        >
            <Info className="modal-hint-icon" size={14} strokeWidth={2} aria-hidden="true" />
            <span className="modal-hint-text">{children}</span>
        </div>
    );
};
