import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useGame } from '../context/GameContext';
import { useConfirm } from '../context/ConfirmContext';
import { isSleeping, getAwakeningProgress } from '../utils/gameLogic';
import { AssetSheep } from './AssetSheep';
import { AddSheepModal } from './AddSheepModal';
import { TagManagerModal } from './TagManagerModal';
import { Plus, Trash2, RotateCcw, CheckSquare, SlidersHorizontal } from 'lucide-react';
import '../styles/design-tokens.css';
import './SheepList.css';

const FilterSettingsMenu = ({ filters, hiddenFilterIds, onToggle, onManageTags, onClose, anchorRef }) => {
    const menuRef = useRef(null);
    const scrollRef = useRef(null);
    const [position, setPosition] = useState({ bottom: 0, right: 0 });
    const [showFadeOverlay, setShowFadeOverlay] = useState(false);

    const checkScrollState = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        const { scrollHeight, clientHeight, scrollTop } = el;
        const hasOverflow = scrollHeight > clientHeight;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 2;
        setShowFadeOverlay(hasOverflow && !isAtBottom);
    }, []);

    useEffect(() => {
        const id = requestAnimationFrame(() => checkScrollState());
        return () => cancelAnimationFrame(id);
    }, [checkScrollState, filters]);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const ro = new ResizeObserver(() => requestAnimationFrame(checkScrollState));
        ro.observe(el);
        return () => ro.disconnect();
    }, [checkScrollState]);

    useEffect(() => {
        const updatePosition = () => {
            if (anchorRef?.current) {
                const rect = anchorRef.current.getBoundingClientRect();
                setPosition({
                    bottom: window.innerHeight - rect.top + 8,
                    right: window.innerWidth - rect.right
                });
            }
        };
        updatePosition();
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);
        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [anchorRef]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target) && anchorRef?.current && !anchorRef.current.contains(e.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose, anchorRef]);

    return ReactDOM.createPortal(
        <div
            ref={menuRef}
            className="filter-settings-menu"
            style={{
                position: 'fixed',
                bottom: position.bottom,
                right: position.right,
                minWidth: '200px',
                maxHeight: '280px',
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--card-inner-bg, #fff)',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                border: '1px solid var(--border-subtle, rgba(0,0,0,0.1))',
                zIndex: 2500
            }}
        >
            <div style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <div
                    ref={scrollRef}
                    onScroll={checkScrollState}
                    style={{ padding: '12px 12px 0', flex: 1, minHeight: 0, overflowY: 'auto' }}
                >
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '10px', color: '#666' }}>顯示篩選</div>
                {filters.map((f) => {
                    const isHidden = hiddenFilterIds.has(f.id);
                    return (
                        <label
                            key={f.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '6px 0',
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={!isHidden}
                                onChange={() => onToggle(f.id)}
                            />
                            {f.color ? (
                                <span
                                    style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: 4,
                                        background: f.color
                                    }}
                                />
                            ) : null}
                            <span>{f.label}</span>
                        </label>
                    );
                })}
                </div>
                {showFadeOverlay && (
                    <div
                        aria-hidden
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: 45,
                            background: 'linear-gradient(to top, var(--card-inner-bg, #fff) 0%, transparent 100%)',
                            pointerEvents: 'none',
                            transition: 'opacity 0.2s ease'
                        }}
                    />
                )}
            </div>
            <div style={{ borderTop: '1px solid rgba(0,0,0,0.1)', padding: '12px', flexShrink: 0 }}>
                <button
                    type="button"
                    className="modal-btn-secondary"
                    onClick={onManageTags}
                    style={{ width: '100%', fontSize: '0.85rem', padding: '8px 12px' }}
                >
                    管理標籤
                </button>
            </div>
        </div>,
        document.body
    );
};

// --- Card Component (tag design aligned with SheepListModal.tsx) ---
const useLongPress = (onLongPress, onClick, { shouldPreventDefault = true, delay = 500 } = {}) => {
    const [longPressTriggered, setLongPressTriggered] = useState(false);
    const timeout = React.useRef();
    const target = React.useRef();
    const isMoved = React.useRef(false); // Track if movement occurred
    const isTouch = React.useRef(false); // Track if interaction is touch-based

    const start = React.useCallback(
        (event) => {
            // Prevent default context menu on touch devices immediately if needed
            // But we might want some default behavior, usually touch-action: manipulation handles it.
            if (shouldPreventDefault && event.target) {
                target.current = event.target;
            }
            isMoved.current = false; // Reset movement flag
            setLongPressTriggered(false);
            timeout.current = setTimeout(() => {
                onLongPress(event);
                setLongPressTriggered(true);
            }, delay);
        },
        [onLongPress, delay, shouldPreventDefault]
    );

    const clear = React.useCallback(
        (event, shouldTriggerClick = true) => {
            timeout.current && clearTimeout(timeout.current);
            // Click should ONLY trigger if NO long press happened AND NO movement occurred
            if (shouldTriggerClick && !longPressTriggered && !isMoved.current && onClick) {
                onClick(event);
            }
            setLongPressTriggered(false);
            target.current = undefined;
        },
        [longPressTriggered, onClick]
    );

    return {
        onMouseDown: (e) => {
            if (isTouch.current) return;
            start(e);
        },
        onTouchStart: (e) => {
            isTouch.current = true;
            start(e);
        },
        onMouseUp: (e) => {
            if (isTouch.current) return;
            clear(e);
        },
        onMouseLeave: (e) => {
            if (isTouch.current) return;
            clear(e, false);
        },
        onTouchMove: (e) => {
            isMoved.current = true; // Mark as moved
            clear(e, false);
        },
        onTouchEnd: (e) => clear(e) // Trigger click if isMoved is false
    };
};

