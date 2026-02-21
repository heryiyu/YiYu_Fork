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

    // Map y (0-100) to bottom % (25% base to shift up, max ~95%)
    // Map y (0-100) to bottom % (0% base to allow full front access, max ~95%)
    const bottomPos = (visualSheep.y || 0) * 0.95;
    const depthScale = 1.1 - ((visualSheep.y || 0) / 200);
    const zIdx = alwaysShowName ? 10000 : (visualSheep.zIndex !== undefined ? visualSheep.zIndex : Math.floor(1000 - (visualSheep.y || 0)));

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
        const baseStyle = {
            position: 'absolute',
            width: '100px', // Explicit width for centering
            height: '100px',
            marginLeft: '-50px', // Center the wrapper on the x-coordinate
            zIndex: zIdx,
            transformOrigin: 'bottom center',
            willChange: 'transform'
        };

        if (containerSize && containerSize.width > 0) {
            // Pixel Transform Mode (GPU Friendly)
            const px = (visualSheep.x / 100) * containerSize.width;
            const py = (bottomPos / 100) * containerSize.height;
            const topPx = containerSize.height - py - 100;

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
                left: `${visualSheep.x}%`,
                bottom: `${bottomPos}%`,
                transform: `scale(${depthScale}) translate3d(0, 0, 0)`,
                transition: isSheepSleeping ? 'none' : 'left 1.1s linear, bottom 1.1s linear, transform 1.1s linear',
            };
        }
    }, [visualSheep.x, bottomPos, depthScale, zIdx, containerSize, isSheepSleeping]);

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

            {/* Visual Container (Flippable) */}
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
                    state={visualSheep.state}
                    status={visualSheep.status}
                    visual={visualSheep.visual}
                    health={visualSheep.health}
                    direction={visualSheep.direction}
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
