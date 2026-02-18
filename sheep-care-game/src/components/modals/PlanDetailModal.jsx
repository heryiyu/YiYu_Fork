import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Users, Edit2, Trash2, Plus, Save, ChevronLeft } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { AssetSheep } from '../game/AssetSheep';
import '../../styles/design-tokens.css';
import './PlanDetailModal.css';

export const PlanDetailModal = ({ schedule, onClose, embedded = false, onComplete }) => {
    const {
        sheep,
        currentUser,
        lineId,
        addSchedule,
        updateSchedule,
        deleteSchedule,
        addParticipantToSchedule,
        removeParticipantFromSchedule
    } = useGame();

    // console.log("PlanDetailModal rendered. Schedule:", schedule);

    // Form State
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        scheduled_time: '',
        location: '',
        content: '',
        reminderOffset: 15
    });

    // Helper to format ISO string to "YYYY-MM-DDThh:mm" for input[type="datetime-local"]
    const toLocalISOString = (isoString) => {
        if (!isoString) return '';
        try {
            const date = new Date(isoString);
            if (isNaN(date.getTime())) return ''; // Invalid Date check

            // Adjust to local time zone for display in input
            const offsetMs = date.getTimezoneOffset() * 60 * 1000;
            const localDate = new Date(date.getTime() - offsetMs);
            return localDate.toISOString().slice(0, 16);
        } catch (e) {
            console.warn("Date parse error:", e);
            return '';
        }
    };

    // Local State for Participants (Batch Update)
    const [localParticipants, setLocalParticipants] = useState([]);
    const [pendingSelection, setPendingSelection] = useState([]); // IDs of sheep selected in the "Add" panel
    const [showAddParticipant, setShowAddParticipant] = useState(false);

    // Initialize local state when schedule opens
    useEffect(() => {
        // console.log("PlanDetailModal: useEffect [schedule] triggered. ID:", schedule?.id);
        if (schedule) {
            setFormData({
                title: schedule.title || schedule.action || '',
                scheduled_time: toLocalISOString(schedule.scheduled_time),
                location: schedule.location || '',
                content: schedule.content || '',
                reminderOffset: (schedule.reminder_offset !== undefined && schedule.reminder_offset !== null) ? schedule.reminder_offset : 15
            });
            // Deep copy to avoid mutating prop
            setLocalParticipants(schedule.schedule_participants ? [...schedule.schedule_participants] : []);
        }
    }, [schedule]);

    if (!schedule) return null;

    // Filter sheep: exclude those already in localParticipants
    const currentParticipantIds = localParticipants.map(p => p.sheep_id);
    // Available sheep are those NOT in the local list
    const availableSheep = sheep.filter(s => !currentParticipantIds.includes(s.id));

    // Toggle selection in the "Add" panel
    const togglePendingSelection = (sheepId) => {
        setPendingSelection(prev => {
            if (prev.includes(sheepId)) return prev.filter(id => id !== sheepId);
            return [...prev, sheepId];
        });
    };

    // Confirm adding selected sheep to the local list
    const confirmAddParticipants = () => {
        const newParticipants = pendingSelection.map(sheepId => ({
            sheep_id: sheepId,
            // status/id missing for new ones, but that's fine for display
            isNew: true
        }));
        setLocalParticipants(prev => [...prev, ...newParticipants]);
        setPendingSelection([]); // Reset selection
        setShowAddParticipant(false); // Close panel
    };

    // Remove from local list
    const handleRemoveParticipant = (sheepId) => {
        setLocalParticipants(prev => prev.filter(p => p.sheep_id !== sheepId));
    };

    const handleSave = async () => {
        setIsLoading(true);

        try {
            if (schedule.id !== 'new') {
                // UPDATE EXISTING
                const payload = { ...formData };

                // Handle Timestamp Mapping
                if (payload.scheduled_time && payload.scheduled_time.trim() !== '') {
                    const dateObj = new Date(payload.scheduled_time);
                    payload.scheduled_time = dateObj.toISOString();
                    if (payload.reminderOffset !== -1) {
                        const notifyTime = new Date(dateObj.getTime() - (payload.reminderOffset * 60 * 1000));
                        payload.notify_at = notifyTime.toISOString();
                    } else {
                        payload.notify_at = null;
                    }
                } else {
                    payload.scheduled_time = null;
                    payload.notify_at = null;
                }

                // Map reminderOffset to schema field
                payload.reminder_offset = payload.reminderOffset;
                delete payload.reminderOffset;

                const updateSuccess = await updateSchedule(schedule.id, payload);
                if (!updateSuccess) throw new Error("Update schedule details failed");

                // 2. Diff Participants
                const originalIds = (schedule.schedule_participants || []).map(p => p.sheep_id);
                const finalIds = localParticipants.map(p => p.sheep_id);

                // Added: In Final but not in Original
                const toAdd = finalIds.filter(id => !originalIds.includes(id));

                // Removed: In Original but not in Final
                const toRemove = originalIds.filter(id => !finalIds.includes(id));

                // Execute Updates
                const addPromises = toAdd.map(sheepId => addParticipantToSchedule(schedule.id, sheepId));
                const removePromises = toRemove.map(sheepId => removeParticipantFromSchedule(schedule.id, sheepId));

                await Promise.all([...addPromises, ...removePromises]);
            } else {
                // NEW SCHEDULE
                const payload = {
                    title: (formData.title || '').trim() || '未命名行動',
                    scheduled_time: null,
                    location: (formData.location || '').trim(),
                    content: (formData.content || '').trim(),
                    reminder_offset: formData.reminderOffset
                };

                if (formData.scheduled_time && formData.scheduled_time.trim() !== '') {
                    const dateObj = new Date(formData.scheduled_time);
                    payload.scheduled_time = dateObj.toISOString();
                    if (formData.reminderOffset !== -1) {
                        const notifyTime = new Date(dateObj.getTime() - (formData.reminderOffset * 60 * 1000));
                        payload.notify_at = notifyTime.toISOString();
                    } else {
                        payload.notify_at = null;
                    }
                } else {
                    payload.notify_at = null;
                }

                const sheepIds = localParticipants.map(p => p.sheep_id);
                const newSchedule = await addSchedule(payload, sheepIds);
                if (!newSchedule) throw new Error("Create schedule failed");
            }

            onClose(); // Close on success
        } catch (error) {
            console.error("Save failed:", error);
            alert("儲存失敗，請重試");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('確定要刪除這個行程嗎？此操作無法復原。')) {
            setIsLoading(true);
            const success = await deleteSchedule(schedule.id);
            setIsLoading(false);
            if (success) {
                onClose();
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await handleSave();
    };

    return (
        <div className={`nested-plan-detail-wrapper ${embedded ? 'embedded' : ''}`}>
            {/* Header: Only show if NOT embedded */}
            {!embedded && (
                <div className="plan-detail-modal-header" style={{ padding: '8px 16px', minHeight: '56px' }}>
                    <div className="plan-detail-header-title-wrap">
                        {schedule?.id !== 'new' && (
                            <button
                                type="button"
                                className="icon-btn-ghost"
                                onClick={handleDelete}
                                style={{ color: 'var(--palette-danger)', padding: '8px' }}
                                title="刪除此規劃"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
                        <h3 className="plan-detail-header-title" style={{ textAlign: 'center', flex: 1 }}>
                            {schedule?.id === 'new' ? '新增規劃' : '行程詳情'}
                        </h3>
                        <button type="button" className="icon-btn-ghost" onClick={onClose} style={{ color: '#fff', padding: '8px' }}>
                            <X size={24} />
                        </button>
                    </div>
                </div>
            )}

            <div className={`plan-detail-modal-body ${embedded ? 'embedded-body' : ''}`}>
                <div className="plan-detail-form-container">

                    <form className="plan-detail-form" onSubmit={handleSubmit}>
                        {/* Title and Time - Card 1 */}
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

                        <div className="plan-detail-card">
                            <label className="plan-participant-header">
                                <span className="plan-participant-title">夥伴名單</span>
                                <button
                                    type="button"
                                    className="plan-participant-add-btn"
                                    onClick={() => setShowAddParticipant(true)}
                                >
                                    <Plus size={14} /> 新增
                                </button>
                            </label>
                            <div className="plan-participant-list">
                                {/* <div style={{padding: '10px', color: 'red'}}>DEBUG: Participant List Hidden</div> */}
                                {localParticipants.map((participant, index) => {
                                    const sheepData = sheep.find(s => s.id === participant.sheep_id);
                                    const key = participant.id || `new-${participant.sheep_id}-${index}`;
                                    return (
                                        <div key={key} className="plan-participant-item">
                                            <div className="plan-participant-info">
                                                {/* Temporarily disable AssetSheep to check for crash */}
                                                <div className="plan-participant-avatar">
                                                    {sheepData && <AssetSheep visual={sheepData.visual} centered animated={false} />}
                                                </div>
                                                <span className="plan-participant-name">{sheepData ? sheepData.name : 'Unknown'}</span>
                                            </div>
                                            <button
                                                type="button"
                                                className="plan-participant-remove"
                                                onClick={() => handleRemoveParticipant(participant.sheep_id)}
                                                aria-label="移除夥伴"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    );
                                })}
                                {localParticipants.length === 0 && (
                                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '16px', background: 'var(--bg-snow)', borderRadius: '12px', fontSize: '0.9rem' }}>
                                        暫無夥伴，請新增
                                    </div>
                                )}
                            </div>
                        </div>

                        {showAddParticipant && (
                            <div className="plan-add-panel">
                                <h5 className="plan-add-panel-title">選擇要加入的小羊：</h5>
                                <div className="plan-sheep-grid">
                                    {availableSheep.length > 0 ? availableSheep.map(s => {
                                        const isSelected = pendingSelection.includes(s.id);
                                        return (
                                            <button
                                                key={s.id}
                                                type="button"
                                                className={`plan-sheep-btn ${isSelected ? 'selected' : ''}`}
                                                onClick={() => togglePendingSelection(s.id)}
                                            >
                                                <div style={{ width: '24px', height: '24px', overflow: 'hidden', borderRadius: '50%', background: '#fff' }}>
                                                    <AssetSheep visual={s.visual} centered animated={false} />
                                                </div>
                                                <span style={{ fontSize: '0.9rem', color: 'var(--text-body)', fontWeight: isSelected ? 'bold' : 'normal' }}>{s.name}</span>
                                            </button>
                                        );
                                    }) : (
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '8px' }}>沒有其他小羊可選了</div>
                                    )}
                                </div>
                                <div className="plan-add-panel-footer">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowAddParticipant(false);
                                            setPendingSelection([]);
                                        }}
                                        className="modal-btn-secondary"
                                        style={{ flex: 1, padding: '10px', borderRadius: '12px' }}
                                    >
                                        取消
                                    </button>
                                    <button
                                        type="button"
                                        onClick={confirmAddParticipants}
                                        className="modal-btn-confirm-add"
                                        disabled={pendingSelection.length === 0}
                                    >
                                        確認加入 ({pendingSelection.length})
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="spiritual-plan-form-actions">
                            <button
                                type="submit"
                                className="modal-btn-confirm-add"
                                disabled={isLoading}
                            >
                                {isLoading ? '處理中...' : (schedule?.id === 'new' ? '確認新增' : '儲存變更')}
                            </button>
                            {embedded && (
                                <button
                                    type="button"
                                    className="modal-btn-secondary"
                                    onClick={onClose}
                                >
                                    返回列表
                                </button>
                            )}
                            {(() => {
                                if (schedule.id === 'new') return null;

                                const now = new Date();
                                const scheduledTime = schedule.scheduled_time ? new Date(schedule.scheduled_time) : null;
                                const createdAt = schedule.created_at ? new Date(schedule.created_at) : null;

                                let isReady = false;
                                if (scheduledTime) {
                                    isReady = now >= scheduledTime;
                                } else if (createdAt) {
                                    const oneDayMs = 24 * 60 * 60 * 1000;
                                    isReady = now >= new Date(createdAt.getTime() + oneDayMs);
                                }

                                if (!isReady) return null;

                                return (
                                    <button
                                        type="button"
                                        className="modal-btn-primary"
                                        onClick={onComplete}
                                        style={{
                                            marginLeft: '8px',
                                            padding: '0 16px',
                                            background: 'var(--palette-orange-action)',
                                            borderColor: 'var(--palette-orange-action)',
                                            color: '#fff',
                                            fontWeight: 'bold',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                    >
                                        <Edit2 size={16} /> 認領紀錄
                                    </button>
                                );
                            })()}
                        </div>
                    </form>

                </div>
            </div>
        </div>
    );
};
