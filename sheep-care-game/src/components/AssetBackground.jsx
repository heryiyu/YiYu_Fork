
import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { generateScene } from '../utils/SceneGenerator';
import '../styles/design-tokens.css';

const mountainSvgCache = new Map();
const mountainTintCache = new Map();
const cloudSvgCache = new Map();
const cloudTintCache = new Map();

export const AssetBackground = React.memo(({ userId, weather }) => {
    // Generate the deterministic scene for this user
    const scene = useMemo(() => generateScene(userId), [userId]);
    const timeStatus = weather?.timeStatus || 'day';
    const [tintedMountains, setTintedMountains] = useState({});
    const [tintedClouds, setTintedClouds] = useState({});

    const getBushVariantSrc = (src) => {
        if (!src.includes('/assets/decorations/bushes/')) return src;
        if (timeStatus === 'evening') {
            return src.replace(/(bush_\d+)\.svg$/, '$1_evening.svg');
        }
        if (timeStatus === 'night') {
            return src.replace(/(bush_\d+)\.svg$/, '$1_night.svg');
        }
        return src;
    };

    useEffect(() => {
        if (timeStatus === 'day') return;
        const desiredFill =
            timeStatus === 'evening'
                ? '#EFC786'
                : timeStatus === 'night'
                    ? '#262E49'
                    : null;
        if (!desiredFill) return;

        const mountainSrcs = Array.from(
            new Set(scene.elements.filter(e => e.type === 'MOUNTAIN').map(m => m.src))
        );
        if (mountainSrcs.length === 0) return;

        let isMounted = true;
        const loadMountainVariants = async () => {
            const updates = {};

            await Promise.all(
                mountainSrcs.map(async (src) => {
                    const cacheKey = `${src}|${timeStatus}`;
                    if (mountainTintCache.has(cacheKey)) {
                        updates[src] = mountainTintCache.get(cacheKey);
                        return;
                    }

                    let svgText = mountainSvgCache.get(src);
                    if (!svgText) {
                        const response = await fetch(src);
                        if (!response.ok) return;
                        svgText = await response.text();
                        mountainSvgCache.set(src, svgText);
                    }

                    const tintedSvg = svgText.replace(/#C2DBFA/gi, desiredFill);
                    const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(tintedSvg)}`;
                    mountainTintCache.set(cacheKey, dataUri);
                    updates[src] = dataUri;
                })
            );

            if (!isMounted || Object.keys(updates).length === 0) return;
            setTintedMountains((prev) => ({ ...prev, ...updates }));
        };

        loadMountainVariants();
        return () => {
            isMounted = false;
        };
    }, [scene, timeStatus]);

    useEffect(() => {
        if (timeStatus !== 'night') return;
        const desiredFill = '#4E5364';
        const cloudSrcs = Array.from(new Set(scene.clouds.map(c => c.src)));
        if (cloudSrcs.length === 0) return;

        let isMounted = true;
        const loadCloudVariants = async () => {
            const updates = {};

            await Promise.all(
                cloudSrcs.map(async (src) => {
                    const cacheKey = `${src}|night`;
                    if (cloudTintCache.has(cacheKey)) {
                        updates[src] = cloudTintCache.get(cacheKey);
                        return;
                    }

                    let svgText = cloudSvgCache.get(src);
                    if (!svgText) {
                        const response = await fetch(src);
                        if (!response.ok) return;
                        svgText = await response.text();
                        cloudSvgCache.set(src, svgText);
                    }

                    const tintedSvg = svgText.replace(
                        /fill="(white|#fff|#ffffff)"/gi,
                        `fill="${desiredFill}"`
                    );
                    const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(tintedSvg)}`;
                    cloudTintCache.set(cacheKey, dataUri);
                    updates[src] = dataUri;
                })
            );

            if (!isMounted || Object.keys(updates).length === 0) return;
            setTintedClouds((prev) => ({ ...prev, ...updates }));
        };

        loadCloudVariants();
        return () => {
            isMounted = false;
        };
    }, [scene, timeStatus]);

    // Viewport anchors: horizon at 33%, grass-bushes at 66%. Content = 40% of canvas at 30%, 30%.
    // Canvas coords: horizon 43.33%, grass-bushes 56.67%
    const HORIZON_TOP = '43.33%';
    const GRASS_HEIGHT = '13.33%';
    const BUSHES_TOP = '56.67%';
    const BUSHES_HEIGHT = '43.33%';

    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            overflow: 'visible', zIndex: 0,
            background: 'var(--color-sky)', // Sky fills root; horizon at 43.33%
            fontSize: '10px'
        }}>
            {/* --- 1. SKY: top 0 to horizon (43.33%) - via root background --- */}

            {/* --- 2. CONTENT: 40% x 40% at 30%, 30% - clouds, mountains, trees */}
            <div style={{
                position: 'absolute', left: '30%', top: '30%', width: '40%', height: '40%',
                overflow: 'visible', zIndex: 5
            }}>
                <div className="cloud-layer" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }}>
                    {scene.clouds.map((cloud, i) => (
                        <motion.img
                            key={`cloud-${i}`}
                            src={timeStatus === 'night' ? (tintedClouds[cloud.src] || cloud.src) : cloud.src}
                            style={{
                                position: 'absolute',
                                top: `${cloud.y}%`,
                                left: `${cloud.x}%`,
                                width: `${10 * cloud.scale}%`,
                                opacity: 0.8
                            }}
                            initial={{ x: 0 }}
                            animate={{ x: ['-10%', '10%'] }}
                            transition={{
                                duration: cloud.duration,
                                repeat: Infinity,
                                repeatType: 'reverse',
                                ease: 'easeInOut'
                            }}
                        />
                    ))}
                </div>

                {scene.elements.filter(e => e.type === 'MOUNTAIN').map(m => (
                    <img
                        key={m.id}
                        src={timeStatus === 'day' ? m.src : (tintedMountains[m.src] || m.src)}
                        style={{
                            position: 'absolute',
                            left: `${m.x}%`,
                            bottom: `${m.y}%`,
                            transform: `translate(-50%, 20%) scale(${m.scale})`,
                            zIndex: 1,
                            opacity: 0.9
                        }}
                    />
                ))}

                {scene.elements.filter(e => e.type === 'TREE').map(t => (
                    <motion.img
                        key={t.id}
                        src={t.src}
                        style={{
                            position: 'absolute',
                            left: `${t.x}%`,
                            bottom: `calc(${t.y}% - ${(150 * t.scale) * 0.1}px)`,
                            height: `${150 * t.scale}px`,
                            zIndex: 2,
                            transformOrigin: 'bottom center'
                        }}
                        animate={{ rotate: [-2, 2, -2] }}
                        transition={{
                            duration: t.duration,
                            repeat: Infinity,
                            ease: 'easeInOut'
                        }}
                    />
                ))}
            </div>

            {/* --- 3. GRASS BASE: covers mountain/tree bases; zIndex > content --- */}
            <div style={{
                position: 'absolute', top: HORIZON_TOP, left: 0,
                width: '100%', height: GRASS_HEIGHT,
                background: 'var(--color-grass-base)',
                zIndex: 10
            }} />

            {/* --- 4. HORIZON GRASS + FIELD GRASS: inside content, aligned to grass band --- */}
            <div style={{
                position: 'absolute', left: '30%', top: '30%', width: '40%', height: '40%',
                overflow: 'visible', zIndex: 11, pointerEvents: 'none'
            }}>
                {scene.elements.filter(e => e.type === 'HORIZON_GRASS').map(g => (
                    <img
                        key={g.id}
                        src={g.src}
                        style={{
                            position: 'absolute',
                            left: `${g.x}em`,
                            bottom: '66.67%', // Horizon = top of grass = 33% from content top
                            width: g.width || '20px',
                            zIndex: 4,
                            pointerEvents: 'none'
                        }}
                    />
                ))}

                {scene.elements.filter(e => e.type === 'GRASS').map(d => (
                    <img
                        key={d.id}
                        src={d.src}
                        style={{
                            position: 'absolute',
                            left: `${d.x}%`,
                            bottom: `${d.y}%`,
                            width: '1.2em',
                            transform: `scale(${d.scale})`,
                            zIndex: Math.floor(100 - d.y)
                        }}
                    />
                ))}
            </div>

            {/* --- 5. BUSHES: root-level, full canvas width, extends downward (56.67%-100%) --- */}
            <div style={{
                position: 'absolute', top: BUSHES_TOP, left: 0,
                width: '100%', height: BUSHES_HEIGHT,
                pointerEvents: 'none',
                zIndex: 100
            }}>
                <div style={{
                    width: '100%', height: '100%',
                    position: 'absolute', bottom: 0, left: 0,
                    background: scene.foreground.baseColor
                }} />

                {scene.elements.filter(e => e.type === 'FOREGROUND_SEAM_ITEM').map(item => (
                    <img
                        key={item.id}
                        src={item.subType === 'BUSH' ? getBushVariantSrc(item.src) : item.src}
                        style={{
                            position: 'absolute',
                            left: `${item.x}em`,
                            bottom: '100%', // Seam at grass-bushes boundary (top of bushes layer)
                            width: item.width,
                            transform: `scale(${item.scale}) ${item.subType === 'BUSH' ? 'translateY(20%)' : ''}`,
                            transformOrigin: 'bottom center',
                            zIndex: 101,
                            pointerEvents: 'none'
                        }}
                    />
                ))}

                {scene.foreground.decorations.filter(d => d.type === 'GRASS').map(g => (
                    <img
                        key={g.id}
                        src={g.src}
                        style={{
                            position: 'absolute',
                            left: `${g.x}%`,
                            bottom: `${g.y}%`,
                            width: '1.2em',
                            transform: `scale(${g.scale})`,
                            zIndex: 102
                        }}
                    />
                ))}
            </div>
        </div>
    );
});
