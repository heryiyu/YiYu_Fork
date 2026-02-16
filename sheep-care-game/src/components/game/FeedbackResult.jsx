import React from 'react';
import { Edit2, FileText, ChevronLeft, Calendar } from 'lucide-react';

const formatDisplayTime = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', weekday: 'short' });
};

export const FeedbackResult = ({
    data,
    onEdit,
    onBack,
    onViewPlan,
    editTitle = '修改紀錄',
    title = '認領果效 (已完成)'
}) => {
    return (
        <div className="spiritual-plan-form">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '8px', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--palette-deep-green)' }}>{title}</h3>

                {onEdit && (
                    <button
                        type="button"
                        className="modal-btn-primary"
                        onClick={onEdit}
                        style={{
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            padding: 0,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            minWidth: 'unset',
                            background: 'transparent',
                            color: '#999',
                            boxShadow: 'none',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                        title={editTitle}
                    >
                        <Edit2 size={16} />
                    </button>
                )}
            </div>

            <div className="form-group">
                <label>📅 完成時間</label>
                <div style={{ padding: '8px', background: '#f5f5f5', borderRadius: '8px', color: '#666' }}>
                    {formatDisplayTime(data.completedAt)}
                </div>
            </div>

            <div className="form-group">
                <label>💭 心得紀錄</label>
                <div style={{ padding: '12px', background: '#fff', border: '1px solid #eee', borderRadius: '8px', minHeight: '80px', whiteSpace: 'pre-wrap' }}>
                    {data.note || '無心得紀錄'}
                </div>
            </div>

            <div className="form-group">
                <label>🏷️ 狀況標記</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {data.tags && data.tags.length > 0 ? (
                        data.tags.map(tag => (
                            <span
                                key={tag}
                                style={{
                                    padding: '4px 10px',
                                    borderRadius: '20px',
                                    background: 'var(--palette-blue-action)',
                                    color: '#fff',
                                    fontSize: '0.9rem'
                                }}
                            >
                                {tag}
                            </span>
                        ))
                    ) : (
                        <span style={{ color: '#999' }}>無標記</span>
                    )}
                </div>
            </div>

            <div className="spiritual-plan-form-actions" style={{ flexDirection: 'column', gap: '12px' }}>
                {onViewPlan && (
                    <button
                        type="button"
                        className="modal-btn-primary"
                        onClick={onViewPlan}
                        style={{ width: '100%', background: '#fff', color: 'var(--palette-blue-action)', border: '1px solid var(--palette-blue-action)' }}
                    >
                        <FileText size={16} /> 查看行程細節
                    </button>
                )}

                {onBack && (
                    <button
                        type="button"
                        className="modal-btn-secondary"
                        onClick={onBack}
                        style={{ width: '100%' }}
                    >
                        返回列表
                    </button>
                )}
            </div>
        </div>
    );
};
