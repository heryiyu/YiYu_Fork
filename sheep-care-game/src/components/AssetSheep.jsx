import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ASSETS } from '../utils/AssetRegistry';
import { isSleeping } from '../utils/gameLogic';
import '../styles/design-tokens.css';

export const AssetSheep = ({
    x, y,
    state, // 'walking', 'idle', 'sleep'
    direction, // 1 or -1
    status, // 'healthy', 'sick', 'sleeping' (legacy 'dead' accepted)
    visual = {},
    onClick,
    scale = 1,
    centered = false,
    animated = undefined
}) => {
    const isSleepingState = isSleeping({ status });
    const isWalking = state === 'walking';

    // --- 1. Determine Image Source ---
    // If DB has a skinUrl (Parametric Skinning), use it.
    // If Dead, use Ghost Asset.
    // Else default to Classic White.
    const imgSrc = useMemo(() => {
        // Priority 1: GHOST (Sleeping)
        if (isSleepingState) return ASSETS.SHEEP_VARIANTS.GHOST;

        // Determine Variant Key
        let variantKey = 'CLASSIC_WHITE';
        if (visual.skinUrl && ASSETS.SKIN_MAP && ASSETS.SKIN_MAP[visual.skinUrl]) {
            variantKey = ASSETS.SKIN_MAP[visual.skinUrl];
        }

        // Get Variant Object
        const variant = ASSETS.SHEEP_VARIANTS[variantKey] || ASSETS.SHEEP_VARIANTS.CLASSIC_WHITE;

        // Priority 2: SICK vs HEALTHY
        if (status === 'sick') return variant.SICK;
        return variant.HEALTHY;

    }, [isSleepingState, status, visual.skinUrl]);

    // --- 2. Animations ---
    // Object Animation: We animate the CONTAINER or the IMG itself.

    // A. Ghost Animation (Floating)
    const ghostAnim = {
        y: [0, -15, 0],
        opacity: [0.7, 0.9, 0.7],
        transition: {
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
        }
    };

    // B. Walk Animation (Bouncing)
    const walkAnim = {
        y: [0, -4, 0],
        rotate: [0, 2, 0, -2, 0],
        transition: {
            duration: 0.6,
            repeat: Infinity,
            ease: "linear"
        }
    };

    // C. Sleep Animation (Zzz or subtle breathe)
    const sleepAnim = {
        scale: [1, 0.98, 1],
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
        }
    };

    // Select Animation (disabled in card/centered mode unless overridden)
    const shouldAnimate = animated !== undefined ? animated : !centered;

    let activeAnim = {};
    if (shouldAnimate) {
        if (isSleepingState) activeAnim = ghostAnim;
        else if (isWalking) activeAnim = walkAnim;
        else if (state === 'sleep') activeAnim = sleepAnim;
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
                    display: 'flex', justifyContent: 'center', alignItems: 'flex-end'
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
            {status === 'sick' && (
                <div style={{
                    position: 'absolute', top: -10, right: 0,
                    fontSize: '20px', animation: 'pulse 1s infinite'
                }}>
                    🤒
                </div>
            )}
        </div>
    );
};
