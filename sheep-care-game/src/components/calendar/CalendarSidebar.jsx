import React from 'react';
import { Plus } from 'lucide-react';
import { MiniCalendar } from '../game/MiniCalendar';
import { Tag } from '../ui/Tag';

export const CalendarSidebar = ({
    onAddClick,
    schedules,
    selectedDate,
    onSelectDate,
    tags,
    selectedTags,
    onToggleTag,
    sheep,
    selectedSheep,
    onToggleSheep
}) => {
    return (
        <aside className="calendar-sidebar">
            <div className="drawer-header">
                牧羊人週記
            </div>

            <div className="sidebar-section">
                <MiniCalendar
                    schedules={schedules}
                    selectedDate={selectedDate}
                    onSelectDate={onSelectDate}
                />
            </div>

            <div className="sidebar-section filters-section">
                <h3 className="section-title">我的小羊</h3>
                <div className="filter-list">
                    {sheep.slice(0, 8).map(s => (
                        <label key={s.id} className="filter-item">
                            <input
                                type="checkbox"
                                checked={selectedSheep.includes(s.id)}
                                onChange={() => onToggleSheep(s.id)}
                            />
                            <span className="filter-label">{s.name || '未命名小羊'}</span>
                        </label>
                    ))}
                    {sheep.length > 8 && <div className="more-link">還有 {sheep.length - 8} 隻...</div>}
                </div>
            </div>

            <div className="sidebar-section filters-section">
                <h3 className="section-title">標籤篩選</h3>
                <div className="tag-filters">
                    {tags.map(t => (
                        <button
                            key={t.id}
                            className={`tag-filter-btn ${selectedTags.includes(t.id) ? 'active' : ''}`}
                            onClick={() => onToggleTag(t.id)}
                            style={{
                                '--tag-color': t.color,
                                borderColor: selectedTags.includes(t.id) ? t.color : 'transparent'
                            }}
                        >
                            <span className="color-dot" style={{ backgroundColor: t.color }}></span>
                            {t.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="sidebar-section">
                <h3 className="section-title">待安排行程 ({schedules.filter(s => !s.scheduled_time).length})</h3>
                <div className="unscheduled-list">
                    {schedules.filter(s => !s.scheduled_time).map(s => (
                        <div
                            key={s.id}
                            className="unscheduled-item"
                            onClick={() => onEventClick(s)}
                        >
                            <span className="unscheduled-bullet"></span>
                            <span className="unscheduled-text">{s.action}</span>
                        </div>
                    ))}
                </div>
            </div>
        </aside>
    );
};
