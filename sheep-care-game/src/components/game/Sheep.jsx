import React, { useState, useEffect, useMemo } from 'react';
import { AssetSheep } from './AssetSheep';
import { isSleeping } from '../../utils/gameLogic';
import { sheepTickerstore } from '../../utils/sheepTickerStore';

export const Sheep = React.memo(({ sheep: logicalSheep, onPray, onSelect, alwaysShowName, containerSize }) => {
    // 1. Local state for fast visual updates
    const [visualSheep, setVisualSheep] = useState(logicalSheep);

    // 2. Subscribe to Ticker Store
    useEffect(() => {
        // Subscribe to high-frequency updates
        const unsubscribe = sheepTickerstore.subscribe(logicalSheep.id, (newVisualState) => {
            setVisualSheep(newVisualState);
        });
        return unsubscribe;
    }, [logicalSheep.id]);

    // 3. Keep visualSheep in sync with massive logical changes (like waking up, health boost)
    useEffect(() => {
        setVisualSheep(prev => ({
            ...logicalSheep,
            // Preserve the high-frequency visual coordinates and animation state from the previous visual tick!
            x: prev.x !== undefined ? prev.x : logicalSheep.x,
            y: prev.y !== undefined ? prev.y : logicalSheep.y,
            angle: prev.angle !== undefined ? prev.angle : logicalSheep.angle,
            direction: prev.direction !== undefined ? prev.direction : logicalSheep.direction,
            state: prev.state !== undefined ? prev.state : logicalSheep.state,
        }));
    }, [logicalSheep]);

    const isGolden = visualSheep.type === 'GOLDEN';
    const [showName, setShowName] = useState(false);

    // --- FORMATION POSITIONING OVERRIDE ---
    // If we have a formationConstraint, we map the global 0-100 x/y into the constrained local bounds
    const displayX = useMemo(() => {
        if (!logicalSheep.formationConstraint) return visualSheep.x;
        const c = logicalSheep.formationConstraint;
        // visualSheep.x naturally ranges 5 to 95 from gameLogic bounds
        // We remap this to c.centerX +/- c.radiusLeft/Right
        const percent = ((visualSheep.x || 50) - 5) / 90; // 0.0 to 1.0 (left to right of old bounds)

        // Map 0-1 to the constrained range [-radiusLeft, radiusRight]
        const range = c.radiusLeft + c.radiusRight;
        const offset = (percent * range) - c.radiusLeft;

        return c.centerX + offset;
    }, [visualSheep.x, logicalSheep.formationConstraint]);

    const displayY = useMemo(() => {
        if (!logicalSheep.formationConstraint) return visualSheep.y || 0;
        const c = logicalSheep.formationConstraint;
        // visualSheep.y naturally ranges 35 to 64 from gameLogic bounds
        const percent = ((visualSheep.y || 50) - 35) / 29; // 0.0 to 1.0 (bottom to top of old bounds)

        const range = c.radiusBottom + c.radiusTop;
        const offset = (percent * range) - c.radiusBottom;

        return c.centerY + offset;
    }, [visualSheep.y, logicalSheep.formationConstraint]);

    // Map y (0-100) to bottom % (0% base to allow full front access, max ~95%)
    const bottomPos = displayY * 0.95;
    const depthScale = 1.1 - (displayY / 200);
    const zIdx = alwaysShowName ? 10000 : (visualSheep.zIndex !== undefined ? visualSheep.zIndex : Math.floor(1000 - displayY));

    const handleInteract = (e) => {
        // Prevent ghost clicks and double tapping issues
        e.preventDefault();
        e.stopPropagation();

        // Trigger selection if handler exists
        if (onSelect) {
            onSelect(logicalSheep.id);
        }

        // Toggle name visibility
        setShowName(prev => {
            if (!prev) {
                // Determine auto-hide duration
                setTimeout(() => setShowName(false), 3000);
                return true;
            }
            return false; // Toggle off if clicked again
        });
    };

    // Performance Optimization: Use Transform instead of Left/Bottom
    const isSheepSleeping = isSleeping(visualSheep);
    const style = React.useMemo(() => {
        // Calculate size dynamically: e.g. 15% of screen width, bounded between 50px and 100px
        const sizePx = (containerSize && containerSize.width > 0)
            ? Math.max(50, Math.min(100, containerSize.width * 0.15))
            : 100; // Fallback to 100px

        const baseStyle = {
            position: 'absolute',
            width: `${sizePx}px`,
            height: `${sizePx}px`,
            marginLeft: `-${sizePx / 2}px`, // Center the wrapper on the x-coordinate
            zIndex: zIdx,
            transformOrigin: 'bottom center',
            willChange: 'transform'
        };

        if (containerSize && containerSize.width > 0) {
            // Pixel Transform Mode (GPU Friendly)
            const px = (displayX / 100) * containerSize.width;
            const py = (bottomPos / 100) * containerSize.height;
            const topPx = containerSize.height - py - sizePx;

            return {
                ...baseStyle,
                left: 0,
                top: 0,
                transform: `translate3d(${px}px, ${topPx}px, 0) scale(${depthScale})`,
                transition: isSheepSleeping ? 'none' : 'transform 1.1s linear',
            };
        } else {
            // Fallback (Layout Thrashing but reliable)
            // Still try to use translate for the scale part to keep it on GPU
            return {
                ...baseStyle,
                left: `${displayX}%`,
                bottom: `${bottomPos}%`,
                transform: `scale(${depthScale}) translate3d(0, 0, 0)`,
                transition: isSheepSleeping ? 'none' : 'left 1.1s linear, bottom 1.1s linear, transform 1.1s linear',
            };
        }
    }, [displayX, bottomPos, depthScale, zIdx, containerSize, isSheepSleeping]);

    return (
        <div
            className="sheep-wrapper"
            style={style}
        >
            {/* Name Tag - Only Show when toggled or forced */}
            {(showName || alwaysShowName) && (
                <div className="sheep-name-tag" style={{
                    position: 'absolute',
                    bottom: '-25px', // At the feet
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 100,
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none' // Click through to sheep
                }}>
                    {visualSheep.name}
                    {isGolden && ' 🌟'}
                </div>
            )}

            {/* Speech Bubble (Emotional Blackmail) */}
            {visualSheep.message && (
                <div className="speech-bubble">
                    {visualSheep.message}
                </div>
            )}

            <div
                style={{
                    cursor: 'pointer',
                    width: '100%',
                    height: '100%'
                }}
                onClick={handleInteract}
            >
                <AssetSheep
                    type={visualSheep.type}
                    // Force walking animation if in formation (to match scroll), unless it's sleeping
                    state={(!isSheepSleeping && logicalSheep.formationConstraint) ? 'walking' : visualSheep.state}
                    status={visualSheep.status}
                    visual={visualSheep.visual}
                    health={visualSheep.health}
                    direction={logicalSheep.formationConstraint ? 1 : visualSheep.direction}
                    centered={true}
                    animated={true}
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
    // Since visual changes are handled internally by subscription, 
    // React memo only needs to care about logical data changes (like adopting, health updates)
    // or prop changes from parents.

    // Health Stage Logic
    const getStage = (h) => {
        if (h > 80) return 'super';
        if (h < 20) return 'critical';
        if (h < 40) return 'weak';
        return 'normal';
    };

    if (getStage(prevProps.sheep.health) !== getStage(nextProps.sheep.health)) return false;

    return true;
});
