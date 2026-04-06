import React from 'react';
import './SheepSwipeCard.css';
import { AssetSheep } from './AssetSheep';
import { SheepSwipeCardBack } from './SheepSwipeCardBack';
import { FileText, Heart, ShieldAlert, Moon, Activity } from 'lucide-react';
import { isSleeping, getAwakeningProgress } from '../../utils/gameLogic';

export const SheepSwipeCard = ({
    sheep,
    tags = [],
    tagAssignmentsBySheep = {},
    isFlipped,
    onEditClick,
    onFlipBack,
    onSwipeLeft,
    onSwipeRight
}) => {
    if (!sheep) return null;

    const currentStatus = sheep.status;
    const currentHealth = sheep.health;
    const currentIsSleeping = isSleeping(sheep);
    const currentIsSick = currentStatus === 'sick';

    const todayStr = new Date().toDateString();
    const alreadyPrayedToday = sheep.lastPrayedDate === todayStr;
    const currentPrayedCount = alreadyPrayedToday ? (sheep.prayedCount || 0) : 0;

    const assigned = (tagAssignmentsBySheep[sheep.id] || []);
    
    // Determine status badge
    let statusText = '健康';
    let statusColor = '#A7F3D0'; // Light Green
    let statusTextColor = '#065F46';
    let StatusIcon = Activity;

    if (currentIsSleeping) {
        statusText = `沉睡中 (喚醒進度 ${getAwakeningProgress(sheep)}/5)`;
        statusColor = '#E5E7EB'; // Gray
        statusTextColor = '#374151';
        StatusIcon = Moon;
    } else if (currentIsSick) {
        statusText = '生病需關懷';
        statusColor = '#FECACA'; // Red
        statusTextColor = '#991B1B';
        StatusIcon = ShieldAlert;
    } else if (currentHealth >= 90) {
        statusText = '強壯活躍';
        statusColor = '#D9F99D'; // Lime
        statusTextColor = '#3F6212';
    }

    return (
        <div className="sheep-swipe-card-perspective">
            <div className={`sheep-swipe-card ${isFlipped ? 'is-flipped' : ''}`}>
                {/* Front Face */}
                <div 
                    className="sheep-swipe-card-face front-face"
                    onClick={onEditClick}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="sheep-swipe-card-header">
                        <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 className="sheep-swipe-card-name" style={{ wordBreak: 'break-word' }}>{sheep.name}</h2>
                    
                    <div className="sheep-swipe-card-status-badge" style={{ backgroundColor: statusColor, color: statusTextColor }}>
                        <StatusIcon size={14} style={{ marginRight: '6px' }} />
                        {statusText}
                    </div>

                    <div className="sheep-swipe-tags-wrap">
                        {assigned.map(a => {
                            const t = tags.find(tag => tag.id === a.tagId);
                            if (!t) return null;
                            return (
                                <span key={t.id} className="sheep-swipe-tag" style={{ backgroundColor: t.color || '#E5E5E5', color: '#fff' }}>
                                    {t.name}
                                </span>
                            );
                        })}
                    </div>
                </div>

                <div className="sheep-swipe-card-avatar-wrap">
                    <AssetSheep
                        status={currentStatus}
                        visual={sheep.visual}
                        health={currentHealth}
                        type={sheep.type}
                        scale={0.8}
                        direction={1}
                        centered={true}
                        showStatusIcon={false}
                    />
                </div>
            </div>

            <div className="sheep-swipe-card-info-section">
                <h3 className="sheep-swipe-card-section-title">
                    <Heart size={18} />
                    關懷與代禱事項
                </h3>
                <p className="sheep-swipe-card-body-text">
                    {sheep.note || '目前尚無筆記。滑動卡片來記錄你們的互動吧！或是點擊下方編輯按鈕來新增代禱事項。'}
                </p>
                
                {(!currentIsSleeping && currentPrayedCount > 0) && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(0,0,0,0.05)', fontSize: '0.9rem', color: '#6D6860' }}>
                        🙏 今日已禱告次數：{currentPrayedCount}/3
                    </div>
                )}
            </div>

            <div className="sheep-swipe-card-footer">
                <button 
                    className="sheep-swipe-card-btn sheep-swipe-card-btn-secondary" 
                    style={{ flex: 1 }}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onSwipeLeft) onSwipeLeft();
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <span style={{color: '#eab308'}}>⭐️</span> <span style={{fontWeight: 800}}>下次</span>
                    </div>
                </button>
                <button 
                    className="sheep-swipe-card-btn sheep-swipe-card-btn-primary" 
                    style={{ flex: 1, backgroundColor: '#0ea5e9' }}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onSwipeRight) onSwipeRight();
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        ❤️ <span style={{fontWeight: 800}}>阿們</span>
                    </div>
                </button>
            </div>
                </div>

                {/* Back Face */}
                <SheepSwipeCardBack 
                    sheep={sheep} 
                    tags={tags} 
                    tagAssignmentsBySheep={tagAssignmentsBySheep} 
                    onFlipBack={onFlipBack} 
                />
            </div>
        </div>
    );
};
