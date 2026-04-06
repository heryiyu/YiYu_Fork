import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { SheepSwipeCard } from './SheepSwipeCard';
import { isSleeping } from '../../utils/gameLogic';
import { useGameActions, useUserAuth } from '../../context/GameContext/useGame';

const SwipeableCardWrapper = ({
    sheep, tags, tagAssignmentsBySheep, isEditing, setIsEditing, onSwipeRight, onSwipeLeft, leaveDirection, onSelect
}) => {
    const x = useMotionValue(0);
    const dragOpacityRight = useTransform(x, [0, 100], [0, 1]);
    const dragOpacityLeft = useTransform(x, [0, -100], [0, 1]);

    const handleDragEnd = (event, info) => {
        const SWIPE_THRESHOLD = 80;
        const VELOCITY_THRESHOLD = 500;
        
        if (info.offset.x > SWIPE_THRESHOLD || info.velocity.x > VELOCITY_THRESHOLD) {
            onSwipeRight();
        } else if (info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -VELOCITY_THRESHOLD) {
            onSwipeLeft();
        }
    };

    return (
        <motion.div
            drag={isEditing ? false : "x"}
            dragSnapToOrigin={true}
            onDragEnd={handleDragEnd}
            whileTap={{ scale: 1.05 }}
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{
                x: leaveDirection === 'left' ? -500 : (leaveDirection === 'right' ? 500 : 0),
                opacity: 0,
                rotate: leaveDirection === 'left' ? -30 : (leaveDirection === 'right' ? 30 : 0),
                transition: { duration: 0.3 }
            }}
            style={{
                x,
                position: 'absolute',
                zIndex: 1,
                touchAction: 'none'
            }}
        >
            {/* Left/Right Overlays */}
            <motion.div
                style={{
                    position: 'absolute', top: '50px', right: '40px',
                    backgroundColor: '#0ea5e9', color: 'white', padding: '10px 24px',
                    borderRadius: '24px', fontWeight: 900, fontSize: '1.5rem',
                    opacity: dragOpacityRight, zIndex: 10,
                    boxShadow: '0 4px 12px rgba(14,165,233,0.3)',
                    border: '3px solid #0ea5e9',
                    display: 'flex', alignItems: 'center', gap: '8px'
                }}
            >
                ❤️ 阿們
            </motion.div>
            <motion.div
                style={{
                    position: 'absolute', top: '50px', left: '40px',
                    backgroundColor: '#f1f5f9', color: '#64748b', padding: '10px 24px',
                    borderRadius: '24px', fontWeight: 900, fontSize: '1.5rem',
                    opacity: dragOpacityLeft, zIndex: 10,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    border: '3px solid #cbd5e1',
                    display: 'flex', alignItems: 'center', gap: '8px'
                }}
            >
                <span style={{color: '#eab308'}}>⭐️</span> 下次
            </motion.div>

            <SheepSwipeCard
                sheep={sheep}
                tags={tags}
                tagAssignmentsBySheep={tagAssignmentsBySheep}
                isFlipped={isEditing}
                onEditClick={() => setIsEditing(true)}
                onFlipBack={() => setIsEditing(false)}
                onSwipeRight={onSwipeRight}
                onSwipeLeft={onSwipeLeft}
                onSelect={onSelect}
            />
        </motion.div>
    );
};

