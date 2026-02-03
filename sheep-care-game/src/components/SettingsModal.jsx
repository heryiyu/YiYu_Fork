import React, { useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';

export const SettingsModal = ({ onClose }) => {
    const { settings, updateSetting } = useGame();
    const closeBtnRef = useRef(null);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    useEffect(() => {
        closeBtnRef.current?.focus();
    }, []);

    const handleChange = (e) => {
        updateSetting('maxVisibleSheep', parseInt(e.target.value));
    };

    return (
        <div className="debug-editor-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="settings-modal-title">
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 id="settings-modal-title">⚙️ 顯示設定</h3>
                    <button ref={closeBtnRef} className="close-btn" onClick={onClose} aria-label="關閉">✖</button>
                </div>

                <div className="modal-form">
                    <div className="form-group">
                        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>畫面顯示小羊數量</span>
                            <span style={{ color: 'var(--palette-blue-action)' }}>{settings.maxVisibleSheep} 隻</span>
                        </label>

                        <input
                            type="range"
                            min="10"
                            max="50"
                            step="5"
                            value={settings.maxVisibleSheep}
                            onChange={handleChange}
                        />

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#999', marginTop: '5px' }}>
                            <span>10 (效能)</span>
                            <span>50 (豐富)</span>
                        </div>

                        <p className="modal-info-box" style={{ marginTop: '10px' }}>
                            💡 當小羊總數超過此設定時，系統會每分鐘<b>隨機輪播</b>，讓不同的小羊輪流出來透氣，同時保持畫面流暢不卡頓。
                        </p>
                    </div>



                    <button className="modal-btn-primary" onClick={onClose}>
                        確定
                    </button>
                </div>
            </div>
        </div>
    );
};
