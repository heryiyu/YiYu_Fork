import React, { useEffect, useState } from 'react';
import {
    Maximize2,
    Minimize2,
    Play,
    HeartHandshake,
    Search,
    MessageCircle,
    Zap,
    Cross,
    BookOpen,
    Mic
} from 'lucide-react';
import { CloseButton } from './ui/CloseButton';
import { Tooltip } from './ui/Tooltip';
import './SevenStepsMap.css';

// Lucide icon per step (semantic mapping)
const STEP_ICONS = {
    1: HeartHandshake, // 接觸關懷 - contact & care
    2: Search,      // 發現需要 - discover needs
    3: MessageCircle, // 見證分享 - testimony sharing
    4: Zap,         // 權能服事 - power ministry
    5: Cross,       // 決志信主 - commit to faith
    6: BookOpen,    // 靈修生活 - devotional life
    7: Mic          // 作主見證 - be a witness
};

// Solid fill per step (design-system: no gradients, flat palette)
const STEP_COLORS = {
    1: 'var(--palette-blue-action)',
    2: 'var(--palette-deep-green)',
    3: 'var(--palette-pink-action)',
    4: 'var(--palette-purple)',
    5: 'var(--palette-orange-action)',
    6: 'var(--palette-blue-text)',
    7: 'var(--palette-orange-action)'
};

// Mobile-First Vertical Zig-Zag Layout: Bottom-Left (1) -> Top (7)
// Coordinates in 0-100 ViewBox Scale
const stepPositions = {
    1: { x: 20, y: 90 },
    2: { x: 80, y: 78 },
    3: { x: 20, y: 64 },
    4: { x: 80, y: 50 },
    5: { x: 20, y: 36 },
    6: { x: 80, y: 22 },
    7: { x: 50, y: 8 }
};

const VIDEO_EMBED_ID = '_W72XdpyqC0';

const steps = [
    { id: 1, title: '接觸關懷' },
    { id: 2, title: '發現需要' },
    { id: 3, title: '見證分享' },
    { id: 4, title: '權能服事' },
    { id: 5, title: '決志信主' },
    { id: 6, title: '靈修生活' },
    { id: 7, title: '作主見證' }
];

// Helper to generate a smooth path through points
const generatePath = () => {
    const sortedIds = Object.keys(stepPositions).sort((a, b) => a - b);
    const points = sortedIds.map(id => stepPositions[id]);

    if (points.length === 0) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const dy = p2.y - p1.y;
        const cp1x = p1.x;
        const cp1y = p1.y + dy * 0.5;
        const cp2x = p2.x;
        const cp2y = p2.y - dy * 0.5;
        d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
};

const useMediaQuery = (query) => {
    const [matches, setMatches] = useState(() =>
        typeof window !== 'undefined' ? window.matchMedia(query).matches : false
    );
    useEffect(() => {
        const m = window.matchMedia(query);
        const handler = () => setMatches(m.matches);
        m.addEventListener('change', handler);
        return () => m.removeEventListener('change', handler);
    }, [query]);
    return matches;
};

