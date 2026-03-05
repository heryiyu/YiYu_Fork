import React, { useEffect, useRef } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { CloseButton } from '../ui/CloseButton';
import { SettingsContent } from '../../pages/LiteSettings/SettingsContent';

export const SettingsModal = ({ onClose }) => {
    const closeBtnRef = useRef(null);
    const isMobile = useIsMobile();
    const [activeTab, setActiveTab] = React.useState('QUEUE');

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    useEffect(() => {
        if (!isMobile) {
            closeBtnRef.current?.focus();
        }
    }, [isMobile]);

    return (
        <div className="debug-editor-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="settings-modal-title">
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 id="settings-modal-title">⚙️ 設定 <span style={{ fontSize: '0.7em', opacity: 0.7, marginLeft: '5px' }}>v1.1.0</span></h3>
                    <CloseButton ref={closeBtnRef} onClick={onClose} ariaLabel="關閉" />
                </div>

                <div className="modal-form">
                    <SettingsContent
                        activeTab={activeTab}
                        onChangeTab={setActiveTab}
                        onSave={onClose}
                    />
                </div>
            </div>
        </div>
    );
};
