import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useGameState, useGameActions, useUserAuth } from '../../context/GameContext/useGame';
import { useConfirm } from '../../context/ConfirmContext.jsx';
import { isSleeping } from '../../utils/gameLogic';
import { AddSheepModal } from '../modals/AddSheepModal';
import { TagManagerModal } from '../modals/TagManagerModal';
import { SheepCard } from './SheepCard';
import { SheepListToolbar } from './SheepListToolbar';
import '../../styles/design-tokens.css';
import './SheepList.css';
import { SheepListTextView } from './SheepListTextView';


const TAG_FILTER_PREFIX = 'TAG:';

export const SheepList = ({ onSelect }) => {
    const {
        sheep,
        tags,
        tagAssignmentsBySheep,
        focusedSheepId
    } = useGameState();

    const {
        deleteMultipleSheep,
        updateSheep,
        adoptSheep,
        updateMultipleSheep,
        togglePin,
        findSheep,
        updateSetting
    } = useGameActions();

    const { settings } = useUserAuth();
    const confirm = useConfirm();

    // State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [editingSheep, setEditingSheep] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [showTagManagerModal, setShowTagManagerModal] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [pinFlashId, setPinFlashId] = useState(null);
    const [unpinPlaceholder, setUnpinPlaceholder] = useState(null);

    // Refs
    const filterMenuAnchorRef = useRef(null);
    const searchWrapRef = useRef(null);
    const searchInputRef = useRef(null);
    const scrollAreaRef = useRef(null);
    const cardRefs = useRef({});
    const lastPinActionRef = useRef(null);
    const pendingPinIdRef = useRef(null);
    const pinFlashTimeoutRef = useRef(null);
    const pinHighlightTimeoutRef = useRef(null);

    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pinnedSet = useMemo(() => new Set(settings?.pinnedSheepIds || []), [settings?.pinnedSheepIds]);
    const hiddenFilterIds = useMemo(() => new Set(settings?.hiddenFilters || []), [settings?.hiddenFilters]);

    // Derived Data
    const sortedSheep = useMemo(() => {
        return [...(sheep || [])].sort((a, b) => {
            const aPinned = pinnedSet.has(a.id);
            const bPinned = pinnedSet.has(b.id);
            if (aPinned !== bPinned) return aPinned ? -1 : 1;
            return a.id - b.id;
        });
    }, [sheep, pinnedSet]);

    const effectiveFilterStatus = hiddenFilterIds.has(filterStatus) ? 'ALL' : filterStatus;

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

    // Effects
    useEffect(() => {
        if (focusedSheepId) {
            setIsCollapsed(true);
        }
    }, [focusedSheepId]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!searchWrapRef.current) return;
            if (!searchWrapRef.current.contains(e.target)) {
                setIsSearchExpanded(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const pendingId = pendingPinIdRef.current;
        if (!pendingId || lastPinActionRef.current !== 'pin') return;
        const scrollEl = scrollAreaRef.current;
        const cardEl = cardRefs.current[pendingId];
        if (!scrollEl || !cardEl) return;

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const cardRect = cardEl.getBoundingClientRect();
                const scrollRect = scrollEl.getBoundingClientRect();
                const cardCenter = cardRect.left - scrollRect.left + scrollEl.scrollLeft + cardRect.width / 2;
                const scrollCenter = scrollEl.clientWidth / 2;
                scrollEl.scrollTo({ left: cardCenter - scrollCenter, behavior: prefersReducedMotion ? 'auto' : 'smooth' });

                if (pinHighlightTimeoutRef.current) clearTimeout(pinHighlightTimeoutRef.current);
                pinHighlightTimeoutRef.current = setTimeout(() => {
                    pendingPinIdRef.current = null;
                    setPinFlashId(pendingId);
                    if (pinFlashTimeoutRef.current) clearTimeout(pinFlashTimeoutRef.current);
                    pinFlashTimeoutRef.current = setTimeout(() => {
                        setPinFlashId(null);
                        pinFlashTimeoutRef.current = null;
                    }, 400);
                    pinHighlightTimeoutRef.current = null;
                }, prefersReducedMotion ? 0 : 300);
                lastPinActionRef.current = null;
            });
        });
    }, [filteredSheep, prefersReducedMotion]);

    // Handlers
    const toggleFilterVisibility = (filterId) => {
        const next = new Set(hiddenFilterIds);
        if (next.has(filterId)) next.delete(filterId);
        else next.add(filterId);
        updateSetting('hiddenFilters', Array.from(next));
    };

    const handleTogglePin = useCallback((id) => {
        if (!togglePin) return;
        const wasPinned = settings?.pinnedSheepIds?.includes(id);
        const idx = filteredSheep.findIndex((s) => s.id === id);
        const wrapperEl = cardRefs.current[id];

        if (wasPinned && idx >= 0 && wrapperEl && !prefersReducedMotion) {
            const width = wrapperEl.offsetWidth + 12;
            togglePin(id);
            lastPinActionRef.current = 'unpin';
            setUnpinPlaceholder({ index: idx, width, id });
            setPinFlashId(id);
            if (pinFlashTimeoutRef.current) clearTimeout(pinFlashTimeoutRef.current);
            pinFlashTimeoutRef.current = setTimeout(() => {
                setPinFlashId(null);
                setUnpinPlaceholder(null);
                pinFlashTimeoutRef.current = null;
            }, 320);
        } else {
            togglePin(id);
            lastPinActionRef.current = 'pin';
            pendingPinIdRef.current = id;
        }
    }, [togglePin, settings?.pinnedSheepIds, filteredSheep, prefersReducedMotion]);

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
            if (navigator.vibrate) navigator.vibrate(50);
        } else {
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
            message: `確定要將這 ${n} 隻小羊重置為「健康」嗎？`,
            variant: 'default'
        });
        if (!ok) return;
        updateMultipleSheep(Array.from(selectedIds), {
            health: 60,
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
        if (Array.isArray(data)) {
            data.forEach(item => adoptSheep(item));
        } else {
            adoptSheep(data);
        }
        setShowAddModal(false);
    };

    const handleToolbarClick = () => {
        if (isCollapsed) setIsCollapsed(false);
        else setIsCollapsed(true);
    };

    const handleOverlayClick = (e) => {
        e.stopPropagation();
        setIsCollapsed(true);
    };

    return (
        <>
            {!isCollapsed && (
                <div
                    className="drawer-overlay"
                    onClick={handleOverlayClick}
                    style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        zIndex: 'calc(var(--z-dock-layer) - 100)',
                        background: 'transparent',
                        cursor: 'default',
                        touchAction: 'none'
                    }}
                />
            )}

            <div className="sheep-list-container" style={{
                position: 'absolute', bottom: 0, left: 0, width: '100vw',
                height: 'auto',
                zIndex: 'var(--z-dock-layer)',
                display: 'flex', flexDirection: 'column',
                pointerEvents: 'none',
                transition: 'transform 0.3s ease, height 0.3s ease'
            }}>
                <style>{`
                    .sheep-dock-scroll::-webkit-scrollbar { display: none; }
                    .list-content-wrapper {
                        transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
                        overflow: hidden;
                    }
                `}</style>

                <div className="sheep-dock-group">
                    <SheepListToolbar
                        isSelectionMode={isSelectionMode}
                        selectedIds={selectedIds}
                        setSelectedIds={setSelectedIds}
                        setIsSelectionMode={setIsSelectionMode}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        isSearchExpanded={isSearchExpanded}
                        setIsSearchExpanded={setIsSearchExpanded}
                        searchWrapRef={searchWrapRef}
                        searchInputRef={searchInputRef}
                        handleDeleteSelected={handleDeleteSelected}
                        handleResetSelected={handleResetSelected}
                        setShowAddModal={setShowAddModal}
                        isCollapsed={isCollapsed}
                        handleToolbarClick={handleToolbarClick}
                        sortedSheep={sortedSheep}
                        tags={tags}
                        TAG_FILTER_PREFIX={TAG_FILTER_PREFIX}
                        hiddenFilterIds={hiddenFilterIds}
                        filterStatus={filterStatus}
                        setFilterStatus={setFilterStatus}
                        counts={counts}
                        showFilterMenu={showFilterMenu}
                        setShowFilterMenu={setShowFilterMenu}
                        filterMenuAnchorRef={filterMenuAnchorRef}
                        toggleFilterVisibility={toggleFilterVisibility}
                        setShowTagManagerModal={setShowTagManagerModal}
                        effectiveFilterStatus={effectiveFilterStatus}
                    />

                    <div
                        className={`list-content-wrapper ${settings?.isSheepListExpanded ? 'list-content-wrapper--expanded' : ''}`}
                        style={{
                            height: isCollapsed ? '0px' : (settings?.isSheepListExpanded ? 'calc(100vh - 56px)' : 'clamp(180px, 25vh, 260px)'),
                            opacity: isCollapsed ? 0 : 1,
                            display: 'flex', flexDirection: 'column',
                            pointerEvents: isCollapsed ? 'none' : 'auto'
                        }}
                    >
                        {settings?.sheepListViewMode === 'text' ? (
                            <SheepListTextView
                                sheepList={filteredSheep}
                                selectedIds={selectedIds}
                                onSelect={(id) => {
                                    if (isSelectionMode) {
                                        toggleSelection(id);
                                    } else {
                                        const s = sheep.find(item => item.id === id);
                                        if (onSelect && s) onSelect(s);
                                    }
                                }}
                                isSelectionMode={isSelectionMode}
                            />
                        ) : (
                            <div
                                ref={scrollAreaRef}
                                className={`dock-scroll-area ${settings?.isSheepListExpanded ? 'dock-scroll-area--grid' : ''}`}
                                style={{
                                    flex: 1,
                                    display: settings?.isSheepListExpanded ? 'grid' : 'flex',
                                    gridTemplateColumns: settings?.isSheepListExpanded ? 'repeat(auto-fill, minmax(140px, 1fr))' : 'none',
                                    flexDirection: settings?.isSheepListExpanded ? 'unset' : 'row',
                                    flexWrap: settings?.isSheepListExpanded ? 'unset' : 'nowrap',
                                    alignItems: settings?.isSheepListExpanded ? 'start' : 'flex-end',
                                    justifyContent: settings?.isSheepListExpanded ? 'center' : 'flex-start',
                                    gap: settings?.isSheepListExpanded ? '16px' : '12px',
                                    padding: settings?.isSheepListExpanded ? '24px 16px' : '10px 16px 6px 16px',
                                    overflowX: settings?.isSheepListExpanded ? 'hidden' : 'auto',
                                    overflowY: settings?.isSheepListExpanded ? 'auto' : 'hidden',
                                    scrollBehavior: 'smooth',
                                    pointerEvents: 'auto',
                                    height: '100%'
                                }}
                            >
                                {filteredSheep.map((s, i) => {
                                    const items = [];
                                    const ph = unpinPlaceholder;
                                    if (ph && ph.index === i) {
                                        items.push(
                                            <div
                                                key={`placeholder-${ph.id}`}
                                                className="sheep-card-placeholder"
                                                style={{ '--ph-width': `${ph.width}px` }}
                                                aria-hidden="true"
                                            />
                                        );
                                    }
                                    items.push(
                                        <div
                                            key={s.id}
                                            ref={(el) => { if (el) cardRefs.current[s.id] = el; }}
                                            style={{
                                                width: settings?.isSheepListExpanded ? '100%' : 'max-content',
                                                minWidth: settings?.isSheepListExpanded ? 'unset' : 'max-content',
                                                height: settings?.isSheepListExpanded ? 'auto' : '100%',
                                                paddingBottom: '5px',
                                                pointerEvents: 'auto'
                                            }}
                                        >
                                            <SheepCard
                                                s={s}
                                                isSelectionMode={isSelectionMode}
                                                isSelected={selectedIds.has(s.id)}
                                                isPinned={settings?.pinnedSheepIds?.includes(s.id)}
                                                onTogglePin={handleTogglePin}
                                                pinFlashId={pinFlashId}
                                                onSelect={(sheep) => { if (onSelect) onSelect(sheep); }}
                                                onToggleSelect={toggleSelection}
                                                onLongPress={handleLongPress}
                                                isSleepingState={isSleeping(s)}
                                                isSick={s.status === 'sick'}
                                                tags={tags}
                                                tagAssignmentsBySheep={tagAssignmentsBySheep}
                                                onFind={findSheep}
                                            />
                                        </div>
                                    );
                                    return items;
                                })}
                                {settings?.sheepListViewMode === 'card' && unpinPlaceholder && unpinPlaceholder.index === filteredSheep.length && (
                                    <div
                                        key={`placeholder-${unpinPlaceholder.id}`}
                                        className="sheep-card-placeholder"
                                        style={{ '--ph-width': `${unpinPlaceholder.width}px` }}
                                        aria-hidden="true"
                                    />
                                )}
                                {filteredSheep.length === 0 && (
                                    <div style={{ color: 'rgba(0,0,0,0.5)', padding: '20px', fontWeight: 'bold' }}>沒有小羊...</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {showAddModal && (
                    <div className="dock-child" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 'var(--z-modal-base)', pointerEvents: 'auto' }}>
                        <AddSheepModal
                            onConfirm={handleConfirmAdd}
                            onCancel={() => setShowAddModal(false)}
                        />
                    </div>
                )}

                {editingSheep && (
                    <div className="dock-child" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 'var(--z-modal-base)', pointerEvents: 'auto' }}>
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

                {showTagManagerModal && (
                    <div className="dock-child" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 'var(--z-modal-base)', pointerEvents: 'auto' }}>
                        <TagManagerModal onClose={() => setShowTagManagerModal(false)} />
                    </div>
                )}
            </div>
        </>
    );
};

