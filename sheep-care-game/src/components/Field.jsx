
import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { Sheep } from './Sheep';

export const Field = ({ onSelectSheep }) => {
    const { sheep, prayForSheep, shepherdSheep, message } = useGame();

    // Generate static decorations once
    const decorations = useMemo(() => {
        const items = [];
        // Trees
        for (let i = 0; i < 8; i++) {
            items.push({
                id: `tree-${i}`,
                type: 'tree',
                emoji: '🌲',
                x: Math.random() * 90 + 5,
                y: Math.random() * 90 // Depth
            });
        }
        // Rocks
        for (let i = 0; i < 5; i++) {
            items.push({
                id: `rock-${i}`,
                type: 'rock',
                emoji: '🪨',
                x: Math.random() * 90 + 5,
                y: Math.random() * 90
            });
        }
        // Sort by Y for z-index
        return items.sort((a, b) => b.y - a.y); // Should handle via CSS z-index actually
    }, []);

    return (
        <div className="field-container">
            <div className="sky"></div>

            {message && (
                <div className="toast-message">
                    {message}
                </div>
            )}

            <div className="grass">
                {/* Render Decorations */}
                {decorations.map(d => {
                    const bottomPos = 5 + d.y * 0.9; // Map 0-100 Y to Screen%
                    const scale = 1.0 - (d.y / 200);
                    const zIdx = Math.floor(1000 - d.y);

                    return (
                        <div
                            key={d.id}
                            className="decoration"
                            style={{
                                left: `${d.x}%`,
                                bottom: `${bottomPos}%`,
                                zIndex: zIdx,
                                transform: `scale(${scale})`
                            }}
                        >
                            {d.emoji}
                        </div>
                    );
                })}

                {sheep.map(s => (
                    <Sheep
                        key={s.id}
                        sheep={s}
                        onPray={prayForSheep}
                        onShepherd={shepherdSheep}
                        onSelect={onSelectSheep}
                    />
                ))}

                {sheep.length === 0 && (
                    <div className="empty-state">
                        牧場靜悄悄的...<br />
                        (快按鈴鐺新增小羊!)
                    </div>
                )}
            </div>
        </div>
    );
};
