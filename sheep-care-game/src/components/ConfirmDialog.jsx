import React, { useEffect, useRef } from 'react';

export const ConfirmDialog = ({
    open,
    title,
    message,
    warning,
    confirmLabel = '確定',
    cancelLabel = '取消',
    variant = 'default',
    onConfirm,
    onCancel
}) => {
    const confirmBtnRef = useRef(null);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!open) return;
            if (e.key === 'Escape') onCancel?.();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, onCancel]);

    useEffect(() => {
        if (open && confirmBtnRef.current) {
            confirmBtnRef.current.focus();
        }
    }, [open]);

    if (!open) return null;

    const isDanger = variant === 'danger';

    return (
        <div
            className="debug-editor-overlay"
            onClick={onCancel}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            style={{ zIndex: 10000 }}
        >
            <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '360px' }}>
                <div className="modal-header">
                    <h3 id="confirm-dialog-title">{title}</h3>
                    <button className="close-btn" onClick={onCancel} aria-label="關閉">✖</button>
                </div>
                <div className="modal-form" style={{ padding: '16px' }}>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>{message}</p>
                    {warning && (
                        <div
                            className="confirm-dialog-warning"
                            style={{
                                marginTop: '12px',
                                padding: '10px 12px',
                                background: 'rgba(244, 67, 54, 0.1)',
                                border: '1px solid rgba(244, 67, 54, 0.3)',
                                borderRadius: 8,
                                fontSize: '0.9rem',
                                color: 'var(--palette-danger)',
                                lineHeight: 1.4
                            }}
                        >
                            {warning}
                        </div>
                    )}
                    <div
                        style={{
                            display: 'flex',
                            gap: '10px',
                            marginTop: '20px',
                            justifyContent: 'flex-end'
                        }}
                    >
                        <button
                            type="button"
                            className="modal-btn-secondary"
                            onClick={onCancel}
                            style={{ width: 'auto', padding: '8px 16px' }}
                        >
                            {cancelLabel}
                        </button>
                        <button
                            ref={confirmBtnRef}
                            type="button"
                            className={isDanger ? 'modal-btn-primary btn-destructive' : 'modal-btn-primary'}
                            onClick={onConfirm}
                            style={{ width: 'auto', padding: '8px 16px' }}
                        >
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
