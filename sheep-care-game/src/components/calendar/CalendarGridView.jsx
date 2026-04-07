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

    // --- Elastic Timeline Logic ---
    const EXPANDED_HEIGHT = 60;
    const COLLAPSED_HEIGHT = 16; 

    const { hourHeights, hourOffsets, activeHours, totalHeight } = useMemo(() => {
        if (viewMode === 'month') return { hourHeights: [], hourOffsets: [], activeHours: new Set(), totalHeight: 0 };

        const activeSet = new Set();
        const visibleDatesStrings = dates.map(d => d.toDateString());

        const visibleEvents = schedules.filter(s => {
            if (!s.scheduled_time) return false;
            return visibleDatesStrings.includes(new Date(s.scheduled_time).toDateString());
        });

        visibleEvents.forEach(event => {
            const date = new Date(event.scheduled_time);
            const startHour = date.getHours();
            // Assuming default 45min duration for collision bounding map
            const endMins = date.getMinutes() + 45;
            const endHour = date.getHours() + Math.floor(endMins / 60);

            for (let h = startHour; h <= endHour && h < 24; h++) {
                activeSet.add(h);
            }
        });

        // Current hour is always active if today is visible
        const now = new Date();
        if (visibleDatesStrings.includes(now.toDateString())) {
            activeSet.add(now.getHours());
            // Optionally add surrounding hours to make current time block feel less squished
            if (now.getHours() > 0) activeSet.add(now.getHours() - 1);
        }

        const heights = [];
        const offsets = [];
        let currentOffset = 0;

        for (let h = 0; h < 24; h++) {
            const hStatus = activeSet.has(h);
            const hHeight = hStatus ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT;
            heights.push(hHeight);
            offsets.push(currentOffset);
            currentOffset += hHeight;
        }
        offsets.push(currentOffset); // Offset for the end of the day

        return { hourHeights: heights, hourOffsets: offsets, activeHours: activeSet, totalHeight: currentOffset };
    }, [viewMode, dates, schedules]);

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
                const top = hourOffsets[hour] + (min / 60) * hourHeights[hour];
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
    }, [dates, viewMode, hourOffsets, hourHeights]);

    // Scroll to 8:00 AM or first active hour on initial load
    useEffect(() => {
        if (gridRef.current && viewMode !== 'month') {
            const firstActive = Math.max(0, Array.from(activeHours).sort((a,b)=>a-b)[0] || 8);
            // Scroll to the first active hour, slightly padded
            gridRef.current.scrollTop = hourOffsets[Math.max(0, firstActive - 1)] || 0;
        }
    }, [viewMode, hourOffsets, activeHours]);

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
            const top = hourOffsets[startHour] + (startMin / 60) * hourHeights[startHour];
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
                <div className="grid-body" style={{ height: `${totalHeight}px` }}>
                    <div className="time-gutter">
                        {HOURS.map(h => {
                            const isActive = activeHours.has(h);
                            return (
                                <div 
                                    key={h} 
                                    className={`time-label ${!isActive ? 'is-collapsed' : ''}`}
                                    style={{ height: `${hourHeights[h]}px` }}
                                >
                                    {isActive && h > 0 ? `${h.toString().padStart(2, '0')}:00` : ''}
                                    {!isActive && <div className="collapsed-tick"></div>}
                                </div>
                            );
                        })}
                    </div>

                    <div className="columns-container">
                        {dates.map((date, idx) => (
                            <div
                                key={idx}
                                className="day-column"
                                onClick={() => onCellClick(date)}
                            >
                                {HOURS.map(h => (
                                    <div 
                                        key={h} 
                                        className={`hour-cell ${!activeHours.has(h) ? 'is-collapsed' : ''}`}
                                        style={{ height: `${hourHeights[h]}px` }}
                                    ></div>
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
