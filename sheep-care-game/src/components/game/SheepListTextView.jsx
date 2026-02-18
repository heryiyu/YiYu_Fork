import React from 'react';
import { MapPin } from 'lucide-react';

export const SheepListTextView = ({
    sheepList,
    selectedIds,
    onSelect,
    isSelectionMode
}) => {
    if (!sheepList || sheepList.length === 0) {
        return (
            <div className="sheep-list-empty">
                <p>沒有符合條件的小羊</p>
            </div>
        );
    }

    return (
        <div className="sheep-list-text-view">
            <div className="sheep-text-header">
                <div className="col-name">名字</div>
                <div className="col-maturity">靈程</div>
                <div className="col-needs">代禱需要</div>
            </div>
            <div className="sheep-text-body">
                {sheepList.map(sheep => {
                    const isSelected = selectedIds.has(sheep.id);
                    const isPinned = sheep.isPinned; // Assuming this property exists or passed down

                    return (
                        <div
                            key={sheep.id}
                            className={`sheep-text-row ${isSelected ? 'is-selected' : ''}`}
                            onClick={() => onSelect(sheep.id)}
                        >
                            <div className="col-name">
                                {sheep.name}
                                {isPinned && <span className="pinned-indicator">📌</span>}
                            </div>
                            <div className="col-maturity">
                                {sheep.spiritualMaturity || 0}
                            </div>
                            <div className="col-needs">
                                {sheep.note || <span className="text-muted">無內容</span>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
