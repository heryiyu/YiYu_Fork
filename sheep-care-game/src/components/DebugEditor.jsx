
import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';

export const DebugEditor = ({ selectedSheepId, onClose }) => {
    const { sheep, updateSheep, prayForSheep } = useGame();

    const target = (sheep || []).find(s => s.id === selectedSheepId);
    const [name, setName] = useState('');
    const [note, setNote] = useState('');

    useEffect(() => {
        if (target) {
            setName(target.name);
            setNote(target.note || '');
        }
    }, [target?.id]);

    if (!target) return null;

    const handleSave = () => {
        updateSheep(target.id, { name, note });
        onClose();
    };

    const handlePray = () => {
        prayForSheep(target.id);
    };

    const isDead = target.status === 'dead';

    // Prayer / Resurrection Logic
    const today = new Date().toDateString();
    const currentCount = (target.lastPrayedDate === today) ? (target.prayedCount || 0) : 0;
    const isFull = !isDead && currentCount >= 3;

    // Button Text
    let buttonText = '';
    if (isDead) {
        buttonText = `🔮 進行復活儀式 (${target.resurrectionProgress || 0}/5)`;
    } else {
        buttonText = isFull ? '🙏 今日禱告已達上限' : `🙏 為牠禱告 (今日: ${currentCount}/3)`;
    }

    // Status Text
    const getStatusText = (status) => {
        if (status === 'dead') return '已安息 🪦';
        if (status === 'sick') return '生病 (需禱告恢復)';
        if (status === 'injured') return '受傷 (需禱告恢復)';
        return '健康';
    };

    return (
        <div className="debug-editor-overlay">
            <div className="debug-editor simple-editor">
                <div className="editor-header">
                    <h3>{isDead ? '🪦 墓碑' : '📝 小羊資料'}</h3>
                    <button className="close-btn" onClick={onClose}>✖</button>
                </div>

                <div className="editor-form">
                    <div className="form-group">
                        <label>{isDead ? '墓誌銘 (姓名)' : '姓名'}</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={10}
                            placeholder="名字..."
                        />
                    </div>

                    <div className="form-group">
                        <label>狀態</label>
                        <div style={{
                            padding: '8px',
                            background: '#f5f5f5',
                            borderRadius: '8px',
                            color: isDead ? '#666' : (target.status === 'healthy' ? 'green' : 'red')
                        }}>
                            {getStatusText(target.status)} <br />
                            {!isDead && <small>健康度: {Math.round(target.health)}%</small>}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>備註 / 追憶</label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={3}
                            style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ddd' }}
                            placeholder={isDead ? "寫下對牠的思念..." : "記錄這隻小羊的狀況..."}
                        />
                    </div>

                    <button
                        className="pray-action-btn"
                        onClick={handlePray}
                        disabled={!isDead && isFull}
                        style={{
                            opacity: (!isDead && isFull) ? 0.6 : 1,
                            cursor: (!isDead && isFull) ? 'not-allowed' : 'pointer',
                            background: isDead ? '#9c27b0' : undefined // Purple for magic
                        }}
                    >
                        {buttonText}
                    </button>

                    <button className="save-btn" onClick={handleSave}>儲存並關閉</button>
                </div>
            </div>
        </div>
    );
};
