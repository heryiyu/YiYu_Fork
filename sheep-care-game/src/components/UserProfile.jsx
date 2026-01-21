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

    // Styles
    const containerStyle = {
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 1000,
        backgroundColor: 'rgba(255, 255, 255, 0.85)', // Semi-transparent
        backdropFilter: 'blur(5px)', // Glass effect
        borderRadius: '20px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
        padding: expanded ? '20px' : '6px 10px 6px 10px', // Tighter padding when collapsed
        transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
        width: expanded ? '240px' : 'max-content', // Hug content when collapsed
        maxWidth: '90vw',
        cursor: expanded ? 'default' : 'pointer',
        border: '1px solid rgba(255,255,255,0.5)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        textAlign: 'left'
    };

    return (
        <div
            ref={wrapperRef}
            style={containerStyle}
            onClick={() => !expanded && setExpanded(true)}
        >
            {/* Header / Collapsed View */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: expanded ? '15px' : '0' }}>
                <span style={{ fontSize: '1.2rem', width: '20px', textAlign: 'center' }}>👤</span>

                {/* Name Display / Input */}
                {expanded ? (
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        placeholder="輸入暱稱"
                        style={{
                            fontSize: '1rem', fontWeight: 'bold', color: '#333',
                            border: 'none', background: 'rgba(0,0,0,0.05)',
                            borderRadius: '5px', padding: '2px 5px',
                            width: '100%', outline: 'none'
                        }}
                        autoFocus
                    />
                ) : (
                    <span style={{ fontWeight: 'bold', color: '#555', whiteSpace: 'nowrap' }}>
                        {nickname || currentUser}
                    </span>
                )}
            </div>

            {/* Expanded Details */}
            <div style={{
                maxHeight: expanded ? '200px' : '0',
                opacity: expanded ? 1 : 0,
                transition: 'all 0.3s ease',
                display: 'flex', flexDirection: 'column', gap: '8px'
            }}>
                {/* Location */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', color: '#666' }}>
                    <span style={{ width: '20px', textAlign: 'center' }}>📍</span>
                    <span>{location?.name || '未知區域'}</span>
                </div>

                {/* Weather */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', color: '#666' }}>
                    <span style={{ width: '20px', textAlign: 'center' }}>🌡️</span>
                    <span>{weatherLabel} ({weather?.temp || 25}°C)</span>
                </div>

                {/* Divider */}
                <div style={{ height: '1px', background: '#eee', margin: '5px 0' }}></div>

                {/* Sheep Count */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', color: '#777' }}>
                    <span style={{ width: '20px', textAlign: 'center' }}>🐑</span>
                    <span>目前擁有 {sheep?.length || 0} 隻小羊</span>
                </div>
            </div>

            {/* Collapsed Count (Only Show when collapsed) */}
            {!expanded && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px'
                }}>
                    <span style={{ fontSize: '1rem', width: '20px', textAlign: 'center' }}>🐑</span>
                    <span style={{ fontSize: '0.9rem', color: '#666' }}>{sheep?.length || 0} 隻</span>
                </div>
            )}
        </div>
    );
};
