import React, { useMemo, useEffect, useRef } from 'react';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS_OFFSET = Array.from({ length: 7 }, (_, i) => i);

export const CalendarGridView = ({
    viewMode = 'week',
    currentDate,
    weekStart,
    schedules,
    onEventClick,
    onCellClick
}) => {
    const gridRef = useRef(null);
    const nowIndicatorRef = useRef(null);

    const dates = useMemo(() => {
        if (viewMode === 'day') {
            return [currentDate];
        }
        // Week view
        return DAYS_OFFSET.map(offset => {
            const d = new Date(weekStart);
            d.setDate(d.getDate() + offset);
            return d;
        });
    }, [viewMode, currentDate, weekStart]);

    // Position "now" indicator
    useEffect(() => {
        const updateNowIndicator = () => {
            if (!nowIndicatorRef.current || viewMode === 'month') return;
            const now = new Date();
            const hour = now.getHours();
            const min = now.getMinutes();

            const isVisible = dates.some(d => d.toDateString() === now.toDateString());

            if (isVisible) {
                const dayIdx = dates.findIndex(d => d.toDateString() === now.toDateString());
                const top = (hour * 60 + min);
                nowIndicatorRef.current.style.top = `${top}px`;
                nowIndicatorRef.current.style.display = 'block';

                const colWidth = gridRef.current?.offsetWidth / dates.length;
                nowIndicatorRef.current.style.left = `${dayIdx * colWidth}px`;
                nowIndicatorRef.current.style.width = `${colWidth}px`;
            } else {
                nowIndicatorRef.current.style.display = 'none';
            }
        };

        updateNowIndicator();
        const interval = setInterval(updateNowIndicator, 60000);
        return () => clearInterval(interval);
    }, [dates, viewMode]);

    // Scroll to 8:00 AM on initial load
    useEffect(() => {
        if (gridRef.current && viewMode !== 'month') {
            gridRef.current.scrollTop = 8 * 60; // 8:00 AM
        }
    }, [viewMode]);

    const renderEvents = (dayDate) => {
        const dStr = dayDate.toDateString();
        const dayEvents = schedules.filter(s => {
            if (!s.scheduled_time) return false;
            return new Date(s.scheduled_time).toDateString() === dStr;
        });

        return dayEvents.map(event => {
            const date = new Date(event.scheduled_time);
            const startHour = date.getHours();
            const startMin = date.getMinutes();
            const top = startHour * 60 + startMin;
            const height = 45;

            return (
                <div
                    key={event.id}
                    className="calendar-event-block"
                    onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                    }}
                    style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        backgroundColor: 'var(--palette-blue-action)',
                        borderLeft: '4px solid rgba(255,255,255,0.3)'
                    }}
                >
                    <div className="event-time">{date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })}</div>
                    <div className="event-title">{event.action}</div>
                </div>
            );
        });
    };

    if (viewMode === 'month') {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();

        const monthDays = [];
        // Prev month padding
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = firstDay - 1; i >= 0; i--) {
            monthDays.push({ date: new Date(year, month - 1, prevMonthLastDay - i), current: false });
        }
        // Current month
        for (let i = 1; i <= daysInMonth; i++) {
            monthDays.push({ date: new Date(year, month, i), current: true });
        }
        // Next month padding
        const totalCells = monthDays.length > 35 ? 42 : 35;
        const nextPadding = totalCells - monthDays.length;
        for (let i = 1; i <= nextPadding; i++) {
            monthDays.push({ date: new Date(year, month + 1, i), current: false });
        }

        return (
            <div className="calendar-grid-container month-view">
                <div className="month-grid-header">
                    {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                        <div key={d} className="month-day-label">{d}</div>
                    ))}
                </div>
                <div className="month-grid-body">
                    {monthDays.map((d, i) => {
                        const isToday = d.date.toDateString() === new Date().toDateString();
                        const dayEvents = schedules.filter(s => s.scheduled_time && new Date(s.scheduled_time).toDateString() === d.date.toDateString());

                        return (
                            <div key={i} className={`month-cell ${!d.current ? 'not-current' : ''}`} onClick={() => onCellClick(d.date)}>
                                <div className={`month-day-num ${isToday ? 'is-today' : ''}`}>{d.date.getDate()}</div>
                                <div className="month-event-container">
                                    {dayEvents.slice(0, 3).map(e => (
                                        <div key={e.id} className="month-event-tiny" onClick={(ev) => { ev.stopPropagation(); onEventClick(e); }}>
                                            {e.action}
                                        </div>
                                    ))}
                                    {dayEvents.length > 3 && <div className="month-more-link">還有 {dayEvents.length - 3} 個...</div>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <div className="calendar-grid-container">
            <div className="grid-header">
                <div className="time-gutter-header"></div>
                {dates.map((date, idx) => {
                    const isToday = new Date().toDateString() === date.toDateString();
                    return (
                        <div key={idx} className={`day-header ${isToday ? 'is-today' : ''}`}>
                            <div className="day-name">{['日', '一', '二', '三', '四', '五', '六'][date.getDay()]}</div>
                            <div className="day-number">{date.getDate()}</div>
                        </div>
                    );
                })}
            </div>

            <div className="grid-scroll-area" ref={gridRef}>
                <div className="grid-body">
                    <div className="time-gutter">
                        {HOURS.map(h => (
                            <div key={h} className="time-label">
                                {h > 0 ? `${h.toString().padStart(2, '0')}:00` : ''}
                            </div>
                        ))}
                    </div>

                    <div className="columns-container">
                        {dates.map((date, idx) => (
                            <div
                                key={idx}
                                className="day-column"
                                onClick={() => onCellClick(date)}
                            >
                                {HOURS.map(h => (
                                    <div key={h} className="hour-cell"></div>
                                ))}
                                {renderEvents(date)}
                            </div>
                        ))}

                        <div className="now-indicator" ref={nowIndicatorRef}>
                            <div className="now-dot"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
