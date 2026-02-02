import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { AssetSheep } from './AssetSheep';
import { AddSheepModal } from './AddSheepModal';
import { Plus, Trash2, RotateCcw } from 'lucide-react';
import '../styles/design-tokens.css';
import './SheepList.css';

// --- Card Component (tag design aligned with SheepListModal.tsx) ---
const SheepCard = ({ s, isSelectionMode, isSelected, onSelect, onToggleSelect, isDead, isSick, isPinned, onTogglePin }) => {
    const tagVariant = isDead ? 'dead' : (isSick ? 'sick' : (s.name.length > 3 ? 'companion' : 'new'));
    const tagLabel = isDead ? '已離世' : (isSick ? '生病' : (s.name.length > 3 ? '夥伴' : '新朋友'));
    const healthFull = Math.ceil(s.health || 0) >= 100;

    return (
        <div
            className={`sheep-card ${isSelectionMode && isSelected ? 'selected' : ''} ${isSelectionMode ? 'sheep-card--select-mode' : ''}`}
            onClick={() => {
                if (isSelectionMode) onToggleSelect(s.id);
                else onSelect(s);
            }}
        >
            {isSelectionMode && (
                <div className={`sheep-card-selection-dot ${isSelected ? 'sheep-card-selection-dot--selected' : ''}`}>
                    {isSelected && <span className="sheep-card-selection-check">✓</span>}
                </div>
            )}

            <div className="sheep-card-header">
                <div className={`sheep-card-health ${healthFull ? 'sheep-card-health--full' : ''}`}>
                    <span className="sheep-card-health-icon">♥</span>
                    <span>{Math.ceil(s.health || 0)}%</span>
                </div>
                <div className={`sheep-card-tag sheep-card-tag--${tagVariant}`}>
                    {tagLabel}
                </div>
                <div className="sheep-card-header-actions">
                    {!isSelectionMode && onTogglePin && (
                        <button
                            type="button"
                            className="pin-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                onTogglePin(s.id);
                            }}
                            style={{
                                background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
                                opacity: isPinned ? 1 : 0.2,
                                fontSize: '1rem',
                                transition: 'transform 0.2s, opacity 0.2s'
                            }}
                        >
                            📌
                        </button>
                    )}
                </div>
            </div>

            <div className="sheep-card-avatar">
                <AssetSheep
                    status={s.status}
                    visual={s.visual}
                    health={s.health}
                    type={s.type}
                    scale={0.55}
                    direction={1}
                    centered={true}
                />
            </div>

            <div className="sheep-card-footer">
                <div className="sheep-card-name">{s.name}</div>
                {!isSelectionMode && (
                    <div className={`sheep-card-pray ${isDead ? 'sheep-card-pray--dead' : ''}`}>
                        {isDead ? `🕯️ 迫切禱告 ${s.resurrectionProgress || 0}/5` : `🙏 禱告 ${s.prayedCount || 0}/3`}
                    </div>
                )}
            </div>
        </div >
    );
};

