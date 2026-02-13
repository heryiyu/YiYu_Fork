import React, { useState, useEffect, useRef } from 'react';
import { Heart, Plus, ChevronRight, Calendar, ChevronUp, ChevronDown, Settings, X, Check, Megaphone, Sparkles, Users, HeartHandshake, Flame, BookOpen } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useGame } from '../context/GameContext';
import { useConfirm } from '../context/ConfirmContext.jsx';
import { calculateSheepState, isSleeping, getAwakeningProgress } from '../utils/gameLogic';
import { supabase } from '../services/supabaseClient';
import { TagManagerModal } from './TagManagerModal';
import { ModalHint } from './ModalHint';
import { CloseButton } from './ui/CloseButton';
import { Slider } from './ui/Slider';
import { Tag } from './ui/Tag';
import { IconButton, IconButtonGroup } from './ui/IconButton';
import { Tooltip } from './ui/Tooltip';
import { Portal } from './ui/Portal';
import { generateGoogleCalendarUrl } from '../utils/calendarHelper';

const TagSelect = ({ sheepId, tags, assignedIds, onSave }) => {
    const [orderedIds, setOrderedIds] = useState(assignedIds);
    useEffect(() => { setOrderedIds(assignedIds || []); }, [(assignedIds || []).join(',')]);

    const addTag = (tagId) => {
        if (orderedIds.includes(tagId)) return;
        const next = [...orderedIds, tagId];
        setOrderedIds(next);
        onSave(next);
    };

    const removeTag = (tagId) => {
        const next = orderedIds.filter(id => id !== tagId);
        setOrderedIds(next);
        onSave(next);
    };

    const moveUp = (idx) => {
        if (idx <= 0) return;
        const next = [...orderedIds];
        [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
        setOrderedIds(next);
        onSave(next);
    };

    const moveDown = (idx) => {
        if (idx >= orderedIds.length - 1) return;
        const next = [...orderedIds];
        [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
        setOrderedIds(next);
        onSave(next);
    };

    const availableTags = tags.filter(t => !orderedIds.includes(t.id));

    return (
        <div className="tag-select">
            <div className="form-group" style={{ marginBottom: '8px' }}>
                <select
                    id="tag-select-dropdown"
                    value=""
                    onChange={(e) => {
                        const id = e.target.value;
                        if (id) { addTag(id); e.target.value = ''; }
                    }}
                    aria-label="選擇標籤"
                >
                    <option value="">選擇標籤加入...</option>
                    {availableTags.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0 0 8px 0', lineHeight: 1.4 }}>
                {orderedIds.length > 0 ? '第一個標籤會顯示在卡片上，可用 ↑↓ 調整順序。' : '選擇標籤後，第一個會顯示在卡片上。'}
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }} role="list">
                {orderedIds.map((tagId, idx) => {
                    const tag = tags.find(t => t.id === tagId);
                    if (!tag) return null;
                    return (
                        <li
                            key={tagId}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                marginBottom: '8px',
                                padding: '4px 8px',
                                background: 'rgba(0,0,0,0.02)',
                                borderRadius: '8px'
                            }}
                        >
                            <Tag name={tag.name} color={tag.color} className="tag-select-tag" style={{ flex: 1, textAlign: 'center' }} />
                            <IconButtonGroup>
                                <IconButton icon={ChevronUp} onClick={() => moveUp(idx)} disabled={idx === 0} ariaLabel="上移" />
                                <IconButton icon={ChevronDown} onClick={() => moveDown(idx)} disabled={idx === orderedIds.length - 1} ariaLabel="下移" />
                                <IconButton icon={X} onClick={() => removeTag(tagId)} ariaLabel="移除" className="icon-btn--muted" />
                            </IconButtonGroup>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

import { useIsMobile } from '../hooks/useIsMobile';

export const SheepDetailModal = ({ selectedSheepId, onClose }) => {
    const { sheep, updateSheep, prayForSheep, completePlan, deleteSheep, forceLoadFromCloud, isAdmin, lineId, tags, tagAssignmentsBySheep, setSheepTags, notifyScheduleUpdate } = useGame();
    const confirm = useConfirm();
    const modalRef = useRef(null);
    const closeBtnRef = useRef(null);
    const isMobile = useIsMobile();

    const target = (sheep || []).find(s => s.id === selectedSheepId);
    const [name, setName] = useState('');
    const [note, setNote] = useState('');

    // Spiritual Plan State
    const [plans, setPlans] = useState([]);
    const [viewMode, setViewMode] = useState('LIST');
    const [editingPlanId, setEditingPlanId] = useState(null);
    const [tempPlan, setTempPlan] = useState({ name: '', time: '', location: '', content: '' });
    const [reminderOffset, setReminderOffset] = useState(0); // 0 = On time, 15 = 15m before, -1 = No reminder

    // Check List State
    const [completionData, setCompletionData] = useState({ note: '', tags: [] });
    const FEEDBACK_TAGS = ['成功接觸', '反應良好', '參加聚會', '決志禱告', '願意受洗'];

    const [planActionLoading, setPlanActionLoading] = useState(false);

    // Animation State
    const [isPrayingAnim, setIsPrayingAnim] = useState(false);

    // Tab State: 'DASHBOARD' | 'PLAN' | 'EFFECTS' | 'SETTINGS'
    const [activeTab, setActiveTab] = useState('DASHBOARD');
    const [localMsg, setLocalMsg] = useState('');
    const [showTagManager, setShowTagManager] = useState(false);
    const [showWinningModal, setShowWinningModal] = useState(false);

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
            setLocalMsg('');
            // Fetch remote plans
            fetchPlans();
            setViewMode('LIST');
            setActiveTab('DASHBOARD'); // Reset to Dashboard on open
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
        if (!isMobile) {
            closeBtnRef.current?.focus();
        }
    }, [selectedSheepId, isMobile]);

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
            notifyScheduleUpdate();
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
        const ok = await confirm({
            title: '刪除規劃',
            message: '確定要刪除此認領規劃嗎？',
            variant: 'danger',
            confirmLabel: '刪除'
        });
        if (!ok) return;

        setPlanActionLoading(true);
        try {
            const { error } = await supabase
                .from('spiritual_plans')
                .delete()
                .eq('id', id);
            if (error) throw error;
            notifyScheduleUpdate();
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

    const handlePlanClick = (plan) => {
        if (plan.completed_at) {
            setCompletionData({
                note: plan.feedback?.note || '',
                tags: plan.feedback?.tags || [],
                completedAt: plan.completed_at
            });
            setViewMode('RESULT');
        } else {
            openEditPlan(plan);
        }
    };

    const openCompletePlan = (plan) => {
        setEditingPlanId(plan.id);
        setCompletionData({ note: '', tags: [] });
        setViewMode('COMPLETE');
    };

    const handleCompleteSubmit = async () => {
        if (!editingPlanId) return;
        setPlanActionLoading(true);
        try {
            await completePlan(editingPlanId, target.id, completionData);
            notifyScheduleUpdate();
            await fetchPlans();
            setViewMode('LIST');
            setEditingPlanId(null);
        } catch (error) {
            alert('提交失敗: ' + error.message);
        } finally {
            setPlanActionLoading(false);
        }
    };

    const toggleFeedbackTag = (tag) => {
        setCompletionData(prev => {
            const current = prev.tags;
            if (current.includes(tag)) {
                return { ...prev, tags: current.filter(t => t !== tag) };
            } else {
                return { ...prev, tags: [...current, tag] };
            }
        });
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

    // Stamp System
    const STAMPS = [
        { id: 'evangelism', label: '參與過佈道活動', icon: Megaphone, color: '#FF6B6B' },
        { id: 'sunday_service', label: '參與過特會/主日', icon: Sparkles, color: '#FFD93D' },
        { id: 'small_group', label: '參與過小組', icon: Users, color: '#4D96FF' },
        { id: 'decision_prayer', label: '決志禱告', icon: HeartHandshake, color: '#FF4D94' },
        { id: 'altar_rpg', label: '築壇RPG', icon: Flame, color: '#FF8C42' },
        { id: 'stable_devotion', label: '穩定靈修', icon: BookOpen, color: '#6BCB77' },
    ];

    const handleStampToggle = (stampId) => {
        if (!target) return;
        const currentStamps = target.stamps || {};
        const isStamped = !!currentStamps[stampId];

        const newStamps = { ...currentStamps };

        if (isStamped) {
            delete newStamps[stampId]; // Toggle off
        } else {
            newStamps[stampId] = true; // Toggle on
            // Optional: Haptic/Sound effect here

            // Trigger confetti (Enabled for ALL stamps)
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                zIndex: 9999
            });
            setShowWinningModal(true);
        }

        updateSheep(target.id, { stamps: newStamps });
    };

    return (
        <Portal>
            <div className="debug-editor-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="sheep-detail-title">
                <div className="modal-card" ref={modalRef} onClick={(e) => e.stopPropagation()}>
                    {/* ... content ... */}
                    <div className="modal-header">
                        <h3 id="sheep-detail-title">{isSleepingState ? `🪦 沉睡紀錄 (${target.name})` : `📝 ${target.name} 的資料`}</h3>
                        <CloseButton ref={closeBtnRef} onClick={onClose} ariaLabel="關閉" />
                    </div>

                    <div className="modal-form sheep-detail-modal-form">
                        <div className="modal-tabs">
                            <button
                                className={`modal-tab ${activeTab === 'DASHBOARD' ? 'modal-tab-active' : ''}`}
                                onClick={() => setActiveTab('DASHBOARD')}
                            >
                                總覽
                            </button>
                            <button
                                className={`modal-tab ${activeTab === 'PLAN' ? 'modal-tab-active' : ''}`}
                                data-tab="plan"
                                onClick={() => setActiveTab('PLAN')}
                            >
                                認領規劃
                            </button>
                            <button
                                className={`modal-tab ${activeTab === 'EFFECTS' ? 'modal-tab-active' : ''}`}
                                data-tab="effects"
                                onClick={() => setActiveTab('EFFECTS')}
                            >
                                認領果效
                            </button>
                            <button
                                className={`modal-tab ${activeTab === 'SETTINGS' ? 'modal-tab-active' : ''}`}
                                onClick={() => setActiveTab('SETTINGS')}
                            >
                                自訂/資料
                            </button>
                        </div>

                        <div className="sheep-detail-scroll">
                            {activeTab === 'DASHBOARD' && (
                                <div className="dashboard-layout">
                                    {/* 1. Compact Status Header */}
                                    <div className="status-header-compact">
                                        <div className="status-header-left">
                                            <div className="status-header-avatar">
                                                {isSleepingState ? '🪦' : (target.health >= 80 ? '💪' : (target.status === 'sick' ? '🤒' : '🐑'))}
                                            </div>
                                            <div className="status-header-info">
                                                <div className="status-header-main">
                                                    {isSleepingState ? '沉睡中' : `${getStatusText(target.status, target.health)}`}
                                                </div>
                                                {!isSleepingState && (
                                                    <div className="status-header-sub">
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <Heart size={12} fill="currentColor" color="var(--palette-orange-action)" />
                                                            {target.careLevel || 0}
                                                        </span>
                                                        <span style={{ color: '#ddd', margin: '0 4px' }}>|</span>
                                                        <span style={{ color: target.health < 60 ? 'red' : 'inherit' }}>
                                                            負擔 {Math.ceil(target.health)}%
                                                        </span>
                                                        <span style={{ color: '#ddd', margin: '0 4px' }}>|</span>
                                                        <span>
                                                            禱告 {currentCount}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="status-header-action">
                                            <Tooltip content={isSleepingState ? '喚醒禱告' : '認領禱告'} side="left">
                                                <button
                                                    className={`pray-btn-compact ${isPrayingAnim ? 'praying' : ''}`}
                                                    onClick={handlePray}
                                                    disabled={!isSleepingState && isFull && !isAdmin}
                                                >
                                                    {isPrayingAnim ? '🙏 禱告中...' : '🙏 為他禱告'}
                                                </button>
                                            </Tooltip>
                                        </div>
                                    </div>

                                    {localMsg && (
                                        <div className="modal-local-msg" style={{ margin: '0 8px' }}>
                                            {localMsg}
                                        </div>
                                    )}

                                    {/* 2. Hero Note Section */}
                                    <div className="note-hero-container">
                                        <div className="note-hero">
                                            <div className="note-hero-label">
                                                📌 牧養筆記 / 代禱事項
                                            </div>
                                            <textarea
                                                className="note-hero-input"
                                                value={note}
                                                onChange={(e) => setNote(e.target.value)}
                                                onBlur={() => handleBasicAutoSave('note', note)}
                                                placeholder={isSleepingState ? "為他寫下禱告..." : "他在這，有什麼需要代禱的嗎？..."}
                                                rows={3}
                                            />
                                        </div>
                                    </div>

                                    {/* 3. Next Plan Ticket */}
                                    <div className="plan-ticket-container">
                                        <div className="section-label">
                                            <Calendar size={14} /> 下一步行動
                                        </div>

                                        {plans.filter(p => !p.completed_at).length > 0 ? (
                                            (() => {
                                                const nextPlan = plans.filter(p => !p.completed_at)[0];
                                                const d = nextPlan.scheduled_time ? new Date(nextPlan.scheduled_time) : null;
                                                const dateStr = d ? `${d.getMonth() + 1}/${d.getDate()}` : '--/--';
                                                const timeStr = d ? d.toLocaleTimeString('zh-TW', { hour: 'numeric', minute: '2-digit' }) : '';

                                                return (
                                                    <div className="plan-ticket">
                                                        <div className="ticket-left">
                                                            <div className="ticket-date">{dateStr}</div>
                                                            <div className="ticket-time">{timeStr}</div>
                                                        </div>
                                                        <div className="ticket-right">
                                                            <div className="ticket-content">
                                                                <div>
                                                                    <div className="ticket-action">{nextPlan.action}</div>
                                                                    {nextPlan.location && <div className="ticket-sub">📍 {nextPlan.location}</div>}
                                                                </div>
                                                            </div>
                                                            <button
                                                                className="ticket-btn-complete"
                                                                onClick={() => openCompletePlan(nextPlan)}
                                                            >
                                                                <Check size={14} strokeWidth={3} /> 完成
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })()
                                        ) : (
                                            <div
                                                className="plan-add-dashed"
                                                onClick={() => {
                                                    setActiveTab('PLAN');
                                                    openAddPlan();
                                                }}
                                            >
                                                <Plus size={20} />
                                                <span>新增認領規劃</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'SETTINGS' && (
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
                                        <label>標籤</label>
                                        <TagSelect
                                            sheepId={target?.id}
                                            tags={tags}
                                            assignedIds={(tagAssignmentsBySheep[target?.id] || []).map(a => a.tagId)}
                                            onSave={(tagIds) => target?.id && setSheepTags(target.id, tagIds)}
                                        />
                                        <Tooltip content="管理標籤" side="top">
                                            <button
                                                type="button"
                                                className="tag-manage-btn"
                                                onClick={() => setShowTagManager(true)}
                                                style={{
                                                    marginTop: '10px',
                                                    fontSize: '0.8rem',
                                                    padding: '4px 10px',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    background: 'rgba(0,0,0,0.04)',
                                                    border: '1px solid rgba(0,0,0,0.1)',
                                                    borderRadius: '6px',
                                                    color: 'var(--text-muted)',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <Settings size={12} strokeWidth={2} />
                                                管理標籤
                                            </button>
                                        </Tooltip>
                                    </div>

                                    {isAdmin && !isSleepingState && (
                                        <div className="form-group">
                                            <div className="modal-admin-box">
                                                <label>🔧 管理員調整: {Math.ceil(target.health)}%</label>
                                                <div className="admin-actions">
                                                    <Slider
                                                        min={1}
                                                        max={100}
                                                        value={target.health}
                                                        onChange={(e) => {
                                                            const newHealth = Number(e.target.value);
                                                            const { health, status, type } = calculateSheepState(newHealth, target.status);
                                                            updateSheep(target.id, { health, type, status });
                                                        }}
                                                        ariaLabel="管理員調整健康度"
                                                    />
                                                    <Tooltip content="直接歸零 (測試沉睡)" side="top">
                                                        <button
                                                            type="button"
                                                            className="admin-reset-btn btn-destructive"
                                                            onClick={() => updateSheep(target.id, { health: 0 })}
                                                        >
                                                            💀 歸零
                                                        </button>
                                                    </Tooltip>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="modal-hint">
                                        (內容將自動儲存)
                                    </div>
                                </div>
                            )}

                            {activeTab === 'PLAN' && (
                                <div className="spiritual-plan-container">
                                    {viewMode === 'LIST' && (
                                        <>
                                            <div className="plan-list-header">
                                                <Tooltip content="新增認領規劃" side="bottom">
                                                    <button
                                                        type="button"
                                                        className="plan-add-btn"
                                                        onClick={openAddPlan}
                                                        aria-label="新增認領規劃"
                                                    >
                                                        <Plus size={18} strokeWidth={2.5} />
                                                        <span>新增規劃</span>
                                                    </button>
                                                </Tooltip>
                                            </div>
                                            <ModalHint className="plan-retention-hint">
                                                系統會自動清理超過一個月的過期行程
                                            </ModalHint>

                                            <div className="plan-list">
                                                {plans.length === 0 ? (
                                                    <div className="plan-list-empty">
                                                        <Calendar size={32} strokeWidth={1.5} />
                                                        <p>目前沒有認領規劃</p>
                                                        <p className="plan-list-empty-hint">點擊上方「新增規劃」開始安排</p>
                                                    </div>
                                                ) : (
                                                    plans.map(p => (
                                                        <button
                                                            key={p.id}
                                                            type="button"
                                                            className="plan-item"
                                                            onClick={() => handlePlanClick(p)}
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
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                {p.scheduled_time && (
                                                                    <div
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            const url = generateGoogleCalendarUrl(p, target);
                                                                            if (url) window.open(url, '_blank');
                                                                        }}
                                                                        style={{
                                                                            padding: '6px',
                                                                            color: 'var(--palette-blue-action)',
                                                                            background: 'rgba(0,0,0,0.04)',
                                                                            borderRadius: '8px',
                                                                            fontSize: '1em',
                                                                            cursor: 'pointer'
                                                                        }}
                                                                        title="同步到 Google 日曆"
                                                                    >
                                                                        📅
                                                                    </div>
                                                                )}
                                                                {!p.completed_at && (
                                                                    <div
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            openCompletePlan(p);
                                                                        }}
                                                                        style={{
                                                                            padding: '6px',
                                                                            color: 'var(--palette-deep-green)',
                                                                            background: 'rgba(0,0,0,0.04)',
                                                                            borderRadius: '8px',
                                                                            fontSize: '1em',
                                                                            cursor: 'pointer'
                                                                        }}
                                                                        title="完成並填寫果效"
                                                                    >
                                                                        <Check size={18} strokeWidth={2.5} />
                                                                    </div>
                                                                )}
                                                                {p.completed_at && <span style={{ fontSize: '0.8em', color: 'var(--text-muted)' }}>已完成</span>}
                                                                <ChevronRight size={20} strokeWidth={2} className="plan-item-chevron" />
                                                            </div>
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        </>
                                    )}

                                    {viewMode === 'EDIT' && (
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

                                    {viewMode === 'COMPLETE' && (
                                        <div className="spiritual-plan-form">
                                            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: 'var(--palette-deep-green)' }}>認領果效</h3>

                                            <div className="form-group">
                                                <label>💭 心得紀錄</label>
                                                <textarea
                                                    value={completionData.note}
                                                    onChange={(e) => setCompletionData({ ...completionData, note: e.target.value })}
                                                    rows={5}
                                                    placeholder="接觸狀況如何？小羊的反應？有無邀約或決志？"
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label>🏷️ 狀況標記 (可複選)</label>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                    {FEEDBACK_TAGS.map(tag => {
                                                        const active = completionData.tags.includes(tag);
                                                        return (
                                                            <button
                                                                key={tag}
                                                                type="button"
                                                                onClick={() => toggleFeedbackTag(tag)}
                                                                style={{
                                                                    padding: '6px 12px',
                                                                    borderRadius: '20px',
                                                                    border: active ? '1px solid var(--palette-blue-action)' : '1px solid #ddd',
                                                                    background: active ? 'var(--palette-blue-action)' : '#f9f9f9',
                                                                    color: active ? '#fff' : '#666',
                                                                    fontSize: '0.9rem',
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.2s'
                                                                }}
                                                            >
                                                                {tag}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div className="spiritual-plan-form-actions">
                                                <button
                                                    type="button"
                                                    className="modal-btn-secondary"
                                                    onClick={() => setViewMode('LIST')}
                                                    disabled={planActionLoading}
                                                >
                                                    取消
                                                </button>
                                                <button
                                                    type="button"
                                                    className="modal-btn-primary"
                                                    onClick={handleCompleteSubmit}
                                                    disabled={planActionLoading}
                                                >
                                                    {planActionLoading ? '處理中...' : '完成紀錄'}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {viewMode === 'RESULT' && (
                                        <div className="spiritual-plan-form">
                                            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: 'var(--palette-deep-green)' }}>認領果效 (已完成)</h3>

                                            <div className="form-group">
                                                <label>📅 完成時間</label>
                                                <div style={{ padding: '8px', background: '#f5f5f5', borderRadius: '8px', color: '#666' }}>
                                                    {formatDisplayTime(completionData.completedAt)}
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label>💭 心得紀錄</label>
                                                <div style={{ padding: '12px', background: '#fff', border: '1px solid #eee', borderRadius: '8px', minHeight: '80px', whiteSpace: 'pre-wrap' }}>
                                                    {completionData.note || '無心得紀錄'}
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label>🏷️ 狀況標記</label>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                    {completionData.tags && completionData.tags.length > 0 ? (
                                                        completionData.tags.map(tag => (
                                                            <span
                                                                key={tag}
                                                                style={{
                                                                    padding: '4px 10px',
                                                                    borderRadius: '20px',
                                                                    background: 'var(--palette-blue-action)',
                                                                    color: '#fff',
                                                                    fontSize: '0.9rem'
                                                                }}
                                                            >
                                                                {tag}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span style={{ color: '#999' }}>無標記</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="spiritual-plan-form-actions">
                                                <button
                                                    type="button"
                                                    className="modal-btn-primary"
                                                    onClick={() => setViewMode('LIST')}
                                                >
                                                    返回列表
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'EFFECTS' && (
                                <div className="spiritual-plan-container">
                                    <div className="stamp-grid">
                                        {STAMPS.map(stamp => {
                                            const isStamped = target.stamps && target.stamps[stamp.id];
                                            const Icon = stamp.icon;
                                            return (
                                                <div
                                                    key={stamp.id}
                                                    className={`stamp-card ${isStamped ? 'stamped' : ''}`}
                                                    onClick={() => handleStampToggle(stamp.id)}
                                                >
                                                    {isStamped && (
                                                        <div className="stamp-mark">
                                                            {stamp.id === 'decision_prayer' || stamp.id === 'stable_devotion' ? 'AMEN' : 'DONE'}
                                                        </div>
                                                    )}

                                                    <div className="stamp-icon-placeholder">
                                                        <Icon size={24} strokeWidth={isStamped ? 2.5 : 2} />
                                                    </div>
                                                    <span className="stamp-label">{stamp.label}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <ModalHint>
                                        點擊格子即可蓋章，再次點擊可取消。
                                    </ModalHint>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {
                showTagManager && (
                    <TagManagerModal onClose={() => setShowTagManager(false)} />
                )
            }
            {showWinningModal && (
                <div
                    className="winning-modal-overlay"
                    onClick={() => setShowWinningModal(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-label="得獎通知"
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        zIndex: 10000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0, 0, 0, 0.5)',
                        backdropFilter: 'blur(2px)'
                    }}
                >
                    <div
                        className="winning-modal-content"
                        style={{
                            transform: 'scale(1)',
                            animation: 'modalPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            pointerEvents: 'none' // Let clicks pass through to close
                        }}
                    >
                        <img
                            src="/assets/sheep/winning_sheep.png"
                            alt="Winning Sheep"
                            style={{
                                maxWidth: '80vw',
                                maxHeight: '60vh',
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))'
                            }}
                        />
                    </div>
                </div>
            )}
        </Portal >
    );
};