const SheepCard = ({ s, isSelectionMode, isSelected, onSelect, onToggleSelect, isSleepingState, isSick, isPinned, onTogglePin, onLongPress, tags = [], tagAssignmentsBySheep = {} }) => {
    const assigned = (tagAssignmentsBySheep[s.id] || []);
    const firstTagId = assigned.length > 0 ? assigned[0].tagId : null;
    const firstTag = firstTagId ? tags.find(t => t.id === firstTagId) : null;
    const tagVariant = firstTag ? 'custom' : (isSleepingState ? 'dead' : (isSick ? 'sick' : 'healthy'));
    const tagLabel = firstTag ? firstTag.name : (isSleepingState ? '已沉睡' : (isSick ? '生病' : '健康'));
    const healthFull = Math.ceil(s.health || 0) >= 100;

    // Interaction Logic
    const handleCardClick = () => {
        if (isSelectionMode) onToggleSelect(s.id);
        else onSelect(s);
    };

    const handleCardLongPress = () => {
        if (onLongPress) onLongPress(s.id);
    };

    // Use the hook
    const longPressEventHandlers = useLongPress(handleCardLongPress, handleCardClick, { delay: 500 });

    return (
        <div
            className={`sheep-card ${isSelectionMode && isSelected ? 'selected' : ''} ${isSelectionMode ? 'sheep-card--select-mode' : ''}`}
            {...longPressEventHandlers}
            style={{ touchAction: 'manipulation', userSelect: 'none' }} // 'manipulation' allows scroll but blocks double-tap zoom
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
                <div
                    className={`sheep-card-tag sheep-card-tag--${tagVariant}`}
                    style={firstTag ? { background: firstTag.color || '#6b7280', color: '#fff' } : undefined}
                >
                    {tagLabel}
                </div>
                <div className="sheep-card-header-actions">
                    {!isSelectionMode && onTogglePin && (
                        <button
                            type="button"
                            className="pin-btn"
                            onClick={(e) => {
                                e.stopPropagation(); // Standard click stop propagation is enough here
                                onTogglePin(s.id);
                            }}
                            // MouseDown/TouchStart here should NOT trigger the card's long press
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
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
                <div className="sheep-card-avatar-inner">
                    <AssetSheep
                        status={s.status}
                        visual={s.visual}
                        health={s.health}
                        type={s.type}
                        scale={0.55}
                        direction={1}
                        centered={true}
                        showStatusIcon={false}
                    />
                </div>
            </div>

            <div className="sheep-card-footer">
                <div className="sheep-card-name">{s.name}</div>
                {!isSelectionMode && (
                    <div className={`sheep-card-pray ${isSleepingState ? 'sheep-card-pray--dead' : ''}`}>
                        {isSleepingState ? `🕯️ 喚醒禱告 ${getAwakeningProgress(s)}/5` : `🙏 禱告 ${s.prayedCount || 0}/3`}
                    </div>
                )}
            </div>
        </div >
    );
};

// --- Main List Component ---
export const SheepList = ({ onSelect }) => {
    const { sheep, deleteMultipleSheep, updateSheep, adoptSheep, updateMultipleSheep, settings, togglePin, tags, tagAssignmentsBySheep, updateSetting } = useGame();
    const confirm = useConfirm();
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
    const [showAddModal, setShowAddModal] = useState(false);
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [showTagManagerModal, setShowTagManagerModal] = useState(false);
    const hiddenFilterIds = useMemo(() => new Set(settings?.hiddenFilters || []), [settings?.hiddenFilters]);
    const filterMenuAnchorRef = useRef(null);

    // Collapsible State (Default Open)
    const [isCollapsed, setIsCollapsed] = useState(false);

    const toggleFilterVisibility = (filterId) => {
        const next = new Set(hiddenFilterIds);
        if (next.has(filterId)) next.delete(filterId);
        else next.add(filterId);
        updateSetting('hiddenFilters', Array.from(next));
    };

    const effectiveFilterStatus = hiddenFilterIds.has(filterStatus) ? 'ALL' : filterStatus;

    const TAG_FILTER_PREFIX = 'TAG:';

    const filteredSheep = useMemo(() => sortedSheep.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
        const isSleepingState = isSleeping(s);
        const isSick = s.status === 'sick';
        const isPinned = settings?.pinnedSheepIds?.includes(s.id);

        if (!matchesSearch) return false;
        if (effectiveFilterStatus === 'SLEEPING') return isSleepingState;
        if (effectiveFilterStatus === 'SICK') return isSick;
        if (effectiveFilterStatus === 'HEALTHY') return !isSleepingState && !isSick;
        if (effectiveFilterStatus === 'PINNED') return isPinned;
        if (effectiveFilterStatus.startsWith(TAG_FILTER_PREFIX)) {
            const tagId = effectiveFilterStatus.slice(TAG_FILTER_PREFIX.length);
            const assigned = tagAssignmentsBySheep[s.id] || [];
            return assigned.some(a => a.tagId === tagId);
        }
        return true;
    }), [sortedSheep, searchTerm, effectiveFilterStatus, settings?.pinnedSheepIds, tagAssignmentsBySheep]);

    const counts = useMemo(() => {
        const acc = { ALL: sortedSheep.length, HEALTHY: 0, SICK: 0, SLEEPING: 0, PINNED: 0 };
        (tags || []).forEach(t => { acc[`${TAG_FILTER_PREFIX}${t.id}`] = 0; });
        sortedSheep.forEach(s => {
            const isSleepingState = isSleeping(s);
            const isSick = s.status === 'sick';
            const isPinned = settings?.pinnedSheepIds?.includes(s.id);
            if (isSleepingState) acc.SLEEPING++;
            else if (isSick) acc.SICK++;
            else acc.HEALTHY++;
            if (isPinned) acc.PINNED++;
            (tagAssignmentsBySheep[s.id] || []).forEach(a => {
                const key = `${TAG_FILTER_PREFIX}${a.tagId}`;
                if (acc[key] !== undefined) acc[key]++;
            });
        });
        return acc;
    }, [sortedSheep, settings?.pinnedSheepIds, tags, tagAssignmentsBySheep]);

    const toggleSelection = (id) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleLongPress = (id) => {
        if (!isSelectionMode) {
            setIsSelectionMode(true);
            setSelectedIds(new Set([id]));
            // Trigger haptic feedback if available (optional)
            if (navigator.vibrate) navigator.vibrate(50);
        } else {
            // If already in selection mode, long press behaves like a toggle (or ignore)
            // Let's make it toggle for consistency
            toggleSelection(id);
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.size === 0) return;
        const n = selectedIds.size;
        const ok = await confirm({
            title: '刪除小羊',
            message: `確定要刪除這 ${n} 隻小羊嗎？`,
            warning: '此操作無法復原。',
            variant: 'danger',
            confirmLabel: '刪除'
        });
        if (!ok) return;
        deleteMultipleSheep(Array.from(selectedIds));
        setIsSelectionMode(false);
        setSelectedIds(new Set());
    };

    const handleResetSelected = async () => {
        if (selectedIds.size === 0) return;
        const n = selectedIds.size;
        const ok = await confirm({
            title: '重置狀態',
            message: `確定要將這 ${n} 隻小羊重置為「健康 (100%)」嗎？`,
            variant: 'default'
        });
        if (!ok) return;
        updateMultipleSheep(Array.from(selectedIds), {
            health: 100,
            status: 'healthy',
            careLevel: 0,
            resurrectionProgress: 0,
            awakeningProgress: 0,
            lastPrayedDate: null,
            prayedCount: 0
        });
        setIsSelectionMode(false);
        setSelectedIds(new Set());
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
                                    className="dock-toolbar-action-btn"
                                    onClick={() => {
                                        if (selectedIds.size === sortedSheep.length) {
                                            setSelectedIds(new Set());
                                        } else {
                                            setSelectedIds(new Set(sortedSheep.map(s => s.id)));
                                        }
                                    }}
                                    style={{
                                        background: selectedIds.size === sortedSheep.length && sortedSheep.length > 0 ? 'var(--palette-blue-action)' : 'rgba(255, 255, 255, 0.9)',
                                        color: selectedIds.size === sortedSheep.length && sortedSheep.length > 0 ? 'white' : 'var(--palette-sheep-brown)',
                                        borderColor: selectedIds.size === sortedSheep.length && sortedSheep.length > 0 ? 'transparent' : 'var(--palette-sheep-brown)'
                                    }}
                                >
                                    <CheckSquare size={14} strokeWidth={2.5} />
                                    {selectedIds.size === sortedSheep.length && sortedSheep.length > 0 ? '取消全選' : '全選'}
                                </button>

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

                                {/* 3. Filters (chip style) */}
                                {[
                                    { id: 'ALL', label: '全部' },
                                    { id: 'PINNED', label: '📌釘選' },
                                    { id: 'HEALTHY', label: '健康' },
                                    { id: 'SICK', label: '生病' },
                                    { id: 'SLEEPING', label: '沉睡' },
                                    ...(tags || []).map(t => ({ id: `${TAG_FILTER_PREFIX}${t.id}`, label: t.name, color: t.color }))
                                ]
                                    .filter(f => !hiddenFilterIds.has(f.id))
                                    .map(f => (
                                    <button
                                        type="button"
                                        key={f.id}
                                        className={`dock-toolbar-chip ${effectiveFilterStatus === f.id ? 'dock-toolbar-chip--selected' : ''}`}
                                        onClick={() => setFilterStatus(f.id)}
                                        style={{
                                            opacity: isCollapsed ? 0.6 : 1,
                                            ...(f.color && effectiveFilterStatus === f.id && { borderColor: f.color, color: '#fff', background: f.color })
                                        }}
                                    >
                                        {f.label} {counts[f.id] ?? 0}
                                    </button>
                                ))}

                                {/* 4. Filter Settings */}
                                <div style={{ position: 'relative', display: 'inline-flex' }} ref={filterMenuAnchorRef}>
                                    <button
                                        type="button"
                                        className={`dock-toolbar-chip dock-toolbar-chip--settings ${showFilterMenu ? 'dock-toolbar-chip--selected' : ''}`}
                                        onClick={() => setShowFilterMenu(prev => !prev)}
                                        style={{ opacity: isCollapsed ? 0.6 : 1 }}
                                        title="篩選設定"
                                        aria-label="篩選設定"
                                    >
                                        <SlidersHorizontal size={14} strokeWidth={2.5} />
                                        <span>篩選設定</span>
                                    </button>
                                    {showFilterMenu && (
                                        <FilterSettingsMenu
                                            filters={[
                                                { id: 'ALL', label: '全部' },
                                                { id: 'PINNED', label: '📌釘選' },
                                                { id: 'HEALTHY', label: '健康' },
                                                { id: 'SICK', label: '生病' },
                                                { id: 'SLEEPING', label: '沉睡' },
                                                ...(tags || []).map(t => ({ id: `${TAG_FILTER_PREFIX}${t.id}`, label: t.name, color: t.color }))
                                            ]}
                                            hiddenFilterIds={hiddenFilterIds}
                                            onToggle={toggleFilterVisibility}
                                            onManageTags={() => {
                                                setShowFilterMenu(false);
                                                setShowTagManagerModal(true);
                                            }}
                                            onClose={() => setShowFilterMenu(false)}
                                            anchorRef={filterMenuAnchorRef}
                                        />
                                    )}
                                </div>

                                {/* 5. Select Button */}
                                <button
                                    type="button"
                                    className={`dock-toolbar-select-btn ${isSelectionMode ? 'dock-toolbar-select-btn--active' : ''}`}
                                    onClick={() => {
                                        setIsSelectionMode(!isSelectionMode);
                                        setSelectedIds(new Set());
                                        setFilterStatus('ALL');
                                    }}
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
                        padding: '10px 16px 12px 16px', // Adjusted padding
                        overflowX: 'auto',
                        overflowY: 'hidden',
                        scrollBehavior: 'smooth',
                        pointerEvents: 'auto',
                        height: '100%' // Ensure it fills the wrapper
                    }}>
                        {filteredSheep.map(s => (
                            <div key={s.id} style={{
                                width: 'max-content',
                                minWidth: 'max-content',
                                height: '100%',
                                paddingBottom: '5px',
                                pointerEvents: 'auto'
                            }}>
                                <SheepCard
                                    s={s}
                                    isSelectionMode={isSelectionMode}
                                    isSelected={selectedIds.has(s.id)}
                                    isPinned={settings?.pinnedSheepIds?.includes(s.id)}
                                    onTogglePin={() => togglePin && togglePin(s.id)}
                                    onSelect={(sheep) => { if (onSelect) onSelect(sheep); }}
                                    onToggleSelect={toggleSelection}
                                    onLongPress={handleLongPress}
                                    isSleepingState={isSleeping(s)}
                                    isSick={s.status === 'sick'}
                                    tags={tags}
                                    tagAssignmentsBySheep={tagAssignmentsBySheep}
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

                {/* Tag Manager Modal (from filter settings) */}
                {showTagManagerModal && (
                    <div className="dock-child" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 3000, pointerEvents: 'auto' }}>
                        <TagManagerModal onClose={() => setShowTagManagerModal(false)} />
                    </div>
                )}
            </div>
        </>
    );
};
