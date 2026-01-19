
import React, { useState } from 'react';
import { useGame } from '../context/GameContext';

export const SettingsModal = ({ onClose }) => {
    const { currentUser, location, updateUserLocation, updateUserName, saveToCloud } = useGame();
    const [cityInput, setCityInput] = useState(location?.name || '');
    const [nameInput, setNameInput] = useState(currentUser || '');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleUpdateLocation = async () => {
        if (!cityInput.trim()) return;
        setIsLoading(true);
        await updateUserLocation(cityInput);
        setIsLoading(false);
    };

    const handleUpdateName = () => {
        if (!nameInput.trim()) return;
        updateUserName(nameInput.trim());
    };

    return (
        <div className="debug-editor-overlay" onClick={onClose}>
            <div className="debug-editor simple-editor" onClick={(e) => e.stopPropagation()} style={{ width: '350px' }}>
                <div className="editor-header">
                    <h3>⚙️ 設定</h3>
                    <button className="close-btn" onClick={onClose}>✖</button>
                </div>

                <div className="editor-form">
                    <div className="form-group">
                        <label>👤 您的稱呼 (暱稱)</label>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <input
                                type="text"
                                value={nameInput}
                                onChange={(e) => setNameInput(e.target.value)}
                                placeholder="輸入新的暱稱"
                            />
                            <button
                                onClick={handleUpdateName}
                                style={{
                                    background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px',
                                    padding: '0 10px', cursor: 'pointer'
                                }}
                            >
                                修改
                            </button>
                        </div>
                    </div>

                    <hr style={{ margin: '15px 0', border: '0', borderTop: '1px solid #eee' }} />

                    <div className="form-group">
                        <label>📍 所在地城市 (天氣資料)</label>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <input
                                type="text"
                                value={cityInput}
                                onChange={(e) => setCityInput(e.target.value)}
                                placeholder="輸入城市名稱 (例如: Taipei, Tokyo)"
                            />
                            <button
                                onClick={handleUpdateLocation}
                                disabled={isLoading}
                                style={{
                                    background: '#2196f3', color: 'white', border: 'none', borderRadius: '4px',
                                    padding: '0 10px', cursor: isLoading ? 'wait' : 'pointer'
                                }}
                            >
                                {isLoading ? '⏳' : '更新'}
                            </button>
                        </div>
                        <p style={{ fontSize: '0.7rem', color: '#999', margin: '5px 0' }}>目前位置: {location?.name} ({location?.lat?.toFixed(2)}, {location?.lon?.toFixed(2)})</p>
                    </div>

                    <hr style={{ margin: '15px 0', border: '0', borderTop: '1px solid #eee' }} />

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={async () => { await saveToCloud(); alert("已手動備份至雲端！"); }}
                            style={{ flex: 1, padding: '10px', background: '#ffa000', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                        >
                            ☁️ 手動備份
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};
