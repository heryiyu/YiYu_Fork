import React from 'react';
import { ChevronLeft, ChevronRight, Menu } from 'lucide-react';

export const CalendarHeader = ({
    currentDate,
    onPrev,
    onNext,
    onToday,
    viewMode,
    onViewModeChange,
    onToggleSidebar
}) => {
    const monthYearString = currentDate.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'long'
    });

    return (
        <header className="calendar-mobile-header">
            <div className="header-top">
                <div className="header-left">
                    <button className="icon-btn menu-btn" onClick={onToggleSidebar}>
                        <Menu size={24} />
                    </button>
                    <h2 className="header-title" style={{ marginRight: '8px' }}>{monthYearString}</h2>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="icon-btn" onClick={onPrev} style={{ padding: '4px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <ChevronLeft size={20} color="#5f6368" />
                        </button>
                        <button className="icon-btn" onClick={onNext} style={{ padding: '4px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <ChevronRight size={20} color="#5f6368" />
                        </button>
                    </div>
                </div>

                <div className="header-right">
                    <button className="icon-btn search-btn">
                        <span className="logo-emoji">🔍</span>
                    </button>
                    <button className="btn-today-alt" onClick={onToday}>
                        <span className="calendar-icon-wrapper">
                            <div className="cal-day-num">{new Date().getDate()}</div>
                        </span>
                    </button>
                    <select
                        className="mobile-view-selector"
                        value={viewMode}
                        onChange={(e) => onViewModeChange(e.target.value)}
                    >
                        <option value="day">日</option>
                        <option value="week">週</option>
                        <option value="month">月</option>
                    </select>
                </div>
            </div>
        </header>
    );
};
