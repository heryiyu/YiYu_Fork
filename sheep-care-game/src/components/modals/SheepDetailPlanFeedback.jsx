import React from 'react';
import { FeedbackForm } from '../game/FeedbackForm';
import { FeedbackResult } from '../game/FeedbackResult';

export const SheepDetailPlanFeedback = ({
    viewMode,
    completionData,
    setCompletionData,
    handleCompleteSubmit,
    planActionLoading,
    setViewMode,
    completionTarget,
    plans,
    setSelectedSchedule
}) => {
    if (viewMode === 'COMPLETE') {
        return (
            <FeedbackForm
                initialData={completionData}
                onSubmit={(data) => {
                    setCompletionData(data);
                    handleCompleteSubmit(data);
                }}
                onCancel={() => setViewMode('LIST')}
                loading={planActionLoading}
            />
        );
    }

    if (viewMode === 'RESULT') {
        return (
            <FeedbackResult
                data={completionData}
                onEdit={() => setViewMode('COMPLETE')}
                onBack={() => setViewMode('LIST')}
                onViewPlan={() => {
                    const p = plans.find(plan => plan.participant_id === completionTarget);
                    if (p && p.originalSchedule) {
                        setSelectedSchedule(p.originalSchedule);
                        setViewMode('LIST');
                    }
                }}
            />
        );
    }

    return null;
};
