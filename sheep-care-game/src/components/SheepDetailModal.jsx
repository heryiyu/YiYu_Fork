import React, { useState, useEffect, useRef } from 'react';
import { Heart, Plus, ChevronRight, Calendar, ChevronUp, ChevronDown, Settings, X, Check, Megaphone, Sparkles, Users, HeartHandshake, Flame, BookOpen, Edit2, Save, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useGame } from '../context/GameContext';
import { useConfirm } from '../context/ConfirmContext.jsx';
import { calculateSheepState, isSleeping, getAwakeningProgress } from '../utils/gameLogic';
import { TagManagerModal } from './TagManagerModal';
import { ModalHint } from './ModalHint';
import { CloseButton } from './ui/CloseButton';
import { Slider } from './ui/Slider';
import { Tag } from './ui/Tag';
import { IconButton, IconButtonGroup } from './ui/IconButton';
import { Tooltip } from './ui/Tooltip';
import { Portal } from './ui/Portal';
import { PlanDetailModal } from './PlanDetailModal';
import { generateGoogleCalendarUrl } from '../utils/calendarHelper';
import { useIsMobile } from '../hooks/useIsMobile';

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

export const SheepDetailModal = ({ selectedSheepId, initialPlanId, onClose }) => {
    const { sheep, updateSheep, prayForSheep, completePlan, deleteSheep, forceLoadFromCloud, isAdmin, lineId, tags, tagAssignmentsBySheep, setSheepTags, notifyScheduleUpdate, settings, updateSetting, updatePlanFeedback, fetchWeeklySchedules } = useGame();
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
    const [isEditingLabels, setIsEditingLabels] = useState(false);
    const [tempLabels, setTempLabels] = useState({});

    // New State for PlanDetailModal
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [completionTarget, setCompletionTarget] = useState(null);

    // Fetch Plans from DB (Refactored to use Shared Fetcher)
    const fetchPlans = async () => {
        if (!target?.id) return;
        try {
            // Use the shared fetcher to ensure consistency with Calendar
            // This returns all schedules (that I own or my sheep are in)
            const allSchedules = await fetchWeeklySchedules();

            // Filter for THIS specific sheep
            const relevantSchedules = allSchedules.filter(s =>
                s.schedule_participants && s.schedule_participants.some(p => p.sheep_id === target.id)
            );

            // Transform to flat structure for UI
            const formattedPlans = relevantSchedules.map(s => {
                // Find the participant entry for THIS sheep
                const myParticipant = s.schedule_participants.find(p => p.sheep_id === target.id);

                return {
                    id: s.id, // Use schedule_id as primary ID for UI interactions
                    participant_id: myParticipant?.id,
                    action: s.action || '未命名',
                    scheduled_time: s.scheduled_time,
                    location: s.location,
                    completed_at: myParticipant?.completed_at,
                    feedback: myParticipant?.feedback,
                    sheep_id: target.id,
                    created_by: s.created_by,
                    originalSchedule: s // Store full object for PlanDetailModal
                };
            }).sort((a, b) => {
                const tA = a.scheduled_time ? new Date(a.scheduled_time).getTime() : 0;
                const tB = b.scheduled_time ? new Date(b.scheduled_time).getTime() : 0;
                return tA - tB;
            });

            // console.log(`[SheepDetail] Loaded ${formattedPlans.length} plans for ${target.name}`);
            setPlans(formattedPlans);

            // Handle Initial Plan ID (Deep Link)
            if (initialPlanId && formattedPlans.length > 0) {
                // console.log("Handling initialPlanId:", initialPlanId);
                const targetPlan = formattedPlans.find(p => p.id === initialPlanId);
                if (targetPlan) {
                    handlePlanClick(targetPlan);
                }
            }
        } catch (error) {
            console.error('Error fetching plans:', error);
        }
    };

    useEffect(() => {
        // console.log("SheepDetailModal: target changed", target?.id);
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

    const openAddPlan = () => {
        setSelectedSchedule({
            id: 'new',
            action: '',
            scheduled_time: new Date().toISOString(),
            location: '',
            content: '',
            reminder_offset: 15,
            schedule_participants: [{ sheep_id: target.id }]
        });
    };

    const handlePlanClick = (plan) => {
        // console.log("handlePlanClick triggered:", plan);
        setActiveTab('PLAN');
        // fetchParticipants(plan); // Removed: Not needed in new architecture or handled differently
        if (plan.completed_at) {
            // console.log("Plan is completed. Opening result view.");
            setCompletionData({
                note: plan.feedback?.note || '',
                tags: plan.feedback?.tags || [],
                completedAt: plan.completed_at
            });
            // We need the schedule ID for updatePlanFeedback/completePlan
            // Using a local variable or separate state instead of editingPlanId
            setCompletionTarget(plan.id);
            setViewMode('RESULT');
        } else {
            // console.log("handlePlanClick: Incomplete plan. Setting schedule.", plan.originalSchedule?.id);
            if (plan.originalSchedule) {
                setSelectedSchedule(plan.originalSchedule);
            }
        }
    };

    const openCompletePlan = (plan) => {
        setCompletionTarget(plan.id);
        setCompletionData({ note: '', tags: [] });
        setViewMode('COMPLETE');
    };

    const handleCompleteSubmit = async () => {
        if (!completionTarget) return;
        setPlanActionLoading(true);
        try {
            // Check if editing an existing completed plan
            const planToEdit = plans.find(p => p.id === completionTarget);
            if (planToEdit && planToEdit.completed_at) {
                // UPDATE FeedBack Only
                await updatePlanFeedback(completionTarget, completionData);
            } else {
                // NEW Completion
                await completePlan(completionTarget, target.id, completionData);
            }

            notifyScheduleUpdate();
            await fetchPlans();
            setViewMode('LIST');
            setCompletionTarget(null);
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
    const DEFAULT_STAMPS = [
        { id: 'evangelism', label: '參與過佈道活動', icon: Megaphone, color: '#FF6B6B' },
        { id: 'sunday_service', label: '參與過特會/主日', icon: Sparkles, color: '#FFD93D' },
        { id: 'small_group', label: '參與過小組', icon: Users, color: '#4D96FF' },
        { id: 'decision_prayer', label: '決志禱告', icon: HeartHandshake, color: '#FF4D94' },
        { id: 'altar_rpg', label: '築壇RPG', icon: Flame, color: '#FF8C42' },
        { id: 'stable_devotion', label: '穩定靈修', icon: BookOpen, color: '#6BCB77' },
    ];

    const STAMPS = DEFAULT_STAMPS.map(s => ({
        ...s,
        label: (settings.stampLabels && settings.stampLabels[s.id]) || s.label
    }));

    const handleLabelEditStart = () => {
        const currentLabels = {};
        STAMPS.forEach(s => {
            currentLabels[s.id] = s.label;
        });
        setTempLabels(currentLabels);
        setIsEditingLabels(true);
    };

    const handleLabelSave = () => {
        updateSetting('stampLabels', tempLabels);
        setIsEditingLabels(false);
    };

    const handleStampToggle = (stampId) => {
        if (isEditingLabels) return; // Disable toggling while editing
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
                                <div className="spiritual-plan-container" style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
                                    {selectedSchedule ? (
                                        <div className="nested-plan-detail" style={{
                                            flex: 1,
                                            height: '100%',
                                            background: 'var(--bg-card)',
                                            animation: 'slideIn 0.3s ease-out',
                                            display: 'flex',
                                            flexDirection: 'column'
                                        }}>
                                            <PlanDetailModal
                                                key={selectedSchedule.id}
                                                embedded={true}
                                                schedule={selectedSchedule}
                                                onClose={() => {
                                                    setSelectedSchedule(null);
                                                    fetchPlans();
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="plan-list-wrapper" style={{ height: '100%', overflowY: 'auto', padding: '0 4px' }}>
                                            {/* View Toggle & Add Button Header */}
                                            <div className="plan-list-header" style={{
                                                display: 'flex',
                                                justifyContent: 'flex-end',
                                                alignItems: 'center',
                                                paddingBottom: '10px',
                                                position: 'sticky',
                                                top: 0,
                                                zIndex: 10,
                                                background: 'linear-gradient(to bottom, var(--bg-card) 85%, rgba(255, 255, 255, 0) 100%)'
                                            }}>
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
                                                    <div className="empty-plan-state">
                                                        <div className="empty-icon">📅</div>
                                                        <div className="empty-text">尚無認領規劃</div>
                                                        <button className="empty-btn" onClick={openAddPlan}>
                                                            立即新增
                                                        </button>
                                                    </div>
                                                ) : (
                                                    plans.map(p => (
                                                        <div
                                                            key={p.id}
                                                            className={`plan-item ${p.completed_at ? 'completed' : ''}`}
                                                            onClick={() => handlePlanClick(p)}
                                                        >
                                                            <div className="plan-item-left">
                                                                <div className="plan-date-box">
                                                                    <span className="plan-date-month">
                                                                        {p.scheduled_time ? new Date(p.scheduled_time).getMonth() + 1 : '--'}月
                                                                    </span>
                                                                    <span className="plan-date-day">
                                                                        {p.scheduled_time ? new Date(p.scheduled_time).getDate() : '--'}
                                                                    </span>
                                                                </div>
                                                                <div className="plan-info">
                                                                    <div className="plan-action">{p.action}</div>
                                                                    <div className="plan-meta">
                                                                        {p.scheduled_time && (
                                                                            <span className="plan-time">
                                                                                <Clock size={12} />
                                                                                {new Date(p.scheduled_time).toLocaleTimeString('zh-TW', { hour: 'numeric', minute: '2-digit' })}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="plan-item-right">
                                                                {p.completed_at ? (
                                                                    <span className="status-badge completed">
                                                                        <Check size={12} strokeWidth={3} />
                                                                        已完成
                                                                    </span>
                                                                ) : (
                                                                    <ChevronRight size={16} className="arrow-icon" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'COMPLETE' && (
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

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '8px', marginBottom: '16px' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--palette-deep-green)' }}>認領果效 (已完成)</h3>
                                        <button
                                            type="button"
                                            className="modal-btn-primary"
                                            onClick={() => setViewMode('COMPLETE')}
                                            style={{
                                                borderRadius: '50%',
                                                width: '24px',
                                                height: '24px',
                                                padding: 0,
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                minWidth: 'unset',
                                                background: 'transparent',
                                                color: '#999',
                                                boxShadow: 'none',
                                                border: 'none',
                                                cursor: 'pointer'
                                            }}
                                            title="修改紀錄"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                    </div>

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
                                            className="modal-btn-secondary"
                                            onClick={() => setViewMode('LIST')}
                                            style={{ width: '100%' }}
                                        >
                                            返回列表
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'EFFECTS' && (
                                <div className="spiritual-plan-container">
                                    <div className="section-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>🏆 認領果效 (點擊蓋章)</span>
                                        {isAdmin && (
                                            !isEditingLabels ? (
                                                <button
                                                    className="icon-btn"
                                                    onClick={handleLabelEditStart}
                                                    style={{ padding: '4px', height: 'auto', width: 'auto', background: 'transparent', border: 'none', color: 'var(--text-muted)' }}
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                            ) : (
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        className="icon-btn"
                                                        onClick={() => setIsEditingLabels(false)}
                                                        style={{ padding: '4px', height: 'auto', width: 'auto', background: 'transparent', border: 'none', color: 'var(--text-muted)' }}
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                    <button
                                                        className="icon-btn"
                                                        onClick={handleLabelSave}
                                                        style={{ padding: '4px', height: 'auto', width: 'auto', background: 'transparent', border: 'none', color: 'var(--palette-blue-action)' }}
                                                    >
                                                        <Save size={16} />
                                                    </button>
                                                </div>
                                            )
                                        )}
                                    </div>
                                    <div className="stamp-grid">
                                        {Object.values(STAMPS).map(stamp => {
                                            const isStamped = (target.stamps || []).includes(stamp.id);
                                            return (
                                                <div
                                                    key={stamp.id}
                                                    className={`stamp-cell ${isStamped ? 'stamped' : ''} ${isEditingLabels ? 'editing' : ''}`}
                                                    onClick={() => handleStampToggle(stamp.id)}
                                                    style={{ position: 'relative' }}
                                                >
                                                    {isStamped && !isEditingLabels && (
                                                        <div className="stamp-mark">
                                                            {stamp.id === 'decision_prayer' || stamp.id === 'stable_devotion' ? 'AMEN' : 'DONE'}
                                                        </div>
                                                    )}

                                                    <div className="stamp-icon-placeholder">
                                                        <Icon size={24} strokeWidth={isStamped ? 2.5 : 2} />
                                                    </div>

                                                    {isEditingLabels ? (
                                                        <input
                                                            type="text"
                                                            value={tempLabels[stamp.id] || ''}
                                                            onChange={(e) => setTempLabels({ ...tempLabels, [stamp.id]: e.target.value })}
                                                            onClick={(e) => e.stopPropagation()}
                                                            style={{
                                                                width: '100%',
                                                                fontSize: '0.8rem',
                                                                textAlign: 'center',
                                                                border: '1px solid var(--border-main)',
                                                                borderRadius: '4px',
                                                                padding: '2px',
                                                                marginTop: '4px'
                                                            }}
                                                        />
                                                    ) : (
                                                        <span className="stamp-label">{stamp.label}</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <ModalHint>
                                        {isEditingLabels ? '修改後點擊上方儲存' : '點擊格子即可蓋章，再次點擊可取消。'}
                                    </ModalHint>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>

            {showTagManager && (
                <TagManagerModal onClose={() => setShowTagManager(false)} />
            )}

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
        </Portal>
    );
};
