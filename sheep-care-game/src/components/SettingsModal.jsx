import React, { useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { ModalHint } from './ModalHint';
import { CloseButton } from './ui/CloseButton';

export const SettingsModal = ({ onClose }) => {
    const { settings, updateSetting, tags } = useGame();
    const closeBtnRef = useRef(null);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    useEffect(() => {
        closeBtnRef.current?.focus();
    }, []);

    const handleChange = (e) => {
        updateSetting('maxVisibleSheep', parseInt(e.target.value));
    };

    const [activeTab, setActiveTab] = React.useState('DISPLAY'); // DISPLAY | SYSTEM

    return (
        <div className="debug-editor-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="settings-modal-title">
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 id="settings-modal-title">⚙️ 系統設定</h3>
                    <CloseButton ref={closeBtnRef} onClick={onClose} ariaLabel="關閉" />
                </div>

                <div className="modal-form">
                    {/* Tabs */}
                    <div className="modal-tabs">
                        <button
                            className={`modal-tab ${activeTab === 'DISPLAY' ? 'modal-tab-active' : ''}`}
                            onClick={() => setActiveTab('DISPLAY')}
                        >
                            🖥️ 顯示設定
                        </button>
                        <button
                            className={`modal-tab ${activeTab === 'SYSTEM' ? 'modal-tab-active' : ''}`}
                            onClick={() => setActiveTab('SYSTEM')}
                        >
                            📖 系統說明
                        </button>
                    </div>

                    <div className="modal-scroll" style={{ marginTop: '0' }}>
                        {activeTab === 'DISPLAY' ? (
                            <div className="modal-content" style={{ padding: '10px' }}>
                                <div className="form-group">
                                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>畫面顯示小羊數量</span>
                                        <span style={{ color: 'var(--palette-blue-action)' }}>{settings.maxVisibleSheep} 隻</span>
                                    </label>

                                    <input
                                        type="range"
                                        min="10"
                                        max="50"
                                        step="5"
                                        value={settings.maxVisibleSheep}
                                        onChange={handleChange}
                                    />

                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#999', marginTop: '5px' }}>
                                        <span>10 (效能)</span>
                                        <span>50 (豐富)</span>
                                    </div>

                                    <ModalHint className="modal-info-box" style={{ marginTop: '10px' }}>
                                        當小羊總數超過此設定時，系統會每分鐘<b>隨機輪播</b>，讓不同的小羊輪流出來透氣，同時保持畫面流暢不卡頓。
                                    </ModalHint>
                                </div>

                                <button className="modal-btn-primary" onClick={onClose} style={{ marginTop: '20px' }}>
                                    確定
                                </button>
                            </div>
                        ) : (
                            <div className="modal-content guide-modal-content" style={{
                                color: '#000',
                                padding: '16px',
                                background: 'rgba(255, 255, 255, 0.15)',
                                borderRadius: '12px',
                                border: '2px solid rgba(143, 125, 103, 0.15)',
                                fontSize: '0.95rem',
                                lineHeight: '1.6'
                            }}>
                                <h4>1. 每日照顧 (Daily Care)</h4>
                                <p>每天透過禱告來關心您的小羊：</p>
                                <ul>
                                    <li><strong>禱告 (Prayer):</strong> 每隻小羊每天最多 <strong>3 次</strong> (每次恢復 <strong>+6 健康度</strong>)。</li>
                                    <li><strong>健康度 (Health):</strong> 代表小羊的生命狀態，越高越有活力。</li>
                                </ul>

                                <h4>2. 小羊標籤 (Tags)</h4>
                                <p>您可自訂標籤來分類小羊，在小羊詳情中選擇「標籤」並點「管理標籤」新增。卡片上會顯示您為該小羊設定的第一個標籤。</p>
                                <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '6px' }}>若小羊尚未設定任何標籤，卡片會顯示系統預設的「已沉睡」「生病」「健康」等狀態文字作為替代，這些並非您建立的標籤，也不會出現在標籤列表中。</p>
                                {tags && tags.length > 0 ? (
                                    <div style={{ marginTop: '8px' }}>
                                        <p style={{ marginBottom: '6px', fontWeight: 600 }}>您目前的標籤：</p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                            {tags.map(t => (
                                                <span
                                                    key={t.id}
                                                    style={{
                                                        padding: '2px 8px',
                                                        borderRadius: 6,
                                                        fontSize: '0.85rem',
                                                        fontWeight: 600,
                                                        background: t.color || '#6b7280',
                                                        color: '#fff'
                                                    }}
                                                >
                                                    {t.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '6px' }}>尚無自訂標籤。點擊小羊 → 基本資料 → 管理標籤 即可新增。</p>
                                )}

                                <h4>3. 離線與自然衰退</h4>
                                <p>即使不在線上，時間仍在流動：</p>
                                <ul>
                                    <li><strong>離線機制:</strong> 健康度會自然流失 (每天約 <strong>13%</strong>)。</li>
                                    <li><strong>守望保護:</strong> 當日有被禱告的小羊，流失大幅減緩至約 <strong>6%</strong>！</li>
                                </ul>

                                <h4>4. 沉睡與甦醒 (Miracle)</h4>
                                <p>沉睡不是終點，信心能喚回生命：</p>
                                <ul>
                                    <li><strong>甦醒儀式:</strong> 對已沉睡的小羊連續 <strong>5 天</strong> 進行「喚醒禱告」(每天1次)。</li>
                                    <li><strong>奇蹟:</strong> 第 5 次禱告後，小羊將甦醒！(保留姓名與靈程，重置為健康小羊)。</li>
                                    <li><strong>中斷歸零:</strong> 若中斷一天沒禱告，進度將歸零重來。</li>
                                </ul>

                                <h4>5. 標籤與資料管理</h4>
                                <ul>
                                    <li><strong>標籤 (Tags):</strong> 可自訂標籤來分類小羊，在小羊詳情中管理。</li>
                                    <li><strong>使用說明:</strong> 請使用 LINE 帳號登入，系統會自動備份您的羊群資料。</li>
                                </ul>

                                <h4>6. 提醒與通知 (Bell)</h4>
                                <ul>
                                    <li><strong>鈴鐺按鈕 (右上方):</strong> 點擊鈴鐺可開啟/關閉牧羊提醒。</li>
                                    <li><strong>提醒時刻:</strong> 早上 8:00、中午 12:00、晚上 18:30。</li>
                                </ul>

                                <p style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
                                    <em>"信心若沒有行為就是死的。"</em>
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
