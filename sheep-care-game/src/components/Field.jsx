
import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { Sheep } from './Sheep';

export const Field = ({ onSelectSheep }) => {
    const { sheep, prayForSheep, shepherdSheep, message, weather } = useGame();

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
        // Graveyard Boundary Rocks (Fan Shape)
        // Center (0, 100), Radius ~28
        // Arc from 0 to 90 degrees (relative to vertical down? No, relative to center)
        // Math: x = R * sin(theta), y = 100 - R * cos(theta)
        // Theta 0 (Down along left edge) to 90 (Right along top edge)?
        // Wait, standard polar: x = R cos, y = R sin.
        // Let's sweep from "Bottom of Arc" (x=0, y=100-R -> Theta=270?)
        // Let's simpler: Loop theta 0 to PI/2.
        // x = R * sin(theta) -> 0 to R
        // y = 100 - R * cos(theta) -> 100-R to 100
        const R = 33; // Increased to be well away from graves (Logic Radius 25)
        for (let theta = 0; theta <= Math.PI / 2; theta += 0.06) {
            // Gap for Entrance (Mouth)
            // Approx 45 degrees (PI/4 = 0.78). Gap from 0.7 to 0.9.
            if (theta > 0.7 && theta < 0.9) continue;

            items.push({
                id: `grave-wall-arc-${theta}`, type: 'rock', emoji: '🪨',
                // Tighter line, less wobble
                x: R * Math.sin(theta) + (Math.random() * 0.5),
                y: 100 - R * Math.cos(theta) + (Math.random() * 0.5),
                scale: 0.9 + Math.random() * 0.3 // Slight size var
            });
        }

        // Gate & Signboard
        // Gate removed as per request

        // Signboard next to gate (Positioned at user red circle)

        // Signboard next to gate (Positioned at user red circle)
        items.push({
            id: 'grave-sign', type: 'sign', emoji: '🪧',
            x: 20,
            y: 60,
            scale: 2.5, // Reduced by 1 unit (3.5 -> 2.5)
            hasLabel: true,
            label: '安息之地'
        });

        // Sort by Y for z-index
        return items.sort((a, b) => b.y - a.y); // Should handle via CSS z-index actually
    }, []);

    return (
        <div className="field-container">
            <div className={`sky ${weather?.type || 'sunny'} ${weather?.isDay ? 'day' : 'night'}`}>
                {/* Extra Clouds */}
                <div className="cloud-extra c1"></div>
                <div className="cloud-extra c2"></div>

                {/* Sun - Only if Sunny and Day */}
                {weather?.type === 'sunny' && weather?.isDay && (
                    <div className="sun"></div>
                )}

                {/* Birds - Hide if raining or snowing */}
                {weather?.type !== 'rain' && weather?.type !== 'storm' && weather?.type !== 'snow' && (
                    // Birds were removed by request previously, but if user wants them back in future, logic is here.
                    // Currently no birds code block exists here based on previous edit. 
                    // I will leave this empty or skip re-adding birds.
                    null
                )}

                {/* Rain Overlay */}
                {(weather?.type === 'rain' || weather?.type === 'storm') && (
                    <div className="rain-container">
                        {[...Array(20)].map((_, i) => <div key={i} className="rain-drop" style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random()}s`, animationDuration: `${0.5 + Math.random() * 0.5}s` }}></div>)}
                    </div>
                )}

                {/* Snow Overlay */}
                {weather?.type === 'snow' && (
                    <div className="rain-container"> {/* Reuse container for full coverage */}
                        {[...Array(30)].map((_, i) => <div key={i} className="snow-drop" style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 5}s`, animationDuration: `${3 + Math.random() * 2}s` }}>❄</div>)}
                    </div>
                )}
            </div>

            {message && (
                <div className="toast-message">
                    {message}
                </div>
            )}

            <div className="grass">
                {/* Graveyard Visual Zone (Fan Shape) */}
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0,
                    width: '40%', height: '40%', // Roughly covers the arc area (R=33)
                    background: 'radial-gradient(circle at top left, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.2) 60%, transparent 70%)',
                    zIndex: 0,
                    pointerEvents: 'none'
                }}>
                    {/* Text removed, moved to signboard */}
                </div>
                {/* Render Decorations */}
                {decorations.map(d => {
                    const bottomPos = 5 + d.y * 0.9; // Map 0-100 Y to Screen%
                    const baseScale = 1.0 - (d.y / 200);
                    const finalScale = baseScale * (d.scale || 1);
                    const zIdx = Math.floor(1000 - d.y);

                    return (
                        <div
                            key={d.id}
                            className="decoration"
                            style={{
                                left: `${d.x}%`,
                                bottom: `${bottomPos}%`,
                                zIndex: zIdx,
                                transform: `scale(${finalScale})`
                            }}
                        >
                            {d.emoji}
                            {d.hasLabel && (
                                <div style={d.id === 'grave-sign' ? {
                                    // Special styling for Graveyard Sign (Inside the board)
                                    position: 'absolute',
                                    top: '45%', // Moved up by ~10% (User asked for 5 units, adjusting relative)
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    color: '#5d4037', // Dark brown
                                    fontSize: '6px', // Compensated for smaller scale (2.5 * 6 = 15px)
                                    fontWeight: '900',
                                    whiteSpace: 'nowrap',
                                    textShadow: '0 0.5px 0 rgba(255,255,255,0.4)',
                                    pointerEvents: 'none',
                                    fontFamily: 'serif',
                                    width: '100%',
                                    textAlign: 'center'
                                } : {
                                    // Default label styling (Floating above)
                                    position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)',
                                    background: '#5d4037', color: '#ffecb3', padding: '1px 5px', borderRadius: '3px',
                                    fontSize: '0.5rem', whiteSpace: 'nowrap', border: '1px solid #3e2723', fontWeight: 'bold',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.3)', width: 'auto'
                                }}>
                                    {d.label}
                                </div>
                            )}
                        </div>
                    );
                })}

                {(sheep || []).map(s => (
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
                        (快來認領新增小羊!)
                    </div>
                )}
            </div>
        </div>
    );
};
