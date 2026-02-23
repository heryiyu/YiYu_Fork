import React, { useState, useEffect, useRef } from 'react';
import { useGameState, useUserAuth } from '../../context/GameContext/useGame';
import { ASSETS } from '../../utils/AssetRegistry';
import { User, MapPin, Cloud, Sun, CloudRain, CloudLightning, Snowflake } from 'lucide-react';

export const LiteProfileCard = () => {
    const { sheep, weather, location } = useGameState();
    const { nickname, updateNickname, currentUser, userAvatarUrl } = useUserAuth();

    const [name, setName] = useState(nickname || '');
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef(null);

    // Sync local state with global
    useEffect(() => {
        setName(nickname || '');
    }, [nickname]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

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
        } else if (e.key === 'Escape') {
            setName(nickname || '');
            setIsEditing(false);
        }
    };

    const weatherMap = {
        sunny: { label: '晴天', Icon: Sun, color: '#f59f00' },
        cloudy: { label: '多雲', Icon: Cloud, color: '#868e96' },
        rain: { label: '下雨', Icon: CloudRain, color: '#4dabf7' },
        storm: { label: '暴風雨', Icon: CloudLightning, color: '#5f3dc4' },
        snow: { label: '下雪', Icon: Snowflake, color: '#74c0fc' }
    };

    const weatherInfo = weatherMap[weather?.type] || weatherMap.sunny;
    const WeatherIcon = weatherInfo.Icon;

    return (
        <div className="lite-profile-card">
            <div className="lite-profile-header">
                <div className="lite-profile-avatar">
                    {userAvatarUrl ? (
                        <img src={userAvatarUrl} alt="User Avatar" />
                    ) : (
                        <User size={32} color="var(--palette-blue-action)" />
                    )}
                </div>
                <div className="lite-profile-info">
                    <div className="lite-profile-name-row">
                        {isEditing ? (
                            <input
                                ref={inputRef}
                                type="text"
                                className="lite-profile-name-input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onBlur={handleSave}
                                onKeyDown={handleKeyDown}
                                placeholder="輸入暱稱"
                                maxLength={12}
                            />
                        ) : (
                            <h3
                                className="lite-profile-name-display"
                                onClick={() => setIsEditing(true)}
                                title="點擊修改暱稱"
                            >
                                {nickname || currentUser}
                            </h3>
                        )}
                        <span className="lite-profile-account-id">@{currentUser}</span>
                    </div>

                    <div className="lite-profile-badges">
                        <div className="lite-profile-badge">
                            <MapPin size={14} />
                            <span>{location?.name || '未知區域'}</span>
                        </div>
                        <div className="lite-profile-badge">
                            <WeatherIcon size={14} color={weatherInfo.color} />
                            <span>{weatherInfo.label} {weather?.temp || 25}°C</span>
                        </div>
                        <div className="lite-profile-badge sheep-badge">
                            <img src={ASSETS.SHEEP_VARIANTS.CLASSIC_WHITE.HEALTHY} alt="Sheep" width={16} height={16} />
                            <span>{sheep?.length || 0} 隻</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
