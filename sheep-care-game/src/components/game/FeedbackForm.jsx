import React, { useState } from 'react';
import { sanitizeInput } from '../../utils/gameLogic';

const FEEDBACK_TAGS = ['成功接觸', '反應良好', '參加聚會', '決志禱告', '願意受洗'];

export const FeedbackForm = ({
    initialData = { note: '', tags: [] },
    onSubmit,
    onCancel,
    loading = false
}) => {
    const [data, setData] = useState(initialData);

    const toggleTag = (tag) => {
        setData(prev => {
            const current = prev.tags || [];
            if (current.includes(tag)) {
                return { ...prev, tags: current.filter(t => t !== tag) };
            } else {
                return { ...prev, tags: [...current, tag] };
            }
        });
    };

    return (
        <div className="spiritual-plan-form" style={{ padding: '4px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: 'var(--palette-blue-action)', fontWeight: 'bold' }}>認領紀錄</h3>

            <div className="form-group">
                <label style={{ fontWeight: 'bold', color: 'var(--text-header)', marginBottom: '8px', display: 'block' }}>💭 心得紀錄</label>
                <textarea
                    value={data.note}
                    onChange={(e) => setData({ ...data, note: e.target.value })}
                    rows={5}
                    placeholder="接觸狀況如何？小羊的反應？有無邀約或決志？"
                    disabled={loading}
                />
            </div>

            <div className="form-group">
                <label style={{ fontWeight: 'bold', color: 'var(--text-header)', marginBottom: '8px', display: 'block' }}>🏷️ 狀況標記 (可複選)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {FEEDBACK_TAGS.map(tag => {
                        const active = (data.tags || []).includes(tag);
                        return (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => toggleTag(tag)}
                                disabled={loading}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '20px',
                                    border: active ? '1px solid var(--palette-blue-action)' : '1px solid #ddd',
                                    background: active ? 'var(--palette-blue-action)' : '#f9f9f9',
                                    color: active ? '#fff' : '#666',
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {tag}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="spiritual-plan-form-actions">
                <button
                    type="button"
                    className="modal-btn-secondary"
                    onClick={onCancel}
                    disabled={loading}
                >
                    取消
                </button>
                <button
                    type="button"
                    className="modal-btn-primary"
                    onClick={() => onSubmit({ ...data, note: sanitizeInput(data.note) })}
                    disabled={loading}
                >
                    {loading ? '處理中...' : '確認儲存'}
                </button>
            </div>
        </div>
    );
};
