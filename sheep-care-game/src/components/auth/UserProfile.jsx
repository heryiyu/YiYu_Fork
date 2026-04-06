import React, { useState, useEffect, useRef } from 'react';
import { useGame, useGameActions, useUserAuth } from '../../context/GameContext/useGame';
import { ASSETS } from '../../utils/AssetRegistry';
import { User } from 'lucide-react';

export const UserProfile = () => {
    const { nickname, sheep, weather, location, updateNickname, currentUser, userAvatarUrl } = useGame();
    const { updateSetting } = useGameActions();
    const { settings } = useUserAuth();
    const [expanded, setExpanded] = useState(false);
    const [name, setName] = useState(nickname || '');
    const [isEditing, setIsEditing] = useState(false);

    // Sync local state with global
    const [prevNickname, setPrevNickname] = useState(nickname);
    if (nickname !== prevNickname) {
        setPrevNickname(nickname);
        setName(nickname || '');
    }

    const wrapperRef = useRef(null);

    // Save on Blur or Enter
    const handleSave = React.useCallback(() => {
        const trimmed = name.trim();
        if (trimmed && trimmed.length <= 12) {
            updateNickname(trimmed);
        } else {
            setName(nickname || ''); // Revert if invalid
        }
        setIsEditing(false);
    }, [name, nickname, updateNickname]);

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
    }, [expanded, isEditing, handleSave]); // Depend on handleSave which uses name

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
                {userAvatarUrl ? (
                    <span className="icon icon-avatar">
                        <img src={userAvatarUrl} alt="" width={24} height={24} />
                    </span>
                ) : (
                    <span className="icon">
                        <User size={18} strokeWidth={2.5} />
                    </span>
                )}
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
                    <span className="icon icon-sheep">
                        <img src={ASSETS.SHEEP_VARIANTS.CLASSIC_WHITE.HEALTHY} alt="" width={24} height={24} style={{ display: 'block', objectFit: 'contain' }} />
                    </span>
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
                        <span className="icon icon-sheep">
                            <img src={ASSETS.SHEEP_VARIANTS.CLASSIC_WHITE.HEALTHY} alt="" width={24} height={24} style={{ display: 'block', objectFit: 'contain' }} />
                        </span>
                        <span className="text-label">目前擁有 {sheep?.length || 0} 隻小羊</span>
                    </div>

                    <div style={{ height: '1px', background: 'rgba(0,0,0,0.1)', margin: '5px 0' }}></div>

                    {/* Lite Mode Toggle */}
                    <div className="widget-header" style={{ justifyContent: 'space-between', marginTop: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="icon">📝</span>
                            <span className="text-label">清單模式</span>
                        </div>
                        <div
                            className={`toggle-switch ${settings?.liteMode ? 'active' : ''}`}
                            onClick={(e) => {
                                e.stopPropagation(); // prevent bubbling to widget wrapper
                                updateSetting('liteMode', !settings?.liteMode);
                                setExpanded(false); // Auto-collapse the widget on toggle
                            }}
                            style={{
                                width: '36px', height: '20px', background: settings?.liteMode ? 'var(--palette-blue-action)' : 'var(--border-subtle)',
                                borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'background 0.3s'
                            }}
                        >
                            <div style={{
                                width: '16px', height: '16px', background: 'white', borderRadius: '50%',
                                position: 'absolute', top: '2px', left: settings?.liteMode ? '18px' : '2px',
                                transition: 'left 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                            }} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
