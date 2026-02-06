import React, { useState, useMemo, useEffect } from 'react';
import { Eye } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { isSleeping } from '../utils/gameLogic';
import { Sheep } from './Sheep';
import { AssetBackground } from './AssetBackground';
import { AssetPreloader } from './AssetPreloader';

export const Field = ({ onSelectSheep }) => {
    const { sheep, prayForSheep, weather, settings, focusedSheepId, clearFocus, lineId } = useGame();
    const [isLoaded, setIsLoaded] = useState(false);

    // --- Manual Panning Logic ---
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [startPan, setStartPan] = useState({ x: 0, y: 0 });

    // Reset pan when focus changes
    useEffect(() => {
        setPanOffset({ x: 0, y: 0 });
    }, [focusedSheepId]);

    const handlePointerDown = (e) => {
        if (!focusedSheepId) return;
        setIsPanning(true);
        setStartPan({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    };

    const handlePointerMove = (e) => {
        if (!isPanning || !focusedSheepId) return;
        setPanOffset({
            x: e.clientX - startPan.x,
            y: e.clientY - startPan.y
        });
    };

    const handlePointerUp = () => {
        setIsPanning(false);
    };

    // --- 1. Separate Sheep ---
    const livingSheep = useMemo(() => sheep.filter(s => !isSleeping(s)), [sheep]);
    const sleepingSheep = useMemo(() => sheep.filter(s => isSleeping(s)), [sheep]);

    // --- 2. Living Sheep Rotation (Existing Logic) ---
    // --- 2. Visibility Logic (Pinned > Random) ---
    // Consolidated Living + Dead limit enforcement
    const [visibleIds, setVisibleIds] = useState(new Set());

    useEffect(() => {
        const updateVisible = () => {
            if (!sheep || sheep.length === 0) return;
            const max = settings?.maxVisibleSheep || 15;
            const pinnedIds = settings?.pinnedSheepIds || [];

            // 1. Separate Favorites and Others (Living + Dead mixed)
            // We want to verify ID existence in current sheep list
            const currentSheepIds = new Set(sheep.map(s => s.id));
            const activePinnedIds = pinnedIds.filter(id => currentSheepIds.has(id));

            let finalIds = [];

            // 2. Add Favorites (Up to Max)
            // If user favorites more than max, we slice to max (Performance Safety)
            // They should increase Max setting if they want to see more.
            const pinnedToTake = activePinnedIds.slice(0, max);
            finalIds = [...pinnedToTake];

            // 3. Fill Remaining Slots
            const slotsRemaining = max - finalIds.length;
            if (slotsRemaining > 0) {
                // Get all unpinned sheep
                const unpinnedSheep = sheep.filter(s => !finalIds.includes(s.id));

                if (unpinnedSheep.length > 0) {
                    // Shuffle and Pick
                    const shuffled = [...unpinnedSheep].sort(() => 0.5 - Math.random());
                    const selected = shuffled.slice(0, slotsRemaining);
                    finalIds = [...finalIds, ...selected.map(s => s.id)];
                }
            }

            setVisibleIds(new Set(finalIds));
        };

        updateVisible();
        const interval = setInterval(updateVisible, 60000); // 60s Rotation
        return () => clearInterval(interval);
    }, [settings?.maxVisibleSheep, settings?.pinnedSheepIds, sheep.length]); // Re-run if count changes

    // Derived Lists for Rendering
    const visibleLiving = useMemo(() => {
        return sheep.filter(s => !isSleeping(s) && visibleIds.has(s.id));
    }, [sheep, visibleIds]);

    const visibleSleeping = useMemo(() => {
        return sheep.filter(s => isSleeping(s) && visibleIds.has(s.id));
    }, [sheep, visibleIds]);

    // --- 3. Ghost Sheep Positioning (Random Roam Simulation) ---
    // Since sleeping sheep are no longer graveyard bound, we give them random positions
    // In a real physics system, they would trigger 'move' updates.
    // Here we just map them to static random float positions if they lack coordinates.
    // Or we rely on the fact that they MIGHT have last known coordinates? 
    // Let's assign them a random float position that changes periodically? 
    // No, simple is stable: Assign random X/Y based on ID hash if X/Y is missing/zero.

    // Seeded random for Ghosts
    const ghostSheep = useMemo(() => {
        return visibleSleeping.map(s => {
            // If sheep has coordinates, use them (maybe they died there).
            // But we want them to float around.
            // Let's override X/Y with a "Ghost Position".
            // We can use the seeded random based on ID + Time? No, just ID for stability.
            const seed = s.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
            const rand = (offset) => {
                const x = Math.sin(seed + offset) * 10000;
                return x - Math.floor(x);
            };

            return {
                ...s,
                // Float in the air (Screen Y 20-60%)
                x: Math.floor(rand(1) * 90) + 5,
                y: Math.floor(rand(2) * 50) + 20,
                zIndex: 200 // Above ground items, below UI
            };
        });
    }, [visibleSleeping]);



    // --- 4. Focus / Zoom Logic ---
    const focusedSheep = useMemo(() => {
        return sheep.find(s => s.id === focusedSheepId);
    }, [sheep, focusedSheepId]);

    // Force visibility of focused sheep
    const finalVisibleLiving = useMemo(() => {
        if (!focusedSheepId) return visibleLiving;
        // If focused sheep is already visible, return as is
        if (visibleLiving.find(s => s.id === focusedSheepId)) return visibleLiving;
        // If not, add it (temporarily exceed max count if needed)
        const target = sheep.find(s => s.id === focusedSheepId);
        if (target && !isSleeping(target)) {
            return [...visibleLiving, target];
        }
        return visibleLiving;
    }, [visibleLiving, focusedSheepId, sheep]);

    // Calculate Zoom Transform
    const fieldStyle = useMemo(() => {
        if (focusedSheepId) {
            const target = sheep.find(s => s.id === focusedSheepId);
            if (target) {
                // Zoom in on target (Scale 2x)
                // Origin Calculation:
                // We want the sheep to be in the CENTER of the screen.
                // Default sheep position: left: x%, bottom: bottomPos%
                // We need to translate the field so the sheep's point moves to center.

                // Current Sheep Center in %:
                const sx = target.x; // 0-100
                // bottomPos logic from Sheep.jsx:
                const sy = (target.y || 0) * 0.95; // 0-100 (bottom relative)

                // Zoom level
                const scale = 2.5;

                // Transform Origin: Center (50% 50%) is easiest if we use translate.
                // T = (Center - SheepPos) * Scale? No.
                // Let's use standard CSS transform.
                // translate( (50 - sx)%, (sy - 50)% ) ? No, Y is bottom.
                // Center Y is 50%. Sheep Y is sy%.
                // We want to move (50 - sx)% horizontally.
                // We want to move (50 - sy)% vertically (relative to bottom).
                // Adjust pan speed (divide by scale for 1:1 feel)
                const adjustedPanX = panOffset.x / scale;
                const adjustedPanY = panOffset.y / scale;

                return {
                    transform: `scale(${scale}) translate(calc(${(50 - sx)}% + ${adjustedPanX}px), calc(${(50 - sy)}% + ${adjustedPanY}px))`,
                    transformOrigin: '50% 50%',
                    transition: isPanning ? 'none' : 'transform 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    cursor: isPanning ? 'grabbing' : 'grab'
                };
            }
        }
        return {
            transform: 'scale(1) translate(0%, 0%)',
            transition: 'transform 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            cursor: 'default'
        };
    }, [focusedSheepId, sheep, panOffset, isPanning]);

    if (!isLoaded) {
        return <AssetPreloader onLoaded={() => setIsLoaded(true)} />;
    }

    return (
        <div className={`field-container`}
            style={{
                position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden',
                touchAction: 'none',
                ...(!focusedSheepId ? {} : { cursor: isPanning ? 'grabbing' : 'grab' })
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onClick={(e) => {
                // Prevent click if we dragged significantly
                if (focusedSheepId && !isPanning && Math.abs(panOffset.x) < 5 && Math.abs(panOffset.y) < 5) {
                    clearFocus();
                }
            }}
        >
            {/* New Asset Background (Handles Scene, Weather, Decor) */}
            <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                ...fieldStyle
            }}>
                <AssetBackground userId={lineId || 'guest'} weather={weather} />

                {/* Render Sheep Layer (Living + Ghosts) */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>

                    {/* 1. Ghosts (Floaty) */}
                    {ghostSheep.map(s => (
                        // Re-enable pointer events for sheep
                        <div key={s.id} style={{ pointerEvents: 'auto' }}>
                            <Sheep sheep={s} onPray={prayForSheep} onSelect={onSelectSheep} />
                        </div>
                    ))}

                    {/* 2. Living Sheep (Grounded) */}
                    {finalVisibleLiving.map(s => (
                        <div key={s.id} style={{ pointerEvents: 'auto' }}>
                            <Sheep
                                sheep={s}
                                onPray={prayForSheep}
                                onSelect={onSelectSheep}
                                alwaysShowName={s.id === focusedSheepId}
                            />
                        </div>
                    ))}

                </div>
            </div>

            {/* Message / HUD Overlay usually goes here via App.jsx, but if Field owns some: */}

            {/* Count Overlay: Show if Total Sheep > Currently Shown */}
            {sheep.length > visibleIds.size && !focusedSheepId && (
                <div style={{
                    position: 'absolute', top: '80px', right: '10px',
                    background: 'var(--color-primary-cream)', color: 'var(--color-text-brown)',
                    padding: '8px 16px', borderRadius: 'var(--radius-btn)',
                    fontSize: '0.85rem', pointerEvents: 'none', zIndex: 500,
                    boxShadow: 'var(--shadow-soft)', fontWeight: 'bold',
                    display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                    <Eye size={14} strokeWidth={2} style={{ opacity: 0.8 }} />
                    {visibleIds.size} / {sheep.length}
                </div>
            )}

            {/* Call Focus Overlay Cancel Hint */}
            {focusedSheepId && (
                <div style={{
                    position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(0,0,0,0.4)', color: '#fff',
                    padding: '8px 16px', borderRadius: '20px',
                    fontSize: '0.85rem', pointerEvents: 'none', zIndex: 600,
                    backdropFilter: 'blur(4px)'
                }}>
                    點擊畫面任意處取消鎖定
                </div>
            )}

            {sheep.length === 0 && (
                <div className="empty-state" style={{
                    position: 'absolute', top: '40%', width: '100%', textAlign: 'center',
                    color: 'var(--color-text-brown)', zIndex: 10
                }}>
                    <h3 style={{ marginBottom: '10px' }}>牧場靜悄悄的...</h3>
                    <p>快去認領第一隻小羊吧！</p>
                </div>
            )}
        </div>
    );
};
