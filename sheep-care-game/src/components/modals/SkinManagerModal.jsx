import React, { useState, useEffect, useRef } from 'react';
import { CloseButton } from '../ui/CloseButton';
import { skinManagerService } from '../../services/skinManagerService';
import { Portal } from '../ui/Portal';
import { ASSETS } from '../../utils/AssetRegistry';
import './SkinManagerModal.css';

export const SkinManagerModal = ({ onClose }) => {
    const [manifest, setManifest] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Form State
    const [newId, setNewId] = useState('');
    const [newName, setNewName] = useState('');
    const [healthyFile, setHealthyFile] = useState(null);
    const [sickFile, setSickFile] = useState(null); // Optional

    const healthyInputRef = useRef(null);
    const sickInputRef = useRef(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            const data = await skinManagerService.loadManifest();
            setManifest(data || {});
        } catch (err) {
            setErrorMsg('載入外觀清單失敗 (請確認 Supabase Storage 是否開啟)');
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        if (!newId || !newId.match(/^[A-Z0-9_]+$/)) {
            setErrorMsg('ID 必須是全大寫英文、數字或底線 (例如: GOLDEN_SHEEP)');
            return;
        }
        if (!newName.trim()) {
            setErrorMsg('請輸入名稱 (例如: 黃金傳說羊)');
            return;
        }
        if (!healthyFile) {
            setErrorMsg('必須上傳 [健康狀態] 圖片');
            return;
        }

        setSaving(true);
        try {
            await skinManagerService.uploadSkin(newId, newName, healthyFile, sickFile);
            setSuccessMsg(`成功新增外觀: ${newName}! (可以關閉視窗檢查下拉選單)`);

            // Reset form
            setNewId('');
            setNewName('');
            setHealthyFile(null);
            setSickFile(null);
            if (healthyInputRef.current) healthyInputRef.current.value = '';
            if (sickInputRef.current) sickInputRef.current.value = '';

            await loadData();
        } catch (err) {
            setErrorMsg(err.message || '上傳失敗');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`確定要刪除自訂外觀 [${name}] 嗎？正在使用的羊可能會變成預設外觀。`)) return;

        setSaving(true);
        try {
            await skinManagerService.deleteSkin(id);
            setSuccessMsg(`已刪除外觀: ${name}`);
            await loadData();
        } catch (err) {
            setErrorMsg(err.message || '刪除失敗');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Portal>
            <div className="debug-editor-overlay" onClick={onClose} style={{ zIndex: 10005 }}> {/* Higher than AddSheepModal */}
                <div className="modal-card" style={{ maxWidth: '600px', backgroundColor: '#f8f9fa' }} onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header" style={{ background: 'var(--palette-purple)' }}>
                        <h3>✨ 自訂外觀管理器 (Admin)</h3>
                        <CloseButton onClick={onClose} ariaLabel="關閉" />
                    </div>

                    <div className="modal-form" style={{ padding: '20px' }}>

                        <div style={{ background: '#eef2ff', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #c7d2fe' }}>
                            <h4 style={{ margin: '0 0 10px 0', color: '#3730a3' }}>➕ 新增外觀</h4>
                            <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>外觀代碼 (ID)</label>
                                        <input
                                            type="text"
                                            placeholder="例: SUPER_SHEEP"
                                            value={newId}
                                            onChange={e => setNewId(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                                            disabled={saving}
                                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>顯示名稱</label>
                                        <input
                                            type="text"
                                            placeholder="例: 超級小羊"
                                            value={newName}
                                            onChange={e => setNewName(e.target.value)}
                                            disabled={saving}
                                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                                        />
                                    </div>
                                </div>

                                <div style={{ borderTop: '1px dashed #c7d2fe', margin: '5px 0' }}></div>

                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                                        上傳健康狀態圖片 <span style={{ color: 'red' }}>*必填</span>
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/png, image/jpeg, image/gif, image/webp"
                                        ref={healthyInputRef}
                                        onChange={e => setHealthyFile(e.target.files[0])}
                                        disabled={saving}
                                        style={{ fontSize: '0.9rem' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                                        上傳生病狀態圖片 (選填，若無則共用健康圖)
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/png, image/jpeg, image/gif, image/webp"
                                        ref={sickInputRef}
                                        onChange={e => setSickFile(e.target.files[0])}
                                        disabled={saving}
                                        style={{ fontSize: '0.9rem' }}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={saving || !newId || !newName || !healthyFile}
                                    style={{
                                        marginTop: '10px',
                                        padding: '10px',
                                        background: saving ? '#9ca3af' : 'var(--palette-purple)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: 'bold',
                                        cursor: saving ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {saving ? '⏳ 上傳與處理中...' : '⬆️ 確認上傳並新增'}
                                </button>
                            </form>

                            {errorMsg && <p style={{ color: 'red', marginTop: '10px', fontSize: '0.9rem', fontWeight: 'bold' }}>❌ {errorMsg}</p>}
                            {successMsg && <p style={{ color: 'green', marginTop: '10px', fontSize: '0.9rem', fontWeight: 'bold' }}>✅ {successMsg}</p>}
                        </div>

                        <div style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                            <h4 style={{ margin: '0 0 10px 0', color: '#374151' }}>📋 已安裝的自訂外觀清單</h4>

                            {loading ? (
                                <p style={{ color: '#6b7280' }}>載入中...</p>
                            ) : Object.keys(manifest).length === 0 ? (
                                <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>目前尚未上傳任何自訂外觀，此清單為空。</p>
                            ) : (
                                <div style={{ display: 'grid', gap: '10px', maxHeight: '30vh', overflowY: 'auto' }}>
                                    {Object.values(manifest).map(skin => (
                                        <div key={skin.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '6px', background: '#f9fafb' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <img
                                                    src={skinManagerService.getPublicUrl(skin.healthyPath)}
                                                    alt={skin.name}
                                                    style={{ width: '40px', height: '40px', objectFit: 'contain', background: '#e2e8f0', borderRadius: '4px' }}
                                                />
                                                <div>
                                                    <div style={{ fontWeight: 'bold', color: '#111827' }}>{skin.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>ID: {skin.id}</div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDelete(skin.id, skin.name)}
                                                disabled={saving}
                                                style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                                            >
                                                刪除
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </Portal>
    );
};
