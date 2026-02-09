import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Plus, Clock, MapPin, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { CloseButton } from './ui/CloseButton';
import { AssetSheep } from './AssetSheep';
import { BatchAddScheduleModal } from './BatchAddScheduleModal';
import { Portal } from './ui/Portal';
import '../styles/design-tokens.css';

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

export const ScheduleListModal = ({ onClose }) => {
    const { fetchWeeklySchedules, sheep } = useGame();
    const [schedules, setSchedules] = useState([]);
    const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(new Date()));
    const [selectedDayIndex, setSelectedDayIndex] = useState(new Date().getDay()); // 0-6
    const [isLoading, setIsLoading] = useState(true);
    const [showBatchAdd, setShowBatchAdd] = useState(false);

    const loadSchedules = async () => {
        setIsLoading(true);
        const data = await fetchWeeklySchedules();
        setSchedules(data);
        setIsLoading(false);
    };

    useEffect(() => {
        loadSchedules();
    }, []);

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

    // Group schedules by day
    const daySchedules = useMemo(() => {
        const targetDate = addDays(currentWeekStart, selectedDayIndex);
        const targetDateStr = targetDate.toDateString();

        return schedules.filter(s => {
            if (!s.scheduled_time) return false;
            const d = new Date(s.scheduled_time);
            return d.toDateString() === targetDateStr;
        }).sort((a, b) => new Date(a.scheduled_time) - new Date(b.scheduled_time));
    }, [schedules, currentWeekStart, selectedDayIndex]);

    const formatTime = (isoString) => {
        const d = new Date(isoString);
        return d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    if (showBatchAdd) {
        const initialDate = addDays(currentWeekStart, selectedDayIndex);
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
                <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px', height: '80vh', display: 'flex', flexDirection: 'column' }}>
                    <div className="modal-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                            <Calendar size={20} />
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{currentYearMonth}</h3>

                            <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto', marginRight: '8px' }}>
                                <button className="icon-btn" onClick={prevWeek} title="上一週">
                                    <ChevronLeft size={18} />
                                </button>
                                <button className="icon-btn" onClick={nextWeek} title="下一週">
                                    <ChevronRight size={18} />
                                </button>
                            </div>
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

                    {/* Day Tabs */}
                    <div className="schedule-tabs" style={{
                        display: 'flex',
                        overflowX: 'auto',
                        gap: '4px',
                        padding: '10px 16px',
                        borderBottom: '1px solid var(--border-subtle)',
                        background: 'rgba(255,255,255,0.5)',
                        scrollbarWidth: 'none'
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
                                        padding: '6px 12px',
                                        borderRadius: '16px',
                                        background: isSelected ? 'var(--palette-blue-action)' : (isToday ? 'var(--bg-snow)' : 'transparent'),
                                        color: isSelected ? '#fff' : (isToday ? 'var(--palette-blue-text)' : 'var(--text-secondary)'),
                                        border: isToday && !isSelected ? '1px solid var(--palette-blue-text)' : 'none',
                                        whiteSpace: 'nowrap',
                                        fontSize: '0.9rem',
                                        fontWeight: isSelected || isToday ? 'bold' : 'normal',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '2px',
                                        minWidth: '48px'
                                    }}
                                >
                                    <span style={{ fontSize: '0.8rem' }}>{day}</span>
                                    <span style={{ fontSize: '0.9rem' }}>{date.getDate()}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Content */}
                    <div className="modal-content" style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                        {isLoading ? (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>載入中...</div>
                        ) : daySchedules.length === 0 ? (
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
                                <p>週{DAYS[selectedDayIndex].slice(1)}沒有安排行程</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {daySchedules.map(plan => {
                                    const sheepData = plan.sheep || sheep.find(s => s.id === plan.sheep_id);
                                    return (
                                        <div key={plan.id} className="schedule-card" style={{
                                            background: '#fff',
                                            borderRadius: '12px',
                                            padding: '12px',
                                            boxShadow: 'var(--shadow-subtle)',
                                            display: 'flex',
                                            gap: '12px',
                                            alignItems: 'center'
                                        }}>
                                            {/* Avatar */}
                                            <div style={{
                                                width: '48px', height: '48px',
                                                background: 'var(--bg-app)',
                                                borderRadius: '50%',
                                                flexShrink: 0,
                                                overflow: 'hidden',
                                                border: '2px solid #fff',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                position: 'relative'
                                            }}>
                                                {sheepData ? (
                                                    <AssetSheep
                                                        visual={sheepData.visual}
                                                        centered={true}
                                                        animated={false}
                                                        status={sheepData.status || 'healthy'}
                                                    />
                                                ) : (
                                                    <User size={24} style={{ margin: '10px' }} />
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                    <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{plan.action}</span>
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
                                                        {formatTime(plan.scheduled_time)}
                                                    </span>
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                                    <span>{sheepData?.name || '未知小羊'}</span>
                                                    {plan.location && (
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                                            <MapPin size={12} />
                                                            {plan.location}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
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
                </div>
            </div>
        </Portal>
    );
};
