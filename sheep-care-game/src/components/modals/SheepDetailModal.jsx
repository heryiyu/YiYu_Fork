import React, { useState, useEffect, useRef } from 'react';
import { Heart, Plus, ChevronRight, Calendar, ChevronUp, ChevronDown, Settings, X, Check, Megaphone, Sparkles, Users, HeartHandshake, Flame, BookOpen, Edit2, Save, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useGameState, useGameActions, useUserAuth } from '../../context/GameContext/useGame';
import { useConfirm } from '../../context/ConfirmContext.jsx';
import { getAwakeningProgress, isSleeping, calculateSheepState, sanitizeInput } from '../../utils/gameLogic';
import { TagManagerModal } from './TagManagerModal';
import { ModalHint } from './ModalHint';
import { CloseButton } from '../ui/CloseButton';
import { Slider } from '../ui/Slider';
import { Tag } from '../ui/Tag';
import { IconButton, IconButtonGroup } from '../ui/IconButton';
import { Tooltip } from '../ui/Tooltip';
import { Portal } from '../ui/Portal';
import { PlanDetailModal } from './PlanDetailModal';
import { FeedbackForm } from '../game/FeedbackForm';
import { FeedbackResult } from '../game/FeedbackResult';
import { generateGoogleCalendarUrl } from '../../utils/calendarHelper';
import { useIsMobile } from '../../hooks/useIsMobile';

// Sub-components
import { SheepDetailDashboard } from './SheepDetailDashboard';
import { SheepDetailPlan } from './SheepDetailPlan';
import { SheepDetailPlanFeedback } from './SheepDetailPlanFeedback';
import { SheepDetailEffects } from './SheepDetailEffects';
import { SheepDetailSettings } from './SheepDetailSettings';

