import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';

export const UserProfile = () => {
    const { nickname, sheep, weather, location, updateNickname, currentUser } = useGame();
    const [expanded, setExpanded] = useState(false);
    const [name, setName] = useState(nickname || '');
    const [isEditing, setIsEditing] = useState(false);

    // Sync local state with global
    useEffect(() => {
        if (nickname) setName(nickname);
    }, [nickname]);

    const wrapperRef = useRef(null);

    // Save on Blur or Enter
    const handleSave = () => {
        const trimmed = name.trim();
        if (trimmed && trimmed.length <= 12) {
            updateNickname(trimmed);
        } else {
            setName(nickname || ''); // Revert if invalid
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSave();
            e.target.blur();
        }
    };

    // Click outside to collapse
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                if (expanded) {
                    setExpanded(false);
                    if (isEditing) handleSave();
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [expanded, isEditing, name]); // Depend on name to capture latest state for save

    const weatherMap = {
        sunny: '晴天', cloudy: '多雲', rain: '下雨', storm: '暴風雨', snow: '下雪'
    };
    const weatherLabel = weatherMap[weather?.type] || '晴天';

    // CSS classes are defined in App.css under .profile-hud-widget

    return (
        <div
            ref={wrapperRef}
            className={`profile-hud-widget ${expanded ? 'expanded' : ''}`}
            onClick={() => !expanded && setExpanded(true)}
        >
            {/* Header: Name + Avatar */}
            <div className="widget-header">
                <span className="icon">👤</span>
                {expanded ? (
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        placeholder="輸入暱稱"
                        maxLength={12} // Strict length limit
                        style={{
                            fontSize: '1rem', fontWeight: 'bold', color: '#333',
                            border: 'none', background: 'rgba(0,0,0,0.05)',
                            borderRadius: '5px', padding: '2px 5px',
                            width: '140px', // Fixed width during edit to prevent jumpiness
                            outline: 'none'
                        }}
                        autoFocus
                    />
                ) : (
                    <span className="text-bold">
                        {nickname || currentUser}
                    </span>
                )}
            </div>

            {/* Collapsed Info: Sheep Count */}
            {!expanded && (
                <div className="widget-collapsed-info">
                    <span className="icon">🐑</span>
                    <span className="text-label">{sheep?.length || 0} 隻</span>
                </div>
            )}

            {/* Expanded Content: Location, Weather, Count */}
            {expanded && (
                <div className="widget-content">
                    {/* Location */}
                    <div className="widget-header">
                        <span className="icon">📍</span>
                        <span className="text-label">{location?.name || '未知區域'}</span>
                    </div>

                    {/* Weather */}
                    <div className="widget-header">
                        <span className="icon">🌡️</span>
                        <span className="text-label">{weatherLabel} ({weather?.temp || 25}°C)</span>
                    </div>

                    <div style={{ height: '1px', background: 'rgba(0,0,0,0.1)', margin: '5px 0' }}></div>

                    {/* Sheep Count Detail */}
                    <div className="widget-header">
                        <span className="icon">🐑</span>
                        <span className="text-label">目前擁有 {sheep?.length || 0} 隻小羊</span>
                    </div>
                </div>
            )}
        </div>
    );
};
