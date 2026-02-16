import React, { useState, useEffect } from 'react';
import { X, ChevronUp, ChevronDown, Settings } from 'lucide-react';
import { Tag } from '../ui/Tag';
import { IconButton, IconButtonGroup } from '../ui/IconButton';
import { Tooltip } from '../ui/Tooltip';
import { Slider } from '../ui/Slider';
import { calculateSheepState } from '../../utils/gameLogic';

const TagSelect = ({ sheepId, tags, assignedIds, onSave }) => {
    const [orderedIds, setOrderedIds] = useState(assignedIds);
    useEffect(() => { setOrderedIds(assignedIds || []); }, [(assignedIds || []).join(',')]);

    const addTag = (tagId) => {
        if (orderedIds.includes(tagId)) return;
        const next = [...orderedIds, tagId];
        setOrderedIds(next);
        onSave(next);
    };

    const removeTag = (tagId) => {
        const next = orderedIds.filter(id => id !== tagId);
        setOrderedIds(next);
        onSave(next);
    };

    const moveUp = (idx) => {
        if (idx <= 0) return;
        const next = [...orderedIds];
        [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
        setOrderedIds(next);
        onSave(next);
    };

    const moveDown = (idx) => {
        if (idx >= orderedIds.length - 1) return;
        const next = [...orderedIds];
        [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
        setOrderedIds(next);
        onSave(next);
    };

    const availableTags = tags.filter(t => !orderedIds.includes(t.id));

    return (
        <div className="tag-select">
            <div className="form-group" style={{ marginBottom: '8px' }}>
                <select
                    id="tag-select-dropdown"
                    value=""
                    onChange={(e) => {
                        const id = e.target.value;
                        if (id) { addTag(id); e.target.value = ''; }
                    }}
                    aria-label="選擇標籤"
                >
                    <option value="">選擇標籤加入...</option>
                    {availableTags.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0 0 8px 0', lineHeight: 1.4 }}>
                {orderedIds.length > 0 ? '第一個標籤會顯示在卡片上，可用 ↑↓ 調整順序。' : '選擇標籤後，第一個會顯示在卡片上。'}
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }} role="list">
                {orderedIds.map((tagId, idx) => {
                    const tag = tags.find(t => t.id === tagId);
                    if (!tag) return null;
                    return (
                        <li
                            key={tagId}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                marginBottom: '8px',
                                padding: '4px 8px',
                                background: 'rgba(0,0,0,0.02)',
                                borderRadius: '8px'
                            }}
                        >
                            <Tag name={tag.name} color={tag.color} className="tag-select-tag" style={{ flex: 1, textAlign: 'center' }} />
                            <IconButtonGroup>
                                <IconButton icon={ChevronUp} onClick={() => moveUp(idx)} disabled={idx === 0} ariaLabel="上移" />
                                <IconButton icon={ChevronDown} onClick={() => moveDown(idx)} disabled={idx === orderedIds.length - 1} ariaLabel="下移" />
                                <IconButton icon={X} onClick={() => removeTag(tagId)} ariaLabel="移除" className="icon-btn--muted" />
                            </IconButtonGroup>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export const SheepDetailSettings = ({
    target,
    name,
    setName,
    handleBasicAutoSave,
    tags,
    tagAssignmentsBySheep,
    setSheepTags,
    setShowTagManager,
    isAdmin,
    isSleepingState,
    updateSheep
}) => {
    return (
        <div className="sheep-detail-basic">
            <div className="form-group">
                <label>{isSleepingState ? '沉睡紀錄 (姓名)' : '姓名'}</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => handleBasicAutoSave('name', name)}
                    maxLength={10}
                    placeholder="名字..."
                />
            </div>

            <div className="form-group">
                <label>標籤</label>
                <TagSelect
                    sheepId={target?.id}
                    tags={tags}
                    assignedIds={(tagAssignmentsBySheep[target?.id] || []).map(a => a.tagId)}
                    onSave={(tagIds) => target?.id && setSheepTags(target.id, tagIds)}
                />
                <Tooltip content="管理標籤" side="top">
                    <button
                        type="button"
                        className="tag-manage-btn"
                        onClick={() => setShowTagManager(true)}
                        style={{
                            marginTop: '10px',
                            fontSize: '0.8rem',
                            padding: '4px 10px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(0,0,0,0.04)',
                            border: '1px solid rgba(0,0,0,0.1)',
                            borderRadius: '6px',
                            color: 'var(--text-muted)',
                            cursor: 'pointer'
                        }}
                    >
                        <Settings size={12} strokeWidth={2} />
                        管理標籤
                    </button>
                </Tooltip>
            </div>

            {isAdmin && !isSleepingState && (
                <div className="form-group">
                    <div className="modal-admin-box">
                        <label>🔧 管理員調整: {Math.ceil(target.health)}%</label>
                        <div className="admin-actions">
                            <Slider
                                min={1}
                                max={100}
                                value={target.health}
                                onChange={(e) => {
                                    const newHealth = Number(e.target.value);
                                    const { health, status, type } = calculateSheepState(newHealth, target.status);
                                    updateSheep(target.id, { health, type, status });
                                }}
                                ariaLabel="管理員調整健康度"
                            />
                            <Tooltip content="直接歸零 (測試沉睡)" side="top">
                                <button
                                    type="button"
                                    className="admin-reset-btn btn-destructive"
                                    onClick={() => updateSheep(target.id, { health: 0 })}
                                >
                                    💀 歸零
                                </button>
                            </Tooltip>
                        </div>
                    </div>
                </div>
            )}

            <div className="modal-hint">
                (內容將自動儲存)
            </div>
        </div>
    );
};
