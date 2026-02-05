import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { ConfirmDialog } from '../components/ConfirmDialog';

const ConfirmContext = createContext(null);
const isDev = import.meta?.env?.MODE !== 'production';

export const useConfirm = () => {
    const ctx = useContext(ConfirmContext);
    if (!ctx) {
        throw new Error('useConfirm must be used within ConfirmDialogProvider');
    }
    return typeof ctx === 'function' ? ctx : ctx.confirm;
};

export const ConfirmDialogProvider = ({ children }) => {
    const resolveRef = useRef(null);
    const [state, setState] = useState({
        open: false,
        title: '',
        message: '',
        warning: null,
        confirmLabel: '確定',
        cancelLabel: '取消',
        variant: 'default'
    });

    const confirm = useCallback((options = {}) => {
        return new Promise((resolve) => {
            resolveRef.current = resolve;
            if (isDev) {
                console.debug('[confirm] open', options);
            }
            setState({
                open: true,
                title: options.title ?? '確認',
                message: options.message ?? '',
                warning: options.warning ?? null,
                confirmLabel: options.confirmLabel ?? (options.variant === 'danger' ? '刪除' : '確定'),
                cancelLabel: options.cancelLabel ?? '取消',
                variant: options.variant ?? 'default'
            });
        });
    }, []);

    const handleConfirm = useCallback(() => {
        if (isDev) {
            console.debug('[confirm] confirm');
        }
        resolveRef.current?.(true);
        resolveRef.current = null;
        setState(prev => ({ ...prev, open: false }));
    }, []);

    const handleCancel = useCallback(() => {
        if (isDev) {
            console.debug('[confirm] cancel');
        }
        resolveRef.current?.(false);
        resolveRef.current = null;
        setState(prev => ({ ...prev, open: false }));
    }, []);

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}
            {ReactDOM.createPortal(
                <ConfirmDialog
                    open={state.open}
                    title={state.title}
                    message={state.message}
                    warning={state.warning}
                    confirmLabel={state.confirmLabel}
                    cancelLabel={state.cancelLabel}
                    variant={state.variant}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                />,
                document.body
            )}
        </ConfirmContext.Provider>
    );
};
