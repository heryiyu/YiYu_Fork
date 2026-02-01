
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
                background: isDead ? '#F5F5F5' : '#FFFFFF',
                borderRadius: 'var(--radius-card)',
                padding: '12px',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                boxShadow: isSelectionMode && isSelected
                    ? '0 0 0 4px var(--color-action-blue)'
                    : 'var(--shadow-card)',
                cursor: 'pointer',
                transition: 'transform 0.1s, box-shadow 0.2s',
                aspectRatio: '0.8',
                border: '1px solid rgba(0,0,0,0.05)'
            }}
        >
            {/* Status Badge */}
            <div style={{
                position: 'absolute', top: '10px', left: '10px', zIndex: 2,
                background: isDead ? '#9E9E9E' : (isSick ? '#FF5252' : 'rgba(255, 255, 255, 0.8)'),
                color: isDead || isSick ? 'white' : 'var(--color-text-secondary)',
                padding: '4px 8px', borderRadius: 'var(--radius-tag)',
                fontSize: '0.7rem', fontWeight: 'bold'
            }}>
                {isDead ? '已離世' : (isSick ? '生病' : (s.type === 'LAMB' ? '小羊' : s.type))}
            </div>

            {/* Selection Checkbox Overlay */}
            {isSelectionMode && (
                <div style={{
                    position: 'absolute', top: '10px', right: '10px', zIndex: 10,
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: isSelected ? 'var(--color-action-blue)' : 'white',
                    border: '2px solid #ddd',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 'bold'
                }}>
                    {isSelected && '✓'}
                </div>
            )}

            {/* Avatar Section - Fixed overflow clipping */}
            <div style={{
                flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                marginBottom: '5px', position: 'relative' // Removed overflow:hidden
            }}>
                <AssetSheep
                    status={s.status}
                    visual={s.visual}
                    health={s.health}
                    type={s.type}
                    scale={1.2} // Slightly larger scale
                    direction={1}
                    centered={true}
                />
            </div>

            {/* Info Section */}
            <div style={{ width: '100%', textAlign: 'center' }}>
                <div style={{
                    fontWeight: 'bold', fontSize: '1rem', color: 'var(--color-text-brown)',
                    marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                }}>
                    {s.name}
                </div>

                {/* Health Bar (if alive) */}
                {!isDead && (
                    <div style={{
                        width: '80%', height: '6px', background: '#EEE',
                        borderRadius: '3px', margin: '0 auto 8px auto', overflow: 'hidden'
                    }}>
                        <div style={{
                            width: `${s.health || 100}%`, height: '100%',
                            background: s.health < 30 ? '#FF5252' : '#81C784'
                        }} />
                    </div>
                )}

                {/* Primary Action Button */}
                {!isSelectionMode && (
                    <button style={{
                        width: '100%', padding: '8px 0',
                        background: isDead ? 'var(--color-status-orange)' : 'var(--color-primary-pink)',
                        color: 'white', border: 'none',
                        borderRadius: 'var(--radius-btn)',
                        fontWeight: 'bold', fontSize: '0.85rem'
                    }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect(s);
                        }}
                    >
                        {isDead ? '回憶' : '禱告'}
                    </button>
                )}
            </div>
        </div>
    );
};

// --- Main List Component ---
export const SheepList = ({ onSelect }) => { // Removed onClose
    const { sheep, deleteMultipleSheep, updateSheep } = useGame();
    const sortedSheep = [...(sheep || [])].sort((a, b) => a.id - b.id);

    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [editingSheep, setEditingSheep] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');

    // Filter Logic
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

    // Counts Logic
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
            background: 'transparent', // No background, scene acts as BG
            zIndex: 1500, // Below Controls (2000) but above Foreground (100)
            display: 'flex', flexDirection: 'column',
            pointerEvents: 'none' // Allow clicks through empty areas, but re-enable for children
        }}>
            <style>{`
                @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
                .sheep-dock-scroll::-webkit-scrollbar { display: none; }
                .dock-child { pointer-events: auto; }
            `}</style>

            {/* Filter Bar (Floating above the list) */}
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

                {/* Edit Mode Toggle (Small) */}
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
            <div className="sheep-dock-scroll dock-child" style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: '15px',
                padding: '0 20px 80px 20px', // Bottom padding for Controls
                overflowX: 'auto',
                overflowY: 'hidden',
                scrollBehavior: 'smooth'
            }}>
                {filteredSheep.map(s => (
                    <div key={s.id} style={{ minWidth: '130px', height: '100%', position: 'relative' }}>
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

            {/* Batch Action Bar (if selecting) */}
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

            {/* Edit Modal Overlay - Needs to be full screen z-index high */}
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
