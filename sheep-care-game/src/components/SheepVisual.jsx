
import React from 'react';
import './SheepVisual.css';

export const SheepVisual = ({
    x, y, state, direction,
    status, visual = {},
    health = 100,
    scale = 1,
    isStatic = false,
    name = ''
}) => {
    const isDead = status === 'dead';
    const { color = '#ffffff', accessory = 'none' } = visual || {};

    const style = {
        position: isStatic ? 'relative' : 'absolute',
        left: isStatic ? 'auto' : `${x}%`,
        top: isStatic ? 'auto' : `${y}%`,
        transform: `scale(${scale})`,
        zIndex: isStatic ? 1 : Math.floor(y),
        '--sheep-color': color
    };

    const containerStyle = isStatic ? style : {
        ...style,
        transform: `scale(${scale}) scaleX(${direction})`
    };

    if (isDead) {
        return (
            <div className="sheep-visual-container" style={containerStyle}>
                <div className="sheep-grave">🪦</div>
            </div>
        );
    }

    // --- Status Logic ---
    const isSick = status === 'sick';
    const isInjured = status === 'injured';

    // Health Stages
    let healthStage = 'normal';
    if (health >= 80) healthStage = 'super';
    else if (health >= 50) healthStage = 'normal';
    else if (health >= 30) healthStage = 'weak';
    else healthStage = 'critical';

    const statusClass = isSick ? 'sheep-sick' : (isInjured ? 'sheep-injured' : '');
    const animClass = (state === 'walking' && !isStatic) ? 'walking' : '';

    // Eyes logic based on health/status
    const isSad = isSick || isInjured || healthStage === 'weak' || healthStage === 'critical';
    const isHappy = healthStage === 'super' && !isSick && !isInjured;
    const eyeClass = isSad ? 'eye-sad' : (isHappy ? 'eye-happy' : 'eye');

    let StatusIcon = null;
    // Removed mosquito icon for sick status
    if (isInjured) StatusIcon = '🤕'; // Bandage
    else if (healthStage === 'critical') StatusIcon = '😰'; // Sweat/Fear
    else if (healthStage === 'weak') StatusIcon = '💧'; // Tired drop

    return (
        <div className={`sheep-visual-container ${animClass} ${statusClass} stage-${healthStage}`} style={containerStyle}>

            {/* Status Float Icon */}
            {StatusIcon && <div className="status-icon-float">{StatusIcon}</div>}

            <div className="sheep-body-group">
                <div className="sheep-leg leg-fl"></div>
                <div className="sheep-leg leg-fr"></div>
                <div className="sheep-leg leg-bl"></div>
                <div className="sheep-leg leg-br"></div>
                <div className="sheep-body"></div>

                <div className="sheep-head-group">
                    <div className="sheep-ear ear-left"></div>
                    <div className="sheep-ear ear-right"></div>

                    <div className="sheep-head">
                        <div className="sheep-face">
                            <div className="sheep-eyes">
                                <div className={eyeClass}></div>
                                <div className={eyeClass}></div>
                            </div>
                        </div>
                        {/* Accessories */}
                        {accessory === 'tie_red' && <div className="acc-tie acc-tie-red"></div>}
                        {accessory === 'tie_blue' && <div className="acc-tie acc-tie-blue"></div>}
                        {accessory === 'flower' && <div className="acc-flower">🌸</div>}
                        {accessory === 'scarf_green' && <div className="acc-scarf"></div>}
                    </div>
                </div>
            </div>
        </div>
    );
};
