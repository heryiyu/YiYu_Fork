import React, { useEffect, useState } from 'react';
import { X, Star } from 'lucide-react';
import './SevenStepsMap.css';

const steps = [
    { id: 1, title: '接觸關懷' },
    { id: 2, title: '發現需要' },
    { id: 3, title: '見證分享' },
    { id: 4, title: '權能服事' },
    { id: 5, title: '決志信主' },
    { id: 6, title: '靈修生活' },
    { id: 7, title: '作主見證' }
];

export function SevenStepsMap() {
    // Simple animation entry effect
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setVisible(true);
    }, []);

    return (
        <div className={`map-container ${visible ? 'visible' : ''}`}>
            <h2 className="map-title">領人歸主秘笈有七招</h2>

            {/* Background Path (abstract SVG line connecting approximate points) 
            Note: The path coordinates below are approximations to match the CSS positioning.
            Since CSS handles absolute positioning, we draw a curve that roughly passes through them.
            Responsiveness is handled by CSS, SVG might need simple media query adjustment or just be "good enough" background art.
        */}
            <svg className="map-path-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path
                    d="M 15 90 C 25 85, 35 85, 35 80 S 65 85, 65 80 S 90 60, 90 55 S 50 40, 50 35 S 25 25, 25 20 L 55 10"
                    className="map-path-line"
                    vectorEffect="non-scaling-stroke"
                />
            </svg>

            <div className="islands-wrapper">
                {steps.map((step) => (
                    <div key={step.id} className={`island-node step-${step.id}`}>
                        <div className="island-visual">
                            <div className="island-star">
                                <Star size={16} fill="#FFD700" stroke="none" />
                            </div>
                            <span className="island-number">{step.id}</span>
                            <div className="island-base-shadow"></div>
                        </div>
                        <div className="island-label">{step.title}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
