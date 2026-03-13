import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useGameState, useGameActions, useUserAuth } from '../../context/GameContext/useGame';
import { useConfirm } from '../../context/ConfirmContext.jsx';
import { getAwakeningProgress, isSleeping, sanitizeInput } from '../../utils/gameLogic';
import { SheepDetailContent } from './SheepDetailContent';
import { TagManagerModal } from '../../components/modals/TagManagerModal';
import { Megaphone, Sparkles, Users, HeartHandshake, Flame, BookOpen } from 'lucide-react';
import './LiteSheepDetailPage.css';

export const LiteSheepDetailPage = ({ target, onClose }) => {
    // Bring in all the context and state needed for SheepDetailContent, 
    // exactly like SheepDetailModal but rendered as a page view.
    const { sheep, tags, tagAssignmentsBySheep } = useGameState();
    const {
        updateSheep, prayForSheep, completePlan, deleteSheep,
        setSheepTags, notifyScheduleUpdate,
        updatePlanFeedback, fetchWeeklySchedules
    } = useGameActions();
    const { isAdmin, settings } = useUserAuth();
    const { updateSetting } = useGameActions();

    // States
    const [name, setName] = useState(target?.name || '');
    const [note, setNote] = useState(target?.note || '');
    const [plans, setPlans] = useState([]);
    const [viewMode, setViewMode] = useState('LIST');
    const [completionData, setCompletionData] = useState({ note: '', tags: [] });
    const [planActionLoading, setPlanActionLoading] = useState(false);
    const [isPrayingAnim, setIsPrayingAnim] = useState(false);
    const [activeTab, setActiveTab] = useState('DASHBOARD');
    const [localMsg, setLocalMsg] = useState('');
    const [showTagManager, setShowTagManager] = useState(false);
    const [showWinningModal, setShowWinningModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [tempLabels, setTempLabels] = useState({});
    const [tempStamps, setTempStamps] = useState({});
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [completionTarget, setCompletionTarget] = useState(null);

    const lastFetchedRef = useRef(null);

    const fetchPlans = async () => {
        if (!target?.id) return;
        try {
            const allSchedules = await fetchWeeklySchedules();
            const relevantSchedules = allSchedules.filter(s =>
                s.schedule_participants && s.schedule_participants.some(p => p.sheep_id === target.id)
            );
            const formattedPlans = relevantSchedules.map(s => {
                const myParticipant = s.schedule_participants.find(p => p.sheep_id === target.id);
                return {
                    id: s.id,
                    participant_id: myParticipant?.id,
                    action: s.action || '未命名',
                    scheduled_time: s.scheduled_time,
                    location: s.location,
                    completed_at: myParticipant?.completed_at,
                    feedback: myParticipant?.feedback,
                    sheep_id: target.id,
                    created_by: s.created_by,
                    created_at: s.created_at,
                    originalSchedule: s
                };
            }).sort((a, b) => {
                const tA = a.scheduled_time ? new Date(a.scheduled_time).getTime() : 0;
                const tB = b.scheduled_time ? new Date(b.scheduled_time).getTime() : 0;
                return tA - tB;
            });
            setPlans(formattedPlans);
        } catch (error) {
            console.error('Error fetching plans:', error);
        }
    };

    useEffect(() => {
        if (target) {
            setName(target.name);
            setNote(target.note || '');
            setLocalMsg('');
            if (lastFetchedRef.current !== target.id) {
                fetchPlans();
                lastFetchedRef.current = target.id;
            }
            setViewMode('LIST');
            setActiveTab('DASHBOARD');
        }
    }, [target?.id]);

    if (!target) return null;

    // Actions
    const handlePray = () => {
        const todayStr = new Date().toDateString();
        if (isSleeping(target) && target.lastPrayedDate === todayStr && !isAdmin) {
            setLocalMsg("今天已經為這隻小羊禱告過了，請明天再來！🙏");
            return;
        }
        prayForSheep(target.id);
        setIsPrayingAnim(true);
        setTimeout(() => setIsPrayingAnim(false), 800);
        setLocalMsg('');
    };

    const isSleepingState = isSleeping(target);
    const today = new Date().toDateString();
    const currentCount = (target.lastPrayedDate === today) ? (target.prayedCount || 0) : 0;
    const isFull = !isSleepingState && currentCount >= 3;

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
        if (plan.completed_at) {
            setCompletionData({
                note: plan.feedback?.note || '',
                tags: plan.feedback?.tags || [],
                completedAt: plan.completed_at
            });
            setCompletionTarget(plan.participant_id);
            setViewMode('RESULT');
        } else {
            if (plan.originalSchedule) {
                setSelectedSchedule(plan.originalSchedule);
            }
        }
    };

    const openCompletePlan = (plan) => {
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
        const rawData = dataOverride || completionData;
        const finalData = { ...rawData, note: sanitizeInput(rawData.note) };
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

    const handleBasicAutoSave = (field, value) => {
        const payload = { [field]: value };
        if (field === 'sLevel') {
            payload.spiritualMaturity = value;
            delete payload.sLevel;
        }
        updateSheep(target.id, payload);
    };

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
        STAMPS.forEach(s => { currentLabels[s.id] = s.label; });
        setTempLabels(currentLabels);

        const currentStamps = target.stamps || {};
        let initialStamps = {};
        if (Array.isArray(currentStamps)) {
            currentStamps.forEach(s => { initialStamps[s] = true; });
        } else {
            initialStamps = { ...currentStamps };
        }
        setTempStamps(initialStamps);

        setIsEditMode(true);
    };

    const handleLabelSave = () => {
        if (isAdmin) {
            updateSetting('stampLabels', tempLabels);
        }
        updateSheep(target.id, { stamps: tempStamps });
        setIsEditMode(false);
    };

    const handleStampToggle = (stampId) => {
        if (!target) return;

        if (isEditMode) {
            const isStamped = !!tempStamps[stampId];
            if (isStamped) {
                const newTemp = { ...tempStamps };
                delete newTemp[stampId];
                setTempStamps(newTemp);
            }
            return;
        }

        const currentStamps = target.stamps || {};
        const isStamped = Array.isArray(currentStamps)
            ? currentStamps.includes(stampId)
            : !!currentStamps[stampId];

        if (isStamped) {
            return;
        }

        let newStamps;
        if (Array.isArray(currentStamps)) {
            newStamps = {};
            currentStamps.forEach(s => { newStamps[s] = true; });
        } else {
            newStamps = { ...currentStamps };
        }

        newStamps[stampId] = true;
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            zIndex: 9999
        });
        setShowWinningModal(true);

        updateSheep(target.id, { stamps: newStamps });
    };

    return (
        <div className="lite-page-container fade-in lite-sheep-detail-page">
            <div className="lite-page-header">
                <button className="lite-page-back-btn" onClick={onClose}>
                    <ArrowLeft size={20} /> 返回
                </button>
                <h2 className="lite-page-title">{isSleepingState ? `🪦 沉睡紀錄(${target.name})` : `📝 ${target.name} 的資料`}</h2>
                <div style={{ width: '80px' }}>{/* Spacer */}</div>
            </div>

            <div className="lite-page-content lite-sheep-detail-page-content">
                <div className="lite-page-card" style={{ height: '100%', padding: 0, display: 'flex', flexDirection: 'column' }}>
                    <SheepDetailContent
                        {...{
                            activeTab, setActiveTab, target, currentCount, isFull, isAdmin, isPrayingAnim,
                            handlePray, localMsg, note, setNote, handleBasicAutoSave, plans, openCompletePlan,
                            openAddPlan, isSleepingState, getStatusText, name, setName, tags,
                            tagAssignmentsBySheep, setSheepTags, setShowTagManager, updateSheep, viewMode,
                            selectedSchedule, setSelectedSchedule, fetchPlans, completionData, setCompletionData,
                            handleCompleteSubmit, planActionLoading, setViewMode, completionTarget, STAMPS,
                            handleStampToggle, isEditMode, handleLabelEditStart, handleLabelSave,
                            setIsEditMode, tempLabels, setTempLabels, tempStamps, handlePlanClick
                        }}
                    />
                </div>
            </div>

            {showTagManager && <TagManagerModal onClose={() => setShowTagManager(false)} />}

            {showWinningModal && (
                <div
                    className="winning-modal-overlay"
                    onClick={() => setShowWinningModal(false)}
                    role="dialog"
                    aria-modal="true"
                    style={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                        zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(2px)'
                    }}
                >
                    <div className="winning-modal-content" style={{ animation: 'modalPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)', pointerEvents: 'none' }}>
                        <img
                            src="/assets/sheep/winning_sheep.png"
                            alt="Winning Sheep"
                            style={{ maxWidth: '80vw', maxHeight: '60vh', objectFit: 'contain', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))' }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
