import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { supabase } from '../services/supabaseClient';
import { CloseButton } from './ui/CloseButton';
import { AssetSheep } from './AssetSheep';
import { Checkbox } from './ui/Checkbox';
import { Search, Calendar, MapPin, Clock } from 'lucide-react';
import '../styles/design-tokens.css';

const STEPS = {
    SELECT_SHEEP: 0,
    CONFIGURE_PLAN: 1
};

export const BatchAddScheduleModal = ({ onClose, onSaved, initialDate }) => {
    const { sheep, lineId } = useGame();
    const [step, setStep] = useState(STEPS.SELECT_SHEEP);
    const [selectedSheepIds, setSelectedSheepIds] = useState(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        action: '',
        time: initialDate ? new Date(initialDate.getTime() - (initialDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : '',
        location: '',
        content: '',
        reminderOffset: 15,
        repeatDays: [] // 0-6, future feature if needed, currently single shot date
    });

    // Step 1: Filter Sheep
    const filteredSheep = useMemo(() => {
        return sheep.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [sheep, searchTerm]);

    const toggleSheep = (id) => {
        const next = new Set(selectedSheepIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedSheepIds(next);
    };

    const toggleAll = () => {
        if (selectedSheepIds.size === filteredSheep.length) {
            setSelectedSheepIds(new Set());
        } else {
            setSelectedSheepIds(new Set(filteredSheep.map(s => s.id)));
        }
    };

    // Step 2: Submit
    const handleSubmit = async () => {
        if (!formData.action || !formData.time) {
            alert('請輸入行動名稱與時間');
            return;
        }

        setIsSubmitting(true);
        try {
            const dateObj = new Date(formData.time);
            const scheduledTime = dateObj.toISOString();
            let notifyAt = null;

            if (formData.reminderOffset !== -1) {
                const notifyTime = new Date(dateObj.getTime() - (formData.reminderOffset * 60 * 1000));
                notifyAt = notifyTime.toISOString();
            }

            // Create payloads for all selected sheep
            const payloads = Array.from(selectedSheepIds).map(sheepId => ({
                user_id: lineId,
                sheep_id: sheepId,
                action: formData.action,
                scheduled_time: scheduledTime,
                notify_at: notifyAt,
                reminder_offset: formData.reminderOffset,
                location: formData.location,
                content: formData.content,
                is_notified: false
            }));

            const { error } = await supabase.from('spiritual_plans').insert(payloads);
            if (error) throw error;

            onSaved(); // Callback to refresh parent list
        } catch (error) {
            console.error('Batch add failed:', error);
            alert('儲存失敗，請稍後再試');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="debug-editor-overlay" style={{ zIndex: 'var(--z-modal-overlay)' }}>
            <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px', height: '80vh', display: 'flex', flexDirection: 'column' }}>

                {/* Header */}
                <div className="modal-header">
                    <h3>{step === STEPS.SELECT_SHEEP ? '選擇小羊' : '批量規劃'}</h3>
                    <CloseButton onClick={onClose} />
                </div>

                {/* Body */}
                <div className="modal-content" style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

                    {step === STEPS.SELECT_SHEEP && (
                        <>
                            {/* Search & Select All */}
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                <div style={{
                                    flex: 1, display: 'flex', alignItems: 'center',
                                    background: 'var(--bg-light-gray)', borderRadius: '8px', padding: '4px 8px'
                                }}>
                                    <Search size={16} color="var(--text-muted)" />
                                    <input
                                        type="text"
                                        placeholder="搜尋小羊..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        style={{
                                            border: 'none', background: 'transparent', outline: 'none',
                                            padding: '4px', width: '100%', fontSize: '0.9rem'
                                        }}
                                    />
                                </div>
                                <button
                                    onClick={toggleAll}
                                    style={{
                                        border: '1px solid var(--border-main)', borderRadius: '8px',
                                        background: 'white', padding: '0 12px', fontSize: '0.85rem'
                                    }}
                                >
                                    {selectedSheepIds.size === filteredSheep.length ? '全取消' : '全選'}
                                </button>
                            </div>

                            {/* List */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {filteredSheep.map(s => (
                                    <div
                                        key={s.id}
                                        onClick={() => toggleSheep(s.id)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '12px',
                                            padding: '8px', borderRadius: '8px',
                                            background: selectedSheepIds.has(s.id) ? 'var(--palette-pale-blue-bg)' : 'white',
                                            border: selectedSheepIds.has(s.id) ? '1px solid var(--palette-blue-action)' : '1px solid transparent',
                                            cursor: 'pointer', transition: 'all 0.2s'
                                        }}
                                    >
                                        <Checkbox checked={selectedSheepIds.has(s.id)} readOnly />
                                        <div style={{ width: '40px', height: '40px' }}>
                                            <AssetSheep visual={s.visual} centered={true} animated={false} scale={0.8} />
                                        </div>
                                        <span style={{ fontWeight: 500 }}>{s.name}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {step === STEPS.CONFIGURE_PLAN && (
                        <div className="spiritual-plan-form">
                            <div className="modal-hint" style={{ marginBottom: '16px' }}>
                                已選擇 {selectedSheepIds.size} 隻小羊加入此規劃
                            </div>

                            <div className="form-group">
                                <label>📝 行動名稱</label>
                                <input
                                    type="text"
                                    value={formData.action}
                                    onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                                    placeholder="例如：晨禱、小組聚會..."
                                />
                            </div>

                            <div className="form-group">
                                <label>📅 時間</label>
                                <input
                                    type="datetime-local"
                                    value={formData.time}
                                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>⏰ 提醒</label>
                                <select
                                    value={formData.reminderOffset}
                                    onChange={(e) => setFormData({ ...formData, reminderOffset: Number(e.target.value) })}
                                >
                                    <option value={-1}>🔕 不提醒</option>
                                    <option value={0}>⚡ 準時提醒</option>
                                    <option value={15}>🔔 提前 15 分鐘</option>
                                    <option value={30}>🔔 提前 30 分鐘</option>
                                    <option value={60}>🔔 提前 1 小時</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>📍 地點</label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="選填"
                                />
                            </div>

                            <div className="form-group">
                                <label>📋 備註內容</label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    rows={3}
                                    placeholder="選填"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="modal-footer" style={{
                    padding: '16px', background: 'var(--bg-card-secondary)', borderRadius: '0 0 24px 24px',
                    display: 'flex', gap: '8px'
                }}>
                    {step === STEPS.SELECT_SHEEP ? (
                        <button
                            className="modal-btn-primary"
                            style={{ width: '100%' }}
                            disabled={selectedSheepIds.size === 0}
                            onClick={() => setStep(STEPS.CONFIGURE_PLAN)}
                        >
                            下一步 ({selectedSheepIds.size})
                        </button>
                    ) : (
                        <>
                            <button
                                className="modal-btn-secondary"
                                style={{ flex: 1 }}
                                onClick={() => setStep(STEPS.SELECT_SHEEP)}
                                disabled={isSubmitting}
                            >
                                回上一步
                            </button>
                            <button
                                className="modal-btn-primary"
                                style={{ flex: 2 }}
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? '建立中...' : '確認建立'}
                            </button>
                        </>
                    )}
                </div>

            </div>
        </div>
    );
};
