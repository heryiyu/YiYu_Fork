import React, { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { CalendarHeader } from './CalendarHeader';
import { CalendarSidebar } from './CalendarSidebar';
import { CalendarGridView } from './CalendarGridView';

export const CalendarLayout = ({
    schedules,
    tags,
    sheep,
    onAddClick,
    onEventClick
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('week'); // Default week, can be day/3day/month
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Filters
    const [selectedTags, setSelectedTags] = useState([]);
    const [selectedSheep, setSelectedSheep] = useState([]);

    const weekStart = useMemo(() => {
        const d = new Date(currentDate);
        const day = d.getDay();
        const diff = d.getDate() - day;
        return new Date(d.setDate(diff));
    }, [currentDate]);

    const filteredSchedules = useMemo(() => {
        return schedules.filter(s => {
            if (selectedTags.length === 0 && selectedSheep.length === 0) return true;
            const sheepMatch = selectedSheep.length === 0 || s.schedule_participants?.some(p => selectedSheep.includes(p.sheep_id));
            const tagMatch = selectedTags.length === 0 || true;
            return sheepMatch && tagMatch;
        });
    }, [schedules, selectedTags, selectedSheep]);

    const handlePrev = () => {
        setCurrentDate(prev => {
            const next = new Date(prev);
            if (viewMode === 'week') next.setDate(prev.getDate() - 7);
            else if (viewMode === 'day') next.setDate(prev.getDate() - 1);
            else next.setMonth(prev.getMonth() - 1);
            return next;
        });
    };

    const handleNext = () => {
        setCurrentDate(prev => {
            const next = new Date(prev);
            if (viewMode === 'week') next.setDate(prev.getDate() + 7);
            else if (viewMode === 'day') next.setDate(prev.getDate() + 1);
            else next.setMonth(prev.getMonth() + 1);
            return next;
        });
    };

    const handleToday = () => setCurrentDate(new Date());

    const toggleTag = (tagId) => {
        setSelectedTags(prev => prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]);
    };

    const toggleSheep = (sheepId) => {
        setSelectedSheep(prev => prev.includes(sheepId) ? prev.filter(id => id !== sheepId) : [...prev, sheepId]);
    };

    return (
        <div className="calendar-mobile-container">
            <CalendarHeader
                currentDate={currentDate}
                onPrev={handlePrev}
                onNext={handleNext}
                onToday={handleToday}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onToggleSidebar={() => setIsDrawerOpen(true)}
            />

            <div className="calendar-main-content">
                {/* Drawer Overlay */}
                <div
                    className={`drawer-overlay ${isDrawerOpen ? 'active' : ''}`}
                    onClick={() => setIsDrawerOpen(false)}
                ></div>

                {/* Drawer Menu */}
                <div className={`calendar-drawer ${isDrawerOpen ? 'active' : ''}`}>
                    <CalendarSidebar
                        onAddClick={onAddClick}
                        schedules={schedules}
                        selectedDate={currentDate}
                        onSelectDate={(date) => {
                            setCurrentDate(date);
                            setIsDrawerOpen(false); // Auto close on date select
                        }}
                        tags={tags}
                        selectedTags={selectedTags}
                        onToggleTag={toggleTag}
                        sheep={sheep}
                        selectedSheep={selectedSheep}
                        onToggleSheep={toggleSheep}
                        onEventClick={(e) => {
                            onEventClick(e);
                            setIsDrawerOpen(false);
                        }}
                    />
                </div>

                <main className="calendar-grid-wrapper">
                    <CalendarGridView
                        viewMode={viewMode}
                        currentDate={currentDate}
                        weekStart={weekStart}
                        schedules={filteredSchedules}
                        onEventClick={onEventClick}
                        onCellClick={(date) => {
                            setCurrentDate(date);
                        }}
                    />
                </main>

                {/* Floating Action Button */}
                <button className="calendar-fab" onClick={onAddClick}>
                    <Plus size={24} />
                    <span className="fab-label">建立</span>
                </button>
            </div>
        </div>
    );
};
