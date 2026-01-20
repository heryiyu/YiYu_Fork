
import React from 'react';
import { useGame } from '../context/GameContext';
import { SheepVisual } from './SheepVisual';
import { getSheepMessage, getStableSheepMessage } from '../utils/gameLogic';

export const SheepList = ({ onSelect, onClose }) => {
    const { sheep, deleteMultipleSheep } = useGame();
    const sortedSheep = [...(sheep || [])].sort((a, b) => a.id - b.id);

    const [isSelectionMode, setIsSelectionMode] = React.useState(false);
    const [selectedIds, setSelectedIds] = React.useState(new Set());

    const toggleSelection = (id) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleSelectAll = () => {
        if (selectedIds.size === sortedSheep.length) {
            setSelectedIds(new Set()); // Deselect All
        } else {
            const allIds = new Set(sortedSheep.map(s => s.id));
            setSelectedIds(allIds);
        }
    };

    const handleDeleteSelected = () => {
        if (selectedIds.size === 0) return;
        if (window.confirm(`確定要刪除這 ${selectedIds.size} 隻小羊嗎？\n此動作無法復原！`)) {
            deleteMultipleSheep(Array.from(selectedIds));
            setIsSelectionMode(false);
            setSelectedIds(new Set());
        }
    };

    return (
        <div className="debug-editor-overlay" onClick={onClose}>
            <div className="simple-editor" onClick={(e) => e.stopPropagation()} style={{ width: '360px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                <div className="editor-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <h3>📖 小羊圖鑑 ({sheep.length})</h3>
                    </div>
                    <div>
                        <button
                            onClick={() => {
                                setIsSelectionMode(!isSelectionMode);
                                setSelectedIds(new Set());
                            }}
                            style={{
                                background: 'transparent', border: '1px solid #ccc',
                                borderRadius: '4px', padding: '5px 8px', fontSize: '0.8rem',
                                cursor: 'pointer', marginRight: '5px',
                                color: isSelectionMode ? '#2196f3' : '#666'
                            }}
                        >
                            {isSelectionMode ? '取消選取' : '批次管理'}
                        </button>
                        <button className="close-btn" onClick={onClose}>✖</button>
                    </div>
                </div>

                {isSelectionMode && (
                    <div style={{ padding: '8px 10px', background: '#f5f5f5', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '0.9rem', color: 'black' }}>
                            <input
                                type="checkbox"
                                checked={sortedSheep.length > 0 && selectedIds.size === sortedSheep.length}
                                onChange={handleSelectAll}
                                style={{ transform: 'scale(1.2)', marginRight: '8px' }}
                            />
                            全選 ({selectedIds.size}/{sortedSheep.length})
                        </label>
                        <button
                            onClick={handleDeleteSelected}
                            disabled={selectedIds.size === 0}
                            style={{
                                background: selectedIds.size > 0 ? '#f44336' : '#ddd',
                                color: 'white', border: 'none', borderRadius: '4px',
                                padding: '5px 10px', fontSize: '0.8rem',
                                cursor: selectedIds.size > 0 ? 'pointer' : 'not-allowed'
                            }}
                        >
                            刪除選取 ({selectedIds.size})
                        </button>
                    </div>
                )}

                <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
                    {sortedSheep.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                            牧場還是空的...<br />快去新增小羊吧！
                        </div>
                    ) : (
                        sortedSheep.map(s => {
                            const isDead = s.status === 'dead';
                            const isSick = s.status === 'sick';
                            const isSelected = selectedIds.has(s.id);

                            return (
                                <div
                                    key={s.id}
                                    onClick={() => {
                                        if (isSelectionMode) toggleSelection(s.id);
                                    }}
                                    style={{
                                        display: 'flex', alignItems: 'center',
                                        padding: '10px', borderBottom: '1px solid #eee',
                                        background: isSelectionMode && isSelected ? '#e3f2fd' : (isDead ? '#f8f8f8' : (isSick ? '#fff0f0' : 'transparent')),
                                        opacity: isDead ? 0.7 : 1,
                                        cursor: isSelectionMode ? 'pointer' : 'default'
                                    }}
                                >
                                    {isSelectionMode && (
                                        <div style={{ marginRight: '10px' }}>
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleSelection(s.id)}
                                                style={{ transform: 'scale(1.3)', cursor: 'pointer' }}
                                                onClick={(e) => e.stopPropagation()} // Prevent double trigger
                                            />
                                        </div>
                                    )}

                                    {/* Mini Visual Preview */}
                                    <div style={{
                                        width: '70px', minWidth: '70px', // Fixed width to prevent squeezing
                                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                                        marginRight: '15px'
                                    }}>
                                        <div style={{ width: '60px', height: '60px', position: 'relative' }}>
                                            <SheepVisual
                                                status={s.status}
                                                visual={s.visual}
                                                health={s.health}
                                                type={s.type}
                                                isStatic={true}
                                                scale={0.65}
                                                direction={1}
                                            />
                                        </div>
                                        <div style={{
                                            marginTop: '2px', fontSize: '0.7rem', color: '#fff',
                                            background: isDead ? '#757575' : (s.type === 'HUMAN' ? '#ff9800' : (s.type === 'STRONG' ? '#2196f3' : '#8bc34a')),
                                            padding: '2px 8px', borderRadius: '10px', whiteSpace: 'nowrap',
                                            fontWeight: 'bold', boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                                            transform: 'translateY(-5px)', zIndex: 2
                                        }}>
                                            {isDead ? '陣亡' : (s.type === 'HUMAN' ? '榮耀' : (s.type === 'STRONG' ? '強壯' : '小羊'))}
                                        </div>
                                    </div>

                                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left', marginRight: '10px' }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '1rem', color: isDead ? '#666' : '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {s.name} <small style={{ color: '#999', fontSize: '0.7rem' }}>#{String(s.id).slice(-4)}</small>
                                        </div>
                                        {s.spiritualMaturity && (
                                            <div style={{ fontSize: '0.8rem', color: '#66bb6a', marginBottom: '2px' }}>
                                                🌱 {s.spiritualMaturity}
                                            </div>
                                        )}
                                        <div style={{ fontSize: '0.8rem', color: isDead ? '#999' : (isSick ? 'red' : 'green'), whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {isDead ? '已離世 (需復活)' : (isSick ? '生病中' : '正常')}
                                            {!isDead && ` | 負擔: ${Math.round(s.health)}%`}
                                            {!isDead && <span style={{ color: '#ff9800', marginLeft: '5px' }}>| ❤️: {s.careLevel || 0}</span>}
                                        </div>
                                        {/* Message Preview */}
                                        <div style={{
                                            marginTop: '4px', background: '#f5f5f5', padding: '4px 8px',
                                            borderRadius: '6px', fontSize: '0.8rem', color: 'black',
                                            display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                            fontStyle: 'italic', maxWidth: '100%'
                                        }}>
                                            💬 {s.message || getStableSheepMessage(s, isDead ? 'dead' : (isSick || s.health < 30 ? 'critical' : (s.health < 60 ? 'neglected' : 'happy')))}
                                        </div>
                                    </div>

                                    {!isSelectionMode && (
                                        <button
                                            className="action-btn"
                                            style={{
                                                padding: '5px 12px', fontSize: '0.9rem',
                                                background: isDead ? '#9c27b0' : '#4facfe',
                                                color: 'white'
                                            }}
                                            onClick={() => onSelect(s)}
                                        >
                                            {isDead ? '復活' : '查看'}
                                        </button>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};
