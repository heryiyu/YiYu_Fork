import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import '../styles/design-tokens.css';

const DAYS_SHORT = ['日', '一', '二', '三', '四', '五', '六'];

export const MiniCalendar = ({ schedules = [], selectedDate, onSelectDate }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate || new Date()));

    const daysInMonth = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        return new Date(year, month + 1, 0).getDate();
    }, [currentMonth]);

    const firstDayOfMonth = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        return new Date(year, month, 1).getDay();
    }, [currentMonth]);

    const handlePrevMonth = () => {
        setCurrentMonth(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() - 1);
            return newDate;
        });
    };

    const handleNextMonth = () => {
        setCurrentMonth(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + 1);
            return newDate;
        });
    };

    const hasEvent = (day) => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const dateStr = new Date(year, month, day).toDateString();

        return schedules.some(s => {
            if (!s.scheduled_time) return false;
            return new Date(s.scheduled_time).toDateString() === dateStr;
        });
    };

    const isSelected = (day) => {
        if (!selectedDate) return false;
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const checkDate = new Date(year, month, day);
        return checkDate.toDateString() === selectedDate.toDateString();
    };

    const isToday = (day) => {
        const today = new Date();
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        return today.toDateString() === new Date(year, month, day).toDateString();
    };

    const renderDays = () => {
        const days = [];
        // Empty cells for days before the first day of month
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`empty-${i}`} style={{ height: '36px' }}></div>);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const active = isSelected(d);
            const event = hasEvent(d);
            const today = isToday(d);

            days.push(
                <button
                    key={d}
                    onClick={() => onSelectDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d))}
                    style={{
                        height: '36px',
                        width: '36px',
                        borderRadius: '50%',
                        border: today && !active ? '1px solid var(--palette-blue-action)' : 'none',
                        background: active ? 'var(--palette-blue-action)' : 'transparent',
                        color: active ? '#fff' : 'var(--text-primary)',
                        cursor: 'pointer',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.9rem',
                        fontWeight: active || today ? 'bold' : 'normal',
                        margin: 'auto'
                    }}
                >
                    {d}
                    {event && (
                        <div style={{
                            position: 'absolute',
                            bottom: '4px',
                            width: '4px',
                            height: '4px',
                            borderRadius: '50%',
                            background: active ? '#fff' : 'var(--palette-danger)'
                        }}></div>
                    )}
                </button>
            );
        }
        return days;
    };

    return (
        <div style={{
            background: 'var(--bg-card-secondary)',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '16px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <button onClick={handlePrevMonth} className="icon-btn" style={{ background: 'transparent', border: 'none' }}>
                    <ChevronLeft size={20} color="var(--text-secondary)" />
                </button>
                <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    {currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月
                </div>
                <button onClick={handleNextMonth} className="icon-btn" style={{ background: 'transparent', border: 'none' }}>
                    <ChevronRight size={20} color="var(--text-secondary)" />
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '8px', textAlign: 'center' }}>
                {DAYS_SHORT.map(d => (
                    <div key={d} style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{d}</div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: '4px' }}>
                {renderDays()}
            </div>
        </div>
    );
};
