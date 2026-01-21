import React from 'react';
import { useGame } from '../context/GameContext';

export const SettingsModal = ({ onClose }) => {
    const { settings, updateSetting } = useGame();

    const handleChange = (e) => {
        updateSetting('maxVisibleSheep', parseInt(e.target.value));
    };

    return (
        <div className="debug-editor-overlay" onClick={onClose}>
            <div
                className="simple-editor"
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '320px',
                    padding: '20px',
                    borderRadius: '15px',
                    background: '#fff',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                }}
            >
                <div className="editor-header" style={{ marginBottom: '20px', textAlign: 'center' }}>
                    <h3>⚙️ 顯示設定</h3>
                </div>

                <div style={{ marginBottom: '25px' }}>
                    <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#555' }}>
                        畫面顯示小羊數量
                        <span style={{ float: 'right', color: '#2196f3' }}>
                            {settings.maxVisibleSheep} 隻
                        </span>
                    </label>

                    <input
                        type="range"
                        min="10"
                        max="50"
                        step="5"
                        value={settings.maxVisibleSheep}
                        onChange={handleChange}
                        style={{ width: '100%', cursor: 'pointer' }}
                    />

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#999', marginTop: '5px' }}>
                        <span>10 (效能)</span>
                        <span>50 (豐富)</span>
                    </div>

                    <p style={{ fontSize: '0.8rem', color: '#777', marginTop: '10px', background: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
                        💡 當小羊總數超過此設定時，系統會每分鐘<b>隨機輪播</b>，讓不同的小羊輪流出來透氣，同時保持畫面流暢不卡頓。
                    </p>
                </div>

                <button
                    onClick={onClose}
                    style={{
                        width: '100%',
                        padding: '12px',
                        background: '#2196f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    確定
                </button>
            </div>
        </div>
    );
};