export const SheepSwipeView = ({
    sheepList,
    selectedIds,
    onSelect,
    isSelectionMode,
    toggleSelection,
    settings,
    tags,
    tagAssignmentsBySheep,
    onClose // new prop to close the swipe UI
}) => {
    const { prayForSheep } = useGameActions();
    const { isAdmin } = useUserAuth();

    const [queueIds, setQueueIds] = useState([]);
    const [leaveDirection, setLeaveDirection] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    
    // Session Stats tracking
    const [sessionStats, setSessionStats] = useState({ total: 0, prayed: 0, skipped: 0 });

    // Motion values and leave direction logic moved inside SwipeableCardWrapper

    const initQueue = () => {
        if (sheepList && sheepList.length > 0) {
            const todayStr = new Date().toDateString();
            const prayedCount = sheepList.filter(s => s.lastPrayedDate === todayStr).length;
            
            setQueueIds(sheepList.map(s => s.id));
            setSessionStats({ total: sheepList.length, prayed: prayedCount, skipped: 0 });
        }
    };

    // Initial load and filter change resync
    useEffect(() => {
        if (sheepList && sheepList.length > 0 && queueIds.length === 0 && sessionStats.total === 0) {
            initQueue();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sheepList, queueIds.length, sessionStats.total]);

    const SWIPE_THRESHOLD = 80;

    const currentSheep = sheepList.find(s => s.id === queueIds[0]);
    const nextSheep = sheepList.find(s => s.id === queueIds[1]);

    const removeTopCard = (direction) => {
        setLeaveDirection(direction);

        if (direction === 'right' && currentSheep) {
            const todayStr = new Date().toDateString();
            const alreadyPrayedToday = currentSheep.lastPrayedDate === todayStr;
            const currentPrayedCount = alreadyPrayedToday ? (currentSheep.prayedCount || 0) : 0;
            const maxAllowed = isSleeping(currentSheep) ? 1 : 3;
            
            const canPray = isAdmin || currentPrayedCount < maxAllowed;

            if (canPray) {
                prayForSheep(currentSheep.id);
                if (!alreadyPrayedToday) {
                    // Only increment the session statistics if it's the first prayer today for this sheep
                    setSessionStats(prev => ({ ...prev, prayed: prev.prayed + 1 }));
                }
            }
        } else if (direction === 'left') {
            setSessionStats(prev => ({ ...prev, skipped: prev.skipped + 1 }));
        }

        // Delay unmount by 10ms to allow React to flush leaveDirection to the child component.
        // This ensures Framer Motion's AnimatePresence captures the correct exit direction.
        setTimeout(() => {
            setQueueIds(prev => prev.slice(1));
            setLeaveDirection(null);
            setIsEditing(false);
        }, 10);
    };

    const handleRestart = () => {
        initQueue();
    };

    if (sheepList.length === 0) {
        return (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(0,0,0,0.5)', fontWeight: 'bold' }}>
                沒有小羊符合目前的篩選條件
            </div>
        );
    }

    if (queueIds.length === 0) {
        if (sessionStats.total === 0) {
            return (
                <div className="sheep-swipe-overlay-container" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backgroundColor: 'rgba(253, 248, 243, 0.65)', backdropFilter: 'blur(8px)' }}>
                    <div className="sheep-swipe-completion-card" style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>目前沒有小羊需要關懷</h2>
                        <button className="modal-btn-primary" onClick={onClose} style={{ marginTop: '24px', padding: '12px 24px' }}>
                            返回主畫面
                        </button>
                    </div>
                </div>
            );
        }

        const isScenarioA = sessionStats.prayed > 0;

        return (
            <div className="sheep-swipe-overlay-container" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backgroundColor: 'rgba(253, 248, 243, 0.65)', backdropFilter: 'blur(8px)' }}>
                <div className="sheep-swipe-completion-card" style={{ 
                    backgroundColor: '#fff', 
                    padding: '40px 24px', 
                    borderRadius: '40px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    textAlign: 'center', 
                    width: 'clamp(280px, 90vw, 420px)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}>
                    <div style={{ fontSize: '4rem', marginBottom: '16px' }}>
                        {isScenarioA ? '🙏' : '🐑'}
                    </div>
                    
                    {isScenarioA && (
                        <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#4A463F', margin: '0 0 12px 0' }}>太棒了！</h2>
                    )}
                    
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#6D6860', marginBottom: '24px' }}>
                        今日已完成 {sessionStats.prayed}/{sessionStats.total} 位
                    </div>

                    <div style={{ 
                        backgroundColor: 'rgba(0,0,0,0.03)', 
                        padding: '24px', 
                        borderRadius: '24px', 
                        marginBottom: '32px' 
                    }}>
                        <p style={{ margin: 0, fontSize: '1rem', lineHeight: '1.6', color: '#4A463F', fontStyle: 'italic', fontWeight: 600 }}>
                            {isScenarioA 
                                ? '「我常與你們同在，直到世界的末了。」' 
                                : '「一個人若有一百隻羊，一隻走迷了路，他豈不撇下這九十九隻，往山裡去找那隻迷路的羊嗎？」'}
                        </p>
                        <p style={{ margin: '12px 0 0 0', fontSize: '0.85rem', color: '#6D6860' }}>
                            —— {isScenarioA ? '馬太福音 28:20' : '馬太福音 18:12'}
                        </p>
                    </div>

                    <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#000', marginBottom: '32px' }}>
                        {isScenarioA ? '願神祝福你的每一個禱告' : `還有 ${sessionStats.skipped} 隻小羊在等你`}
                    </p>

                    <button 
                        className="modal-btn-primary" 
                        onClick={onClose}
                        style={{ width: '100%', fontSize: '1.1rem', padding: '12px' }}
                    >
                        {isScenarioA ? '關閉並返回主列表' : '查看小羊列表'}
                    </button>
                    {!isScenarioA && (
                        <button 
                            onClick={handleRestart}
                            style={{ width: '100%', fontSize: '1rem', marginTop: '12px', border: 'none', background: 'transparent', color: '#6D6860', fontWeight: 600 }}
                        >
                            重新巡視一次
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div style={{ 
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 1800,
            backgroundColor: 'rgba(253, 248, 243, 0.65)',
            backdropFilter: 'blur(8px)',
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            overflow: 'hidden' 
        }}>
            
            {onClose && (
                <button 
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: 'max(24px, env(safe-area-inset-top, 24px))',
                        right: '24px',
                        background: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '40px', height: '40px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        cursor: 'pointer',
                        zIndex: 10001,
                        fontSize: '1.2rem'
                    }}
                >
                    ✕
                </button>
            )}

            {/* Progress indicators */}
            <div style={{
                position: 'absolute',
                top: 'max(24px, env(safe-area-inset-top, 24px))',
                left: '24px',
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                zIndex: 10000
            }}>
                <div style={{
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    color: '#6D6860',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                }}>
                    進度 {(sessionStats.total - queueIds.length) + 1} / {sessionStats.total}
                </div>
                <div style={{
                    backgroundColor: '#e0f2fe', // light blue tint
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    color: '#0369a1',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                }}>
                    🙏 已禱告：{sessionStats.prayed}
                </div>
            </div>

            {nextSheep && (
                <div style={{
                    position: 'absolute',
                    transform: 'scale(0.95) translateY(10px)',
                    opacity: 0.8,
                    pointerEvents: 'none',
                    zIndex: 0
                }}>
                    <SheepSwipeCard
                        sheep={nextSheep}
                        tags={tags}
                        tagAssignmentsBySheep={tagAssignmentsBySheep}
                    />
                </div>
            )}

            <AnimatePresence>
                {currentSheep && (
                    <SwipeableCardWrapper
                        key={currentSheep.id}
                        sheep={currentSheep}
                        tags={tags}
                        tagAssignmentsBySheep={tagAssignmentsBySheep}
                        isEditing={isEditing}
                        setIsEditing={setIsEditing}
                        onSwipeRight={() => removeTopCard('right')}
                        onSwipeLeft={() => removeTopCard('left')}
                        leaveDirection={leaveDirection}
                        onSelect={onSelect}
                    />
                )}
            </AnimatePresence>
            
            {/* Guide text */}
            <div style={{
                position: 'absolute',
                bottom: 'max(20px, env(safe-area-inset-bottom, 20px))',
                width: '100%',
                textAlign: 'center',
                color: '#6D6860',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                pointerEvents: 'none',
                opacity: 0.8
            }}>
                ⬅️ 左滑略過 ｜ ➡️ 右滑禱告
            </div>
        </div>
    );
};
