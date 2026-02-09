import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { AssetSheep } from './AssetSheep';
import { CloseButton } from './ui/CloseButton';
import { Button } from './ui/Button';
import { generateVisuals, parseMaturity } from '../utils/gameLogic';
import { ASSETS } from '../utils/AssetRegistry';
// AuthContext import removed

const ACCESSORIES = [
    { id: 'none', label: '無' },
    { id: 'tie_red', label: '紅領帶' },
    { id: 'tie_blue', label: '藍領帶' },
    { id: 'flower', label: '小花' },
    { id: 'scarf_green', label: '綠圍巾' },
];

export const AddSheepModal = ({ onConfirm, onCancel, editingSheep = null }) => {
    const { isAdmin } = useGame(); // Get isAdmin directly
    const [isBatchMode, setIsBatchMode] = useState(false);

    // Basic Info
    const [name, setName] = useState(editingSheep?.name || '');
    const [note, setNote] = useState(editingSheep?.note || '');
    const [spiritualMaturity, setSpiritualMaturity] = useState('');
    // maturityStage removed

    // Visual Info
    // Randomize on mount if new
    const [selectedVariant, setSelectedVariant] = useState(() => {
        if (editingSheep?.visual?.variant) return editingSheep.visual.variant;
        // Random pick
        const opts = ASSETS.VARIANT_OPTIONS;
        return opts[Math.floor(Math.random() * opts.length)].id;
    });
    // Accessories removed as per request
    const selectedAccessory = 'none';

    const [batchInput, setBatchInput] = useState('');

    // Load initial maturity strings
    useEffect(() => {
        if (editingSheep?.spiritualMaturity) {
            // Simplified: just take the whole string or parse level only if needed.
            // Since stage is gone, we assume existing data might have it but we only care about the Level part if we were separating them.
            // But now we just want "Level".
            const { level } = parseMaturity(editingSheep.spiritualMaturity);
            setSpiritualMaturity(level);
        }
    }, [editingSheep]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validNameRegex = /^[\u4e00-\u9fa5a-zA-Z0-9\s]+$/;

        // 1. Creation Mode (Batch)
        if (isBatchMode && !editingSheep) {
            const lines = batchInput.trim().split('\n').filter(line => line.trim());
            const sheepData = [];

            for (const line of lines) {
                const parts = line.split(/[ \t,，]+/).map(p => p.trim());
                const sName = parts[0];

                if (!sName) continue;
                if (!validNameRegex.test(sName)) {
                    alert(`名稱 "${sName}" 包含無效字元！僅允許中文、英文、數字與空白。`);
                    return;
                }
                if (sName.length > 12) {
                    alert(`名稱 "${sName}" 太長了！請控制在 12 字以內。`);
                    return;
                }

                // Random variant for batch
                const randomVariant = ASSETS.VARIANT_OPTIONS[Math.floor(Math.random() * ASSETS.VARIANT_OPTIONS.length)].id;

                sheepData.push({
                    name: sName,
                    spiritualMaturity: parts[1] || '', // Ignore 3rd part (Stage)
                    visual: { variant: randomVariant, accessory: 'none' },
                    skinId: null
                });
            }

            if (sheepData.length === 0) return;
            onConfirm(sheepData);
            return;
        }

        // 2. Single Creation OR Edit Logic
        const trimmedName = name.trim();
        if (!trimmedName) return alert("名稱不能為空");
        if (!validNameRegex.test(trimmedName)) return alert("名稱無效");
        if (trimmedName.length > 12) return alert("名稱太長");

        // finalMaturity is just the level now
        let finalMaturity = spiritualMaturity;

        onConfirm({
            name: trimmedName,
            note: note ? note.trim() : '',
            spiritualMaturity: finalMaturity,
            visual: {
                variant: selectedVariant,
                accessory: 'none'
            },
            skinId: null
        });
    };

    const isEditing = !!editingSheep;
    // Always true if create, check diff if edit
    const hasVisualChanges = true;

    return (
        <div className="debug-editor-overlay" onClick={onCancel}>
            <div className="modal-card modal-card--sm" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{isEditing ? `🎨 編輯外觀` : (isBatchMode ? '批量新增' : '新增小羊')}</h3>
                    <CloseButton onClick={onCancel} ariaLabel="關閉" />
                </div>

                <div className="modal-form" style={{ padding: '16px', gap: '10px' }}>
                {(!isBatchMode || isEditing) && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0px' }}>
                        <div style={{
                            position: 'relative', width: '100px', height: '90px',
                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                        }}>
                            <AssetSheep
                                centered={true}
                                scale={0.6}
                                visual={{
                                    variant: selectedVariant,
                                    accessory: 'none'
                                }}
                                status="healthy"
                            />
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>

                    {(!isBatchMode || isEditing) ? (
                        <>
                            {isAdmin && (
                                <div className="form-group">
                                    <label>外觀 (Admin)</label>
                                    <select value={selectedVariant} onChange={e => setSelectedVariant(e.target.value)}>
                                        {ASSETS.VARIANT_OPTIONS.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
                                    </select>
                                </div>
                            )}

                            {/* Basic Info */}
                            {!isEditing && (
                                <>
                                    <div className="form-group">
                                        <label>名稱</label>
                                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="小羊" required />
                                    </div>
                                    <div className="form-group">
                                        <label>靈程</label>
                                        <select value={spiritualMaturity} onChange={e => setSpiritualMaturity(e.target.value)}>
                                            <option value="">未設定</option>
                                            <option value="新朋友">新朋友</option>
                                            <option value="慕道友">慕道友</option>
                                            <option value="基督徒">基督徒</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>備註</label>
                                        <textarea
                                            value={note}
                                            onChange={e => setNote(e.target.value)}
                                            placeholder="..."
                                            style={{ resize: 'none', minHeight: '40px', height: '40px' }}
                                        />
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <label>批量輸入</label>
                            <textarea
                                value={batchInput}
                                onChange={(e) => setBatchInput(e.target.value)}
                                placeholder="例：王大明 新朋友 (換行輸入下一位)"
                                style={{ flex: 1, resize: 'none' }}
                                required
                            />
                        </div>
                    )}

                    <div style={{ marginTop: 'auto' }}>
                        <Button
                            type="submit"
                            variant="success"
                            disabled={isBatchMode ? !batchInput.trim() : !name.trim()}
                        >
                            {isEditing ? '儲存' : (isBatchMode ? '批量新增' : '新增')}
                        </Button>
                    </div>

                    {!isEditing && (
                        <div style={{ textAlign: 'center', marginTop: '2px' }}>
                            <span onClick={() => setIsBatchMode(!isBatchMode)} style={{ fontSize: '0.75rem', color: 'var(--text-muted-light)', cursor: 'pointer', textDecoration: 'underline' }}>
                                {isBatchMode ? '單一模式' : '批量模式'}
                            </span>
                        </div>
                    )}
                </form>
                </div>
            </div>
        </div>
    );
};
