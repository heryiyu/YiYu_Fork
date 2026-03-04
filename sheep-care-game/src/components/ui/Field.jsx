import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Eye } from 'lucide-react';
import { useGameState, useGameActions, useUserAuth } from '../../context/GameContext/useGame';
import { isSleeping } from '../../utils/gameLogic';
import { Sheep } from '../game/Sheep';
import { AssetBackground } from '../game/AssetBackground';
import { AssetPreloader } from '../game/AssetPreloader';
import { usePanGesture } from '../../hooks/usePanGesture';

const VISUAL_CONFIG = {
    ZOOM_SCALE: 2.5,
    CANVAS_SCALE: 2.5,
    SHEEP_CENTER_OFFSET: 6
};

// Simple Hash for random consistency
const simpleHash = (str) => {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i); /* hash * 33 + c */
    }
    return Math.abs(hash);
};

export const Field = ({ onSelectSheep }) => {
    const { sheep, weather, focusedSheepId } = useGameState();
    const { prayForSheep, clearFocus } = useGameActions();
    const { settings, lineId } = useUserAuth();
    const [isLoaded, setIsLoaded] = useState(false);

    // --- Manual Panning Logic (via Hook) ---
    const { domRef: panLayerRef, handlers: panHandlers, reset: resetPan, panState: panStateRef } = usePanGesture(!!focusedSheepId, VISUAL_CONFIG.ZOOM_SCALE);

    // Reset pan when focus changes
    useEffect(() => {
        resetPan();
    }, [focusedSheepId, resetPan]);

    // Handlers wrapper to pass click checks
    const handlePointerDown = (e) => panHandlers.onPointerDown(e);
    const handlePointerMove = (e) => panHandlers.onPointerMove(e);
    const handlePointerUp = (e) => panHandlers.onPointerUp(e);

    // --- 1. Separate Sheep ---
    const livingSheep = useMemo(() => sheep.filter(s => !isSleeping(s)), [sheep]);
    const sleepingSheep = useMemo(() => sheep.filter(s => isSleeping(s)), [sheep]);

    // --- 2. Living Sheep Rotation (Existing Logic) ---
    // --- 2. Visibility Logic & Formation Slots (Pinned > Random) ---
    // User requested different formations based on the number of selected sheep (1 to 10)
    // We define coordinate layouts (x, y percentages) for each possible count to ensure symmetry
    const DYNAMIC_FORMATIONS = useMemo(() => {
        return {
            1: [{ x: 50, y: 48 }], // 1: Center
            2: [{ x: 35, y: 48 }, { x: 65, y: 48 }], // 2: Side by side
            3: [{ x: 50, y: 60 }, { x: 30, y: 40 }, { x: 70, y: 40 }], // 3: Triangle (1 back, 2 front)
            4: [{ x: 35, y: 56 }, { x: 65, y: 56 }, { x: 35, y: 40 }, { x: 65, y: 40 }], // 4: Box 2x2
            5: [{ x: 35, y: 56 }, { x: 65, y: 56 }, { x: 25, y: 40 }, { x: 50, y: 40 }, { x: 75, y: 40 }], // 5: 2 back, 3 front
            6: [{ x: 25, y: 56 }, { x: 50, y: 56 }, { x: 75, y: 56 }, { x: 25, y: 40 }, { x: 50, y: 40 }, { x: 75, y: 40 }], // 6: 3 back, 3 front
            7: [{ x: 25, y: 60 }, { x: 50, y: 60 }, { x: 75, y: 60 }, { x: 15, y: 44 }, { x: 38, y: 44 }, { x: 62, y: 44 }, { x: 85, y: 44 }], // 7: 3 back, 4 front
            8: [{ x: 35, y: 62 }, { x: 65, y: 62 }, { x: 15, y: 48 }, { x: 50, y: 48 }, { x: 85, y: 48 }, { x: 25, y: 34 }, { x: 50, y: 34 }, { x: 75, y: 34 }], // 8: 2-3-3
            9: [{ x: 25, y: 62 }, { x: 50, y: 62 }, { x: 75, y: 62 }, { x: 15, y: 48 }, { x: 50, y: 48 }, { x: 85, y: 48 }, { x: 25, y: 34 }, { x: 50, y: 34 }, { x: 75, y: 34 }], // 9: 3-3-3
            10: [
                { x: 25, y: 60 }, { x: 50, y: 60 }, { x: 75, y: 60 }, // Back 3
                { x: 15, y: 48 }, { x: 38, y: 48 }, { x: 62, y: 48 }, { x: 85, y: 48 }, // Middle 4
                { x: 25, y: 36 }, { x: 50, y: 36 }, { x: 75, y: 36 }  // Front 3
            ]
        };
    }, []);

    const visibleIds = useMemo(() => {
        if (!sheep || sheep.length === 0) return new Set();
        // 1. Get Pinned Ids, but filter out deleted sheep FIRST before slicing to limit
        const currentSheepIds = new Set(sheep.map(s => s.id));
        const pinnedIds = (settings?.pinnedSheepIds || []).filter(id => currentSheepIds.has(id)).slice(0, 10);
        return new Set(pinnedIds);
    }, [settings?.pinnedSheepIds, sheep]);

    const visibleFormationRaw = useMemo(() => {
        return sheep.filter(s => visibleIds.has(s.id));
    }, [sheep, visibleIds]);

    const visibleFormation = useMemo(() => {
        const count = visibleFormationRaw.length;
        const isLonely = count > 0 && count < 3;
        const currentFormation = DYNAMIC_FORMATIONS[count] || DYNAMIC_FORMATIONS[10];

        // Sort the raw sheep array so that the slots mapping is consistent
        // We can sort by ID to ensure a stable assignment
        const sortedSheep = [...visibleFormationRaw].sort((a, b) => a.id.localeCompare(b.id));

        return sortedSheep.map((s, idx) => {
            // For dynamic formations, we just use the index because the formation size perfectly matches the element count
            const slot = currentFormation[idx];
            if (!slot) return s; // Fallback

            return {
                ...s,
                // Add lonely message if there are less than 3 sheep in the whole farm field
                message: (isLonely && idx === 0 && !isSleeping(s)) ? "好孤單喔... 來設定多一點小羊吧！" : s.message,
                formationConstraint: {
                    centerX: slot.x,
                    centerY: slot.y,
                    radiusLeft: 2.0, // Tighter radius for dynamic formations
                    radiusRight: 2.0,
                    radiusTop: 1.0,
                    radiusBottom: 1.0,
                }
            };
        });
    }, [visibleFormationRaw, DYNAMIC_FORMATIONS, settings?.pinnedSheepIds]);



    // --- 4. Focus / Zoom Logic ---
    const focusedSheep = useMemo(() => {
        return sheep.find(s => s.id === focusedSheepId);
    }, [sheep, focusedSheepId]);

    // Force visibility of focused sheep (and its slot)
    const finalVisibleFormation = useMemo(() => {
        if (!focusedSheepId) return visibleFormation;
        // If focused sheep is already visible, return as is
        let existing = visibleFormation.find(s => s.id === focusedSheepId);
        if (existing) return visibleFormation;

        // If not, add it (temporarily exceed max count if needed)
        const target = sheep.find(s => s.id === focusedSheepId);
        if (target) {
            // Assign a temporary slot to the center screen if it wasn't in formation
            return [...visibleFormation, {
                ...target,
                formationConstraint: { centerX: 50, centerY: 50, radiusLeft: 3, radiusRight: 3, radiusTop: 2, radiusBottom: 2 }
            }];
        }
        return visibleFormation;
    }, [visibleFormation, focusedSheepId, sheep]);


    // Calculate Zoom Transform
    const fieldStyle = useMemo(() => {
        if (focusedSheepId) {
            const target = sheep.find(s => s.id === focusedSheepId);
            if (target) {
                // Zoom in on target
                // Sheep position in % (0-100 within content area)
                const sx = target.x;
                const sy = (target.y || 0) * 0.95; // bottomPos from Sheep.jsx - sheep's FEET
                const sy_center = sy + VISUAL_CONFIG.SHEEP_CENTER_OFFSET;

                const scale = VISUAL_CONFIG.ZOOM_SCALE;

                return {
                    transform: `scale(${scale}) translate(${(50 - sx) / VISUAL_CONFIG.CANVAS_SCALE}%, ${(sy_center - 50) / VISUAL_CONFIG.CANVAS_SCALE}%)`,
                    transformOrigin: '50% 50%',
                    transition: 'transform 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    cursor: 'grab'
                };
            }
        }
        return {
            transform: 'scale(1) translate(0%, 0%)',
            transition: 'transform 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            cursor: 'default'
        };
    }, [focusedSheepId, sheep]);

    // --- 5. Resize Observer for Performance Optimization (Pixel Transforms) ---
    const contentRef = React.useRef(null);
    const [containerSize, setContainerSize] = useState(null);

    useEffect(() => {
        if (!contentRef.current) return;
        const observer = new ResizeObserver(entries => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                setContainerSize({ width, height });
            }
        });
        observer.observe(contentRef.current);
        return () => observer.disconnect();
    }, []);

    if (!isLoaded) {
        return <AssetPreloader onLoaded={() => setIsLoaded(true)} />;
    }

    return (
        <div className={`field-container`}
            style={{
                position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden',
                touchAction: 'none',
                ...(!focusedSheepId ? {} : { cursor: 'grab' })
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onClick={(e) => {
                // Prevent click if we dragged significantly
                const dx = Math.abs(panStateRef.current.x);
                const dy = Math.abs(panStateRef.current.y);
                if (focusedSheepId && !panStateRef.current.isPanning && dx < 5 && dy < 5) {
                    clearFocus();
                }
            }}
        >
            {/* Oversized canvas (250%) so pan/zoom never reveals blank; content in center 40% */}
            <div style={{
                position: 'absolute', left: '-75%', top: '-75%',
                width: '250%', height: '250%',
                transformOrigin: '50% 50%',
                ...fieldStyle
            }}>
                {/* Pan Layer: Inner wrapper for manual drag that DOES NOT trigger React renders */}
                <div
                    ref={panLayerRef}
                    style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, willChange: 'transform' }}
                >
                    <AssetBackground userId={lineId || 'guest'} weather={weather} />

                    {/* Content area: 40% x 40% centered so sheep 0-100 coords map to viewport */}
                    <div
                        ref={contentRef}
                        style={{
                            position: 'absolute', left: '30%', top: '30%', width: '40%', height: '40%',
                            pointerEvents: 'none'
                        }}>
                        {/* 1. All Formation Sheep (Grounded / Floating based on type inside Sheep.jsx) */}
                        {finalVisibleFormation.map(s => (
                            <div key={s.id} style={{ pointerEvents: 'auto' }}>
                                <Sheep
                                    sheep={s}
                                    onPray={prayForSheep}
                                    onSelect={onSelectSheep}
                                    alwaysShowName={s.id === focusedSheepId}
                                    containerSize={containerSize}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Message / HUD Overlay usually goes here via App.jsx, but if Field owns some: */}

            {/* Count Overlay has been removed at user request */}

            {/* Call Focus Overlay Cancel Hint */}
            {focusedSheepId && (
                <div style={{
                    position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--bg-modal-overlay)', color: 'var(--text-inverse)',
                    padding: '8px 16px', borderRadius: '20px',
                    fontSize: '0.85rem', pointerEvents: 'none', zIndex: 600,
                    backdropFilter: 'blur(4px)'
                }}>
                    點擊畫面任意處取消鎖定
                </div>
            )}

            {/* Empty Formation Hint */}
            {sheep.length > 0 && finalVisibleFormation.length === 0 && (
                <div style={{
                    position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%, -50%)',
                    background: 'rgba(255, 255, 255, 0.85)', color: 'var(--text-muted)',
                    padding: '16px 24px', borderRadius: '16px',
                    fontSize: '0.95rem', pointerEvents: 'none', zIndex: 10,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)', textAlign: 'center',
                    backdropFilter: 'blur(8px)', border: '1px solid rgba(0,0,0,0.05)',
                    lineHeight: '1.6', fontWeight: 'bold'
                }}>
                    目前沒有設定陣型小羊 🐑<br />
                    <span style={{ fontSize: '0.85rem', fontWeight: 'normal' }}>請至右上角「設定」圖示挑選</span>
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
