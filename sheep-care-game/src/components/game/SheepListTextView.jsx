import './SheepListLite.css';
import { getAwakeningProgress } from '../../utils/gameLogic';

export const SheepListTextView = ({
    sheepList,
    selectedIds,
    onSelect,
    isSelectionMode,
    tags = [],
    tagAssignmentsBySheep = {},
    isLiteMode = true,
    onToggleAll,
    isAllSelected
}) => {
    if (!sheepList || sheepList.length === 0) {
        return (
            <div className="sheep-list-empty" style={{ padding: '24px', textAlign: 'center', color: '#6c757d' }}>
                <p>沒有符合條件的小羊</p>
            </div>
        );
    }

    const containerClass = isLiteMode ? 'sheep-list-lite-container is-lite-mode' : 'sheep-list-lite-container is-game-mode';

    return (
        <div className={containerClass}>
            <div className={`sheep-lite-header ${isSelectionMode ? 'is-selection-mode' : ''}`}>
                {isSelectionMode && (
                    <div className="lite-col-checkbox" onClick={onToggleAll}>
                        <div className={`lite-checkbox ${isAllSelected ? 'checked' : ''}`}>
                            {isAllSelected && <span>✓</span>}
                        </div>
                    </div>
                )}
                <div className="lite-col-name">名字</div>
                <div className="lite-col-maturity">靈程</div>
                {isLiteMode ? (
                    <>
                        <div className="lite-col-health">狀況</div>
                        <div className="lite-col-pray">禱告/喚醒</div>
                        <div className="lite-col-needs">代禱需要</div>
                    </>
                ) : (
                    <div className="lite-col-needs">代禱需要</div>
                )}
            </div>
            <div className="sheep-lite-body">
                {sheepList.map(sheep => {
                    const isSelected = selectedIds.has(sheep.id);
                    const isPinned = sheep.isPinned;

                    const currentStatus = sheep.status;
                    const currentIsSleeping = currentStatus === 'sleeping' || currentStatus === 'dead';
                    const currentIsSick = currentStatus === 'sick';
                    const assigned = (tagAssignmentsBySheep[sheep.id] || []);
                    const firstTagId = assigned.length > 0 ? assigned[0].tagId : null;
                    const firstTag = firstTagId ? tags.find(t => t.id === firstTagId) : null;
                    const tagLabel = firstTag ? firstTag.name : (currentIsSleeping ? '已沉睡' : (currentIsSick ? '生病' : '健康'));

                    // For the dynamic style of tags
                    const tagBg = firstTag ? (firstTag.color || 'var(--palette-gray-muted)') : (currentIsSleeping ? 'var(--tag-dead-bg)' : (currentIsSick ? 'var(--tag-sick-bg)' : 'var(--tag-healthy-bg)'));
                    const tagText = firstTag ? 'var(--text-inverse)' : (currentIsSleeping ? 'var(--tag-dead-text)' : (currentIsSick ? 'var(--tag-sick-text)' : 'var(--tag-healthy-text)'));

                    return (
                        <div
                            key={sheep.id}
                            className={`sheep-lite-row ${isSelected ? 'is-selected' : ''} ${isSelectionMode ? 'is-selection-mode' : ''}`}
                            onClick={() => onSelect(sheep.id)}
                        >
                            {isSelectionMode && (
                                <div className="lite-col-checkbox">
                                    <div className={`lite-checkbox ${isSelected ? 'checked' : ''}`}>
                                        {isSelected && <span>✓</span>}
                                    </div>
                                </div>
                            )}
                            <div className="lite-col-name">
                                {sheep.name}
                                {isPinned && <span className="pinned-indicator">📌</span>}
                            </div>
                            <div className="lite-col-maturity">
                                {sheep.spiritualMaturity || '0'}
                            </div>
                            {isLiteMode ? (
                                <>
                                    <div className="lite-col-health">
                                        <span className="lite-status-tag" style={{ background: tagBg, color: tagText }}>
                                            {tagLabel}
                                        </span>
                                    </div>
                                    <div className={`lite-col-pray ${currentIsSleeping ? 'is-sleeping' : ''}`}>
                                        {currentIsSleeping ? `🕯️ 喚醒 ${getAwakeningProgress(sheep)}/5` : `🙏 禱告 ${sheep.prayedCount || 0}/3`}
                                    </div>
                                    <div className="lite-col-needs">
                                        {sheep.note || <span className="lite-text-muted">無內容</span>}
                                    </div>
                                </>
                            ) : (
                                <div className="lite-col-needs">
                                    {sheep.note || <span className="lite-text-muted">無內容</span>}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
