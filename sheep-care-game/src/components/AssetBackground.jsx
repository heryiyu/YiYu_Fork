
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { generateScene } from '../utils/SceneGenerator';
import '../styles/design-tokens.css';

export const AssetBackground = ({ userId, weather }) => {
    // Generate the deterministic scene for this user
    const scene = useMemo(() => generateScene(userId), [userId]);

    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            overflow: 'hidden', zIndex: 0,
            background: 'var(--color-sky)' // Token-based Sky
        }}>
            {/* --- 1. CLOUDS (Z=1) --- */}
            <div className="cloud-layer" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '30%', zIndex: 1, pointerEvents: 'none' }}>
                {scene.clouds.map((cloudSrc, i) => (
                    <motion.img
                        key={`cloud-${i}`}
                        src={cloudSrc}
                        style={{
                            position: 'absolute',
                            top: `${10 + (i * 5)}%`,
                            width: `${15 + (i * 5)}%`,
                            opacity: 0.8
                        }}
                        initial={{ x: `${-20 - (i * 20)}%` }}
                        animate={{ x: ['-20%', '120%'] }}
                        transition={{
                            duration: 40 + (i * 10),
                            repeat: Infinity,
                            ease: 'linear',
                            delay: i * 5
                        }}
                    />
                ))}
            </div>

            {/* --- 2. MOUNTAINS (Z=2) --- */}
            {scene.elements.filter(e => e.type === 'MOUNTAIN').map(m => (
                <img
                    key={m.id}
                    src={m.src}
                    style={{
                        position: 'absolute',
                        left: `${m.x}%`,
                        bottom: `${m.y}%`,
                        transform: `translate(-50%, 0) scale(${m.scale})`,
                        zIndex: 2,
                        opacity: 0.9
                    }}
                />
            ))}

            {/* --- 3. GRASS FIELD BASE (The "Middle" Zone) (Z=3) --- */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                height: '65%', // Matches Horizon Y
                background: 'var(--color-grass-base)',
                zIndex: 3
            }} />

            {/* --- 3.5 HORIZON EDGE (Z=4) --- */}
            {scene.elements.filter(e => e.type === 'HORIZON_GRASS').map(g => (
                <img
                    key={g.id}
                    src={g.src}
                    style={{
                        position: 'absolute',
                        left: `${g.x}%`,
                        bottom: `64.5%`, // Hardcoded precise alignment to cover the seam
                        width: '21%',
                        zIndex: 4,
                        pointerEvents: 'none'
                    }}
                />
            ))}

            {/* --- 4. TREES (Z=5) --- */}
            {scene.elements.filter(e => e.type === 'TREE').map(t => (
                <motion.img
                    key={t.id}
                    src={t.src}
                    style={{
                        position: 'absolute',
                        left: `${t.x}%`,
                        bottom: `${t.y}%`,
                        height: `${150 * t.scale}px`,
                        zIndex: 5,
                        transformOrigin: 'bottom center'
                    }}
                    animate={{ rotate: [-2, 2, -2] }}
                    transition={{
                        duration: 4 + Math.random() * 2,
                        repeat: Infinity,
                        ease: 'easeInOut'
                    }}
                />
            ))}

            {/* --- 5. FIELD DECORATIONS (Grass) (Z=6+) --- */}
            {scene.elements.filter(e => e.type === 'GRASS').map(d => (
                <img
                    key={d.id}
                    src={d.src}
                    style={{
                        position: 'absolute',
                        left: `${d.x}%`,
                        bottom: `${d.y}%`,
                        width: '40px',
                        transform: `scale(${d.scale})`,
                        zIndex: Math.floor(100 - d.y) // Depth sort
                    }}
                />
            ))}

            {/* --- 6. FOREGROUND ZONE (Token Color Block) (Z=100) --- */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, width: '100%', height: '15%',
                zIndex: 100 // On top of everything
            }}>
                {/* A. Base Block */}
                <div style={{
                    width: '100%', height: '100%',
                    background: scene.foreground.baseColor,
                    // Simple block as requested
                }} />

                {/* B. Edge Bushes (If any) */}
                {scene.foreground.decorations.filter(d => d.type === 'BUSH').map(b => (
                    <img
                        key={b.id}
                        src={b.src}
                        style={{
                            position: 'absolute',
                            left: `${b.x}%`,
                            top: `${b.y - 40}%`,
                            width: '120px',
                            transform: `translate(-50%, 0) scale(${b.scale}) rotate(${b.rotation}deg)`,
                            zIndex: 101
                        }}
                    />
                ))}

                {/* C. Surface Grass */}
                {scene.foreground.decorations.filter(d => d.type === 'GRASS').map(g => (
                    <img
                        key={g.id}
                        src={g.src}
                        style={{
                            position: 'absolute',
                            left: `${g.x}%`,
                            top: `${g.y}%`,
                            width: '40px',
                            transform: `scale(${g.scale})`,
                            zIndex: 102
                        }}
                    />
                ))}
            </div>
        </div>
    );
};
