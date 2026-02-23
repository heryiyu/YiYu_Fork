import React, { useState, useMemo } from 'react';
import { useGameState, useGameActions, useUserAuth } from '../../context/GameContext/useGame';
import { Settings, BookOpen, Calendar, Menu, User, Plus, LogOut, Trash2, RotateCcw, CheckSquare, X } from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';
import { useConfirm } from '../../context/ConfirmContext';
import { SheepListTextView } from '../game/SheepListTextView';
import { AddSheepModal } from '../modals/AddSheepModal';
import { TagManagerModal } from '../modals/TagManagerModal';
import { isSleeping } from '../../utils/gameLogic';
import { FilterSettingsMenu } from '../game/FilterSettingsMenu';
import { LiteSettingsPage } from '../../pages/LiteSettings/LiteSettingsPage';
import { LiteGuidePage } from '../../pages/LiteGuide/LiteGuidePage';
import { LiteSheepDetailPage } from '../../pages/LiteSheepDetail/LiteSheepDetailPage';
import { LiteSchedulePage } from '../../pages/LiteSchedule/LiteSchedulePage';
import './LiteAppLayout.css';

export const LiteAppLayout = ({
    onSelectSheep
}) => {
    const { sheep, tags, tagAssignmentsBySheep } = useGameState();
    const { settings, nickname } = useUserAuth();
    const { signOut, adoptSheep, deleteMultipleSheep, updateMultipleSheep } = useGameActions();
    const confirm = useConfirm();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showTagManagerModal, setShowTagManagerModal] = useState(false);

    // View Routing State: 'DASHBOARD' | 'SETTINGS' | 'GUIDE' | 'DETAIL' | 'SCHEDULE'
    const [activeView, setActiveView] = useState('DASHBOARD');

    // List Selection & Filter State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilterId, setActiveFilterId] = useState('ALL');

    // Muted filters
    const hiddenFilterIds = useMemo(() => new Set(settings?.hiddenFilters || []), [settings?.hiddenFilters]);

    // Calculate Dashboard Stats
    const stats = useMemo(() => {
        let healthy = 0, sick = 0, sleeping = 0;
        sheep.forEach(s => {
            if (isSleeping(s)) sleeping++;
            else if (s.status === 'sick') sick++;
            else healthy++;
        });
        return { total: sheep.length, healthy, sick, sleeping };
    }, [sheep]);

    // Apply Filters & Search
    const filteredSheep = useMemo(() => {
        return sheep.filter(s => {
            // Search
            if (searchTerm && !s.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;

            // Filters
            if (activeFilterId === 'SLEEPING') return isSleeping(s);
            if (activeFilterId === 'SICK') return s.status === 'sick';
            if (activeFilterId === 'HEALTHY') return (!isSleeping(s) && s.status !== 'sick');
            if (activeFilterId === 'PINNED') return settings?.pinnedSheepIds?.includes(s.id);
            if (activeFilterId.startsWith('TAG:')) {
                const tagId = activeFilterId.split(':')[1];
                const assignments = tagAssignmentsBySheep[s.id] || [];
                return assignments.some(a => a.tagId === tagId);
            }
            return true;
        }).sort((a, b) => {
            const aPinned = settings?.pinnedSheepIds?.includes(a.id);
            const bPinned = settings?.pinnedSheepIds?.includes(b.id);
            if (aPinned !== bPinned) return aPinned ? -1 : 1;
            return a.id - b.id;
        });
    }, [sheep, searchTerm, activeFilterId, settings?.pinnedSheepIds, tagAssignmentsBySheep]);

    const handleConfirmAdd = (data) => {
        if (Array.isArray(data)) {
            data.forEach(item => adoptSheep(item));
        } else {
            adoptSheep(data);
        }
        setShowAddModal(false);
    };

    const toggleSelection = (id) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleBatchDelete = async () => {
        if (selectedIds.size === 0) return;
        const ok = await confirm({
            title: '批量刪除小羊',
            message: `確定要刪除這 ${selectedIds.size} 隻小羊嗎？`,
            warning: '此操作無法復原。',
            variant: 'danger',
            confirmLabel: '刪除'
        });
        if (!ok) return;
        deleteMultipleSheep(Array.from(selectedIds));
        setSelectedIds(new Set());
        setIsSelectionMode(false);
    };

    const handleBatchReset = async () => {
        if (selectedIds.size === 0) return;
        const ok = await confirm({
            title: '批量重置小羊',
            message: `確定要將這 ${selectedIds.size} 隻小羊重置為健康狀態嗎？`,
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
        setSelectedIds(new Set());
        setIsSelectionMode(false);
    };

    const isAllSelected = filteredSheep.length > 0 && selectedIds.size === filteredSheep.length;

    const handleToggleAll = () => {
        if (isAllSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredSheep.map(s => s.id)));
        }
    };

    const handleSignOut = () => {
        if (window.confirm('確定要登出嗎？')) {
            signOut();
        }
    };

    return (
        <div className="lite-app-layout">
            <header className="lite-navbar">
                <div className="lite-nav-brand">
                    <span className="lite-logo">🐑</span>
                    <h2>認領禱告管理系統</h2>
                </div>

                <div className="lite-nav-actions">
                    <Tooltip content="新增小羊" side="bottom">
                        <button className="lite-nav-btn primary" onClick={() => setShowAddModal(true)}>
                            <Plus size={18} strokeWidth={2.5} />
                            <span className="btn-label">新增</span>
                        </button>
                    </Tooltip>

                    <nav className="lite-nav-menu is-desktop">
                        <button className="lite-nav-btn" onClick={() => setActiveView('SCHEDULE')} title="牧羊人週記">
                            <Calendar size={18} />
                        </button>
                        <button className="lite-nav-btn" onClick={() => setActiveView('GUIDE')} title="使用說明">
                            <BookOpen size={18} />
                        </button>
                        <button className="lite-nav-btn" onClick={() => setActiveView('SETTINGS')} title="系統設定">
                            <Settings size={18} />
                        </button>
                    </nav>

                    <div className="lite-nav-user">
                        <div className="lite-user-dropdown-trigger" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                            <User size={18} />
                            <span className="lite-user-name">{nickname}</span>
                        </div>
                        {isMenuOpen && (
                            <div className="lite-user-dropdown">
                                <button className="lite-dropdown-item is-mobile" onClick={() => { setActiveView('SCHEDULE'); setIsMenuOpen(false); }}>
                                    <Calendar size={16} /> 牧羊人週記
                                </button>
                                <button className="lite-dropdown-item is-mobile" onClick={() => { setActiveView('GUIDE'); setIsMenuOpen(false); }}>
                                    <BookOpen size={16} /> 使用說明
                                </button>
                                <button className="lite-dropdown-item is-mobile" onClick={() => { setActiveView('SETTINGS'); setIsMenuOpen(false); }}>
                                    <Settings size={16} /> 系統設定
                                </button>
                                <button className="lite-dropdown-item danger" onClick={handleSignOut}>
                                    <LogOut size={16} /> 登出
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="lite-main-content">
                {activeView === 'SETTINGS' ? (
                    <LiteSettingsPage onClose={() => setActiveView('DASHBOARD')} />
                ) : activeView === 'GUIDE' ? (
                    <LiteGuidePage onClose={() => setActiveView('DASHBOARD')} />
                ) : activeView === 'SCHEDULE' ? (
                    <LiteSchedulePage onClose={() => setActiveView('DASHBOARD')} />
                ) : activeView === 'DETAIL' && selectedSheepId ? (
                    <LiteSheepDetailPage
                        target={sheep.find(s => s.id === selectedSheepId)}
                        onClose={() => {
                            setActiveView('DASHBOARD');
                            // If there was an internal selection state it needs to be cleared
                        }}
                    />
                ) : (
                    <>
                        <div className="lite-content-toolbar">
                            <div className="lite-search-box">
                                <input
                                    type="text"
                                    placeholder="搜尋名字..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="lite-toolbar-divider" />

                            <div className="lite-tags-filter-bar">
                                {/* System Filters */}
                                <button
                                    className={`lite-tag-filter-btn system ${activeFilterId === 'ALL' ? 'active' : ''}`}
                                    onClick={() => setActiveFilterId('ALL')}
                                >
                                    全部 ({stats.total})
                                </button>
                                <button
                                    className={`lite-tag-filter-btn system healthy ${activeFilterId === 'HEALTHY' ? 'active' : ''}`}
                                    onClick={() => setActiveFilterId('HEALTHY')}
                                >
                                    健康 ({stats.healthy})
                                </button>
                                <button
                                    className={`lite-tag-filter-btn system sick ${activeFilterId === 'SICK' ? 'active' : ''}`}
                                    onClick={() => setActiveFilterId('SICK')}
                                >
                                    需關注 ({stats.sick})
                                </button>
                                <button
                                    className={`lite-tag-filter-btn system sleeping ${activeFilterId === 'SLEEPING' ? 'active' : ''}`}
                                    onClick={() => setActiveFilterId('SLEEPING')}
                                >
                                    休眠 ({stats.sleeping})
                                </button>

                                <div className="lite-tag-group-divider" />

                                {/* Custom Tags */}
                                {tags.map(tag => {
                                    const isActive = activeFilterId === `TAG:${tag.id}`;
                                    return (
                                        <button
                                            key={tag.id}
                                            className={`lite-tag-filter-btn ${isActive ? 'active' : ''}`}
                                            onClick={() => setActiveFilterId(isActive ? 'ALL' : `TAG:${tag.id}`)}
                                            style={{
                                                backgroundColor: isActive ? tag.color : 'transparent',
                                                borderColor: tag.color,
                                                color: isActive ? '#fff' : tag.color,
                                            }}
                                        >
                                            {tag.name}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="lite-toolbar-actions">
                                <button
                                    className={`lite-action-btn ${isSelectionMode ? 'active' : ''}`}
                                    onClick={() => {
                                        setIsSelectionMode(!isSelectionMode);
                                        if (isSelectionMode) setSelectedIds(new Set());
                                    }}
                                >
                                    <CheckSquare size={14} style={{ marginRight: '6px' }} />
                                    選取
                                </button>
                                <button className="lite-action-btn" onClick={() => setShowTagManagerModal(true)}>
                                    標籤管理
                                </button>
                            </div>
                        </div>

                        {/* Batch Action Bar */}
                        {isSelectionMode && selectedIds.size > 0 && (
                            <div className="lite-batch-bar">
                                <div className="batch-info">
                                    <span>已選取 <strong>{selectedIds.size}</strong> 隻小羊</span>
                                </div>
                                <div className="batch-actions">
                                    <button className="batch-btn" onClick={handleBatchReset}>
                                        <RotateCcw size={14} />
                                        重置為健康
                                    </button>
                                    <button className="batch-btn is-danger" onClick={handleBatchDelete}>
                                        <Trash2 size={14} />
                                        刪除
                                    </button>
                                    <div className="batch-divider" />
                                    <button className="batch-close" onClick={() => setSelectedIds(new Set())}>
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Main List */}
                        <div className="lite-list-wrapper">
                            <SheepListTextView
                                sheepList={filteredSheep}
                                selectedIds={selectedIds}
                                onSelect={(id) => {
                                    if (isSelectionMode) {
                                        toggleSelection(id);
                                    } else {
                                        const s = sheep.find(item => item.id === id);
                                        if (onSelectSheep && s) onSelectSheep(s);
                                    }
                                }}
                                isSelectionMode={isSelectionMode}
                                tags={tags}
                                tagAssignmentsBySheep={tagAssignmentsBySheep}
                                isLiteMode={true}
                                onToggleAll={handleToggleAll}
                                isAllSelected={isAllSelected}
                            />
                        </div>
                    </>
                )}
            </main>

            {showAddModal && (
                <AddSheepModal
                    onConfirm={handleConfirmAdd}
                    onCancel={() => setShowAddModal(false)}
                />
            )}
            {showTagManagerModal && <TagManagerModal onClose={() => setShowTagManagerModal(false)} />}
        </div>
    );
};
