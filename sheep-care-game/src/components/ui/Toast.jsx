import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { CloseButton } from './CloseButton';
import './Toast.css';

/**
 * Reusable toast message.
 * - message: string | ReactNode
 * - variant: default | info | success | warning | error
 * - duration: ms, auto-dismiss if onClose provided
 * - onClose: dismiss handler (optional)
 * - portal: render into document.body
 */
export const Toast = ({
    message,
    variant = 'default',
    duration = 0,
    onClose,
    portal = true,
    className = ''
}) => {
    useEffect(() => {
        if (!message || !onClose || !duration) return;
        const id = setTimeout(() => onClose(), duration);
        return () => clearTimeout(id);
    }, [message, onClose, duration]);

    if (!message) return null;

    const toast = (
        <div className={`toast toast--${variant} ${className}`.trim()} role="status" aria-live="polite">
            <div className="toast__content">
                <div className="toast__message">{message}</div>
                {onClose ? (
                    <CloseButton
                        ariaLabel="關閉通知"
                        onClick={onClose}
                        variant="sm"
                        className="toast__close"
                    />
                ) : null}
            </div>
        </div>
    );

    return portal ? ReactDOM.createPortal(toast, document.body) : toast;
};
