import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ASSETS } from '../utils/AssetRegistry';
import { isSleeping } from '../utils/gameLogic';
import '../styles/design-tokens.css';

// --- 2. Animations (Static Definitions) ---
const GHOST_ANIM = {
    y: [0, -15, 0],
    opacity: [0.7, 0.9, 0.7],
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
};

const WALK_ANIM = {
    y: [0, -4, 0],
    rotate: [0, 2, 0, -2, 0],
    transition: { duration: 0.6, repeat: Infinity, ease: "linear" }
};

const SLEEP_ANIM = {
    scale: [1, 0.98, 1],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
};

export const AssetSheep = ({
    x, y,
    state, // 'walking', 'idle', 'sleep'
    direction, // 1 or -1
    status, // 'healthy', 'sick', 'sleeping' (legacy 'dead' accepted)
    visual = {},
    onClick,
    scale = 1,
    centered = false,
    animated = undefined,
    showStatusIcon = true
}) => {
    const isSleepingState = isSleeping({ status });
    const isWalking = state === 'walking';

    // --- 1. Determine Image Source ---
    // If DB has a skinUrl (Parametric Skinning), use it.
    // If Dead, use Ghost Asset.
    // Else default to Classic White.
    const imgSrc = useMemo(() => {
        // 1. Ghost (Sleeping/Dead)
        if (isSleepingState) return ASSETS.SHEEP_VARIANTS.GHOST;

        // 2. Resolve Variant
        const variantKey = visual?.variant || 'CLASSIC_WHITE';
        const variant = ASSETS.SHEEP_VARIANTS[variantKey] || ASSETS.SHEEP_VARIANTS.CLASSIC_WHITE;

        // 3. Return Healthy/Sick state
        return status === 'sick' ? variant.SICK : variant.HEALTHY;
    }, [isSleepingState, status, visual?.variant]);

    // Select Animation (disabled in card/centered mode unless overridden)
    const shouldAnimate = animated !== undefined ? animated : !centered;

    let activeAnim = {};
    if (shouldAnimate) {
        if (isSleepingState) activeAnim = GHOST_ANIM;
        else if (isWalking) activeAnim = WALK_ANIM;
        else if (state === 'sleep') activeAnim = SLEEP_ANIM;
    }

    const containerStyle = centered ? {
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        cursor: onClick ? 'pointer' : 'default'
    } : {
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`, // Using top% for Field positioning
        zIndex: Math.floor(y) + 10, // Depth sorting
        transform: `translate(-50%, -100%)`, // Anchor at feet
        cursor: 'pointer',
        width: '80px', // Standard Size
        height: '80px',
        pointerEvents: 'auto'
    };

    return (
        <div style={containerStyle}
            onClick={onClick}
        >
            <motion.div
                animate={activeAnim}
                style={{
                    width: '100%', height: '100%',
                    display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
                    willChange: 'transform' // Hint to browser
                }}
            >
                <img
                    src={imgSrc}
                    alt="sheep"
                    style={{
                        // IF centered (Card Mode): Fit within the box (contain)
                        // ELSE (Field Mode): Fixed width/auto height based on container
                        width: centered ? 'auto' : '100%',
                        height: centered ? 'auto' : 'auto',
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',

                        // Direction Flip
                        transform: `scaleX(${direction})`,
                        filter: isSleepingState ? 'grayscale(100%) drop-shadow(0 0 5px rgba(255,255,255,0.5))' : 'none'
                    }}
                    onError={(e) => {
                        // Fallback to text if image fails
                        e.target.style.display = 'none';
                        e.target.parentElement.innerText = isSleepingState ? '👻' : '🐑';
                    }}
                />
            </motion.div>

            {/* Health/Status Indicators can be overlaid here or handled by Parent UI */}
            {showStatusIcon && status === 'sick' && (
                <div style={{
                    position: 'absolute', top: -14, right: 0,
                    fontSize: '20px', animation: 'pulse 1s infinite',
                    marginBottom: '2px'
                }}>
                    🤒
                </div>
            )}
        </div>
    );
};
