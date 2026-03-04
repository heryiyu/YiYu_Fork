import React, { useState, useMemo } from 'react';
import { AssetSheep } from './AssetSheep';
import { isSleeping } from '../../utils/gameLogic';

export const Sheep = ({ sheep: logicalSheep, onPray, onSelect, alwaysShowName, containerSize }) => {

    const isGolden = logicalSheep.type === 'GOLDEN';
    const [showName, setShowName] = useState(false);

    // --- FORMATION POSITIONING OVERRIDE ---
    // If we have a formationConstraint, we map the global 0-100 x/y into the constrained local bounds
    const displayX = useMemo(() => {
        if (!logicalSheep.formationConstraint) return logicalSheep.x;
        const c = logicalSheep.formationConstraint;
        // logicalSheep.x naturally ranges 5 to 95 from gameLogic bounds
        // We remap this to c.centerX +/- c.radiusLeft/Right
        const percent = ((logicalSheep.x || 50) - 5) / 90; // 0.0 to 1.0 (left to right of old bounds)

        // Map 0-1 to the constrained range [-radiusLeft, radiusRight]
        const range = c.radiusLeft + c.radiusRight;
        const offset = (percent * range) - c.radiusLeft;

        return c.centerX + offset;
    }, [logicalSheep.x, logicalSheep.formationConstraint]);

    const displayY = useMemo(() => {
        if (!logicalSheep.formationConstraint) return logicalSheep.y || 0;
        const c = logicalSheep.formationConstraint;
        // logicalSheep.y naturally ranges 35 to 64 from gameLogic bounds
        const percent = ((logicalSheep.y || 50) - 35) / 29; // 0.0 to 1.0 (bottom to top of old bounds)

        const range = c.radiusBottom + c.radiusTop;
        const offset = (percent * range) - c.radiusBottom;

        return c.centerY + offset;
    }, [logicalSheep.y, logicalSheep.formationConstraint]);

    // Map y (0-100) to bottom % (0% base to allow full front access, max ~95%)
    const bottomPos = displayY * 0.95;
    const depthScale = 1.1 - (displayY / 200);
    const zIdx = alwaysShowName ? 10000 : (logicalSheep.zIndex !== undefined ? logicalSheep.zIndex : Math.floor(1000 - displayY));

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
    const isSheepSleeping = isSleeping(logicalSheep);
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
                    {logicalSheep.name}
                    {isGolden && ' 🌟'}
                </div>
            )}

            {/* Speech Bubble (Emotional Blackmail) */}
            {logicalSheep.message && (
                <div className="speech-bubble">
                    {logicalSheep.message}
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
                    type={logicalSheep.type}
                    // Force walking animation if in formation (to match scroll), unless it's sleeping
                    state={(!isSheepSleeping && logicalSheep.formationConstraint) ? 'walking' : logicalSheep.state}
                    status={logicalSheep.status}
                    visual={logicalSheep.visual}
                    health={logicalSheep.health}
                    direction={logicalSheep.formationConstraint ? 1 : logicalSheep.direction}
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
};
