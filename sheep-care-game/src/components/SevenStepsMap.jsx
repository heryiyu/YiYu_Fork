import React, { useEffect, useState } from 'react';
import './SevenStepsMap.css';

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

export function SevenStepsMap() {
    const [visible, setVisible] = useState(false);
    const [selectedStep, setSelectedStep] = useState(null);

    useEffect(() => {
        setVisible(true);
    }, []);

    // Simplified rendering using external assets
    const renderNodeImage = (step) => {
        const imagePath = `/assets/map_levels/step_${step.id}.svg`;
        // Size configuration
        const size = step.id === 7 ? 22 : 18;
        const offset = size / 2;

        return (
            <g className="island-shape">
                {/* Visual Object: External SVG Image */}
                <image
                    href={imagePath}
                    x={-offset}
                    y={-offset}
                    width={size}
                    height={size}
                    preserveAspectRatio="xMidYMid meet"
                    filter="url(#dropShadow)"
                />
            </g>
        );
    };

    return (
        <div className={`map-container ${visible ? 'visible' : ''}`}>
            {/* Full SVG Landscape */}
            <svg
                className="map-svg-layer"
                viewBox="0 0 100 100"
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
                    stroke="rgba(255, 255, 255, 0.2)"
                    strokeWidth="1.5"
                    strokeDasharray="3"
                    className="map-path-line"
                />

                {/* Nodes */}
                {steps.map((step) => {
                    const pos = stepPositions[step.id];
                    return (
                        <g
                            key={step.id}
                            transform={`translate(${pos.x}, ${pos.y})`}
                            onClick={() => setSelectedStep(step)}
                            className="island-group-container"
                            style={{ cursor: 'pointer' }}
                        >
                            {/* Inner Group for Hover Animation - Isolates Scale form Translate */}
                            <g className="island-visual-group">
                                {/* Render the visual object (External Image) */}
                                {renderNodeImage(step)}

                                {/* Label Tag */}
                                <g transform="translate(0, 13)">
                                    <rect
                                        x="-14" y="-3.5"
                                        width="28" height="7"
                                        rx="2.5"
                                        fill="rgba(255,255,255,0.9)"
                                        stroke="rgba(255,215,0,0.5)"
                                        strokeWidth="0.2"
                                    />
                                    <text
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        className="island-svg-label"
                                        y="0.3"
                                    >
                                        {step.title}
                                    </text>
                                </g>
                            </g>
                        </g>
                    );
                })}
            </svg>

            {/* Title Overlay (HTML) */}
            <h2 className="map-title-overlay">領人歸主秘笈</h2>

            {/* Detail Overlay (HTML) */}
            {selectedStep && (
                <div className="step-detail-overlay" onClick={() => setSelectedStep(null)}>
                    <div className="step-detail-card" onClick={e => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setSelectedStep(null)}>✖</button>
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
        </div>
    );
}
