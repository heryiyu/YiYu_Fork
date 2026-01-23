
import React from 'react';
import { SheepVisual } from './SheepVisual';
import { SHEEP_TYPES } from '../data/sheepData';

export const Sheep = React.memo(({ sheep, onPray, onSelect }) => {
    const isGolden = sheep.type === 'GOLDEN';

    // Map y (0-100) to bottom % (25% base to shift up, max ~95%)
    const bottomPos = 25 + (sheep.y || 0) * 0.7;
    // Scale down as they go "back" (higher y). 
    const depthScale = 1.0 - ((sheep.y || 0) / 300);
    const zIdx = Math.floor(1000 - (sheep.y || 0));

    return (
        <div
            className="sheep-wrapper"
            style={{
                left: `${sheep.x}%`,
                bottom: `${bottomPos}%`,
                position: 'absolute',
                transition: sheep.status === 'dead' ? 'none' : 'left 0.5s linear, bottom 0.5s linear',
                zIndex: zIdx,
                transform: `scale(${depthScale})`,
                transformOrigin: 'bottom center'
            }}
        >
            {/* Name Tag */}
            <div className="sheep-name-tag">
                {sheep.name}
                {isGolden && ' 🌟'}
            </div>

            {/* Speech Bubble (Emotional Blackmail) */}
            {sheep.message && (
                <div className="speech-bubble">
                    {sheep.message}
                </div>
            )}

            {/* Visual Container (Flippable) */}
            <div
                style={{
                    transform: `scaleX(${sheep.direction})`,
                    cursor: 'pointer'
                }}
                onClick={(e) => {
                    e.preventDefault();
                    onSelect(sheep);
                }}
            >
                <SheepVisual
                    type={sheep.type}
                    state={sheep.state}
                    status={sheep.status}
                    visual={sheep.visual}
                    health={sheep.health}
                />
            </div>

            {/* Actions (Non-Flipped) */}
            <div className="sheep-actions">
                {/* Health Bar Removed */}
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    // Custom Comparison for Performance
    // Ignore micro-changes in health (decay) unless it changes the visual stage
    const prev = prevProps.sheep;
    const next = nextProps.sheep;

    if (prev.id !== next.id) return false;
    if (prev.x !== next.x) return false;
    if (prev.y !== next.y) return false;
    if (prev.status !== next.status) return false;
    if (prev.state !== next.state) return false;
    if (prev.direction !== next.direction) return false;
    if (prev.message !== next.message) return false;
    if (prev.type !== next.type) return false;
    if (prev.name !== next.name) return false;

    // Deep compare visual if needed, but usually reference stability is enough if immutable
    // If using new object every tick for 'visual', we might need deep check or ensure stable ref in logic
    // For now, assume visual rarely changes structure
    if (prev.visual !== next.visual) {
        // Check internal props if distinct object reference
        if (JSON.stringify(prev.visual) !== JSON.stringify(next.visual)) return false;
    }

    // Health Stage Logic (Match SheepVisual)
    const getStage = (h) => {
        if (h > 80) return 'super';
        if (h < 20) return 'critical';
        if (h < 40) return 'weak';
        return 'normal';
    };

    if (getStage(prev.health) !== getStage(next.health)) return false;

    return true; // Props are "equal" visually
});
