
import React, { useState, useMemo, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { Sheep } from './Sheep';

export const Field = ({ onSelectSheep }) => {
    const { sheep, prayForSheep, message, weather, settings } = useGame();

    // Rotation Logic (Visible Subset)
    const [visibleIds, setVisibleIds] = useState(new Set());

    // 1. Initial & Periodic Rotation
    useEffect(() => {
        const updateVisible = () => {
            if (!sheep || sheep.length === 0) return;

            const max = settings?.maxVisibleSheep || 15;

            // If total sheep is within limit, show all (no IDs needed, just special marker or handled below)
            if (sheep.length <= max) {
                setVisibleIds(new Set(sheep.map(s => s.id)));
                return;
            }

            // Otherwise, pick random IDs
            const allIds = sheep.map(s => s.id);
            // Fisher-Yates Shuffle for IDs
            for (let i = allIds.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [allIds[i], allIds[j]] = [allIds[j], allIds[i]];
            }

            const selected = new Set(allIds.slice(0, max));
            setVisibleIds(selected);
        };

        // Run immediately when sheep list length significantly changes (e.g. initial load or massive add)
        // Actually, just run if visibleIds is empty.
        // We want to re-shuffle every 60s.
        updateVisible();
        const interval = setInterval(updateVisible, 60000); // 60s Rotation

        return () => clearInterval(interval);
    }, [settings?.maxVisibleSheep, sheep?.length]); // Re-run if limit changes or total count changes

    // 2. Filter Logic
    // We want the LATEST sheep objects (with updated x/y), but only those whose IDs are in visibleIds.
    // However, if we just added a new sheep, it might not be in visibleIds yet until next 60s or length change triggers update.
    // The dependency [sheep?.length] handles new adds so they get a chance to appear immediately.

    const visibleSheep = useMemo(() => {
        if (!settings) return sheep;
        if (sheep.length <= (settings.maxVisibleSheep || 15)) return sheep;

        // Filter by the cached random IDs
        return sheep.filter(s => visibleIds.has(s.id));
    }, [sheep, visibleIds, settings]);


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
            scale: 3.5, // Increased size as requested
            hasLabel: true,
            label: '安息之地'
        });

        // Sort by Y for z-index
        return items.sort((a, b) => b.y - a.y); // Should handle via CSS z-index actually
    }, []);

    return (
        <div className={`field-container ${weather?.type || 'sunny'} ${weather?.isDay ? 'day' : 'night'}`}>
            <div className="sky">
                {/* Extra Clouds */}
                <div className="cloud-extra c1"></div>
                <div className="cloud-extra c2"></div>

                {/* Sun - Only if Sunny and Day */}
                {weather?.type === 'sunny' && weather?.isDay && (
                    <div className="sun"></div>
                )}

                {/* Hill Range (Horizon) */}
                <div className="hill-range">
                    <div className="hill h-1"></div>
                    <div className="hill h-2"></div>
                    <div className="hill h-3"></div>
                </div>
            </div>



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
                                    top: '40%', // Slightly higher to hit board center
                                    left: '50%',
                                    transform: 'translate(-50%, -50%) scale(0.33)', // T-Rex fix: Scale down to bypass min-font-size
                                    color: '#4e342e', // Deep Brown
                                    fontSize: '15px', // Increased 3x (5px -> 15px)
                                    fontWeight: 'bold', // Bold but not 900
                                    whiteSpace: 'nowrap',
                                    pointerEvents: 'none',
                                    fontFamily: '"Varela Round", "Microsoft JhengHei", "Hiragino Maru Gothic ProN", sans-serif',
                                    width: '165%', // Increased 3x (55% -> 165%)
                                    textAlign: 'center',
                                    background: '#d7ccc8', // Light brown background
                                    borderRadius: '9px', // Scaled 3x
                                    padding: '3px 0', // Scaled 3x
                                    boxShadow: '0 0 3px rgba(0,0,0,0.1)' // Scaled 3x
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

                {(visibleSheep || []).map(s => (
                    <Sheep
                        key={s.id}
                        sheep={s}
                        onPray={prayForSheep}
                        onSelect={onSelectSheep}
                    />
                ))}

                {/* Show total count if hidden */}
                {sheep.length > visibleSheep.length && (
                    <div style={{
                        position: 'absolute', top: '10px', right: '10px',
                        background: 'rgba(0,0,0,0.5)', color: 'white',
                        padding: '4px 8px', borderRadius: '10px',
                        fontSize: '0.8rem', pointerEvents: 'none', zIndex: 10
                    }}>
                        👁️ 顯示: {visibleSheep.length} / {sheep.length}
                    </div>
                )}

                {sheep.length === 0 && (
                    <div className="empty-state">
                        牧場靜悄悄的...<br />
                        (快來認領新增小羊!)
                    </div>
                )}
            </div>

            {/* Global Weather Overlay */}
            {(weather?.type === 'rain' || weather?.type === 'storm' || weather?.type === 'snow') && (
                <div className="weather-overlay">
                    {useMemo(() => {
                        const isRain = weather.type === 'rain' || weather.type === 'storm';
                        const count = 50;

                        const drops = [...Array(count)].map((_, i) => ({
                            id: i,
                            left: `${Math.random() * 100}%`,
                            delay: `-${Math.random() * 10}s`,
                            duration: isRain
                                ? `${2.5 + Math.random()}s` // Rain: 2.5s - 3.5s (Slower)
                                : `${15 + Math.random() * 5}s` // Snow: 15s - 20s (Very Slow)
                        }));

                        return (
                            <div className={`weather-layer ${weather.type}`}>
                                {drops.map(drop => (
                                    <div
                                        key={drop.id}
                                        className={isRain ? 'rain-drop' : 'snow-drop'}
                                        style={{
                                            left: drop.left,
                                            animationDelay: drop.delay,
                                            animationDuration: drop.duration
                                        }}
                                    >
                                        {isRain ? '' : '❄'}
                                    </div>
                                ))}
                            </div>
                        );
                    }, [weather?.type])}
                </div>
            )}
        </div>
    );
};
