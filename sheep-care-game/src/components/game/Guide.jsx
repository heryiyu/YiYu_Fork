import React, { useState, useRef } from 'react';
import { CloseButton } from '../ui/CloseButton';
import { GuideContent } from '../../pages/LiteGuide/GuideContent';
import './Guide.css';

export const Guide = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState('MANUAL');
    const closeBtnRef = useRef(null);

    return (
        <div className="debug-editor-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="guide-modal-title">
            <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '430px' }}>
                <div className="modal-header">
                    <h3 id="guide-modal-title">📖 牧羊人手冊</h3>
                    <CloseButton ref={closeBtnRef} onClick={onClose} ariaLabel="關閉" />
                </div>

                <div className="modal-form guide-modal-form">
                    <GuideContent activeTab={activeTab} onChangeTab={setActiveTab} />
                </div>
            </div>
        </div>
    );
};
