import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { useConfirm } from '../context/ConfirmContext';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { CloseButton } from './ui/CloseButton';
import { Tag } from './ui/Tag';
import { IconButton, IconButtonGroup } from './ui/IconButton';

export const TagManagerModal = ({ onClose }) => {
    const { tags, createTag, updateTag, deleteTag, tagAssignmentsBySheep } = useGame();
    const confirm = useConfirm();
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState('#6b7280');
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editColor, setEditColor] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!newName.trim()) return;
        setLoading(true);
        try {
            await createTag({ name: newName.trim(), color: newColor });
            setNewName('');
            setNewColor('#6b7280');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (tagId) => {
        if (!editName.trim()) return;
        setLoading(true);
        try {
            await updateTag(tagId, { name: editName.trim(), color: editColor });
            setEditingId(null);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (tag) => {
        const affectedCount = Object.values(tagAssignmentsBySheep || {}).filter(
            assignments => assignments.some(a => a.tagId === tag.id)
        ).length;
        const warning = affectedCount > 0
            ? `此標籤目前套用於 ${affectedCount} 隻小羊，刪除後將全部移除，且無法復原。`
            : '刪除後無法復原。';
        const ok = await confirm({
            title: '刪除標籤',
            message: `確定要刪除「${tag.name}」嗎？`,
            warning,
            variant: 'danger',
            confirmLabel: '刪除'
        });
        if (!ok) return;
        setLoading(true);
        try {
            await deleteTag(tag.id);
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (tag) => {
        setEditingId(tag.id);
        setEditName(tag.name);
        setEditColor(tag.color || '#6b7280');
    };

    const cancelEdit = () => {
        setEditingId(null);
    };

    return (
        <div className="debug-editor-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="tag-manager-title">
            <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '360px' }}>
                <div className="modal-header">
                    <h3 id="tag-manager-title">管理標籤</h3>
                    <CloseButton onClick={onClose} ariaLabel="關閉" />
                </div>
                <div className="modal-form" style={{ padding: '12px' }}>
                    <div className="form-group">
                        <label>新增標籤</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="標籤名稱"
                                maxLength={12}
                                style={{ flex: 1, minWidth: 100, minHeight: 44, padding: '12px 16px', fontSize: 16 }}
                            />
                            <input
                                type="color"
                                value={newColor}
                                onChange={(e) => setNewColor(e.target.value)}
                                title="顏色"
                                style={{
                                    width: 44,
                                    height: 44,
                                    minWidth: 44,
                                    minHeight: 44,
                                    padding: 4,
                                    cursor: 'pointer',
                                    borderRadius: 8
                                }}
                            />
                            <button
                                type="button"
                                className="modal-btn-primary"
                                onClick={handleCreate}
                                disabled={loading || !newName.trim()}
                            >
                                <Plus size={16} strokeWidth={2.5} /> 新增
                            </button>
                        </div>
                    </div>

                    <div className="form-group" style={{ marginTop: '16px' }}>
                        <label>您的標籤</label>
                        {tags.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>尚無標籤，請在上方新增</p>
                        ) : (
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {tags.map((tag) => (
                                    <li
                                        key={tag.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            flexWrap: 'wrap',
                                            padding: '10px 12px',
                                            background: 'rgba(255,255,255,0.5)',
                                            borderRadius: 8,
                                            marginBottom: 6
                                        }}
                                    >
                                        {editingId === tag.id ? (
                                            <>
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    style={{
                                                        flex: 1,
                                                        minWidth: 100,
                                                        minHeight: 44,
                                                        padding: '12px 16px',
                                                        fontSize: 16
                                                    }}
                                                />
                                                <input
                                                    type="color"
                                                    value={editColor}
                                                    onChange={(e) => setEditColor(e.target.value)}
                                                    title="顏色"
                                                    style={{
                                                        width: 44,
                                                        height: 44,
                                                        minWidth: 44,
                                                        minHeight: 44,
                                                        padding: 4,
                                                        cursor: 'pointer',
                                                        borderRadius: 8
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    className="modal-btn-primary"
                                                    onClick={() => handleUpdate(tag.id)}
                                                    disabled={loading || !editName.trim()}
                                                    style={{ padding: '8px 16px', width: 'auto', flexShrink: 0 }}
                                                >
                                                    儲存
                                                </button>
                                                <button
                                                    type="button"
                                                    className="modal-btn-secondary"
                                                    onClick={cancelEdit}
                                                    style={{ padding: '8px 14px', width: 'auto', flexShrink: 0 }}
                                                >
                                                    取消
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <Tag name={tag.name} color={tag.color} />
                                                <IconButtonGroup>
                                                    <IconButton icon={Pencil} onClick={() => startEdit(tag)} ariaLabel="編輯" size={14} />
                                                    <IconButton icon={Trash2} onClick={() => handleDelete(tag)} variant="danger" ariaLabel="刪除" size={14} />
                                                </IconButtonGroup>
                                            </>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
