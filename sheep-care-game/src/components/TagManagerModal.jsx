import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Plus, Trash2, Pencil } from 'lucide-react';

export const TagManagerModal = ({ onClose }) => {
    const { tags, createTag, updateTag, deleteTag } = useGame();
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

    const handleDelete = async (tagId) => {
        if (!window.confirm('確定要刪除此標籤嗎？')) return;
        setLoading(true);
        try {
            await deleteTag(tagId);
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
                    <button className="close-btn" onClick={onClose} aria-label="關閉">✖</button>
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
                                style={{ flex: 1, minWidth: '100px' }}
                            />
                            <input
                                type="color"
                                value={newColor}
                                onChange={(e) => setNewColor(e.target.value)}
                                title="顏色"
                                style={{ width: 36, height: 36, padding: 2, cursor: 'pointer', borderRadius: 6 }}
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
                            <p style={{ color: '#666', fontSize: '0.9rem' }}>尚無標籤，請在上方新增</p>
                        ) : (
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {tags.map((tag) => (
                                    <li
                                        key={tag.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '8px 10px',
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
                                                    style={{ flex: 1, padding: '4px 8px' }}
                                                />
                                                <input
                                                    type="color"
                                                    value={editColor}
                                                    onChange={(e) => setEditColor(e.target.value)}
                                                    style={{ width: 28, height: 28, padding: 2, cursor: 'pointer', borderRadius: 4 }}
                                                />
                                                <button
                                                    type="button"
                                                    className="modal-btn-primary"
                                                    onClick={() => handleUpdate(tag.id)}
                                                    disabled={loading || !editName.trim()}
                                                >
                                                    儲存
                                                </button>
                                                <button type="button" className="modal-btn-secondary" onClick={cancelEdit}>
                                                    取消
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <span
                                                    style={{
                                                        display: 'inline-block',
                                                        padding: '2px 8px',
                                                        borderRadius: 6,
                                                        fontSize: '0.85rem',
                                                        fontWeight: 600,
                                                        background: tag.color || '#6b7280',
                                                        color: '#fff'
                                                    }}
                                                >
                                                    {tag.name}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => startEdit(tag)}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                                                    aria-label="編輯"
                                                >
                                                    <Pencil size={14} strokeWidth={2} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(tag.id)}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--palette-danger)' }}
                                                    aria-label="刪除"
                                                >
                                                    <Trash2 size={14} strokeWidth={2} />
                                                </button>
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
