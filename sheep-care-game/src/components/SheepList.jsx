
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
                overflow: 'hidden' // Strict clipping
            }}
        >
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

            {/* 3. Footer (Hidden on very short screens) */}
            {/* 3. Footer (Fixed Height) */}
            <div className="card-footer" style={{ width: '100%', textAlign: 'center', marginTop: 'auto', flexShrink: 0 }}>
                <div style={{
                    fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--color-text-brown)',
                    marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                }}>
                    {s.name}
                </div>
                {!isSelectionMode && (
                    <button className="sheep-card-action" style={{
                        width: '100%', padding: '6px 0',
                        background: 'var(--color-action-pink)',
                        color: 'white', border: 'none',
                        borderRadius: 'var(--radius-btn)',
                        fontWeight: 'bold', fontSize: '0.8rem',
                        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px'
                    }}
                        onClick={(e) => { e.stopPropagation(); onSelect(s); }}
                    >
                        {isDead ? <><span>🕯️</span> 回憶</> : <><span>🙏</span> 禱告 {s.prayedCount || 0}/3</>}
                    </button>
                )}
            </div>
        </div>
    );
};

// --- Main List Component ---
export const SheepList = ({ onSelect }) => { // Removed onClose
    const { sheep, deleteMultipleSheep, updateSheep } = useGame();
    // ... logic ...

    // REDUNDANT LOGIC SNIPPET REMOVED FOR BREVITY IN REPLACEMENT, 
    // BUT we must keep the existing logic. 
    // I will replace only the render part or use strict replacement. 
    // Since I'm replacing the whole component block in previous steps, 
    // I need to be careful. I will target the `const SheepCard` and `return (...)` of SheepList.

    // Re-instating the full list component code to be safe, but focusing on the style injection.
    const sortedSheep = [...(sheep || [])].sort((a, b) => a.id - b.id);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [editingSheep, setEditingSheep] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');

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

    const handleSelectAll = () => {
        if (selectedIds.size === filteredSheep.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(filteredSheep.map(s => s.id)));
    };

    const handleDeleteSelected = () => {
        if (selectedIds.size === 0) return;
        if (window.confirm(`確定要刪除這 ${selectedIds.size} 隻小羊嗎？`)) {
            deleteMultipleSheep(Array.from(selectedIds));
            setIsSelectionMode(false);
            setSelectedIds(new Set());
        }
    };

    return (
        <div className="sheep-list-container" style={{
            position: 'absolute', bottom: 0, left: 0, width: '100vw', height: '33%', // Occupy Foreground Terrain
            background: 'transparent',
            zIndex: 1500,
            display: 'flex', flexDirection: 'column',
            pointerEvents: 'none'
        }}>
            <style>{`
                @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
                .sheep-dock-scroll::-webkit-scrollbar { display: none; }
                .dock-child { pointer-events: auto; }
            `}</style>

            {/* Filter Bar */}
            <div className="dock-child" style={{
                padding: '10px 20px',
                display: 'flex', gap: '8px',
                overflowX: 'auto', scrollbarWidth: 'none',
                maxWidth: '100%'
            }}>
                {[
                    { id: 'ALL', label: '全部' },
                    { id: 'HEALTHY', label: '健康' },
                    { id: 'SICK', label: '生病' },
                    { id: 'DEAD', label: '離世' }
                ].map(f => (
                    <button key={f.id} onClick={() => setFilterStatus(f.id)}
                        style={{
                            padding: '4px 12px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.5)',
                            background: filterStatus === f.id ? 'var(--color-text-brown)' : 'rgba(255, 255, 255, 0.8)',
                            color: filterStatus === f.id ? 'white' : 'var(--color-text-brown)',
                            fontWeight: 'bold', fontSize: '0.8rem', whiteSpace: 'nowrap',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            transition: 'all 0.2s',
                            cursor: 'pointer'
                        }}>
                        {f.label} {counts[f.id]}
                    </button>
                ))}

                <button onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedIds(new Set()); }}
                    style={{
                        marginLeft: 'auto',
                        background: isSelectionMode ? 'var(--color-action-blue)' : 'rgba(255,255,255,0.8)',
                        border: '1px solid #DDD', borderRadius: '15px',
                        padding: '4px 12px', fontSize: '0.8rem',
                        color: isSelectionMode ? 'white' : '#666',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                    {isSelectionMode ? '完成' : '編輯'}
                </button>
            </div>

            {/* Horizontal Scroll List */}
            <div className="dock-scroll-area" style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-end', // Align cards to bottom
                gap: '15px',
                padding: '10px 20px 20px 20px', // ADDED TOP PADDING (10px)
                overflowX: 'auto',
                overflowY: 'hidden',
                scrollBehavior: 'smooth',
                pointerEvents: 'auto' // ENABLE SCROLLING
            }}>
                {filteredSheep.map(s => (
                    // WRAPPER
                    <div key={s.id} style={{ minWidth: '120px', height: '100%', paddingBottom: '5px' }}>
                        <SheepCard
                            s={s}
                            isSelectionMode={isSelectionMode}
                            isSelected={selectedIds.has(s.id)}
                            onSelect={onSelect}
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

            {/* Batch Action Bar */}
            {isSelectionMode && selectedIds.size > 0 && (
                <div className="dock-child" style={{
                    position: 'absolute', bottom: '85px', left: '50%', transform: 'translateX(-50%)',
                    background: 'white', padding: '10px 20px', borderRadius: '30px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                    display: 'flex', gap: '10px', animation: 'pop-in 0.2s'
                }}>
                    <button onClick={handleSelectAll} style={{ padding: '8px 16px', borderRadius: '20px', background: '#F5F5F5', border: 'none', color: '#666' }}>
                        全選
                    </button>
                    <button onClick={handleDeleteSelected}
                        style={{
                            padding: '8px 16px', borderRadius: '20px',
                            background: '#FF5252', color: 'white', border: 'none', fontWeight: 'bold'
                        }}>
                        刪除 ({selectedIds.size})
                    </button>
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
    );
};
