
import React from 'react';
import { SheepVisual } from './SheepVisual';
import { SHEEP_TYPES } from '../data/sheepData';

export const Sheep = ({ sheep, onPray, onShepherd, onSelect }) => {
    const isGolden = sheep.type === 'GOLDEN';

    const bottomPos = 5 + (sheep.y || 0) * 0.45;
    const depthScale = 1.0 - ((sheep.y || 0) / 250); // Minor scaling
    const zIdx = Math.floor(1000 - (sheep.y || 0));

    return (
        <div
            className="sheep-wrapper"
            style={{
                left: `${sheep.x}%`,
                bottom: `${bottomPos}%`,
                position: 'absolute',
                transition: 'left 0.5s linear, bottom 0.5s linear',
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

            {/* Visual Container (Flippable) */}
            <div
                style={{
                    transform: `scaleX(${sheep.direction})`,
                    cursor: 'pointer'
                }}
                onClick={(e) => {
                    e.preventDefault();
                    onPray(sheep.id);
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

                {isGolden && (
                    <button
                        className="icon-btn shepherd-trigger"
                        onClick={(e) => {
                            e.stopPropagation();
                            onShepherd(sheep.id);
                        }}
                    >
                        🌿
                    </button>
                )}
            </div>
        </div>
    );
};
