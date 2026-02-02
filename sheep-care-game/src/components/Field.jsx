import React, { useState, useMemo, useEffect } from 'react';
import { Eye } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { Sheep } from './Sheep';
import { AssetBackground } from './AssetBackground';
import { AssetPreloader } from './AssetPreloader';

export const Field = ({ onSelectSheep }) => {
    const { sheep, prayForSheep, weather, settings, user } = useGame();
    const [isLoaded, setIsLoaded] = useState(false);

    // --- 1. Separate Sheep ---
    const livingSheep = useMemo(() => sheep.filter(s => s.status !== 'dead'), [sheep]);
    const deadSheep = useMemo(() => sheep.filter(s => s.status === 'dead'), [sheep]);

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
        return sheep.filter(s => s.status !== 'dead' && visibleIds.has(s.id));
    }, [sheep, visibleIds]);

    const visibleDead = useMemo(() => {
        return sheep.filter(s => s.status === 'dead' && visibleIds.has(s.id));
    }, [sheep, visibleIds]);

    // --- 3. Ghost Sheep Positioning (Random Roam Simulation) ---
    // Since dead sheep are no longer graveyard bound, we give them random positions
    // In a real physics system, they would trigger 'move' updates.
    // Here we just map them to static random float positions if they lack coordinates.
    // Or we rely on the fact that they MIGHT have last known coordinates? 
    // Let's assign them a random float position that changes periodically? 
    // No, simple is stable: Assign random X/Y based on ID hash if X/Y is missing/zero.

    // Seeded random for Ghosts
    // Seeded random for Ghosts
    const ghostSheep = useMemo(() => {
        return visibleDead.map(s => {
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
    }, [visibleDead]);


    if (!isLoaded) {
        return <AssetPreloader onLoaded={() => setIsLoaded(true)} />;
    }

    return (
        <div className={`field-container`}
            style={{
                position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden',
                // Disable browser default touch actions for game feel
                touchAction: 'none'
            }}
        >
            {/* New Asset Background (Handles Scene, Weather, Decor) */}
            <AssetBackground userId={user?.id || 'guest'} weather={weather} />

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
                {visibleLiving.map(s => (
                    <div key={s.id} style={{ pointerEvents: 'auto' }}>
                        <Sheep sheep={s} onPray={prayForSheep} onSelect={onSelectSheep} />
                    </div>
                ))}

            </div>

            {/* Message / HUD Overlay usually goes here via App.jsx, but if Field owns some: */}

            {/* Count Overlay: Show if Total Sheep > Currently Shown */}
            {sheep.length > visibleIds.size && (
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