// --- Main List Component ---
export const SheepList = ({ onSelect }) => {
    const { sheep, deleteMultipleSheep, updateSheep, adoptSheep, updateMultipleSheep, settings, togglePin } = useGame();
    const pinnedSet = useMemo(() => new Set(settings?.pinnedSheepIds || []), [settings?.pinnedSheepIds]);
    const sortedSheep = useMemo(() => {
        return [...(sheep || [])].sort((a, b) => {
            const aPinned = pinnedSet.has(a.id);
            const bPinned = pinnedSet.has(b.id);
            if (aPinned !== bPinned) return aPinned ? -1 : 1;
            return a.id - b.id;
        });
    }, [sheep, pinnedSet]);
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
        const isPinned = settings?.pinnedSheepIds?.includes(s.id);

        if (!matchesSearch) return false;
        if (filterStatus === 'DEAD') return isDead;
        if (filterStatus === 'SICK') return isSick;
        if (filterStatus === 'HEALTHY') return !isDead && !isSick;
        if (filterStatus === 'PINNED') return isPinned;
        return true;
    }), [sortedSheep, searchTerm, filterStatus, settings?.pinnedSheepIds]);

    const counts = useMemo(() => sortedSheep.reduce((acc, s) => {
        const isDead = s.status === 'dead';
        const isSick = s.status === 'sick';
        const isPinned = settings?.pinnedSheepIds?.includes(s.id);

        if (isDead) acc.DEAD++;
        else if (isSick) acc.SICK++;
        else acc.HEALTHY++;

        if (isPinned) acc.PINNED++;

        return acc;
    }, { ALL: sortedSheep.length, HEALTHY: 0, SICK: 0, DEAD: 0, PINNED: 0 }), [sortedSheep, settings?.pinnedSheepIds]);

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
    const handleToolbarClick = () => {
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
                    className="dock-child dock-toolbar"
                    onClick={handleToolbarClick}
                >
                    {/* Inner wrapper: functional when Open, pass-through when Collapsed */}
                    <div style={{
                        display: 'contents',
                        pointerEvents: isCollapsed ? 'none' : 'auto'
                    }} onClick={(e) => !isCollapsed && e.stopPropagation()}>

                        {isSelectionMode ? (
                            // --- SELECTION TOOLBAR (same chip style as standard) ---
                            <>
                                <span className="dock-toolbar-label">已選取 {selectedIds.size}</span>

                                <div className="dock-toolbar-search-wrap">
                                    <input
                                        type="text"
                                        className="dock-toolbar-search-input"
                                        placeholder="搜尋..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{ width: searchTerm ? '120px' : '80px' }}
                                    />
                                    <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
                                </div>

                                <button
                                    type="button"
                                    className="dock-toolbar-action-btn dock-toolbar-action-btn--delete btn-destructive"
                                    onClick={handleDeleteSelected}
                                    disabled={selectedIds.size === 0}
                                >
                                    <Trash2 size={14} strokeWidth={2.5} />
                                    刪除
                                </button>

                                <button
                                    type="button"
                                    className="dock-toolbar-action-btn dock-toolbar-action-btn--reset"
                                    onClick={handleResetSelected}
                                    disabled={selectedIds.size === 0}
                                >
                                    <RotateCcw size={14} strokeWidth={2.5} />
                                    重置
                                </button>

                                <button
                                    type="button"
                                    className="dock-toolbar-action-btn dock-toolbar-action-btn--cancel"
                                    onClick={() => { setIsSelectionMode(false); setSelectedIds(new Set()); }}
                                >
                                    取消
                                </button>
                            </>
                        ) : (
                            // --- STANDARD TOOLBAR ---
                            <>
                                {/* 1. Add Button (rounded chip style like SheepListModal) */}
                                <button
                                    type="button"
                                    className="dock-toolbar-add-btn"
                                    onClick={() => setShowAddModal(true)}
                                    style={{ opacity: isCollapsed ? 0.6 : 1 }}
                                >
                                    <Plus size={18} strokeWidth={2.5} />
                                </button>

                                {/* 2. Search Bar */}
                                <div className="dock-toolbar-search-wrap" style={{ opacity: isCollapsed ? 0.6 : 1 }}>
                                    <input
                                        type="text"
                                        className="dock-toolbar-search-input"
                                        placeholder="搜尋..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{ width: searchTerm ? '120px' : '80px' }}
                                    />
                                    <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
                                </div>

                                {/* Divider */}
                                <div className="dock-toolbar-divider" />

                                {/* 3. Filters (chip style like SheepListModal) */}
                                {[
                                    { id: 'ALL', label: '全部' },
                                    { id: 'PINNED', label: '📌 釘選' },
                                    { id: 'HEALTHY', label: '健康' },
                                    { id: 'SICK', label: '生病' },
                                    { id: 'DEAD', label: '離世' }
                                ].map(f => (
                                    <button
                                        type="button"
                                        key={f.id}
                                        className={`dock-toolbar-chip ${filterStatus === f.id ? 'dock-toolbar-chip--selected' : ''}`}
                                        onClick={() => setFilterStatus(f.id)}
                                        style={{ opacity: isCollapsed ? 0.6 : 1 }}
                                    >
                                        {f.label} {counts[f.id]}
                                    </button>
                                ))}

                                {/* 4. Select Button */}
                                <button
                                    type="button"
                                    className={`dock-toolbar-select-btn ${isSelectionMode ? 'dock-toolbar-select-btn--active' : ''}`}
                                    onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedIds(new Set()); }}
                                    style={{ opacity: isCollapsed ? 0.6 : 1 }}
                                >
                                    {isSelectionMode ? '取消' : '選取'}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Collapsible Content Area */}
                <div
                    className="list-content-wrapper"
                    style={{
                        // FIX: Responsive height constraint (Short Cards)
                        // clamp(MIN, VAL, MAX) -> Reduced to be much more compact
                        height: isCollapsed ? '0px' : 'clamp(180px, 25vh, 260px)',
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
                        gap: '12px', // Slightly reduced gap
                        padding: '10px 16px 20px 16px', // Adjusted padding
                        overflowX: 'auto',
                        overflowY: 'hidden',
                        scrollBehavior: 'smooth',
                        pointerEvents: 'auto',
                        height: '100%' // Ensure it fills the wrapper
                    }}>
                        {filteredSheep.map(s => (
                            <div key={s.id} style={{
                                // Adjusted Width: Narrower for mobile as requested
                                /* Wider so tag text (e.g. 新朋友) fits without overflow */
                                minWidth: 'clamp(100px, 26vw, 150px)',
                                height: '100%',
                                paddingBottom: '5px',
                                pointerEvents: 'auto'
                            }}>
                                <SheepCard
                                    s={s}
                                    isSelectionMode={isSelectionMode}
                                    isSelected={selectedIds.has(s.id)}
                                    // Pass Favorite Props
                                    isPinned={settings?.pinnedSheepIds?.includes(s.id)}
                                    onTogglePin={() => togglePin && togglePin(s.id)}
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

                {/* Batch Action Bar REMOVED - Integrated into Toolbar */}

                {/* Add Modal Overlay (Now managed here) */}
                {showAddModal && (
                    <div className="dock-child" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 3000, pointerEvents: 'auto' }}>
                        <AddSheepModal
                            onConfirm={handleConfirmAdd}
                            onCancel={() => setShowAddModal(false)}
                        />
                    </div>
                )}

                {/* Edit Modal Overlay */}
                {editingSheep && (
                    <div className="dock-child" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 3000, pointerEvents: 'auto' }}>
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