export const SheepDetailModal = ({ selectedSheepId, initialPlanId, onClose }) => {
    const { sheep, tags, tagAssignmentsBySheep } = useGameState();
    const {
        updateSheep, prayForSheep, completePlan, deleteSheep,
        forceLoadFromCloud, setSheepTags, notifyScheduleUpdate,
        updatePlanFeedback, fetchWeeklySchedules
    } = useGameActions();
    const { isAdmin, lineId, settings } = useUserAuth();
    const { updateSetting } = useGameActions(); // Some overlap but grouped by logic
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
                    created_at: s.created_at, // Essential for visibility fallback
                    originalSchedule: s // Store full object for PlanDetailModal
                };
            }).sort((a, b) => {
                const tA = a.scheduled_time ? new Date(a.scheduled_time).getTime() : 0;
                const tB = b.scheduled_time ? new Date(b.scheduled_time).getTime() : 0;
                return tA - tB;
            });

            setPlans(formattedPlans);

            // Handle Initial Plan ID (Deep Link)
            if (initialPlanId && formattedPlans.length > 0) {
                const foundPlan = formattedPlans.find(p => p.id === initialPlanId);
                if (foundPlan) {
                    handlePlanClick(foundPlan);
                }
            }
        } catch (error) {
            console.error('Error fetching plans:', error);
        }
    };

    const lastFetchedRef = useRef(null);

    useEffect(() => {
        if (target) {
            setName(target.name);
            setNote(target.note || '');
            setLocalMsg('');
            // Fetch remote plans only if target changed or plans haven't been fetched
            if (lastFetchedRef.current !== target.id) {
                fetchPlans();
                lastFetchedRef.current = target.id;
            }
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
        buttonText = `🔮 喚醒禱告(${getAwakeningProgress(target)} / 5)`;
    } else {
        if (isAdmin) {
            buttonText = `🙏 為他禱告(今日: ${currentCount} /∞)`;
        } else {
            buttonText = isFull ? '🙏 今日禱告已達上限' : `🙏 為他禱告(今日: ${currentCount} / 3)`;
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
        setActiveTab('PLAN');
        // fetchParticipants(plan); // Removed: Not needed in new architecture or handled differently
        if (plan.completed_at) {
            // console.log("Plan is completed. Opening result view.");
            setCompletionData({
                note: plan.feedback?.note || '',
                tags: plan.feedback?.tags || [],
                completedAt: plan.completed_at
            });
            // We need the PARTICIPANT ID for updatePlanFeedback/completePlan
            // Using a local variable or separate state instead of editingPlanId
            setCompletionTarget(plan.participant_id);
            setViewMode('RESULT');
        } else {
            // console.log("handlePlanClick: Incomplete plan. Setting schedule.", plan.originalSchedule?.id);
            if (plan.originalSchedule) {
                setSelectedSchedule(plan.originalSchedule);
            }
        }
    };

    const openCompletePlan = (plan) => {
        // Use participant_id if available (from formatted plan), otherwise we might need to find it
        // If 'plan' is a raw schedule object (from openAddPlan or PlanDetailModal return), it might not have participant_id directly attached in the same way.
        // But openCompletePlan is usually called from Layout or Detail.
        // Let's assume plan has participant_id if it came from the list.
        // If it comes from PlanDetailModal (schedule object), we need to find the participant id for THIS sheep.

        let targetId = plan.participant_id;
        if (!targetId && plan.schedule_participants) {
            const p = plan.schedule_participants.find(sp => sp.sheep_id === target.id);
            if (p) targetId = p.id;
        }

        setCompletionTarget(targetId);
        setCompletionData({ note: '', tags: [] });
        setViewMode('COMPLETE');
    };

    const handleCompleteSubmit = async (dataOverride) => {
        if (!completionTarget) return;
        setPlanActionLoading(true);
        // Use override if provided, else state
        const rawData = dataOverride || completionData;
        const finalData = {
            ...rawData,
            note: sanitizeInput(rawData.note)
        };
        try {
            const planToEdit = plans.find(p => p.participant_id === completionTarget);

            if (planToEdit && planToEdit.completed_at) {
                await updatePlanFeedback(completionTarget, finalData);
            } else {
                await completePlan(completionTarget, target.id, finalData);
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
                        <h3 id="sheep-detail-title">{isSleepingState ? `🪦 沉睡紀錄(${target.name})` : `📝 ${target.name} 的資料`}</h3>
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
                                認領紀錄
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
                                <SheepDetailDashboard
                                    target={target}
                                    currentCount={currentCount}
                                    isFull={isFull}
                                    isAdmin={isAdmin}
                                    isPrayingAnim={isPrayingAnim}
                                    handlePray={handlePray}
                                    localMsg={localMsg}
                                    note={note}
                                    setNote={setNote}
                                    handleBasicAutoSave={handleBasicAutoSave}
                                    plans={plans}
                                    openCompletePlan={openCompletePlan}
                                    setActiveTab={setActiveTab}
                                    openAddPlan={openAddPlan}
                                    isSleepingState={isSleepingState}
                                    getStatusText={getStatusText}
                                />
                            )}

                            {activeTab === 'SETTINGS' && (
                                <SheepDetailSettings
                                    target={target}
                                    name={name}
                                    setName={setName}
                                    handleBasicAutoSave={handleBasicAutoSave}
                                    tags={tags}
                                    tagAssignmentsBySheep={tagAssignmentsBySheep}
                                    setSheepTags={setSheepTags}
                                    setShowTagManager={setShowTagManager}
                                    isAdmin={isAdmin}
                                    isSleepingState={isSleepingState}
                                    updateSheep={updateSheep}
                                />
                            )}

                            {activeTab === 'PLAN' && (
                                <div className="spiritual-plan-container" style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
                                    {viewMode === 'LIST' && (
                                        selectedSchedule ? (
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
                                                    onComplete={() => {
                                                        openCompletePlan(selectedSchedule);
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <SheepDetailPlan
                                                plans={plans}
                                                handlePlanClick={handlePlanClick}
                                                openAddPlan={openAddPlan}
                                                openCompletePlan={openCompletePlan}
                                            />
                                        )
                                    )}

                                    <SheepDetailPlanFeedback
                                        viewMode={viewMode}
                                        completionData={completionData}
                                        setCompletionData={setCompletionData}
                                        handleCompleteSubmit={handleCompleteSubmit}
                                        planActionLoading={planActionLoading}
                                        setViewMode={setViewMode}
                                        completionTarget={completionTarget}
                                        plans={plans}
                                        setSelectedSchedule={setSelectedSchedule}
                                    />
                                </div>
                            )}

                            {activeTab === 'EFFECTS' && (
                                <SheepDetailEffects
                                    target={target}
                                    isAdmin={isAdmin}
                                    STAMPS={STAMPS}
                                    handleStampToggle={handleStampToggle}
                                    isEditingLabels={isEditingLabels}
                                    handleLabelEditStart={handleLabelEditStart}
                                    handleLabelSave={handleLabelSave}
                                    setIsEditingLabels={setIsEditingLabels}
                                    tempLabels={tempLabels}
                                    setTempLabels={setTempLabels}
                                />
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

            {
                showWinningModal && (
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
                )
            }
        </Portal >
    );
};
