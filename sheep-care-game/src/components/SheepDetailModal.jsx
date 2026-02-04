import React, { useState, useEffect, useRef } from 'react';
import { Heart, Plus, ChevronRight, Calendar } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { calculateSheepState, parseMaturity, isSleeping, getAwakeningProgress } from '../utils/gameLogic';
import { supabase } from '../services/supabaseClient';

export const SheepDetailModal = ({ selectedSheepId, onClose }) => {
    const { sheep, updateSheep, prayForSheep, deleteSheep, forceLoadFromCloud, isAdmin, lineId } = useGame();
    const modalRef = useRef(null);
    const closeBtnRef = useRef(null);

    const target = (sheep || []).find(s => s.id === selectedSheepId);
    const [name, setName] = useState('');
    const [note, setNote] = useState('');

    // Spiritual Maturity State
    const [sLevel, setSLevel] = useState('');
    const [sStage, setSStage] = useState('');

    // Spiritual Plan State
    const [plans, setPlans] = useState([]);
    const [viewMode, setViewMode] = useState('LIST');
    const [editingPlanId, setEditingPlanId] = useState(null);
    const [tempPlan, setTempPlan] = useState({ name: '', time: '', location: '', content: '' });
    const [reminderOffset, setReminderOffset] = useState(0); // 0 = On time, 15 = 15m before, -1 = No reminder

    const [planActionLoading, setPlanActionLoading] = useState(false);

    // Animation State
    const [isPrayingAnim, setIsPrayingAnim] = useState(false);

    // Tab State: 'BASIC' | 'PLAN'
    const [activeTab, setActiveTab] = useState('BASIC');
    const [localMsg, setLocalMsg] = useState('');

    // Fetch Plans from DB
    const fetchPlans = async () => {
        if (!target?.id) return;
        try {
            const { data, error } = await supabase
                .from('spiritual_plans')
                .select('*')
                .eq('sheep_id', target.id)
                .order('scheduled_time', { ascending: true });

            if (error) throw error;
            setPlans(data || []);
        } catch (error) {
            console.error('Error fetching plans:', error);
        }
    };

    useEffect(() => {
        if (target) {
            setName(target.name);
            setNote(target.note || '');
            const { level, stage } = parseMaturity(target.spiritualMaturity);
            setSLevel(level);
            setSStage(stage);
            setLocalMsg('');
            // Fetch remote plans
            fetchPlans();
            setViewMode('LIST');
        }
    }, [target?.id]);

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
        if (isSleeping(target) && target.lastPrayedDate === todayStr && !isAdmin) {
            setLocalMsg("今天已經為這隻小羊禱告過了，請明天再來！🙏");
            return;
        }
        prayForSheep(target.id);

        // Trigger Animation
        setIsPrayingAnim(true);
        setTimeout(() => setIsPrayingAnim(false), 800);

        setLocalMsg('');
    };

    const isSleepingState = isSleeping(target);
    const today = new Date().toDateString();
    const currentCount = (target.lastPrayedDate === today) ? (target.prayedCount || 0) : 0;
    const isFull = !isSleepingState && currentCount >= 3;

    let buttonText = '';
    if (isSleepingState) {
        buttonText = `🔮 喚醒禱告 (${getAwakeningProgress(target)}/5)`;
    } else {
        if (isAdmin) {
            buttonText = `🙏 為他禱告 (今日: ${currentCount}/∞)`;
        } else {
            buttonText = isFull ? '🙏 今日禱告已達上限' : `🙏 為他禱告 (今日: ${currentCount}/3)`;
        }
    }

    const getStatusText = (status, health) => {
        if (isSleeping({ status })) return '已沉睡 🪦';
        if (status === 'sick') return '生病 (需禱告恢復)';
        if (status === 'injured') return '受傷 (需禱告恢復)';
        if (health >= 80) return '強壯 💪';
        return '健康';
    };

    // Plan Management (DB Operations)
    const handleSavePlan = async () => {
        if (!tempPlan.name.trim()) {
            alert('請輸入規劃行動');
            return;
        }
        if (!lineId) {
            alert('請先登入');
            return;
        }

        setPlanActionLoading(true);
        // Calculate notify_at
        let notifyAt = null;
        let scheduledTime = null;

        if (tempPlan.time) {
            const dateObj = new Date(tempPlan.time);
            scheduledTime = dateObj.toISOString();

            if (reminderOffset !== -1) {
                // Calculate Reminder Time: Event Time - Offset
                const notifyTime = new Date(dateObj.getTime() - (reminderOffset * 60 * 1000));
                notifyAt = notifyTime.toISOString();
            }
        }

        const payload = {
            user_id: lineId,
            sheep_id: target.id,
            action: tempPlan.name,
            scheduled_time: scheduledTime,
            notify_at: notifyAt,
            reminder_offset: reminderOffset,
            location: tempPlan.location,
            content: tempPlan.content
        };

        // Reset notification ONLY if time changed or it's a new plan
        if (editingPlanId) {
            const originalPlan = plans.find(p => p.id === editingPlanId);
            if (originalPlan && originalPlan.notify_at !== notifyAt) {
                payload.is_notified = false;
            }
        } else {
            payload.is_notified = false;
        }

        try {
            if (editingPlanId) {
                const { error } = await supabase.from('spiritual_plans').update(payload).eq('id', editingPlanId);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('spiritual_plans').insert([payload]);
                if (error) throw error;
            }
            await fetchPlans();
            setViewMode('LIST');
            setEditingPlanId(null);
        } catch (error) {
            alert('儲存失敗: ' + error.message);
        } finally {
            setPlanActionLoading(false);
        }
    };

    const handleDeletePlan = async (id) => {
        if (!window.confirm('確定要刪除此規劃嗎？')) return;

        setPlanActionLoading(true);
        try {
            const { error } = await supabase
                .from('spiritual_plans')
                .delete()
                .eq('id', id);
            if (error) throw error;
            await fetchPlans();
            setViewMode('LIST');
            setEditingPlanId(null);
        } catch (error) {
            alert('刪除失敗: ' + (error?.message || ''));
        } finally {
            setPlanActionLoading(false);
        }
    };

    const handleCancelPlan = () => {
        setViewMode('LIST');
        setEditingPlanId(null);
        setTempPlan({ name: '', time: '', location: '', content: '' });
    };

    const openEditPlan = (plan) => {
        let timeStr = '';
        if (plan.scheduled_time) {
            const d = new Date(plan.scheduled_time);
            const offset = d.getTimezoneOffset() * 60000;
            timeStr = new Date(d.getTime() - offset).toISOString().slice(0, 16);
        }

        setTempPlan({
            name: plan.action || '',
            time: timeStr,
            location: plan.location || '',
            content: plan.content || ''
        });
        setReminderOffset(plan.reminder_offset !== undefined ? plan.reminder_offset : 0);
        setEditingPlanId(plan.id);
        setViewMode('EDIT');
    };

    const openAddPlan = () => {
        setTempPlan({ name: '', time: '', location: '', content: '' });
        setReminderOffset(15); // Default to 15 mins before
        setEditingPlanId(null);
        setViewMode('EDIT');
    };

    // Helper to display time
    const formatDisplayTime = (isoString) => {
        if (!isoString) return '';
        const d = new Date(isoString);
        return d.toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', weekday: 'short' });
    };

    const handleBasicAutoSave = (field, value) => {
        const payload = { [field]: value };
        if (field === 'sLevel') {
            payload.spiritualMaturity = value;
            delete payload.sLevel;
        }
        updateSheep(target.id, payload);
    };

    return (
        <div className="debug-editor-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="sheep-detail-title">
            <div className="modal-card" ref={modalRef} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 id="sheep-detail-title">{isSleepingState ? '🪦 沉睡紀錄' : '📝 小羊資料'}</h3>
                    <button ref={closeBtnRef} className="close-btn" onClick={onClose} aria-label="關閉">✖</button>
                </div>

                <div className="modal-form sheep-detail-modal-form">
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

                    <div className="sheep-detail-scroll">
                        {activeTab === 'BASIC' && (
                            <div className="sheep-detail-basic">
                                <div className="form-group">
                                    <label>{isSleepingState ? '沉睡紀錄 (姓名)' : '姓名'}</label>
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
                                    <div className="modal-status-box" style={{ color: isSleepingState ? '#666' : (target.health >= 80 ? '#2196f3' : (target.status === 'healthy' ? 'green' : 'var(--palette-danger)')) }}>
                                        <div>
                                            {getStatusText(target.status, target.health)}
                                            {!isSleepingState && <span style={{ marginLeft: '10px' }}>負擔: {Math.ceil(target.health)}%</span>}
                                            {!isSleepingState && <span style={{ marginLeft: '10px', color: '#ff9800', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Heart size={14} strokeWidth={2} fill="currentColor" /> 關愛: {target.careLevel || 0}</span>}
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

                                {isAdmin && !isSleepingState && (
                                    <div className="form-group">
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
                                                    title="直接歸零 (測試沉睡)"
                                                >
                                                    💀 歸零
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="form-group">
                                    <label>備註 (狀況需要)</label>
                                    <textarea
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        onBlur={() => handleBasicAutoSave('note', note)}
                                        rows={3}
                                        placeholder={isSleepingState ? "寫下對他的負擔..." : "記錄這隻小羊的狀況..."}
                                    />
                                </div>

                                <button
                                    className={`pray-action-btn ${isPrayingAnim ? 'praying' : ''}`}
                                    onClick={handlePray}
                                    disabled={!isSleepingState && isFull && !isAdmin}
                                    style={{
                                        opacity: (!isSleepingState && isFull && !isAdmin) ? 0.6 : 1,
                                        cursor: (!isSleepingState && isFull && !isAdmin) ? 'not-allowed' : 'pointer',
                                        position: 'relative', // Ensure particles position correctly
                                        overflow: 'visible'   // Allow particles to float out
                                    }}
                                >
                                    {buttonText}
                                    {isPrayingAnim && (
                                        <>
                                            <span className="pray-particle p1">🙏</span>
                                            <span className="pray-particle p2">❤️</span>
                                            <span className="pray-particle p3">✨</span>
                                        </>
                                    )}
                                </button>

                                {localMsg && (
                                    <div className="modal-local-msg">
                                        {localMsg}
                                    </div>
                                )}

                                <div className="modal-hint">
                                    (內容將自動儲存)
                                </div>
                            </div>
                        )}

                        {activeTab === 'PLAN' && (
                            <div className="spiritual-plan-container">
                                {viewMode === 'LIST' ? (
                                    <>
                                        <div className="plan-list-header">
                                            <button
                                                type="button"
                                                className="plan-add-btn"
                                                onClick={openAddPlan}
                                                title="新增靈程規劃"
                                                aria-label="新增靈程規劃"
                                            >
                                                <Plus size={18} strokeWidth={2.5} />
                                                <span>新增規劃</span>
                                            </button>
                                        </div>
                                        <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#ff9800', marginBottom: '10px' }}>
                                            ⚠️ 系統將自動刪除超過一個月的過期行程
                                        </div>

                                        <div className="plan-list">
                                            {plans.length === 0 ? (
                                                <div className="plan-list-empty">
                                                    <Calendar size={32} strokeWidth={1.5} />
                                                    <p>目前沒有靈程規劃</p>
                                                    <p className="plan-list-empty-hint">點擊上方「新增規劃」開始安排</p>
                                                </div>
                                            ) : (
                                                plans.map(p => (
                                                    <button
                                                        key={p.id}
                                                        type="button"
                                                        className="plan-item"
                                                        onClick={() => openEditPlan(p)}
                                                    >
                                                        <div className="plan-item-content">
                                                            <span className="plan-item-action">{p.action}</span>
                                                            {p.scheduled_time && (
                                                                <span className="plan-item-time">
                                                                    {formatDisplayTime(p.scheduled_time)}
                                                                </span>
                                                            )}
                                                            {p.location?.trim() && (
                                                                <span className="plan-item-location">{p.location}</span>
                                                            )}
                                                        </div>
                                                        <ChevronRight size={20} strokeWidth={2} className="plan-item-chevron" />
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="spiritual-plan-form">
                                        <div className="form-group">
                                            <label>📝 行動</label>
                                            <input
                                                type="text"
                                                value={tempPlan.name}
                                                onChange={(e) => setTempPlan({ ...tempPlan, name: e.target.value })}
                                                placeholder="例如：探訪、陪讀..."
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>📅 時間</label>
                                            <input
                                                type="datetime-local"
                                                value={tempPlan.time}
                                                onChange={(e) => setTempPlan({ ...tempPlan, time: e.target.value })}
                                            />
                                        </div>

                                        {tempPlan.time && (
                                            <div className="form-group">
                                                <label>⏰ 提醒設定</label>
                                                <select
                                                    value={reminderOffset}
                                                    onChange={(e) => setReminderOffset(Number(e.target.value))}
                                                >
                                                    <option value={-1}>🔕 不提醒</option>
                                                    <option value={0}>⚡ 準時提醒</option>
                                                    <option value={15}>🔔 提前 15 分鐘</option>
                                                    <option value={30}>🔔 提前 30 分鐘</option>
                                                    <option value={60}>🔔 提前 1 小時</option>
                                                    <option value={120}>🔔 提前 2 小時</option>
                                                    <option value={1440}>📅 提前 1 天</option>
                                                </select>
                                            </div>
                                        )}

                                        <div className="form-group">
                                            <label>📍 地點</label>
                                            <input
                                                type="text"
                                                value={tempPlan.location}
                                                onChange={(e) => setTempPlan({ ...tempPlan, location: e.target.value })}
                                                placeholder="例如：教會小組室"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>📋 內容規劃</label>
                                            <textarea
                                                value={tempPlan.content}
                                                onChange={(e) => setTempPlan({ ...tempPlan, content: e.target.value })}
                                                rows={5}
                                                placeholder="例如：讀經分享、生活關懷..."
                                            />
                                        </div>

                                        <div className="spiritual-plan-form-actions">
                                            <button
                                                type="button"
                                                className="modal-btn-secondary"
                                                onClick={handleCancelPlan}
                                                disabled={planActionLoading}
                                            >
                                                取消
                                            </button>
                                            {editingPlanId && (
                                                <button
                                                    type="button"
                                                    className="modal-btn-secondary btn-destructive"
                                                    onClick={() => handleDeletePlan(editingPlanId)}
                                                    disabled={planActionLoading}
                                                >
                                                    刪除
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                className="modal-btn-primary"
                                                onClick={handleSavePlan}
                                                disabled={planActionLoading}
                                            >
                                                {planActionLoading ? '處理中...' : '儲存'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
