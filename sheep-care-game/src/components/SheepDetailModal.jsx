
import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { calculateSheepState, parseMaturity } from '../utils/gameLogic';

export const SheepDetailModal = ({ selectedSheepId, onClose }) => {
    const { sheep, updateSheep, prayForSheep, deleteSheep, forceLoadFromCloud, isAdmin } = useGame();

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

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
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

            setIsEditing(false); // Default to read-only
            setLocalMsg('');
        }
    }, [target?.id, activeTab]); // Re-run if ID changes. ActiveTab change shouldn't reset, but keeping data synced is good.

    if (!target) return null;

    const handleSave = () => {
        const finalMaturity = sLevel;
        const planData = {
            time: planTime,
            location: planLocation,
            content: planContent
        };
        updateSheep(target.id, {
            name,
            note,
            spiritualMaturity: finalMaturity,
            plan: planData // Will be merged into Spiritual_Journey_Planning by service
        });
        setIsEditing(false); // Exit edit mode
    };

    const handleCancel = () => {
        // Reset to original target data
        setName(target.name);
        setNote(target.note || '');
        const { level, stage } = parseMaturity(target.spiritualMaturity);
        setSLevel(level);
        setSStage(stage);

        // Reset Plan
        const plan = target.plan || {};
        setPlanTime(plan.time || '');
        setPlanLocation(plan.location || '');
        setPlanContent(plan.content || '');

        setIsEditing(false);
        setLocalMsg('');
    };

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

    return (
        <div className="debug-editor-overlay" onClick={onClose}>
            <div className="debug-editor simple-editor" onClick={(e) => e.stopPropagation()} style={{ width: '450px', maxHeight: '90vh', overflowY: 'auto' }}>
                <div className="editor-header">
                    <h3>{isDead ? '🪦 墓碑' : '📝 小羊資料'}</h3>
                    <button className="close-btn" onClick={onClose}>✖</button>
                </div>

                <div className="editor-form">

                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', borderBottom: '1px solid #ddd', paddingBottom: '0' }}>
                        <button
                            onClick={() => setActiveTab('BASIC')}
                            style={{
                                padding: '8px 16px',
                                border: 'none',
                                background: activeTab === 'BASIC' ? 'var(--color-primary-cream)' : 'transparent',
                                borderBottom: activeTab === 'BASIC' ? '3px solid var(--color-action-blue)' : 'none',
                                fontWeight: 'bold',
                                color: activeTab === 'BASIC' ? '#333' : '#999',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            基本資料
                        </button>
                        <button
                            onClick={() => setActiveTab('PLAN')}
                            style={{
                                padding: '8px 16px',
                                border: 'none',
                                background: activeTab === 'PLAN' ? 'var(--color-primary-cream)' : 'transparent',
                                borderBottom: activeTab === 'PLAN' ? '3px solid var(--color-action-pink)' : 'none',
                                fontWeight: 'bold',
                                color: activeTab === 'PLAN' ? '#333' : '#999',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            靈程規劃
                        </button>
                    </div>

                    {/* Content: Basic */}
                    {activeTab === 'BASIC' && (
                        <>
                            <div className="form-group" onClick={() => !isEditing && setIsEditing(true)} style={{ cursor: !isEditing ? 'pointer' : 'default' }} title={!isEditing ? "點擊編輯" : ""}>
                                <label>{isDead ? '墓誌銘 (姓名)' : '姓名'}</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    maxLength={10}
                                    placeholder="名字..."
                                    disabled={!isEditing}
                                    style={{ pointerEvents: !isEditing ? 'none' : 'auto' }}
                                />
                            </div>

                            <div className="form-group">
                                <label>狀態</label>
                                <div style={{
                                    padding: '8px',
                                    background: '#f5f5f5',
                                    borderRadius: '8px',
                                    display: 'flex', flexDirection: 'column', gap: '5px',
                                    color: isDead ? '#666' : (target.health >= 80 ? '#2196f3' : (target.status === 'healthy' ? 'green' : 'red'))
                                }}>
                                    <div>
                                        {getStatusText(target.status, target.health)}
                                        {!isDead && <span style={{ marginLeft: '10px' }}>負擔: {Math.ceil(target.health)}%</span>}
                                        {!isDead && <span style={{ marginLeft: '10px', color: '#ff9800' }}>❤️ 關愛: {target.careLevel || 0}</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="form-group" onClick={() => !isEditing && setIsEditing(true)} style={{ cursor: !isEditing ? 'pointer' : 'default' }} title={!isEditing ? "點擊編輯" : ""}>
                                <label>靈程 (Spiritual Maturity)</label>
                                <select
                                    value={sLevel}
                                    onChange={(e) => setSLevel(e.target.value)}
                                    disabled={!isEditing}
                                    style={{ width: '100%', padding: '8px', borderRadius: '8px', marginBottom: '5px', pointerEvents: !isEditing ? 'none' : 'auto' }}
                                >
                                    <option value="">-- 請選擇 --</option>
                                    <option value="新朋友">新朋友</option>
                                    <option value="慕道友">慕道友</option>
                                    <option value="基督徒">基督徒</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>負擔狀態 (依照數值)</label>
                                <div style={{ padding: '8px', background: '#eee', borderRadius: '8px', color: '#555', fontSize: '0.9rem' }}>
                                    {target.health < 40 ? '🍂 虛弱' : (target.health >= 80 ? '💪 強壯' : '🐑 正常')}
                                </div>
                                {isAdmin && !isDead && (
                                    <div style={{ marginTop: '10px', padding: '10px', background: '#e0f7fa', borderRadius: '8px', border: '1px dashed #00bcd4' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', color: '#006064' }}>🔧 管理員調整: {Math.ceil(target.health)}%</label>
                                        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
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
                                                style={{ flex: 1, cursor: 'pointer' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => updateSheep(target.id, { health: 0 })}
                                                style={{
                                                    padding: '2px 8px', fontSize: '0.8rem', background: '#ff5252', color: 'white',
                                                    border: 'none', borderRadius: '4px', cursor: 'pointer', whiteSpace: 'nowrap'
                                                }}
                                                title="直接歸零 (測試死亡)"
                                            >
                                                💀 歸零
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="form-group" onClick={() => !isEditing && setIsEditing(true)} style={{ cursor: !isEditing ? 'pointer' : 'default' }} title={!isEditing ? "點擊編輯" : ""}>
                                <label>備註 / 追憶</label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    rows={3}
                                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ddd', pointerEvents: !isEditing ? 'none' : 'auto' }}
                                    placeholder={isDead ? "寫下對牠的負擔..." : "記錄這隻小羊的狀況..."}
                                    disabled={!isEditing}
                                />
                            </div>
                        </>
                    )}

                    {/* Content: Spiritual Plan */}
                    {activeTab === 'PLAN' && (
                        <div className="spiritual-plan-form">
                            <div className="form-group" onClick={() => !isEditing && setIsEditing(true)} style={{ cursor: !isEditing ? 'pointer' : 'default' }}>
                                <label>📅 時間</label>
                                <input
                                    type="text"
                                    value={planTime}
                                    onChange={(e) => setPlanTime(e.target.value)}
                                    placeholder="例如：週日早上 10:00"
                                    disabled={!isEditing}
                                    style={{ pointerEvents: !isEditing ? 'none' : 'auto' }}
                                />
                            </div>
                            <div className="form-group" onClick={() => !isEditing && setIsEditing(true)} style={{ cursor: !isEditing ? 'pointer' : 'default' }}>
                                <label>📍 地點</label>
                                <input
                                    type="text"
                                    value={planLocation}
                                    onChange={(e) => setPlanLocation(e.target.value)}
                                    placeholder="例如：教會小組室"
                                    disabled={!isEditing}
                                    style={{ pointerEvents: !isEditing ? 'none' : 'auto' }}
                                />
                            </div>
                            <div className="form-group" onClick={() => !isEditing && setIsEditing(true)} style={{ cursor: !isEditing ? 'pointer' : 'default' }}>
                                <label>📝 內容規劃</label>
                                <textarea
                                    value={planContent}
                                    onChange={(e) => setPlanContent(e.target.value)}
                                    rows={5}
                                    placeholder="例如：讀經分享、生活關懷..."
                                    disabled={!isEditing}
                                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ddd', pointerEvents: !isEditing ? 'none' : 'auto' }}
                                />
                            </div>
                        </div>
                    )}

                    <button
                        className="pray-action-btn"
                        onClick={handlePray}
                        disabled={!isDead && isFull && !isAdmin}
                        style={{
                            opacity: (!isDead && isFull && !isAdmin) ? 0.6 : 1,
                            cursor: (!isDead && isFull && !isAdmin) ? 'not-allowed' : 'pointer',
                            background: isDead ? '#9c27b0' : undefined // Purple for magic
                        }}
                    >
                        {buttonText}
                    </button>

                    {localMsg && (
                        <div style={{
                            marginTop: '10px',
                            color: '#e65100',
                            fontSize: '0.9rem',
                            textAlign: 'center',
                            background: '#fff3e0',
                            padding: '8px',
                            borderRadius: '5px'
                        }}>
                            {localMsg}
                        </div>
                    )}

                    <hr style={{ margin: '15px 0', border: '0', borderTop: '1px solid #eee' }} />

                    {/* Main Actions - Save/Cancel Only */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {isEditing && (
                            <>
                                <button
                                    onClick={handleSave}
                                    disabled={!hasChanges}
                                    style={{
                                        flex: 1, height: '36px', padding: '0 5px',
                                        background: hasChanges ? '#4caf50' : '#ccc',
                                        color: 'white', border: 'none', borderRadius: '8px',
                                        cursor: hasChanges ? 'pointer' : 'not-allowed',
                                        whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem'
                                    }}
                                >
                                    儲存
                                </button>
                                <button
                                    onClick={handleCancel}
                                    style={{
                                        flex: 1, height: '36px', padding: '0 5px',
                                        background: '#29b6f6',
                                        color: 'white', border: 'none', borderRadius: '8px',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem'
                                    }}
                                >
                                    取消
                                </button>
                            </>
                        )}
                        {!isEditing && (
                            <div style={{
                                width: '100%', textAlign: 'center',
                                fontSize: '0.8rem', color: '#999', padding: '10px'
                            }}>
                                (若需刪除或重置，請使用列表的「選取」功能)
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>

    );
};
