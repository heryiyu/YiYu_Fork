import React, { useState } from 'react';
import './SheepSwipeCard.css';
import { Settings, Edit2, Heart, Award, Clock, Save, X } from 'lucide-react';
import { AssetSheep } from './AssetSheep';
import { isSleeping } from '../../utils/gameLogic';
import { useGameActions } from '../../context/GameContext/useGame';

export const SheepSwipeCardBack = ({ sheep, tags, tagAssignmentsBySheep, onFlipBack }) => {
    
    const [isEditMode, setIsEditMode] = useState(false);
    const { updateSheep, setSheepTags } = useGameActions();
    
    // Edit Form State
    const [note, setNote] = useState(sheep.note || '');
    const [isSaving, setIsSaving] = useState(false);
    
    const assignedTags = tagAssignmentsBySheep[sheep.id] || [];
    
    const toggleTag = async (tagId) => {
        const isAssigned = assignedTags.some(a => a.tagId === tagId);
        let newTagIds;
        if (isAssigned) {
            newTagIds = assignedTags.filter(a => a.tagId !== tagId).map(a => a.tagId);
        } else {
            newTagIds = [...assignedTags.map(a => a.tagId), tagId];
        }
        await setSheepTags(sheep.id, newTagIds);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (sheep.note !== note) {
                await updateSheep(sheep.id, { note });
            }
            setIsEditMode(false); // return to read-only back face
        } catch (error) {
            console.error("保存失敗", error);
        } finally {
            setIsSaving(false);
        }
    };

    const isSleepingState = isSleeping(sheep);
    
    const getStatusText = (status, health) => {
        if (isSleepingState) return '已沉睡 🪦';
        if (status === 'sick') return '生病 🤒';
        if (health >= 80) return '強壯 💪';
        return '健康 🐑';
    };

    const birthDate = new Date(sheep.birthday || sheep.created_at || Date.now());
    const diffTime = Math.abs(new Date() - birthDate);
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    
    return (
        <div 
            className="sheep-swipe-card-face back-face" 
            onClick={() => { if (!isEditMode) onFlipBack(); }} 
            style={{ cursor: isEditMode ? 'default' : 'pointer', padding: isEditMode ? '24px' : '32px 24px', boxSizing: 'border-box' }}
        >
            
            {!isEditMode ? (
                // --- READ ONLY MODE ---
                <>
                    {/* Center Avatar & Edit Button */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px', marginTop: '16px' }}>
                        <div style={{ position: 'relative' }}>
                            <div style={{ 
                                width: '100px', height: '100px', 
                                borderRadius: '50%', backgroundColor: '#F0EAE1', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                overflow: 'hidden',
                                boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.08)'
                            }}>
                                <AssetSheep
                                    status={sheep.status}
                                    visual={sheep.visual}
                                    health={sheep.health}
                                    type={sheep.type}
                                    scale={0.8}
                                    direction={1}
                                    centered={true}
                                    showStatusIcon={false}
                                />
                            </div>
                            
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsEditMode(true);
                                }}
                                style={{
                                    position: 'absolute',
                                    bottom: '-4px',
                                    right: '-8px',
                                    width: '32px',
                                    height: '32px',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s ease, color 0.2s ease',
                                    padding: 0,
                                    color: '#020617' /* Shadcn slate-950 black */
                                }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.05)'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                onMouseDown={e => e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.1)'}
                                onMouseUp={e => e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.05)'}
                            >
                                <Edit2 size={18} strokeWidth={2} />
                            </button>
                        </div>
                        
                        <h3 style={{ margin: '20px 0 4px 0', fontSize: '1.8rem', fontWeight: 800, color: '#000' }}>
                            {sheep.name}
                        </h3>
                    </div>

                    {/* Basic Info Grid */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(0,0,0,0.03)', padding: '24px 20px', borderRadius: '24px', marginBottom: 'auto' }}>
                        
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6D6860', fontWeight: 'bold' }}>
                                <Heart size={18} /> 健康狀態
                            </div>
                            <div style={{ fontWeight: 800, color: '#111827', fontSize: '1.1rem' }}>
                                {getStatusText(sheep.status, sheep.health)} ({Math.round(sheep.health)}%)
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6D6860', fontWeight: 'bold' }}>
                                <Award size={18} /> 靈程
                            </div>
                            <div style={{ fontWeight: 800, color: '#111827', fontSize: '1.1rem' }}>
                                {sheep.spiritualMaturity || '新朋友'}
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6D6860', fontWeight: 'bold' }}>
                                <Clock size={18} /> 來到羊群
                            </div>
                            <div style={{ fontWeight: 800, color: '#111827', fontSize: '1.1rem' }}>
                                {diffDays} 天
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', margin: '4px 0' }}></div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6D6860', fontWeight: 'bold' }}>
                                上次聯絡
                            </div>
                            <div style={{ fontWeight: 800, color: '#111827', fontSize: '1.1rem' }}>
                                {sheep.lastPrayedDate ? new Date(sheep.lastPrayedDate).toLocaleDateString() : '無紀錄'}
                            </div>
                        </div>
                        
                    </div>
                </>
            ) : (
                // --- EDIT MODE ---
                <>
                    {/* Header in Edit Mode */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                        <div style={{ 
                            width: '60px', height: '60px', 
                            borderRadius: '50%', backgroundColor: '#F0EAE1', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, overflow: 'hidden', position: 'relative',
                            boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.05)'
                        }}>
                            <AssetSheep
                                status={sheep.status}
                                visual={sheep.visual}
                                health={sheep.health}
                                type={sheep.type}
                                scale={0.5}
                                direction={1}
                                centered={true}
                                showStatusIcon={false}
                            />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#000' }}>
                                {sheep.name}
                            </h3>
                            <div style={{ fontSize: '0.85rem', color: '#6D6860', marginTop: '4px', fontWeight: 'bold' }}>
                                📝 編輯代禱資料
                            </div>
                        </div>
                    </div>

                    {/* Tags Selection */}
                    <div className="sheep-swipe-edit-section">
                        <label className="sheep-swipe-label">分類標籤</label>
                        <div className="sheep-swipe-tags-wrap" style={{ marginTop: '8px' }}>
                            {tags.map(t => {
                                const isAssigned = assignedTags.some(a => a.tagId === t.id);
                                return (
                                    <button
                                        key={t.id}
                                        className={`sheep-swipe-tag-edit ${isAssigned ? 'active' : ''}`}
                                        style={{
                                            backgroundColor: isAssigned ? t.color : 'transparent',
                                            color: isAssigned ? '#fff' : t.color,
                                            borderColor: t.color,
                                        }}
                                        onClick={(e) => { e.stopPropagation(); toggleTag(t.id); }}
                                    >
                                        {t.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Note Textarea */}
                    <div className="sheep-swipe-edit-section" style={{ flex: 1, display: 'flex', flexDirection: 'column', marginTop: '16px' }}>
                        <label className="sheep-swipe-label">代禱事項筆記</label>
                        <textarea 
                            className="sheep-swipe-textarea"
                            placeholder="請輸入您想為他代禱的事項..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>

                    {/* Footer Buttons in Edit Mode */}
                    <div className="sheep-swipe-card-footer" style={{ marginTop: 'auto' }}>
                        <button 
                            className="sheep-swipe-card-btn sheep-swipe-card-btn-secondary" 
                            onClick={(e) => { e.stopPropagation(); setIsEditMode(false); }}
                            disabled={isSaving}
                        >
                            <X size={18} />
                            取消
                        </button>
                        <button 
                            className="sheep-swipe-card-btn sheep-swipe-card-btn-primary" 
                            onClick={(e) => { e.stopPropagation(); handleSave(); }}
                            disabled={isSaving}
                        >
                            <Save size={18} />
                            {isSaving ? '儲存中...' : '儲存變更'}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};