export function SevenStepsMap() {
    const [visible, setVisible] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedStep, setSelectedStep] = useState(null);
    const [videoModalOpen, setVideoModalOpen] = useState(false);
    const isCompactView = useMediaQuery('(max-width: 480px)');

    useEffect(() => {
        setVisible(true);
    }, []);

    useEffect(() => {
        if (!isExpanded) setVideoModalOpen(false);
    }, [isExpanded]);

    /* At 480px and below, expanded map uses collapsed viewBox/sizing */
    const useExpandedLayout = isExpanded && !isCompactView;

    // Render step node: circular badge + Lucide icon (flat solid colors, no gradients)
    const renderNodeImage = (step) => {
        const IconComponent = STEP_ICONS[step.id];
        const fillColor = STEP_COLORS[step.id];
        const radius = step.id === 7 ? 11 : 9;
        const iconSize = step.id === 7 ? 14 : 12;
        const iconOffset = iconSize / 2;

        return (
            <g className="island-shape" filter="url(#dropShadow)">
                {/* Circular badge - solid fill */}
                <circle
                    r={radius}
                    fill={fillColor}
                    stroke="rgba(255,255,255,0.85)"
                    strokeWidth="0.8"
                />
                {/* Lucide icon centered */}
                <g transform={`translate(-${iconOffset}, -${iconOffset})`}>
                    <IconComponent
                        size={iconSize}
                        strokeWidth={2}
                        stroke="white"
                        fill="none"
                        style={{ overflow: 'visible' }}
                    />
                </g>
            </g>
        );
    };

    const handleMapAreaClick = (e) => {
        if (!isExpanded) {
            e.preventDefault();
            e.stopPropagation();
            setIsExpanded(true);
        }
    };

    const handleStepClick = (step) => {
        if (!isExpanded) return;
        setSelectedStep(step);
    };

    const mapContent = (
        <>
            {/* Full SVG Landscape */}
            <svg
                className={`map-svg-layer ${useExpandedLayout ? 'map-svg-layer--expanded' : 'map-svg-layer--collapsed'}`}
                viewBox={useExpandedLayout ? "-50 -50 200 200" : "-10 -10 120 120"}
                preserveAspectRatio="xMidYMid meet"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    {/* Drop Shadow Filter */}
                    <filter id="dropShadow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="0.5" />
                        <feOffset dx="0" dy="0.5" result="offsetblur" />
                        <feComponentTransfer>
                            <feFuncA type="linear" slope="0.5" />
                        </feComponentTransfer>
                        <feMerge>
                            <feMergeNode />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Connectivity Path */}
                <path
                    d={generatePath()}
                    fill="none"
                    strokeWidth="1.5"
                    strokeDasharray="4 6"
                    className="map-path-line"
                />

                {/* Nodes */}
                {steps.map((step) => {
                    const pos = stepPositions[step.id];
                    return (
                        <g
                            key={step.id}
                            transform={`translate(${pos.x}, ${pos.y})`}
                            onClick={() => handleStepClick(step)}
                            className="island-group-container"
                            style={{ cursor: isExpanded ? 'pointer' : 'default', pointerEvents: isExpanded ? 'all' : 'none' }}
                        >
                            {/* Inner Group for Hover Animation - Isolates Scale form Translate */}
                            <g className="island-visual-group">
                                {/* Render the visual object (External Image) */}
                                {renderNodeImage(step)}

                                {/* Label Tag */}
                                <g transform="translate(0, 13)">
                                    <rect
                                        x="-16" y="-3.5"
                                        width="32" height="7"
                                        rx="2.5"
                                        className="island-label-bg"
                                    />
                                    <text
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        className="island-svg-label"
                                        y="0.3"
                                    >
                                        {step.id}. {step.title}
                                    </text>
                                </g>
                            </g>
                        </g>
                    );
                })}
            </svg>

            {/* Header: title + video btn (only when expanded) */}
            {isExpanded && (
                <div className="map-header">
                    <h2 className="map-title-overlay">領人歸主秘笈</h2>
                    <Tooltip content="觀看教學影片" side="bottom">
                    <button
                    type="button"
                    className="map-video-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        setVideoModalOpen(true);
                    }}
                    aria-label="觀看教學影片"
                >
                        <Play size={18} strokeWidth={2} />
                        <span>教學影片</span>
                    </button>
                    </Tooltip>
                </div>
            )}

            {/* Hint: tap step for details (only when expanded, no step selected) */}
            {isExpanded && !selectedStep && (
                <p className="map-step-hint">點擊步驟可查看詳細說明</p>
            )}

            {/* Expand / Unexpand control */}
            <Tooltip content={isExpanded ? '縮小' : '展開'} side="bottom">
            <button
                type="button"
                className="map-expand-btn"
                onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded((prev) => !prev);
                    if (isExpanded) setSelectedStep(null);
                }}
                aria-label={isExpanded ? '縮小' : '展開'}
            >
                {isExpanded ? <Minimize2 size={20} strokeWidth={2} /> : <Maximize2 size={20} strokeWidth={2} />}
            </button>
            </Tooltip>

            {/* Video Modal - only when expanded */}
            {isExpanded && videoModalOpen && (
                <div className="map-video-overlay" onClick={() => setVideoModalOpen(false)}>
                    <div className="map-video-modal" onClick={e => e.stopPropagation()}>
                        <CloseButton className="close-btn" onClick={() => setVideoModalOpen(false)} ariaLabel="關閉" />
                        <div className="map-video-wrapper">
                            <iframe
                                src={`https://www.youtube.com/embed/${VIDEO_EMBED_ID}?autoplay=1`}
                                title="領人歸主秘笈 教學影片"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                        <p className="map-video-hint">(點擊畫面空白處關閉)</p>
                    </div>
                </div>
            )}

            {/* Detail Overlay (HTML) - only when expanded */}
            {isExpanded && selectedStep && (
                <div className="step-detail-overlay" onClick={() => setSelectedStep(null)}>
                    <div className="step-detail-card" onClick={e => e.stopPropagation()}>
                        <CloseButton className="close-btn" onClick={() => setSelectedStep(null)} ariaLabel="關閉" />
                        <div className="detail-header">
                            <span className="detail-number">{selectedStep.id}</span>
                            <h3>{selectedStep.title}</h3>
                        </div>
                        <div className="detail-content">
                            <p>這裡將會顯示「{selectedStep.title}」的詳細內容與執行方法。</p>
                            <p className="detail-hint">(點擊畫面空白處關閉)</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );

    return (
        <>
            {/* Collapsed: inline in Guide modal, tap to expand */}
            {!isExpanded && (
                <div
                    className={`map-container map-container--collapsed ${visible ? 'visible' : ''}`}
                    onClick={handleMapAreaClick}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setIsExpanded(true)}
                    aria-label="點擊展開地圖"
                >
                    {mapContent}
                </div>
            )}

            {/* Expanded: full-viewport overlay */}
            {isExpanded && (
                <div
                    className="map-overlay"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setIsExpanded(false);
                    }}
                    role="presentation"
                >
                    <div className={`map-container map-container--expanded ${isCompactView ? 'map-container--expanded-compact' : ''}`} onClick={(e) => e.stopPropagation()}>
                        {mapContent}
                    </div>
                </div>
            )}
        </>
    );
}
