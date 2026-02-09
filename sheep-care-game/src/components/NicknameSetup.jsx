import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { CloseButton } from './ui/CloseButton';
import { Portal } from './ui/Portal';

export const NicknameSetup = ({ onClose }) => {
    const { updateNickname, nickname, weather, location } = useGame();
    const [name, setName] = useState(nickname || '');
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(!nickname); // Default to edit if no nickname (setup mode)

    const isProfileMode = !!onClose; // "Profile Mode" vs "Initial Setup Mode"

    const weatherMap = {
        sunny: '晴天', cloudy: '多雲', rain: '下雨', storm: '暴風雨', snow: '下雪'
    };
    const weatherLabel = weatherMap[weather?.type] || '晴天';

    const handleSave = (e) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('請輸入暱稱');
            return;
        }
        if (name.length > 12) {
            setError('暱稱太長囉 (12字內)');
            return;
        }
        updateNickname(name.trim());
        setIsEditing(false); // Exit edit mode
        if (!isProfileMode && onClose) { // If initial setup mode and onClose is provided (e.g., for a modal)
            onClose();
        }
    };

    // --- RENDER: PROFILE POPOVER (Top Left) ---
    if (isProfileMode) {
        return (
            <Portal>
                {/* Transparent Backdrop to close on click outside */}
                <div
                    style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 'calc(var(--z-cursor) - 1)' }}
                    onClick={onClose}
                />

                {/* The Card */}
                <div style={{
                    position: 'fixed',
                    top: '20px', left: '20px',
                    width: '320px',
                    background: 'var(--bg-card)',
                    borderRadius: '20px',
                    padding: '20px',
                    boxShadow: 'var(--shadow-card)',
                    border: '1px solid var(--border-subtle)',
                    zIndex: 'var(--z-cursor)',
                    animation: 'popIn 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)'
                }}>
                    <style>{`@keyframes popIn { from { transform: scale(0.8) translate(-10%, -10%); opacity: 0; } to { transform: scale(1) translate(0, 0); opacity: 1; } }`}</style>

                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3 style={{ margin: 0, color: 'var(--text-header)' }}>📄 牧場主資料</h3>
                        <CloseButton onClick={onClose} ariaLabel="關閉" />
                    </div>

                    {/* Info Block (Always Visible) */}
                    <div style={{
                        background: 'var(--bg-card-secondary)',
                        padding: '12px', borderRadius: '12px', marginBottom: '20px',
                        display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.95rem', color: 'var(--text-body)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '1.2rem' }}>📍</span>
                            <span>{location?.name || '未知區域'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '1.2rem' }}>🌡️</span>
                            <span>{weatherLabel} ({weather?.temp || 25}°C)</span>
                        </div>
                    </div>

                    {/* Nickname Section */}
                    {isEditing ? (
                        <form onSubmit={handleSave}>
                            <div style={{ fontSize: '0.9rem', marginBottom: '5px', color: 'var(--text-muted)' }}>修改暱稱:</div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => { setName(e.target.value); setError(''); }}
                                    placeholder="輸入新暱稱"
                                    style={{
                                        flex: 1, padding: '8px 12px', borderRadius: '8px',
                                        border: '1px solid #ddd', outline: 'none'
                                    }}
                                    autoFocus
                                />
                                <button type="submit" style={{
                                    background: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px',
                                    padding: '0 15px', cursor: 'pointer'
                                }}>保存</button>
                            </div>
                            {error && <div style={{ color: 'var(--text-accent)', fontSize: '0.8rem', marginTop: '5px' }}>{error}</div>}
                        </form>
                    ) : (
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '10px 12px', border: '1px solid #eee', borderRadius: '12px'
                        }}>
                            <div>
                                <div style={{ fontSize: '0.8rem', color: '#888' }}>目前暱稱</div>
                                <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#333' }}>{nickname}</div>
                            </div>
                            <button
                                onClick={() => setIsEditing(true)}
                                style={{
                                    background: '#f0f0f0', border: 'none', borderRadius: '20px',
                                    padding: '8px 15px', fontSize: '0.9rem', cursor: 'pointer', color: '#555'
                                }}
                            >
                                ✏️ 修改
                            </button>
                        </div>
                    )}
                </div>
            </Portal>
        );
    }

    // --- RENDER: INITIAL SETUP (Centered Modal) ---
    return (
        <Portal>
            <div className="debug-editor-overlay" style={{ background: 'var(--bg-modal-overlay)' }}>
                <div className="modal-card modal-card--sm">
                    <div className="modal-header">
                        <h3>✨ 歡迎來到牧場</h3>
                        <div style={{ width: 32, height: 32, flexShrink: 0 }} aria-hidden="true" />
                    </div>
                    <div className="modal-form" style={{ textAlign: 'center', padding: '24px' }}>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.6' }}>
                            為了讓羊群認識您<br />
                            請告訴我們您的暱稱
                        </p>

                        <form onSubmit={handleSave}>
                            <div className="form-group">
                                <label htmlFor="nickname-setup-input">暱稱</label>
                                <input
                                    id="nickname-setup-input"
                                    type="text"
                                    value={name}
                                    onChange={(e) => { setName(e.target.value); setError(''); }}
                                    placeholder="請輸入您的暱稱"
                                    style={{ textAlign: 'center' }}
                                    autoFocus
                                />
                            </div>
                            {error && <div style={{ color: 'var(--palette-text-status)', fontSize: '0.9rem', marginBottom: '15px' }}>{error}</div>}

                            <button
                                type="submit"
                                className="modal-btn-primary"
                                disabled={!name.trim()}
                                style={{
                                    width: '100%',
                                    background: !name.trim() ? 'var(--btn-disabled-bg)' : undefined,
                                    marginTop: '10px'
                                }}
                            >
                                開始牧羊 🐑
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </Portal>
    );
};
