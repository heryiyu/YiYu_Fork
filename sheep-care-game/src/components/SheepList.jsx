
import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { AssetSheep } from './AssetSheep';
import { getStableSheepMessage } from '../utils/gameLogic';
import { AddSheepModal } from './AddSheepModal';
import '../styles/design-tokens.css';

// --- Card Component ---
const SheepCard = ({ s, isSelectionMode, isSelected, onSelect, onToggleSelect, isDead, isSick }) => {
    return (
        <div
            className={`sheep-card ${isSelectionMode && isSelected ? 'selected' : ''}`}
            onClick={() => {
                if (isSelectionMode) onToggleSelect(s.id);
                else onSelect(s);
            }}
            style={{
                position: 'relative',
                background: 'var(--color-primary-cream)',
                borderRadius: 'var(--radius-card)',
                padding: '8px',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                boxShadow: isSelectionMode && isSelected
                    ? '0 0 0 4px var(--color-action-blue)'
                    : 'var(--shadow-card)',
                cursor: 'pointer',
                transition: 'transform 0.1s, box-shadow 0.2s',
                height: '100%', // Strict height from dock
                boxSizing: 'border-box',
                border: '2px solid rgba(255,255,255,0.6)',
                overflow: 'hidden', // Strict clipping
                transform: isSelectionMode ? 'scale(0.95)' : 'scale(1)' // Slight shrink in select mode
            }}
        >
            {/* Selection Indicator Overlay */}
            {isSelectionMode && (
                <div style={{
                    position: 'absolute', top: '8px', right: '8px', zIndex: 10,
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: isSelected ? 'var(--color-action-blue)' : 'rgba(255,255,255,0.8)',
                    border: '2px solid var(--color-action-blue)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    {isSelected && <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>✓</span>}
                </div>
            )}

            {/* 1. Header (Fixed Height) */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--color-action-pink)', fontWeight: 'bold' }}>
                    <span>♥</span> <span>{Math.ceil(s.health || 0)}%</span>
                </div>
                <div style={{
                    background: isDead ? '#9E9E9E' : (isSick ? '#FF5252' : 'var(--color-badge-orange)'),
                    color: 'white', padding: '3px 8px', borderRadius: 'var(--radius-tag)',
                    fontSize: '0.65rem', fontWeight: 'bold',
                }}>
                    {isDead ? '已離世' : (isSick ? '生病' : s.name.length > 3 ? '夥伴' : '新朋友')}
                </div>
            </div>

            {/* 2. Avatar (Fills "Remaining Height" with Min-Height Constraint) */}
            <div className="sheep-card-avatar" style={{
                flex: 1, // Grow to fill space
                minHeight: '60px', // STRICT MIN SIZE for Sheep
                width: '100%',
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                overflow: 'hidden', // Clip overflow
                padding: '4px 0' // Safety buffer
            }}>
                <AssetSheep
                    status={s.status}
                    visual={s.visual}
                    health={s.health}
                    type={s.type}
                    scale={1} // CSS handles resizing via contain
                    direction={1}
                    centered={true}
                />
            </div>

            {/* 3. Footer (Fixed Height) */}
            <div className="card-footer" style={{ width: '100%', textAlign: 'center', marginTop: 'auto', flexShrink: 0 }}>
                <div style={{
                    fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--color-text-brown)',
                    marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                }}>
                    {s.name}
                </div>
                {!isSelectionMode && (
                    <div style={{
                        fontSize: '0.75rem', color: isDead ? '#9E9E9E' : 'var(--color-text-brown)',
                        marginTop: '4px', fontWeight: 'bold'
                    }}>
                        {isDead ? '🕯️ 回憶' : `🙏 禱告 ${s.prayedCount || 0}/3`}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Main List Component ---
export const SheepList = ({ onSelect }) => {
    const { sheep, deleteMultipleSheep, updateSheep, adoptSheep, updateMultipleSheep } = useGame();
    // Re-instating the full list component code to be safe, but focusing on the style injection.
    const sortedSheep = [...(sheep || [])].sort((a, b) => a.id - b.id);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [editingSheep, setEditingSheep] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [showAddModal, setShowAddModal] = useState(false); // New explicit state for Add Modal

    // Collapsible State (Default Open)
    const [isCollapsed, setIsCollapsed] = useState(false);

    const filteredSheep = useMemo(() => sortedSheep.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
        const isDead = s.status === 'dead';
        const isSick = s.status === 'sick';
        if (!matchesSearch) return false;
        if (filterStatus === 'DEAD') return isDead;
        if (filterStatus === 'SICK') return isSick;
        if (filterStatus === 'HEALTHY') return !isDead && !isSick;
        return true;
    }), [sortedSheep, searchTerm, filterStatus]);

    const counts = useMemo(() => sortedSheep.reduce((acc, s) => {
        const isDead = s.status === 'dead';
        const isSick = s.status === 'sick';
        if (isDead) acc.DEAD++;
        else if (isSick) acc.SICK++;
        else acc.HEALTHY++;
        return acc;
    }, { ALL: sortedSheep.length, HEALTHY: 0, SICK: 0, DEAD: 0 }), [sortedSheep]);

    const toggleSelection = (id) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleDeleteSelected = () => {
        if (selectedIds.size === 0) return;
        if (window.confirm(`確定要刪除這 ${selectedIds.size} 隻小羊嗎？`)) {
            deleteMultipleSheep(Array.from(selectedIds));
            setIsSelectionMode(false);
            setSelectedIds(new Set());
        }
    };

    const handleResetSelected = () => {
        if (selectedIds.size === 0) return;
        if (window.confirm(`確定要將這 ${selectedIds.size} 隻小羊的狀態重置為「健康 (100%)」嗎？`)) {
            // Reset logic: Restore health, status, clear logs
            updateMultipleSheep(Array.from(selectedIds), {
                health: 100,
                status: 'healthy',
                careLevel: 0,
                resurrectionProgress: 0,
                // keep lastPrayedDate? Maybe clear it so they can be prayed for again?
                // Request says "Reset data", usually implies fresh start.
                lastPrayedDate: null,
                prayedCount: 0
            });
            setIsSelectionMode(false);
            setSelectedIds(new Set());
        }
    };

    const handleConfirmAdd = (data) => {
        // Adapt to support array or single
        if (Array.isArray(data)) {
            data.forEach(item => adoptSheep(item));
        } else {
            adoptSheep(data);
        }
        setShowAddModal(false);
    };

    // --- Interaction Handlers ---

    // Toggle via Toolbar Background
    const handleToolbarClick = (e) => {
        // If collapsed, any click on the toolbar (including disabled buttons) should open it.
        // If open, we only toggle if clicking the background.
        if (isCollapsed) {
            setIsCollapsed(false);
        } else {
            // If already open, clicking background closes it.
            // But we must ensure we aren't clicking a valid button (stopped by stopPropagation).
            // Since buttons have stopPropagation, this handler only fires for background.
            setIsCollapsed(true);
        }
    };

    // Close via Overlay
    const handleOverlayClick = (e) => {
        e.stopPropagation();
        setIsCollapsed(true);
    };

    return (
        <>
            {/* 1. Click-Outside Overlay (Only when Expanded) */}
            {!isCollapsed && (
                <div
                    className="drawer-overlay"
                    onClick={handleOverlayClick}
                    style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        zIndex: 1400, // Below SheepList (1500)
                        background: 'transparent', // Invisible
                        cursor: 'default',
                        touchAction: 'none'
                    }}
                />
            )}

            {/* 2. Main Container */}
            <div className="sheep-list-container" style={{
                position: 'absolute', bottom: 0, left: 0, width: '100vw',
                height: 'auto', // Container adapts to content
                zIndex: 1500,
                display: 'flex', flexDirection: 'column',
                pointerEvents: 'none', // Allow clicks to pass through empty areas
                transition: 'transform 0.3s ease'
            }}>
                <style>{`
                    .sheep-dock-scroll::-webkit-scrollbar { display: none; }
                    .list-content-wrapper {
                        transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
                        overflow: hidden;
                    }
                `}</style>

                {/* Toolbar: Add | Search | Filters | Select */}
                <div
                    className="dock-child"
                    onClick={handleToolbarClick}
                    style={{
                        padding: '10px 20px',
                        display: 'flex', gap: '8px', alignItems: 'center',
                        overflowX: 'auto', scrollbarWidth: 'none',
                        maxWidth: '100%',
                        background: 'transparent',
                        pointerEvents: 'auto',
                        cursor: 'pointer',
                        userSelect: 'none',
                        position: 'relative', zIndex: 2
                    }}
                >
                    {/* Inner wrapper: functional when Open, pass-through when Collapsed */}
                    <div style={{
                        display: 'contents',
                        pointerEvents: isCollapsed ? 'none' : 'auto' // CRITICAL SAFETY FIX
                    }} onClick={(e) => !isCollapsed && e.stopPropagation()}>

                        {/* 1. Add Button (Gold) */}
                        <button onClick={() => setShowAddModal(true)} style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            background: '#ffd700', border: 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.2rem', color: '#5d4037', fontWeight: 'bold',
                            flexShrink: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.2)', cursor: 'pointer',
                            opacity: isCollapsed ? 0.6 : 1, transition: 'opacity 0.2s'
                        }}>
                            ➕
                        </button>

                        {/* 2. Search Bar (White Pill) */}
                        <div style={{ position: 'relative', height: '36px', flexShrink: 0, opacity: isCollapsed ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                            <input
                                type="text"
                                placeholder="搜尋..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    height: '100%', padding: '0 12px 0 30px',
                                    borderRadius: '18px', border: '1px solid rgba(255,255,255,0.5)',
                                    background: 'rgba(255,255,255,0.9)',
                                    width: searchTerm ? '120px' : '80px',
                                    transition: 'width 0.2s', fontSize: '0.9rem',
                                    color: '#5d4037', outline: 'none'
                                }}
                            />
                            <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
                        </div>

                        {/* Divider */}
                        <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.3)', margin: '0 4px' }}></div>

                        {/* 3. Filters */}
                        {[
                            { id: 'ALL', label: '全部' },
                            { id: 'HEALTHY', label: '健康' },
                            { id: 'SICK', label: '生病' },
                            { id: 'DEAD', label: '離世' }
                        ].map(f => (
                            <button key={f.id} onClick={() => setFilterStatus(f.id)}
                                style={{
                                    padding: '6px 12px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.5)',
                                    background: filterStatus === f.id ? 'var(--color-text-brown)' : 'rgba(255, 255, 255, 0.8)',
                                    color: filterStatus === f.id ? 'white' : 'var(--color-text-brown)',
                                    fontWeight: 'bold', fontSize: '0.8rem', whiteSpace: 'nowrap',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    transition: 'all 0.2s',
                                    cursor: 'pointer', flexShrink: 0,
                                    opacity: isCollapsed ? 0.6 : 1
                                }}>
                                {f.label} {counts[f.id]}
                            </button>
                        ))}

                        {/* 4. Select Button */}
                        <button onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedIds(new Set()); }}
                            style={{
                                marginLeft: 'auto',
                                background: isSelectionMode ? 'var(--color-action-blue)' : 'rgba(255,255,255,0.8)',
                                border: '1px solid #DDD', borderRadius: '15px',
                                padding: '6px 16px', fontSize: '0.8rem',
                                color: isSelectionMode ? 'white' : '#666',
                                cursor: 'pointer',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                fontWeight: 'bold', flexShrink: 0,
                                opacity: isCollapsed ? 0.6 : 1
                            }}>
                            {isSelectionMode ? '取消' : '選取'}
                        </button>
                    </div>
                </div>

                {/* Collapsible Content Area */}
                <div
                    className="list-content-wrapper"
                    style={{
                        // FIX: Restore explicit height logic for responsive design
                        // Use clamp to ensure it's never too small (phone) or too big (tablet)
                        // Originally ~33% or 260px min.
                        height: isCollapsed ? '0px' : 'clamp(260px, 33vh, 400px)',
                        opacity: isCollapsed ? 0 : 1,
                        display: 'flex', flexDirection: 'column',
                        pointerEvents: isCollapsed ? 'none' : 'auto'
                    }}
                >
                    {/* Horizontal Scroll List */}
                    <div className="dock-scroll-area" style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'flex-end',
                        gap: '15px',
                        padding: '10px 20px 20px 20px',
                        overflowX: 'auto',
                        overflowY: 'hidden',
                        scrollBehavior: 'smooth',
                        pointerEvents: 'auto',
                        height: '100%' // Ensure it fills the wrapper
                    }}>
                        {filteredSheep.map(s => (
                            <div key={s.id} style={{
                                minWidth: 'clamp(120px, 30vw, 160px)',
                                height: '100%', // Match parent height (which is now constrained)
                                paddingBottom: '5px',
                                pointerEvents: 'auto'
                            }}>
                                <SheepCard
                                    s={s}
                                    isSelectionMode={isSelectionMode}
                                    isSelected={selectedIds.has(s.id)}
                                    onSelect={(sheep) => {
                                        if (onSelect) onSelect(sheep);
                                    }}
                                    onToggleSelect={toggleSelection}
                                    isDead={s.status === 'dead'}
                                    isSick={s.status === 'sick'}
                                />
                            </div>
                        ))}


                        {filteredSheep.length === 0 && (
                            <div style={{ color: 'rgba(0,0,0,0.5)', padding: '20px', fontWeight: 'bold' }}>沒有小羊...</div>
                        )}
                    </div>
                </div>

                {/* Batch Action Bar (Conditional: Selection Mode > 0) */}
                {isSelectionMode && selectedIds.size > 0 && !isCollapsed && (
                    <div className="dock-child" style={{
                        position: 'absolute', bottom: '85px', left: '50%', transform: 'translateX(-50%)',
                        background: 'white', padding: '10px 20px', borderRadius: '30px',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                        display: 'flex', gap: '10px', animation: 'pop-in 0.2s', zIndex: 2000
                    }}>
                        <button onClick={handleDeleteSelected}
                            style={{
                                padding: '8px 16px', borderRadius: '20px',
                                background: '#FF5252', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '4px'
                            }}>
                            🗑️ 刪除 ({selectedIds.size})
                        </button>
                        <button onClick={handleResetSelected}
                            style={{
                                padding: '8px 16px', borderRadius: '20px',
                                background: '#29B6F6', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '4px'
                            }}>
                            🔄 重置 ({selectedIds.size})
                        </button>
                    </div>
                )}

                {/* Add Modal Overlay (Now managed here) */}
                {showAddModal && (
                    <div className="dock-child" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 3000 }}>
                        <AddSheepModal
                            onConfirm={handleConfirmAdd}
                            onCancel={() => setShowAddModal(false)}
                        />
                    </div>
                )}

                {/* Edit Modal Overlay */}
                {editingSheep && (
                    <div className="dock-child" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 3000 }}>
                        <AddSheepModal
                            editingSheep={editingSheep}
                            onConfirm={(updatedData) => {
                                if (updateSheep) updateSheep(editingSheep.id, updatedData);
                                setEditingSheep(null);
                            }}
                            onCancel={() => setEditingSheep(null)}
                        />
                    </div>
                )}
            </div>
        </>
    );
};
