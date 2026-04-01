
import React, { useMemo } from 'react';
import { generateScene } from '../../utils/SceneGenerator';
import '../../styles/design-tokens.css';

// Reusable scrolling layer for infinite horizontal panning
const ScrollingLayer = ({ speed, children, style = {}, className = '', reverse = false }) => {
    return (
        <div className={className} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden', ...style }}>
            <div
                className={`scroll-layer-anim ${reverse ? 'reverse' : ''}`}
                style={{
                    animationDuration: `${speed}s`,
                }}
            >
                {/* Map two identical blocks side-by-side representing 100% viewport each */}
                <div style={{ width: '50%', height: '100%', position: 'relative' }}>
                    {children}
                </div>
                <div style={{ width: '50%', height: '100%', position: 'relative' }}>
                    {children}
                </div>
            </div>
        </div >
    );
};

const getLightingFilter = (timeStatus, isCloud = false) => {
    if (timeStatus === 'day') return '';
    if (timeStatus === 'evening') {
        return isCloud ? 'lighting-filter-evening-cloud' : 'lighting-filter-evening';
    }
    if (timeStatus === 'night') {
        return isCloud ? 'lighting-filter-night-cloud' : 'lighting-filter-night';
    }
    return '';
};

export const AssetBackground = React.memo(({ userId, weather }) => {
    const scene = useMemo(() => generateScene(userId), [userId]);
    const timeStatus = weather?.timeStatus || 'day';

    // Get batch lighting CSS classes
    const lightingClass = getLightingFilter(timeStatus, false);
    const lightingClassCloud = getLightingFilter(timeStatus, true);

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

            {/* --- 2. CONTENT: mountains, trees, horizon grass, field grass */}
            {/* Split out specific depths into their own ScrollingLayers for parallax */}

            {/* Parallax Layer 1: Mountains (Slowest) */}
            <ScrollingLayer speed={300} style={{ zIndex: 1 }} className={lightingClass}>
                <div style={{ position: 'absolute', left: '30%', top: '30%', width: '40%', height: '40%', overflow: 'visible' }}>
                    {scene.elements.filter(e => e.type === 'MOUNTAIN').map(m => (
                        <img
                            key={m.id}
                            src={m.src}
                            style={{
                                position: 'absolute',
                                left: `${m.x}%`,
                                bottom: `${m.y}%`,
                                transform: `translate(-50%, 20%) scale(${m.scale})`,
                                opacity: 0.9
                            }}
                        />
                    ))}
                </div>
            </ScrollingLayer>

            {/* Parallax Layer 2: Trees (Medium Slow) */}
            <ScrollingLayer speed={200} style={{ zIndex: 2 }} className={lightingClass}>
                <div style={{ position: 'absolute', left: '30%', top: '30%', width: '40%', height: '40%', overflow: 'visible' }}>
                    {scene.elements.filter(e => e.type === 'TREE').map(t => (
                        <img
                            key={t.id}
                            src={t.src}
                            style={{
                                position: 'absolute',
                                left: `${t.x}%`,
                                bottom: `calc(${t.y}% - ${(150 * t.scale) * 0.1}px)`,
                                height: `${150 * t.scale}px`,
                                transformOrigin: 'bottom center'
                            }}
                        />
                    ))}
                </div>
            </ScrollingLayer>

            {/* Parallax Layer 3: Clouds (Independent, mostly drifting but also scrolling slightly?)
                We'll leave clouds as independent motion (they have their own animate) but put them in a slow scrolling container too.
            */}
            <ScrollingLayer speed={375} style={{ zIndex: 5, pointerEvents: 'none' }} className={lightingClassCloud}>
                <div style={{ position: 'absolute', left: '30%', top: '30%', width: '40%', height: '40%', overflow: 'visible' }}>
                    <div className="cloud-layer" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }}>
                        {scene.clouds.map((cloud, i) => (
                            <img
                                key={`cloud-${i}`}
                                src={cloud.src}
                                className="cloud-float-anim"
                                style={{
                                    position: 'absolute',
                                    top: `${cloud.y}%`,
                                    left: `${cloud.x}%`,
                                    width: `${10 * cloud.scale}%`,
                                    opacity: 0.8,
                                    animationDuration: `${cloud.duration}s`
                                }}
                            />
                        ))}
                    </div>
                </div>
            </ScrollingLayer>


            {/* --- 3. GRASS BASE: covers mountain/tree bases; zIndex > content --- */}
            <div style={{
                position: 'absolute', top: HORIZON_TOP, left: 0,
                width: '100%', height: GRASS_HEIGHT,
                background: 'var(--color-grass-base)',
                zIndex: 10
            }} />

            {/* Parallax Layer 4: Field Grass / Horizon Edge (Medium Speed) */}
            <ScrollingLayer speed={125} style={{ zIndex: 11, pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', left: '0', top: '30%', width: '100%', height: '40%', overflow: 'visible' }}>

                    {/* Removed ugly repeating border image, relying on natural color seaming */}
                    <div style={{
                        position: 'absolute',
                        left: 0,
                        bottom: '66.67%', // Horizon = top of grass = 33% from content top
                        width: '100%',
                        height: '24px', // Approx 2-3em depending on screen
                        zIndex: 4,
                        pointerEvents: 'none'
                    }} />

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
            </ScrollingLayer>

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

                {/* Parallax Layer 5: Foreground Bushes + Grass (Fastest Speed) */}
                <ScrollingLayer speed={75} style={{ zIndex: 101, pointerEvents: 'none' }}>

                    {/* Removed ugly repeating border image, relying on natural color seaming */}
                    <div style={{
                        position: 'absolute',
                        left: 0,
                        bottom: '100%', // Seam boundary
                        width: '100%',
                        height: '40px', // Roughly bush/grass height
                        zIndex: 1,
                        pointerEvents: 'none' // The actual bushes can still render if needed but grass is flat
                    }} />

                    {/* Only render actual bushes independently to keep variety without spamming grass nodes */}
                    {scene.elements.filter(e => e.type === 'FOREGROUND_SEAM_ITEM' && e.subType === 'BUSH').map(item => (
                        <img
                            key={item.id}
                            src={getBushVariantSrc(item.src)}
                            style={{
                                position: 'absolute',
                                left: `${item.x}em`,
                                bottom: '100%', // Seam at grass-bushes boundary (top of bushes layer)
                                width: item.width,
                                transform: `scale(${item.scale}) translateY(20%)`,
                                transformOrigin: 'bottom center',
                                pointerEvents: 'none',
                                zIndex: 2
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
                                transform: `scale(${g.scale})`
                            }}
                        />
                    ))}
                </ScrollingLayer>
            </div>
        </div>
    );
});
