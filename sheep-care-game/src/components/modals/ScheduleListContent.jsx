import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Calendar, Plus, Clock, MapPin, ChevronLeft, ChevronRight, User, ChevronDown, Users, RefreshCw } from 'lucide-react';
import { useGameState, useGameActions } from '../../context/GameContext/useGame';
import { AssetSheep } from '../game/AssetSheep';
import { BatchAddScheduleModal } from './BatchAddScheduleModal';
import { PlanDetailModal } from './PlanDetailModal';
import { MiniCalendar } from '../game/MiniCalendar';
import { FeedbackForm } from '../game/FeedbackForm';
import { FeedbackResult } from '../game/FeedbackResult';
import { CalendarLayout } from '../calendar/CalendarLayout';


const DAYS = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];

const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
};

const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

export const ScheduleListContent = ({ onClose }) => {
    const { sheep, tags, lastScheduleUpdate } = useGameState();

    const {
        fetchWeeklySchedules, completePlan,
        updatePlanFeedback, notifyScheduleUpdate
    } = useGameActions();

    const [schedules, setSchedules] = useState([]);
    const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(new Date()));
    const [selectedDayIndex, setSelectedDayIndex] = useState(new Date().getDay()); // 0-6
    const [isLoading, setIsLoading] = useState(true);
    const [showBatchAdd, setShowBatchAdd] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState(null); // Track selected schedule for detail view
    const [interactionMode, setInteractionMode] = useState('VIEW_PLAN'); // 'VIEW_PLAN', 'VIEW_RESULT', 'EDIT_RESULT'
    const [completionTarget, setCompletionTarget] = useState(null);
    const [completionData, setCompletionData] = useState({ note: '', tags: [] });
    const [planActionLoading, setPlanActionLoading] = useState(false);

    // Calendar View State
    const [viewFormat, setViewFormat] = useState('LIST'); // 'LIST' or 'CALENDAR'
    const [calendarDate, setCalendarDate] = useState(new Date());

    const loadSchedules = useCallback(async () => {
        setIsLoading(true);
        const data = await fetchWeeklySchedules();
        setSchedules(data);
        setIsLoading(false);
    }, [fetchWeeklySchedules]);

    useEffect(() => {
        loadSchedules();
    }, [lastScheduleUpdate, loadSchedules]);

    // Sync selectedSchedule with updated schedules data
    useEffect(() => {
        if (selectedSchedule) {
            const updated = schedules.find(s => s.id === selectedSchedule.id);
            if (updated && updated !== selectedSchedule) {
                setSelectedSchedule(updated);
            }
        }
    }, [schedules, selectedSchedule]);

    // Initial Mode Logic
    useEffect(() => {
        if (selectedSchedule) {
            const parts = selectedSchedule.schedule_participants || [];
            // Simple logic: if single participant and completed, show Result
            if (parts.length === 1 && parts[0].completed_at) {
                setInteractionMode('VIEW_RESULT');
                setCompletionTarget(parts[0].id);
                setCompletionData({
                    note: parts[0].feedback?.note || '',
                    tags: parts[0].feedback?.tags || [],
                    completedAt: parts[0].completed_at
                });
            } else {
                setInteractionMode('VIEW_PLAN');
            }
        }
    }, [selectedSchedule]);

    const handleEditFeedback = () => {
        if (!selectedSchedule) return;
        const parts = selectedSchedule.schedule_participants || [];
        if (parts.length === 0) return;

        // Use existing completionTarget if set, or default to first
        let targetId = completionTarget;
        if (!targetId) {
            targetId = parts[0].id;
            setCompletionTarget(targetId);
        }

        const target = parts.find(p => p.id === targetId);
        if (target) {
            setCompletionData({
                note: target.feedback?.note || '',
                tags: target.feedback?.tags || [],
                completedAt: target.completed_at
            });
        }

        setInteractionMode('EDIT_RESULT');
    };

    const handleCompleteSubmit = async (data) => {
        if (!completionTarget) return;
        setPlanActionLoading(true);
        try {
            const parts = selectedSchedule.schedule_participants || [];
            const targetPart = parts.find(p => p.id === completionTarget);

            if (targetPart) {
                if (targetPart.completed_at) {
                    await updatePlanFeedback(completionTarget, data);
                } else {
                    await completePlan(completionTarget, targetPart.sheep_id, data);
                }
                notifyScheduleUpdate();
                notifyScheduleUpdate();
                loadSchedules();

                setInteractionMode('VIEW_RESULT');
                setCompletionData({ ...data, completedAt: targetPart.completed_at || new Date().toISOString() });
            }
        } catch (error) {
            console.error(error);
            alert('儲存失敗');
        } finally {
            setPlanActionLoading(false);
        }
    };

    const prevWeek = () => {
        const newStart = new Date(currentWeekStart);
        newStart.setDate(newStart.getDate() - 7);
        setCurrentWeekStart(newStart);
    };

    const nextWeek = () => {
        const newStart = new Date(currentWeekStart);
        newStart.setDate(newStart.getDate() + 7);
        setCurrentWeekStart(newStart);
    };

    const currentYearMonth = useMemo(() => {
        return `${currentWeekStart.getFullYear()}年 ${currentWeekStart.getMonth() + 1} 月`;
    }, [currentWeekStart]);

    const daySchedules = useMemo(() => {
        const targetDate = addDays(currentWeekStart, selectedDayIndex);
        const targetDateStr = targetDate.toDateString();

        return schedules.filter(s => {
            if (!s.scheduled_time) return false;
            const d = new Date(s.scheduled_time);
            return d.toDateString() === targetDateStr;
        }).sort((a, b) => new Date(a.scheduled_time) - new Date(b.scheduled_time));
    }, [schedules, currentWeekStart, selectedDayIndex]);

    const unscheduledSchedules = useMemo(() => {
        return schedules.filter(s => !s.scheduled_time);
    }, [schedules]);

    const hasEventOnDay = (date) => {
        const dStr = date.toDateString();
        return schedules.some(s => s.scheduled_time && new Date(s.scheduled_time).toDateString() === dStr);
    };

    const goToToday = () => {
        const today = new Date();
        setCurrentWeekStart(getStartOfWeek(today));
        setSelectedDayIndex(today.getDay());
    };

    const formatTime = (isoString) => {
        const d = new Date(isoString);
        return d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    if (showBatchAdd) {
        const initialDate = viewFormat === 'CALENDAR' ? calendarDate : addDays(currentWeekStart, selectedDayIndex);
        initialDate.setHours(8, 0, 0, 0);

        return (
            <BatchAddScheduleModal
                onClose={() => setShowBatchAdd(false)}
                onSaved={() => {
                    setShowBatchAdd(false);
                    loadSchedules();
                }}
                initialDate={initialDate}
            />
        );
    }

    return (
        <div className="schedule-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--bg-card)' }}>
            {selectedSchedule ? (
                <div className="modal-scroll" style={{ height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    {interactionMode === 'EDIT_RESULT' && (
                        <div style={{ padding: '20px', minHeight: 'min-content' }}>
                            <FeedbackForm
                                initialData={completionData}
                                onSubmit={handleCompleteSubmit}
                                onCancel={() => {
                                    const parts = selectedSchedule.schedule_participants || [];
                                    const target = parts.find(p => p.id === completionTarget);
                                    if (target && target.completed_at) {
                                        setInteractionMode('VIEW_RESULT');
                                    } else {
                                        setInteractionMode('VIEW_PLAN');
                                    }
                                }}
                                loading={planActionLoading}
                            />
                        </div>
                    )}

                    {interactionMode === 'VIEW_RESULT' && (
                        <div style={{ padding: '20px', minHeight: 'min-content' }}>
                            <FeedbackResult
                                data={completionData}
                                onEdit={handleEditFeedback}
                                onBack={() => {
                                    setSelectedSchedule(null);
                                    loadSchedules();
                                }}
                                onViewPlan={() => setInteractionMode('VIEW_PLAN')}
                            />
                        </div>
                    )}

                    {interactionMode === 'VIEW_PLAN' && (
                        <PlanDetailModal
                            schedule={selectedSchedule}
                            onClose={() => {
                                setSelectedSchedule(null);
                                loadSchedules();
                            }}
                            onComplete={handleEditFeedback}
                        />
                    )}
                </div>
            ) : (
                <>
                    <CalendarLayout
                        schedules={schedules}
                        tags={tags}
                        sheep={sheep}
                        onAddClick={() => setShowBatchAdd(true)}
                        onEventClick={(schedule) => setSelectedSchedule(schedule)}
                    />
                </>
            )}
        </div>
    );
};
