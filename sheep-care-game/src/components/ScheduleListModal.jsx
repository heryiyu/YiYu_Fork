
import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Plus, Clock, MapPin, ChevronLeft, ChevronRight, User, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { CloseButton } from './ui/CloseButton';
import { AssetSheep } from './AssetSheep';
import { BatchAddScheduleModal } from './BatchAddScheduleModal';
import { Portal } from './ui/Portal';
import { generateGoogleCalendarUrl } from '../utils/calendarHelper';
import '../styles/design-tokens.css';
import { PlanDetailModal } from './PlanDetailModal';
import { MiniCalendar } from './MiniCalendar';

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

export const ScheduleListModal = ({ onClose, onSelectSheep }) => {
    const { fetchWeeklySchedules, sheep, lastScheduleUpdate } = useGame();


    const [schedules, setSchedules] = useState([]);
    const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(new Date()));
    const [selectedDayIndex, setSelectedDayIndex] = useState(new Date().getDay()); // 0-6
    const [isLoading, setIsLoading] = useState(true);
    const [showBatchAdd, setShowBatchAdd] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState(null); // Track selected schedule for detail view

    // Calendar View State
    const [viewFormat, setViewFormat] = useState('LIST'); // 'LIST' or 'CALENDAR'
    const [calendarDate, setCalendarDate] = useState(new Date());

    const loadSchedules = async () => {
        setIsLoading(true);
        const data = await fetchWeeklySchedules();
        setSchedules(data);
        setIsLoading(false);
    };

    useEffect(() => {
        loadSchedules();
    }, [lastScheduleUpdate]);

    // Sync selectedSchedule with updated schedules data
    useEffect(() => {
        if (selectedSchedule) {
            const updated = schedules.find(s => s.id === selectedSchedule.id);
            if (updated && updated !== selectedSchedule) {
                setSelectedSchedule(updated);
            }
        }
    }, [schedules]);

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
        initialDate.setHours(8, 0, 0, 0); // Default to 08:00

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
        <Portal>
            <div className="debug-editor-overlay" onClick={onClose}>
                <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '430px', padding: '0', display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '80vh', overflow: 'hidden', background: 'var(--bg-card)', borderRadius: '24px', boxShadow: 'var(--shadow-card)' }}>

                    {selectedSchedule ? (
                        <div style={{ height: '100%', overflow: 'hidden' }}>
                            <PlanDetailModal
                                schedule={selectedSchedule}
                                onClose={() => {
                                    setSelectedSchedule(null);
                                    loadSchedules();
                                }}
                            />
                        </div>
                    ) : (
                        <>    <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                <div
                                    onClick={() => setViewFormat(prev => prev === 'LIST' ? 'CALENDAR' : 'LIST')}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        cursor: 'pointer',
                                        padding: '4px 8px',
                                        borderRadius: '8px',
                                        transition: 'background 0.2s'
                                    }}
                                    className="header-date-toggle"
                                >
                                    <Calendar size={20} />
                                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{currentYearMonth}</h3>
                                    <ChevronDown size={16} style={{
                                        transform: viewFormat === 'CALENDAR' ? 'rotate(180deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.2s',
                                        color: 'var(--text-muted)'
                                    }} />
                                </div>

                                {viewFormat === 'LIST' && (
                                    <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto', marginRight: '8px' }}>
                                        <button className="icon-btn" onClick={prevWeek} title="上一週">
                                            <ChevronLeft size={18} />
                                        </button>
                                        <button
                                            className="icon-btn"
                                            onClick={goToToday}
                                            style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--palette-blue-action)' }}
                                            title="回到今天"
                                        >
                                            今
                                        </button>
                                        <button className="icon-btn" onClick={nextWeek} title="下一週">
                                            <ChevronRight size={18} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    className="icon-btn"
                                    onClick={loadSchedules}
                                    title="重新整理"
                                >
                                    🔄
                                </button>
                                <CloseButton onClick={onClose} />
                            </div>
                        </div>

                            {/* Day Tabs (Only in LIST view) */}
                            {viewFormat === 'LIST' && (
                                <div className="schedule-tabs" style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    gap: '2px',
                                    padding: '10px 8px',
                                    borderBottom: '1px solid var(--border-subtle)',
                                    background: 'rgba(255,255,255,0.5)',
                                }}>
                                    {DAYS.map((day, idx) => {
                                        const date = addDays(currentWeekStart, idx);
                                        const isToday = new Date().toDateString() === date.toDateString();
                                        const isSelected = selectedDayIndex === idx;

                                        return (
                                            <button
                                                key={day}
                                                onClick={() => setSelectedDayIndex(idx)}
                                                className={`schedule - tab - btn ${isSelected ? 'active' : ''} `}
                                                style={{
                                                    position: 'relative',
                                                    flex: 1,
                                                    padding: '6px 0 10px 0',
                                                    borderRadius: '12px',
                                                    background: isSelected ? 'var(--palette-blue-action)' : (isToday ? 'var(--bg-snow)' : 'transparent'),
                                                    color: isSelected ? '#fff' : (isToday ? 'var(--palette-blue-text)' : 'var(--text-secondary)'),
                                                    border: isToday && !isSelected ? '1px solid var(--palette-blue-text)' : 'none',
                                                    whiteSpace: 'nowrap',
                                                    fontSize: '0.85rem',
                                                    fontWeight: isSelected || isToday ? 'bold' : 'normal',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    gap: '2px',
                                                    minWidth: 0
                                                }}
                                            >
                                                <span style={{ fontSize: '0.8rem' }}>{day}</span>
                                                <span style={{ fontSize: '0.9rem' }}>{date.getDate()}</span>
                                                {hasEventOnDay(date) && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        bottom: '3px',
                                                        width: '5px',
                                                        height: '5px',
                                                        borderRadius: '50%',
                                                        background: isSelected ? '#fff' : 'var(--palette-danger)'
                                                    }} />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Calendar View (Only in CALENDAR view) */}
                            {viewFormat === 'CALENDAR' && (
                                <div style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                    <MiniCalendar
                                        schedules={schedules}
                                        selectedDate={calendarDate}
                                        onSelectDate={(date) => {
                                            setCalendarDate(date);
                                            // Sync list view state
                                            setCurrentWeekStart(getStartOfWeek(date));
                                            setSelectedDayIndex(date.getDay());
                                            setViewFormat('LIST');
                                        }}
                                    />
                                    <div style={{
                                        textAlign: 'center',
                                        fontSize: '0.8rem',
                                        color: 'var(--text-muted)',
                                        padding: '4px',
                                        background: 'var(--bg-snow)'
                                    }}>
                                        選擇日期以篩選行程
                                    </div>
                                </div>
                            )}

                            {/* Content */}
                            <div className="modal-content" style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                                {isLoading ? (
                                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>載入中...</div>
                                ) : (viewFormat === 'LIST' ? daySchedules : schedules.filter(s => s.scheduled_time && new Date(s.scheduled_time).toDateString() === calendarDate.toDateString())).length === 0 ? (
                                    <div style={{
                                        textAlign: 'center',
                                        color: 'var(--text-muted)',
                                        marginTop: '40px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}>
                                        <Calendar size={48} strokeWidth={1} style={{ opacity: 0.3 }} />
                                        <p>{viewFormat === 'LIST' ? `週${DAYS[selectedDayIndex].slice(1)}沒有安排行程` : `${calendarDate.getMonth() + 1}/${calendarDate.getDate()} 沒有安排行程`}</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {(viewFormat === 'LIST' ? daySchedules : schedules.filter(s => s.scheduled_time && new Date(s.scheduled_time).toDateString() === calendarDate.toDateString()).sort((a, b) => new Date(a.scheduled_time) - new Date(b.scheduled_time))).map(schedule => {
                                            const currentParticipants = schedule.schedule_participants || [];
                                            const completedCount = currentParticipants.filter(p => p.completed_at).length;
                                            const allCompleted = currentParticipants.length > 0 && completedCount === currentParticipants.length;

                                            return (
                                                <div key={schedule.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {/* Group Header Card */}
                                                    <div
                                                        onClick={() => setSelectedSchedule(schedule)}
                                                        style={{
                                                            background: 'var(--bg-snow)',
                                                            borderRadius: '12px',
                                                            padding: '12px',
                                                            boxShadow: 'var(--shadow-subtle)',
                                                            border: '1px solid var(--border-subtle)',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '12px',
                                                            position: 'relative'
                                                        }}
                                                    >
                                                        {/* Group Icon */}
                                                        <div style={{
                                                            width: '48px', height: '48px',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            background: 'var(--palette-pale-blue-bg)',
                                                            borderRadius: '50%',
                                                            color: 'var(--palette-blue-action)'
                                                        }}>
                                                            {currentParticipants.length > 1 ? <Users size={24} /> : <User size={24} />}
                                                        </div>

                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                                <span style={{
                                                                    fontWeight: 'bold',
                                                                    color: 'var(--text-primary)',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '6px'
                                                                }}>
                                                                    {schedule.action}
                                                                    {currentParticipants.length === 1 ? (
                                                                        (() => {
                                                                            const p = currentParticipants[0];
                                                                            const s = p.sheep || sheep.find(is => is.id === p.sheep_id);
                                                                            return s ? ` - ${s.name}` : '';
                                                                        })()
                                                                    ) : (
                                                                        ` (共${currentParticipants.length}人)`
                                                                    )}
                                                                    {allCompleted && <span style={{ fontSize: '0.8rem', color: 'var(--palette-success)' }}>✓ 全員完成</span>}
                                                                    {!allCompleted && completedCount > 0 && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({completedCount}人完成)</span>}
                                                                </span>
                                                                <span style={{
                                                                    fontSize: '0.85rem',
                                                                    color: 'var(--palette-blue-action)',
                                                                    background: 'var(--palette-pale-blue-bg)',
                                                                    padding: '2px 6px',
                                                                    borderRadius: '4px',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '4px'
                                                                }}>
                                                                    <Clock size={12} />
                                                                    {formatTime(schedule.scheduled_time)}
                                                                </span>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '-6px' }}>
                                                                    {currentParticipants.slice(0, 5).map((p, i) => {
                                                                        const s = p.sheep || sheep.find(is => is.id === p.sheep_id);
                                                                        return (
                                                                            <div key={p.id} style={{
                                                                                width: '24px', height: '24px',
                                                                                borderRadius: '50%',
                                                                                overflow: 'hidden',
                                                                                border: '2px solid #fff',
                                                                                marginLeft: i > 0 ? '-8px' : 0,
                                                                                background: '#eee'
                                                                            }}>{s ? <AssetSheep visual={s.visual} centered animated={false} /> : null}</div>
                                                                        );
                                                                    })}
                                                                    {currentParticipants.length > 5 && <span style={{ marginLeft: '4px', fontSize: '0.8rem' }}>+{currentParticipants.length - 5}</span>}
                                                                </div>
                                                                {schedule.location && (
                                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: '8px' }}>
                                                                        <MapPin size={12} />
                                                                        {schedule.location}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <ChevronRight size={20} color="var(--text-muted)" />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {unscheduledSchedules.length > 0 && (
                                    <div style={{ marginTop: '24px' }}>
                                        <div style={{
                                            fontSize: '0.9rem',
                                            fontWeight: 'bold',
                                            color: 'var(--text-muted)',
                                            marginBottom: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}>
                                            <div style={{ width: '4px', height: '12px', background: 'var(--palette-blue-action)', borderRadius: '2px' }} />
                                            待安排行程 ({unscheduledSchedules.length})
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {unscheduledSchedules.map(schedule => {
                                                const currentParticipants = schedule.schedule_participants || [];
                                                // For unscheduled, we effectively show one card per participant (or group them)
                                                // Let's show a group card if multiple, or single if one.
                                                // Actually, unscheduled usually imply "To Do" items without time.
                                                // Reuse same logic as grouped items for consistency?

                                                if (currentParticipants.length === 0) return null;

                                                return (
                                                    <div key={schedule.id}
                                                        onClick={() => setSelectedSchedule(schedule)}
                                                        style={{
                                                            background: 'rgba(255,255,255,0.6)',
                                                            borderRadius: '12px',
                                                            padding: '12px',
                                                            border: '1px dashed var(--border-subtle)',
                                                            display: 'flex',
                                                            gap: '12px',
                                                            alignItems: 'center',
                                                            opacity: 0.8,
                                                            cursor: 'pointer'
                                                        }}>

                                                        {/* Avatar Area */}
                                                        <div style={{
                                                            width: '40px', height: '40px',
                                                            background: 'var(--bg-app)',
                                                            borderRadius: '50%',
                                                            flexShrink: 0,
                                                            overflow: 'hidden',
                                                            border: '2px solid #fff',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                        }}>
                                                            {currentParticipants.length > 1 ? (
                                                                <Users size={20} color="var(--text-muted)" />
                                                            ) : (
                                                                (() => {
                                                                    const p = currentParticipants[0];
                                                                    const s = p.sheep || sheep.find(is => is.id === p.sheep_id);
                                                                    return s ? <AssetSheep visual={s.visual} centered={true} status={s.status} /> : <User size={20} />;
                                                                })()
                                                            )}
                                                        </div>

                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
                                                                {schedule.action}
                                                                {currentParticipants.length > 1 && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal' }}> (共{currentParticipants.length}人)</span>}
                                                            </div>
                                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                                {currentParticipants.length === 1
                                                                    ? (currentParticipants[0].sheep || sheep.find(s => s.id === currentParticipants[0].sheep_id))?.name || '未知小羊'
                                                                    : '小組行程'
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer Action */}
                            <div className="modal-footer" style={{
                                padding: '16px',
                                borderTop: '1px solid var(--border-subtle)',
                                background: 'var(--bg-card-secondary)',
                                borderRadius: '0 0 24px 24px'
                            }}>
                                <button
                                    className="modal-btn-primary"
                                    style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}
                                    onClick={() => setShowBatchAdd(true)}
                                >
                                    <Plus size={20} />
                                    新增批量規劃
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div >
        </Portal >
    );
};
