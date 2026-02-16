import React from 'react';
import { Footprints } from 'lucide-react';
import { AssetSheep } from './AssetSheep';
import { Tooltip } from '../ui/Tooltip';
import { useLongPress } from '../../hooks/useLongPress';
import { getAwakeningProgress } from '../../utils/gameLogic';

export const SheepCard = React.memo(({
    s,
    isSelectionMode,
    isSelected,
    onSelect,
    onToggleSelect,
    isSleepingState,
    isSick,
    isPinned,
    onTogglePin,
    onFind,
    onLongPress,
    tags = [],
    tagAssignmentsBySheep = {},
    pinFlashId
}) => {
    const assigned = (tagAssignmentsBySheep[s.id] || []);
    const firstTagId = assigned.length > 0 ? assigned[0].tagId : null;
    const firstTag = firstTagId ? tags.find(t => t.id === firstTagId) : null;
    const tagVariant = firstTag ? 'custom' : (isSleepingState ? 'dead' : (isSick ? 'sick' : 'healthy'));
    const tagLabel = firstTag ? firstTag.name : (isSleepingState ? '已沉睡' : (isSick ? '生病' : '健康'));
    const healthFull = Math.ceil(s.health || 0) >= 100;

    // Interaction Logic
    const handleCardClick = () => {
        if (isSelectionMode) onToggleSelect(s.id);
        else onSelect(s);
    };

    const handleCardLongPress = () => {
        if (onLongPress) onLongPress(s.id);
    };

    // Use the hook
    const longPressEventHandlers = useLongPress(handleCardLongPress, handleCardClick, { delay: 500 });

    const isPinFlash = pinFlashId === s.id;

    return (
        <div
            className={`sheep-card ${isSelectionMode && isSelected ? 'selected' : ''} ${isSelectionMode ? 'sheep-card--select-mode' : ''} ${isPinFlash ? 'sheep-card--pin-flash' : ''}`}
            {...longPressEventHandlers}
            style={{ touchAction: 'manipulation', userSelect: 'none' }}
        >
            {isSelectionMode && (
                <div className={`sheep-card-selection-dot ${isSelected ? 'sheep-card-selection-dot--selected' : ''}`}>
                    {isSelected && <span className="sheep-card-selection-check">✓</span>}
                </div>
            )}

            {!isSelectionMode && onTogglePin && (
                <div className="pin-btn-wrapper">
                    <Tooltip content={isPinned ? '取消釘選' : '釘選'} side="top">
                        <button
                            type="button"
                            className="pin-btn"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onTogglePin(s.id);
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            onMouseUp={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                            onTouchEnd={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                            onPointerUp={(e) => e.stopPropagation()}
                            style={{
                                background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
                                opacity: isPinned ? 1 : 0.2,
                                fontSize: '1rem',
                                transition: 'transform 0.2s, opacity 0.2s',
                            }}
                        >
                            📌
                        </button>
                    </Tooltip>
                </div>
            )}

            <div className="sheep-card-header">
                <div className={`sheep-card-health ${healthFull ? 'sheep-card-health--full' : ''}`}>
                    <span className="sheep-card-health-icon">♥</span>
                    <span>{Math.ceil(s.health || 0)}%</span>
                </div>
                <div
                    className={`sheep-card-tag sheep-card-tag--${tagVariant}`}
                    style={firstTag ? { background: firstTag.color || 'var(--palette-gray-muted)', color: 'var(--text-inverse)' } : undefined}
                >
                    {tagLabel}
                </div>
            </div>

            <div className="sheep-card-avatar">
                <div className="sheep-card-avatar-inner">
                    <AssetSheep
                        status={s.status}
                        visual={s.visual}
                        health={s.health}
                        type={s.type}
                        scale={0.55}
                        direction={1}
                        centered={true}
                        showStatusIcon={false}
                    />
                </div>
            </div>

            <div className="sheep-card-footer">
                <div className="sheep-card-name-row">
                    <div className="sheep-card-name">{s.name}</div>
                    {!isSelectionMode && onFind && !isSleepingState && (
                        <Tooltip content="在草原上尋找此小羊" side="top">
                            <button
                                type="button"
                                className="find-btn"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onFind(s.id);
                                }}
                                aria-label="在草原上尋找此小羊"
                                onMouseDown={(e) => e.stopPropagation()}
                                onMouseUp={(e) => e.stopPropagation()}
                                onTouchStart={(e) => e.stopPropagation()}
                                onTouchEnd={(e) => e.stopPropagation()}
                                onPointerDown={(e) => e.stopPropagation()}
                                onPointerUp={(e) => e.stopPropagation()}
                                style={{
                                    background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
                                    fontSize: '1rem',
                                    opacity: 0.6,
                                }}
                            >
                                <Footprints size={15} strokeWidth={2.5} fill="currentColor" style={{ transform: 'rotate(20deg)' }} />
                            </button>
                        </Tooltip>
                    )}
                </div>
                {!isSelectionMode && (
                    <div className={`sheep-card-pray ${isSleepingState ? 'sheep-card-pray--dead' : ''}`}>
                        {isSleepingState ? `🕯️ 喚醒禱告 ${getAwakeningProgress(s)}/5` : `🙏 禱告 ${s.prayedCount || 0}/3`}
                    </div>
                )}
            </div>
        </div >
    );
}, (prev, next) => {
    if (prev.isSelectionMode !== next.isSelectionMode) return false;
    if (prev.isSelected !== next.isSelected) return false;
    if (prev.isPinned !== next.isPinned) return false;
    if (prev.pinFlashId !== next.pinFlashId) return false;

    const ps = prev.s;
    const ns = next.s;

    if (ps.id !== ns.id) return false;
    if (ps.name !== ns.name) return false;
    if (ps.status !== ns.status) return false;
    if (ps.prayedCount !== ns.prayedCount) return false;
    if (ps.awakeningProgress !== ns.awakeningProgress) return false;
    if (ps.resurrectionProgress !== ns.resurrectionProgress) return false;

    if (Math.ceil(ps.health || 0) !== Math.ceil(ns.health || 0)) return false;

    if (JSON.stringify(ps.visual) !== JSON.stringify(ns.visual)) return false;

    if (prev.tagAssignmentsBySheep !== next.tagAssignmentsBySheep) return false;
    if (prev.tags !== next.tags) return false;

    return true;
});
