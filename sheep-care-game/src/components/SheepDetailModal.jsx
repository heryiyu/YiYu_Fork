import React, { useState, useEffect, useRef } from 'react';
import { Heart } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { calculateSheepState, parseMaturity } from '../utils/gameLogic';

export const SheepDetailModal = ({ selectedSheepId, onClose }) => {
    const { sheep, updateSheep, prayForSheep, deleteSheep, forceLoadFromCloud, isAdmin } = useGame();
    const modalRef = useRef(null);
    const closeBtnRef = useRef(null);

    const target = (sheep || []).find(s => s.id === selectedSheepId);
    const [name, setName] = useState('');
    const [note, setNote] = useState('');

    // Admin States
    // const [selectedType, setSelectedType] = useState('LAMB'); // removed manual control

    // Spiritual Maturity State
    const [sLevel, setSLevel] = useState('');
    const [sStage, setSStage] = useState('');

    // Spiritual Plan State
    const [planTime, setPlanTime] = useState('');
    const [planLocation, setPlanLocation] = useState('');
    const [planContent, setPlanContent] = useState('');

    // Tab State: 'BASIC' | 'PLAN'
    const [activeTab, setActiveTab] = useState('BASIC');
    const [localMsg, setLocalMsg] = useState('');

    useEffect(() => {
        if (target) {
            setName(target.name);
            setNote(target.note || '');
            // Parse "Level (Stage)" or just "Level"
            const { level, stage } = parseMaturity(target.spiritualMaturity);
            setSLevel(level);
            setSStage(stage);

            // Init Plan
            const plan = target.plan || {};
            setPlanTime(plan.time || '');
            setPlanLocation(plan.location || '');
            setPlanContent(plan.content || '');

            setLocalMsg('');
        }
    }, [target?.id, activeTab]); // Re-run if ID changes. ActiveTab change shouldn't reset, but keeping data synced is good.

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    useEffect(() => {
        closeBtnRef.current?.focus();
    }, [selectedSheepId]);

    if (!target) return null;

    const handlePray = () => {
        const todayStr = new Date().toDateString();
        // Check if Dead and already prayed today
        if (target.status === 'dead' && target.lastPrayedDate === todayStr && !isAdmin) {
            setLocalMsg("今天已經為這隻小羊禱告過了，請明天再來！🙏");
            return;
        }

        prayForSheep(target.id);
        // Optional: Set success feedback? Global toast handles it.
        // But if successful, maybe clear error msg?
        setLocalMsg('');
    };

    const isDead = target.status === 'dead';

    // Prayer / Resurrection Logic
    const today = new Date().toDateString();
    const currentCount = (target.lastPrayedDate === today) ? (target.prayedCount || 0) : 0;
    const isFull = !isDead && currentCount >= 3;

    // Button Text
    let buttonText = '';
    if (isDead) {
        buttonText = `🔮 迫切認領禱告 (${target.resurrectionProgress || 0}/5)`;
    } else {
        if (isAdmin) {
            buttonText = `🙏 為牠禱告 (今日: ${currentCount}/∞)`;
        } else {
            buttonText = isFull ? '🙏 今日禱告已達上限' : `🙏 為牠禱告 (今日: ${currentCount}/3)`;
        }
    }

    // Status Text
    const getStatusText = (status, health) => {
        if (status === 'dead') return '已安息 🪦';
        if (status === 'sick') return '生病 (需禱告恢復)';
        if (status === 'injured') return '受傷 (需禱告恢復)';
        if (health >= 80) return '強壯 💪';
        return '健康';
    };

    const startMat = target?.spiritualMaturity || '';
    let currentMat = sLevel;
    if (sLevel && sStage) currentMat = `${sLevel} (${sStage})`;

    const hasChanges = target && (
        name !== target.name ||
        note !== (target.note || '') ||
        currentMat !== startMat ||
        planTime !== (target.plan?.time || '') ||
        planLocation !== (target.plan?.location || '') ||
        planContent !== (target.plan?.content || '')
    );

    // Content: Basic
    const handleBasicAutoSave = (field, value) => {
        const payload = { [field]: value };
        // If updating maturity, we need partial merge logic if needed, but here simple value is fine or handled by service
        // Actually for Maturity 'sLevel', we update 'spiritualMaturity'
        if (field === 'sLevel') {
            payload.spiritualMaturity = value; // Simple level for now, or maintain existing stage logic?
            // The original handleSave used just sLevel.
            delete payload.sLevel;
        }
        updateSheep(target.id, payload);
    };

    return (
        <div className="debug-editor-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="sheep-detail-title">
            <div className="modal-card" ref={modalRef} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 id="sheep-detail-title">{isDead ? '🪦 墓碑' : '📝 小羊資料'}</h3>
                    <button ref={closeBtnRef} className="close-btn" onClick={onClose} aria-label="關閉">✖</button>
                </div>

                <div className="modal-form">

                    {/* Tabs */}
                    <div className="modal-tabs">
                        <button
                            className={`modal-tab ${activeTab === 'BASIC' ? 'modal-tab-active' : ''}`}
                            onClick={() => setActiveTab('BASIC')}
                        >
                            基本資料
                        </button>
                        <button
                            className={`modal-tab ${activeTab === 'PLAN' ? 'modal-tab-active' : ''}`}
                            data-tab="plan"
                            onClick={() => setActiveTab('PLAN')}
                        >
                            靈程規劃
                        </button>
                    </div>

                    {/* Content: Basic */}
                    {activeTab === 'BASIC' && (
                        <>
                            <div className="form-group">
                                <label>{isDead ? '墓誌銘 (姓名)' : '姓名'}</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    onBlur={() => handleBasicAutoSave('name', name)}
                                    maxLength={10}
                                    placeholder="名字..."
                                />
                            </div>

                            <div className="form-group">
                                <label>狀態</label>
                                <div className="modal-status-box" style={{ color: isDead ? '#666' : (target.health >= 80 ? '#2196f3' : (target.status === 'healthy' ? 'green' : 'var(--palette-danger)')) }}>
                                    <div>
                                        {getStatusText(target.status, target.health)}
                                        {!isDead && <span style={{ marginLeft: '10px' }}>負擔: {Math.ceil(target.health)}%</span>}
                                        {!isDead && <span style={{ marginLeft: '10px', color: '#ff9800', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Heart size={14} strokeWidth={2} fill="currentColor" /> 關愛: {target.careLevel || 0}</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>靈程 (Spiritual Maturity)</label>
                                <select
                                    value={sLevel}
                                    onChange={(e) => {
                                        setSLevel(e.target.value);
                                        handleBasicAutoSave('sLevel', e.target.value);
                                    }}
                                >
                                    <option value="">-- 請選擇 --</option>
                                    <option value="新朋友">新朋友</option>
                                    <option value="慕道友">慕道友</option>
                                    <option value="基督徒">基督徒</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>負擔狀態 (依照數值)</label>
                                <div className="modal-info-box">
                                    {target.health < 40 ? '🍂 虛弱' : (target.health >= 80 ? '💪 強壯' : '🐑 正常')}
                                </div>
                                {isAdmin && !isDead && (
                                    <div className="modal-admin-box">
                                        <label>🔧 管理員調整: {Math.ceil(target.health)}%</label>
                                        <div className="admin-actions">
                                            <input
                                                type="range"
                                                min="1"
                                                max="100"
                                                value={target.health}
                                                onChange={(e) => {
                                                    const newHealth = Number(e.target.value);
                                                    const { health, status, type } = calculateSheepState(newHealth, target.status);
                                                    updateSheep(target.id, { health, type, status });
                                                }}
                                            />
                                            <button
                                                type="button"
                                                className="admin-reset-btn btn-destructive"
                                                onClick={() => updateSheep(target.id, { health: 0 })}
                                                title="直接歸零 (測試死亡)"
                                            >
                                                💀 歸零
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label>備註 / 追憶</label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    onBlur={() => handleBasicAutoSave('note', note)}
                                    rows={3}
                                    placeholder={isDead ? "寫下對牠的負擔..." : "記錄這隻小羊的狀況..."}
                                />
                            </div>

                            <button
                                className="pray-action-btn"
                                onClick={handlePray}
                                disabled={!isDead && isFull && !isAdmin}
                                style={{
                                    opacity: (!isDead && isFull && !isAdmin) ? 0.6 : 1,
                                    cursor: (!isDead && isFull && !isAdmin) ? 'not-allowed' : 'pointer',
                                }}
                            >
                                {buttonText}
                            </button>

                            {localMsg && (
                                <div className="modal-local-msg">
                                    {localMsg}
                                </div>
                            )}

                            <div className="modal-hint">
                                (內容將自動儲存)
                            </div>
                        </>
                    )}

                    {/* Content: Spiritual Plan (Auto-Save, No Buttons) */}
                    {activeTab === 'PLAN' && (
                        <div className="spiritual-plan-form">
                            <div className="form-group">
                                <label>📅 時間</label>
                                <input
                                    type="text"
                                    value={planTime}
                                    onChange={(e) => setPlanTime(e.target.value)}
                                    onBlur={() => updateSheep(target.id, { plan: { time: planTime, location: planLocation, content: planContent } })}
                                    placeholder="例如：週日早上 10:00"
                                />
                            </div>
                            <div className="form-group">
                                <label>📍 地點</label>
                                <input
                                    type="text"
                                    value={planLocation}
                                    onChange={(e) => setPlanLocation(e.target.value)}
                                    onBlur={() => updateSheep(target.id, { plan: { time: planTime, location: planLocation, content: planContent } })}
                                    placeholder="例如：教會小組室"
                                />
                            </div>
                            <div className="form-group">
                                <label>📝 內容規劃</label>
                                <textarea
                                    value={planContent}
                                    onChange={(e) => setPlanContent(e.target.value)}
                                    onBlur={() => updateSheep(target.id, { plan: { time: planTime, location: planLocation, content: planContent } })}
                                    rows={5}
                                    placeholder="例如：讀經分享、生活關懷..."
                                />
                            </div>
                            <div className="modal-hint">
                                (內容將自動儲存)
                            </div>
                        </div>
                    )}
                </div>
            </div>

        </div>

    );
};
