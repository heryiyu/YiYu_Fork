import React from 'react';
import { Calendar, Plus, Clock, ChevronRight, Check } from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';
import { ModalHint } from './ModalHint';

export const SheepDetailPlan = ({
    plans,
    handlePlanClick,
    openAddPlan,
    openCompletePlan
}) => {
    return (
        <div className="plan-list-wrapper" style={{ height: '100%', overflowY: 'auto', padding: '0 4px' }}>
            <div className="plan-list-header" style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                paddingBottom: '10px',
                position: 'sticky',
                top: 0,
                zIndex: 10,
                background: 'linear-gradient(to bottom, var(--bg-card) 85%, rgba(255, 255, 255, 0) 100%)'
            }}>
                {plans.length > 0 && (
                    <Tooltip content="新增認領規劃" side="bottom">
                        <button
                            type="button"
                            className="plan-add-btn"
                            onClick={openAddPlan}
                            aria-label="新增認領規劃"
                        >
                            <Plus size={18} strokeWidth={2.5} />
                            <span>新增規劃</span>
                        </button>
                    </Tooltip>
                )}
            </div>

            <ModalHint className="plan-retention-hint">
                系統會自動清理超過一個月的過期行程
            </ModalHint>

            <div className="plan-list">
                {plans.length === 0 ? (
                    <div className="plan-list-empty">
                        <Calendar size={48} strokeWidth={1} style={{ opacity: 0.3 }} />
                        <p>尚無認領規劃</p>
                        <button className="modal-btn-primary" onClick={openAddPlan} style={{ marginTop: '8px', maxWidth: '160px' }}>
                            立即新增
                        </button>
                    </div>
                ) : (
                    plans.map(p => (
                        <div
                            key={p.id}
                            className={`plan-item ${p.completed_at ? 'completed' : ''}`}
                            onClick={() => handlePlanClick(p)}
                        >
                            <div className="plan-item-left">
                                <div className="plan-date-box">
                                    <span className="plan-date-month">
                                        {p.scheduled_time ? new Date(p.scheduled_time).getMonth() + 1 : '--'}月
                                    </span>
                                    <span className="plan-date-day">
                                        {p.scheduled_time ? new Date(p.scheduled_time).getDate() : '--'}
                                    </span>
                                </div>
                                <div className="plan-info">
                                    <div className="plan-action">{p.action}</div>
                                    <div className="plan-meta">
                                        {p.scheduled_time && (
                                            <span className="plan-time">
                                                <Clock size={12} />
                                                {new Date(p.scheduled_time).toLocaleTimeString('zh-TW', { hour: 'numeric', minute: '2-digit' })}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="plan-item-right">
                                {p.completed_at ? (
                                    <span className="status-badge completed">
                                        <Check size={12} strokeWidth={3} />
                                        已完成
                                    </span>
                                ) : (
                                    <ChevronRight size={16} className="arrow-icon" />
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
