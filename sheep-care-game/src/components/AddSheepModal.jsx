import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { AssetSheep } from './AssetSheep';
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
            <div className="simple-editor" onClick={(e) => e.stopPropagation()}
                style={{
                    width: '320px',
                    padding: '16px',
                    // Restore default background by removing inline override
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    // Removed boxShadow and background to respect CSS class
                }}>

                <div className="editor-header" style={{ marginBottom: '0px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{isEditing ? `🎨 編輯外觀` : (isBatchMode ? '批量新增' : '新增小羊')}</h3>
                    <button className="close-btn" onClick={onCancel}>✖</button>
                </div>

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
                                <div style={{ marginBottom: '8px' }}>
                                    <label style={{ fontSize: '0.8rem', color: '#666', display: 'block', marginBottom: '2px' }}>外觀 (Admin)</label>
                                    <select style={{ width: '100%', padding: '4px' }} value={selectedVariant} onChange={e => setSelectedVariant(e.target.value)}>
                                        {ASSETS.VARIANT_OPTIONS.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
                                    </select>
                                </div>
                            )}

                            {/* Basic Info */}
                            {!isEditing && (
                                <>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>名稱</label>
                                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="小羊"
                                            style={{ width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '5px' }} required />
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '2px' }}>靈程</label>
                                            <select value={spiritualMaturity} onChange={e => setSpiritualMaturity(e.target.value)}
                                                style={{ width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '5px' }}>
                                                <option value="">未設定</option>
                                                <option value="新朋友">新朋友</option>
                                                <option value="慕道友">慕道友</option>
                                                <option value="基督徒">基督徒</option>
                                            </select>
                                        </div>
                                        {/* Stage Selector Removed */}
                                    </div>
                                    <div style={{ marginTop: '4px' }}>
                                        <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '2px' }}>備註</label>
                                        <textarea
                                            value={note}
                                            onChange={e => setNote(e.target.value)}
                                            placeholder="..."
                                            style={{
                                                width: '100%', padding: '6px', border: '1px solid #ccc',
                                                borderRadius: '5px', resize: 'none', minHeight: '40px', height: '40px'
                                            }}
                                        />
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>批量輸入</label>
                            <textarea
                                value={batchInput}
                                onChange={(e) => setBatchInput(e.target.value)}
                                placeholder="例：王大明 新朋友 (換行輸入下一位)"
                                style={{ flex: 1, width: '100%', padding: '8px', border: '1px solid #ccc', resize: 'none' }}
                                required
                            />
                        </div>
                    )}

                    <div style={{ marginTop: 'auto' }}>
                        <button
                            type="submit"
                            disabled={isBatchMode ? !batchInput.trim() : !name.trim()}
                            style={{
                                width: '100%',
                                padding: '8px',
                                background: (isBatchMode ? !batchInput.trim() : !name.trim()) ? '#ccc' : '#66bb6a',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                fontWeight: 'bold',
                                cursor: (isBatchMode ? !batchInput.trim() : !name.trim()) ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {isEditing ? '儲存' : (isBatchMode ? '批量新增' : '新增')}
                        </button>
                    </div>

                    {!isEditing && (
                        <div style={{ textAlign: 'center', marginTop: '2px' }}>
                            <span onClick={() => setIsBatchMode(!isBatchMode)} style={{ fontSize: '0.75rem', color: '#999', cursor: 'pointer', textDecoration: 'underline' }}>
                                {isBatchMode ? '單一模式' : '批量模式'}
                            </span>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};
