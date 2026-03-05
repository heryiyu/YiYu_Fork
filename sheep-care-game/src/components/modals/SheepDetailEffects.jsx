import React from 'react';
import { Edit2, X, Save } from 'lucide-react';
import { ModalHint } from './ModalHint';

export const SheepDetailEffects = ({
    target,
    isAdmin,
    STAMPS,
    handleStampToggle,
    isEditMode,
    handleLabelEditStart,
    handleLabelSave,
    setIsEditMode,
    tempLabels,
    setTempLabels,
    tempStamps
}) => {
    return (
        <div className="spiritual-plan-container">
            <div className="section-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>🏆 認領紀錄 (點擊蓋章)</span>
                {!isEditMode ? (
                    <button
                        className="icon-btn"
                        onClick={handleLabelEditStart}
                        style={{ padding: '4px', height: 'auto', width: 'auto', background: 'transparent', border: 'none', color: 'var(--text-muted)' }}
                    >
                        <Edit2 size={16} />
                    </button>
                ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            className="icon-btn"
                            onClick={() => setIsEditMode(false)}
                            style={{ padding: '4px', height: 'auto', width: 'auto', background: 'transparent', border: 'none', color: 'var(--text-muted)' }}
                        >
                            <X size={16} />
                        </button>
                        <button
                            className="icon-btn"
                            onClick={handleLabelSave}
                            style={{ padding: '4px', height: 'auto', width: 'auto', background: 'transparent', border: 'none', color: 'var(--palette-blue-action)' }}
                        >
                            <Save size={16} />
                        </button>
                    </div>
                )}
            </div>
            <div className="stamp-grid">
                {Object.values(STAMPS).map(stamp => {
                    const currentStamps = isEditMode ? tempStamps : (target.stamps || {});
                    const isStamped = isEditMode
                        ? !!currentStamps[stamp.id]
                        : (Array.isArray(currentStamps)
                            ? currentStamps.includes(stamp.id)
                            : !!currentStamps[stamp.id]);

                    const Icon = stamp.icon;
                    return (
                        <div
                            key={stamp.id}
                            className={`stamp-card ${isStamped ? 'stamped' : ''} ${isEditMode ? 'editing' : ''}`}
                            onClick={() => handleStampToggle(stamp.id)}
                            style={{ position: 'relative' }}
                        >
                            {isStamped && (
                                <div className={`stamp-mark ${isEditMode ? 'stamp-cancel' : ''}`}>
                                    {isEditMode ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.9rem' }}>
                                            <X size={16} strokeWidth={3.5} /> 取消
                                        </div>
                                    ) : (
                                        stamp.id === 'decision_prayer' || stamp.id === 'stable_devotion' ? 'AMEN' : 'DONE'
                                    )}
                                </div>
                            )}

                            <div className="stamp-icon-placeholder">
                                <Icon size={24} strokeWidth={isStamped ? 2.5 : 2} />
                            </div>

                            {(isEditMode && isAdmin) ? (
                                <input
                                    type="text"
                                    value={tempLabels[stamp.id] || ''}
                                    onChange={(e) => setTempLabels({ ...tempLabels, [stamp.id]: e.target.value })}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                        width: '100%',
                                        fontSize: '0.8rem',
                                        textAlign: 'center',
                                        border: '1px solid var(--border-main)',
                                        borderRadius: '4px',
                                        padding: '2px',
                                        marginTop: '4px'
                                    }}
                                />
                            ) : (
                                <span className="stamp-label">{stamp.label}</span>
                            )}
                        </div>
                    );
                })}
            </div>
            <ModalHint>
                {isEditMode
                    ? (isAdmin ? '修改後請點擊上方儲存，或點選已蓋章項目以取消' : '點選已蓋章項目以取消，確認後請點擊上方儲存')
                    : '點擊格子即可蓋章。如需取消，請先點擊上方鉛筆。'}
            </ModalHint>
        </div>
    );
};
