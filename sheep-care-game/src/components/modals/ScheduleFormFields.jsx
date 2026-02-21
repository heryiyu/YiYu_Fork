import React from 'react';

export const ScheduleFormFields = ({ formData, setFormData, embedded = false }) => {
    return (
        <div className={`plan-detail-card ${embedded ? 'embedded-card' : ''}`}>
            <div className="plan-detail-form-group">
                <label className="plan-detail-label">標題</label>
                <input
                    type="text"
                    className="plan-detail-input"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="例如：小組聚會"
                />
            </div>
            <div className="plan-detail-form-group">
                <label className="plan-detail-label">時間</label>
                <input
                    type="datetime-local"
                    className="plan-detail-input"
                    value={formData.scheduled_time}
                    onChange={e => setFormData({ ...formData, scheduled_time: e.target.value })}
                />
            </div>
            <div className="plan-detail-form-group">
                <label className="plan-detail-label">提醒</label>
                <select
                    className="plan-detail-select"
                    value={formData.reminderOffset}
                    onChange={e => setFormData({ ...formData, reminderOffset: Number(e.target.value) })}
                >
                    <option value={-1}>🔕 不提醒</option>
                    <option value={0}>⚡ 準時提醒</option>
                    <option value={15}>🔔 提前 15 分鐘</option>
                    <option value={30}>🔔 提前 30 分鐘</option>
                    <option value={60}>🔔 提前 1 小時</option>
                </select>
            </div>
            <div className="plan-detail-form-group">
                <label className="plan-detail-label">地點</label>
                <input
                    type="text"
                    className="plan-detail-input"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    placeholder="地點"
                />
            </div>
            <div className="plan-detail-form-group">
                <label className="plan-detail-label">內容規劃</label>
                <textarea
                    className="plan-detail-textarea"
                    value={formData.content}
                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                    rows={3}
                    style={{ resize: 'none' }}
                />
            </div>
        </div>
    );
};
