import React from 'react';
import { Portal } from '../ui/Portal';
import { ScheduleListContent } from './ScheduleListContent';
import '../../styles/design-tokens.css';

export const ScheduleListModal = ({ onClose, onSelectSheep }) => {
    return (
        <Portal>
            <div className="debug-editor-overlay" onClick={onClose}>
                <div
                    className="modal-content"
                    onClick={e => e.stopPropagation()}
                    style={{
                        maxWidth: '480px',
                        width: '95vw',
                        padding: '0',
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        maxHeight: '85vh',
                        overflow: 'hidden',
                        background: 'var(--bg-card)',
                        borderRadius: '24px',
                        boxShadow: 'var(--shadow-card)'
                    }}
                >
                    <ScheduleListContent onClose={onClose} />
                </div>
            </div>
        </Portal>
    );
};
