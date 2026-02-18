import React from 'react';
import { Heart, Calendar, Plus, Check, Edit2 } from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';

export const SheepDetailDashboard = ({
    target,
    currentCount,
    isFull,
    isAdmin,
    isPrayingAnim,
    handlePray,
    localMsg,
    note,
    setNote,
    handleBasicAutoSave,
    plans,
    openCompletePlan,
    setActiveTab,
    openAddPlan,
    isSleepingState,
    getStatusText
}) => {
    return (
        <div className="dashboard-layout">
            {/* 1. Compact Status Header */}
            <div className="status-header-compact">
                <div className="status-header-left">
                    <div className="status-header-avatar">
                        {isSleepingState ? '🪦' : (target.health >= 80 ? '💪' : (target.status === 'sick' ? '🤒' : '🐑'))}
                    </div>
                    <div className="status-header-info">
                        <div className="status-header-main">
                            {isSleepingState ? '沉睡中' : `${getStatusText(target.status, target.health)}`}
                        </div>
                        {!isSleepingState && (
                            <div className="status-header-sub">
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Heart size={12} fill="currentColor" color="var(--palette-orange-action)" />
                                    {target.careLevel || 0}
                                </span>
                                <span style={{ color: '#ddd', margin: '0 4px' }}>|</span>
                                <span style={{ color: target.health < 60 ? 'red' : 'inherit' }}>
                                    負擔 {Math.ceil(target.health)}%
                                </span>
                                <span style={{ color: '#ddd', margin: '0 4px' }}>|</span>
                                <span>
                                    禱告 {currentCount}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="status-header-action">
                    <Tooltip content={isSleepingState ? '喚醒禱告' : '認領禱告'} side="left">
                        <button
                            className={`pray-btn-compact ${isPrayingAnim ? 'praying' : ''}`}
                            onClick={handlePray}
                            disabled={!isSleepingState && isFull && !isAdmin}
                        >
                            {isPrayingAnim ? '🙏 禱告中...' : '🙏 為他禱告'}
                        </button>
                    </Tooltip>
                </div>
            </div>

            {localMsg && (
                <div className="modal-local-msg" style={{ margin: '0 8px' }}>
                    {localMsg}
                </div>
            )}

            {/* 2. Hero Note Section */}
            <div className="note-hero-container">
                <div className="note-hero">
                    <div className="note-hero-label">
                        📌 牧養筆記 / 代禱事項
                    </div>
                    <textarea
                        className="note-hero-input"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        onBlur={() => handleBasicAutoSave('note', note)}
                        placeholder={isSleepingState ? "為他寫下禱告..." : "他在這，有什麼需要代禱的嗎？..."}
                        rows={3}
                    />
                </div>
            </div>

            {/* 3. Next Plan Ticket */}
            <div className="plan-ticket-container">
                <div className="section-label">
                    <Calendar size={14} /> 下一步行動
                </div>

                {(() => {
                    const now = new Date();
                    const visiblePlans = (plans || []).filter(p => {
                        if (p.completed_at) return false;

                        // Visibility Logic:
                        if (p.scheduled_time) {
                            return now >= new Date(p.scheduled_time);
                        }

                        // Fallback: 1 day after creation
                        if (p.created_at) {
                            const oneDayMs = 24 * 60 * 60 * 1000;
                            return now >= new Date(new Date(p.created_at).getTime() + oneDayMs);
                        }

                        return false; // Should not happen if data is consistent
                    });

                    if (visiblePlans.length > 0) {
                        const nextPlan = visiblePlans[0];
                        const d = nextPlan.scheduled_time ? new Date(nextPlan.scheduled_time) : null;
                        const dateStr = d ? `${d.getMonth() + 1}/${d.getDate()}` : '--/--';
                        const timeStr = d ? d.toLocaleTimeString('zh-TW', { hour: 'numeric', minute: '2-digit' }) : '';

                        return (
                            <div className="plan-ticket">
                                <div className="ticket-left">
                                    <div className="ticket-date">{dateStr}</div>
                                    <div className="ticket-time">{timeStr}</div>
                                </div>
                                <div className="ticket-right">
                                    <div className="ticket-content">
                                        <div>
                                            <div className="ticket-action">{nextPlan.action}</div>
                                            {nextPlan.location && <div className="ticket-sub">📍 {nextPlan.location}</div>}
                                        </div>
                                    </div>
                                    <button
                                        className="ticket-btn-complete"
                                        style={{ background: 'var(--palette-orange-action)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}
                                        onClick={() => openCompletePlan(nextPlan)}
                                    >
                                        <Edit2 size={14} /> 認領紀錄
                                    </button>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div
                            className="plan-add-dashed"
                            onClick={() => {
                                setActiveTab('PLAN');
                                openAddPlan();
                            }}
                        >
                            <Plus size={20} />
                            <span>新增認領規劃</span>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
};
