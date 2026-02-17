import React from 'react';
import { Plus, Search, CheckSquare, Trash2, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';
import { CloseButton } from '../ui/CloseButton';
import { FilterSettingsMenu } from './FilterSettingsMenu';

export const SheepListToolbar = ({
    isSelectionMode,
    selectedIds,
    setSelectedIds,
    setIsSelectionMode,
    searchTerm,
    setSearchTerm,
    isSearchExpanded,
    setIsSearchExpanded,
    searchWrapRef,
    searchInputRef,
    handleDeleteSelected,
    handleResetSelected,
    setShowAddModal,
    isCollapsed,
    handleToolbarClick,
    sortedSheep,
    tags,
    TAG_FILTER_PREFIX,
    hiddenFilterIds,
    filterStatus,
    setFilterStatus,
    counts,
    showFilterMenu,
    setShowFilterMenu,
    filterMenuAnchorRef,
    toggleFilterVisibility,
    setShowTagManagerModal,
    effectiveFilterStatus
}) => {
    return (
        <div
            className={`dock-child dock-toolbar ${isSearchExpanded ? 'dock-toolbar--search-expanded' : ''}`}
            onClick={handleToolbarClick}
        >
            <div style={{
                display: 'contents',
                pointerEvents: isCollapsed ? 'none' : 'auto'
            }} onClick={(e) => !isCollapsed && e.stopPropagation()}>

                {isSelectionMode ? (
                    <>
                        <span className="dock-toolbar-label">已選取 {selectedIds.size}</span>

                        <div
                            ref={searchWrapRef}
                            className={`dock-toolbar-search-wrap ${isSearchExpanded ? 'dock-toolbar-search-wrap--expanded' : ''}`}
                        >
                            <input
                                ref={searchInputRef}
                                type="text"
                                className="dock-toolbar-search-input"
                                placeholder="搜尋..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onFocus={() => setIsSearchExpanded(true)}
                            />
                            {isSearchExpanded && (
                                <CloseButton
                                    className="dock-toolbar-search-clear"
                                    ariaLabel="清除並收起搜尋"
                                    variant="sm"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setIsSearchExpanded(false);
                                        searchInputRef.current?.blur();
                                    }}
                                />
                            )}
                            <span className="dock-toolbar-search-icon" aria-hidden="true">
                                <Search size={16} strokeWidth={2.5} />
                            </span>
                        </div>

                        <Tooltip content={selectedIds.size === sortedSheep.length && sortedSheep.length > 0 ? '取消全選' : '全選'} side="bottom">
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
                        </Tooltip>

                        <Tooltip content="刪除所選小羊" side="bottom">
                            <button
                                type="button"
                                className="dock-toolbar-action-btn dock-toolbar-action-btn--delete btn-destructive"
                                onClick={handleDeleteSelected}
                                disabled={selectedIds.size === 0}
                            >
                                <Trash2 size={14} strokeWidth={2.5} />
                                刪除
                            </button>
                        </Tooltip>

                        <Tooltip content="重置所選小羊的禱告次數" side="bottom">
                            <button
                                type="button"
                                className="dock-toolbar-action-btn dock-toolbar-action-btn--reset"
                                onClick={handleResetSelected}
                                disabled={selectedIds.size === 0}
                            >
                                <RotateCcw size={14} strokeWidth={2.5} />
                                重置
                            </button>
                        </Tooltip>

                        <Tooltip content="取消選取" side="bottom">
                            <button
                                type="button"
                                className="dock-toolbar-action-btn dock-toolbar-action-btn--cancel"
                                onClick={() => { setIsSelectionMode(false); setSelectedIds(new Set()); }}
                            >
                                取消
                            </button>
                        </Tooltip>
                    </>
                ) : (
                    <>
                        <Tooltip content="新增小羊" side="bottom">
                            <button
                                type="button"
                                className="dock-toolbar-add-btn"
                                onClick={() => setShowAddModal(true)}
                                style={{ opacity: isCollapsed ? 0.6 : 1 }}
                            >
                                <Plus size={18} strokeWidth={2.5} />
                            </button>
                        </Tooltip>

                        <div
                            ref={searchWrapRef}
                            className={`dock-toolbar-search-wrap ${isSearchExpanded ? 'dock-toolbar-search-wrap--expanded' : ''}`}
                            style={{ opacity: isCollapsed ? 0.6 : 1 }}
                        >
                            <input
                                ref={searchInputRef}
                                type="text"
                                className="dock-toolbar-search-input"
                                placeholder="搜尋..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onFocus={() => setIsSearchExpanded(true)}
                            />
                            {isSearchExpanded && (
                                <CloseButton
                                    className="dock-toolbar-search-clear"
                                    ariaLabel="清除並收起搜尋"
                                    variant="sm"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setIsSearchExpanded(false);
                                        searchInputRef.current?.blur();
                                    }}
                                />
                            )}
                            <span className="dock-toolbar-search-icon" aria-hidden="true">
                                <Search size={16} strokeWidth={2.5} />
                            </span>
                        </div>

                        <div className="dock-toolbar-divider" />

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
                                        ...(f.color && effectiveFilterStatus === f.id && { borderColor: f.color, color: 'var(--text-inverse)', background: f.color })
                                    }}
                                >
                                    {f.label} {counts[f.id] ?? 0}
                                </button>
                            ))}

                        <div style={{ position: 'relative', display: 'inline-flex' }} ref={filterMenuAnchorRef}>
                            <Tooltip content="篩選設定" side="bottom">
                                <button
                                    type="button"
                                    className={`dock-toolbar-chip dock-toolbar-chip--settings ${showFilterMenu ? 'dock-toolbar-chip--selected' : ''}`}
                                    onClick={() => setShowFilterMenu(prev => !prev)}
                                    style={{ opacity: isCollapsed ? 0.6 : 1 }}
                                    aria-label="篩選設定"
                                >
                                    <SlidersHorizontal size={14} strokeWidth={2.5} />
                                    <span>篩選設定</span>
                                </button>
                            </Tooltip>
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

                        <Tooltip content={isSelectionMode ? '取消選取模式' : '選取小羊'} side="bottom">
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
                        </Tooltip>
                    </>
                )}
            </div>
        </div>
    );
};
