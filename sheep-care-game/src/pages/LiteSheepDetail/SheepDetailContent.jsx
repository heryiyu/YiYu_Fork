import React from 'react';
import { SheepDetailDashboard } from '../../components/modals/SheepDetailDashboard';
import { SheepDetailPlan } from '../../components/modals/SheepDetailPlan';
import { SheepDetailPlanFeedback } from '../../components/modals/SheepDetailPlanFeedback';
import { SheepDetailEffects } from '../../components/modals/SheepDetailEffects';
import { SheepDetailSettings } from '../../components/modals/SheepDetailSettings';
import { PlanDetailModal } from '../../components/modals/PlanDetailModal';

export const SheepDetailContent = ({
    activeTab,
    setActiveTab,
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
    openAddPlan,
    isSleepingState,
    getStatusText,
    name,
    setName,
    tags,
    tagAssignmentsBySheep,
    setSheepTags,
    setShowTagManager,
    updateSheep,
    viewMode,
    selectedSchedule,
    setSelectedSchedule,
    fetchPlans,
    completionData,
    setCompletionData,
    handleCompleteSubmit,
    planActionLoading,
    setViewMode,
    completionTarget,
    STAMPS,
    handleStampToggle,
    isEditMode,
    handleLabelEditStart,
    handleLabelSave,
    setIsEditMode,
    tempLabels,
    setTempLabels,
    tempStamps,
    handlePlanClick
}) => {
    return (
        <div className="sheep-detail-modal-form" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="modal-tabs">
                <button
                    className={`modal-tab ${activeTab === 'DASHBOARD' ? 'modal-tab-active' : ''}`}
                    onClick={() => setActiveTab('DASHBOARD')}
                >
                    總覽
                </button>
                <button
                    className={`modal-tab ${activeTab === 'PLAN' ? 'modal-tab-active' : ''}`}
                    data-tab="plan"
                    onClick={() => setActiveTab('PLAN')}
                >
                    認領規劃
                </button>
                <button
                    className={`modal-tab ${activeTab === 'EFFECTS' ? 'modal-tab-active' : ''}`}
                    data-tab="effects"
                    onClick={() => setActiveTab('EFFECTS')}
                >
                    紀錄
                </button>
                <button
                    className={`modal-tab ${activeTab === 'SETTINGS' ? 'modal-tab-active' : ''}`}
                    onClick={() => setActiveTab('SETTINGS')}
                >
                    資訊
                </button>
            </div>

            <div className="sheep-detail-scroll">
                {activeTab === 'DASHBOARD' && (
                    <SheepDetailDashboard
                        target={target}
                        currentCount={currentCount}
                        isFull={isFull}
                        isAdmin={isAdmin}
                        isPrayingAnim={isPrayingAnim}
                        handlePray={handlePray}
                        localMsg={localMsg}
                        note={note}
                        setNote={setNote}
                        handleBasicAutoSave={handleBasicAutoSave}
                        plans={plans}
                        openCompletePlan={openCompletePlan}
                        setActiveTab={setActiveTab}
                        openAddPlan={openAddPlan}
                        isSleepingState={isSleepingState}
                        getStatusText={getStatusText}
                    />
                )}

                {activeTab === 'SETTINGS' && (
                    <SheepDetailSettings
                        target={target}
                        name={name}
                        setName={setName}
                        handleBasicAutoSave={handleBasicAutoSave}
                        tags={tags}
                        tagAssignmentsBySheep={tagAssignmentsBySheep}
                        setSheepTags={setSheepTags}
                        setShowTagManager={setShowTagManager}
                        isAdmin={isAdmin}
                        isSleepingState={isSleepingState}
                        updateSheep={updateSheep}
                    />
                )}

                {activeTab === 'PLAN' && (
                    <div className="spiritual-plan-container" style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
                        {viewMode === 'LIST' && (
                            selectedSchedule ? (
                                <div className="nested-plan-detail" style={{
                                    flex: 1,
                                    height: '100%',
                                    background: 'var(--bg-card)',
                                    animation: 'slideIn 0.3s ease-out',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}>
                                    <PlanDetailModal
                                        key={selectedSchedule.id}
                                        embedded={true}
                                        schedule={selectedSchedule}
                                        onClose={() => {
                                            setSelectedSchedule(null);
                                            fetchPlans();
                                        }}
                                        onComplete={() => {
                                            openCompletePlan(selectedSchedule);
                                        }}
                                    />
                                </div>
                            ) : (
                                <SheepDetailPlan
                                    plans={plans}
                                    handlePlanClick={handlePlanClick}
                                    openAddPlan={openAddPlan}
                                    openCompletePlan={openCompletePlan}
                                />
                            )
                        )}

                        {viewMode !== 'LIST' && (
                            <SheepDetailPlanFeedback
                                viewMode={viewMode}
                                completionData={completionData}
                                setCompletionData={setCompletionData}
                                handleCompleteSubmit={handleCompleteSubmit}
                                planActionLoading={planActionLoading}
                                setViewMode={setViewMode}
                                completionTarget={completionTarget}
                                plans={plans}
                                setSelectedSchedule={setSelectedSchedule}
                            />
                        )}
                    </div>
                )}

                {activeTab === 'EFFECTS' && (
                    <SheepDetailEffects
                        target={target}
                        isAdmin={isAdmin}
                        STAMPS={STAMPS}
                        handleStampToggle={handleStampToggle}
                        isEditMode={isEditMode}
                        handleLabelEditStart={handleLabelEditStart}
                        handleLabelSave={handleLabelSave}
                        setIsEditMode={setIsEditMode}
                        tempLabels={tempLabels}
                        setTempLabels={setTempLabels}
                        tempStamps={tempStamps}
                    />
                )}
            </div>
        </div>
    );
};
