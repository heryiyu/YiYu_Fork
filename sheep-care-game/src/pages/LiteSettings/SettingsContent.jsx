import React from 'react';
import { useGameState, useGameActions, useUserAuth } from '../../context/GameContext/useGame';
import { ModalHint } from '../../components/modals/ModalHint';
import { Slider } from '../../components/ui/Slider';
import { Tag } from '../../components/ui/Tag';

export const SettingsContent = ({ activeTab, onChangeTab, onSave }) => {
    const { tags, sheep } = useGameState();
    const { updateSetting, togglePin } = useGameActions();
    const { settings } = useUserAuth();

    const handleToggleSheep = (sheepId, isCurrentlySelected) => {
        if (isCurrentlySelected) {
            togglePin(sheepId);
        } else {
            const currentCount = settings.pinnedSheepIds?.length || 0;
            if (currentCount < 10) {
                togglePin(sheepId);
            }
        }
    };

    return (
        <>
            {/* Tabs */}
            <div className="modal-tabs">
                <button
                    className={`modal-tab ${activeTab === 'DISPLAY' ? 'modal-tab-active' : ''}`}
                    onClick={() => onChangeTab('DISPLAY')}
                >
                    🖥️ 顯示
                </button>
                <button
                    className={`modal-tab ${activeTab === 'GUIDE' ? 'modal-tab-active' : ''}`}
                    onClick={() => onChangeTab('GUIDE')}
                >
                    📖 手冊
                </button>
                <button
                    className={`modal-tab ${activeTab === 'ABOUT' ? 'modal-tab-active' : ''}`}
                    onClick={() => onChangeTab('ABOUT')}
                >
                    ℹ️ 關於
                </button>
            </div>

            <div className="modal-scroll" style={{ marginTop: '0' }}>
                {activeTab === 'DISPLAY' && (
                    <div className="modal-content" style={{ padding: '10px' }}>
                        <div className="form-group">
                            <h4 style={{ marginBottom: '8px', color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                🐑 陣型管理 (指定列隊小羊)
                            </h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted-light)', marginBottom: '12px', lineHeight: '1.4' }}>
                                請挑選 1 到 10 隻最愛的小羊，牠們將會出現在主畫面的草地上排隊散步。<br />
                                <strong>目前已選：<span style={{ color: (settings?.pinnedSheepIds?.length >= 10) ? 'var(--text-status)' : 'var(--palette-blue-action)' }}>{settings?.pinnedSheepIds?.length || 0} / 10</span></strong>
                            </p>

                            <div className="sheep-selection-list" style={{
                                maxHeight: '250px', overflowY: 'auto',
                                border: '1px solid var(--border-subtle)', borderRadius: '8px',
                                background: 'white'
                            }}>
                                {sheep.length === 0 ? (
                                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        牧場裡還沒有小羊喔！
                                    </div>
                                ) : (
                                    sheep.map(s => {
                                        const isSelected = settings?.pinnedSheepIds?.includes(s.id);
                                        const atLimit = (settings?.pinnedSheepIds?.length || 0) >= 10;

                                        return (
                                            <label key={s.id} style={{
                                                display: 'flex', alignItems: 'center', padding: '12px',
                                                borderBottom: '1px solid var(--border-subtle)',
                                                cursor: (atLimit && !isSelected) ? 'not-allowed' : 'pointer',
                                                opacity: (atLimit && !isSelected) ? 0.5 : 1,
                                                transition: 'background 0.2s'
                                            }}
                                                onMouseEnter={(e) => {
                                                    if (!(atLimit && !isSelected)) e.currentTarget.style.background = 'var(--bg-content-subtle)';
                                                }}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={!!isSelected}
                                                    onChange={() => handleToggleSheep(s.id, isSelected)}
                                                    disabled={atLimit && !isSelected}
                                                    style={{
                                                        marginRight: '12px', width: '20px', height: '20px',
                                                        accentColor: 'var(--palette-blue-action)', cursor: 'inherit'
                                                    }}
                                                />
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontWeight: isSelected ? 'bold' : 'normal', color: 'var(--text-body)' }}>
                                                        {s.name || '未命名小羊'}
                                                    </span>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                        健康度: {s.health}%
                                                    </span>
                                                </div>
                                            </label>
                                        );
                                    })
                                )}
                            </div>

                            <ModalHint className="modal-info-box" style={{ marginTop: '12px' }}>
                                提示：如果您選擇的小於 3 隻，草地上的小羊會覺得孤單喔！
                            </ModalHint>
                        </div>

                        {onSave && (
                            <button className="modal-btn-primary" onClick={onSave} style={{ marginTop: '20px' }}>
                                確定
                            </button>
                        )}
                    </div>
                )}

                {activeTab === 'GUIDE' && (
                    <div className="modal-content guide-modal-content" style={{
                        color: 'var(--text-body)',
                        padding: '16px',
                        background: 'var(--bg-content-subtle)',
                        borderRadius: '12px',
                        border: '2px solid var(--border-subtle)',
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
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '6px' }}>若小羊尚未設定任何標籤，卡片會顯示系統預設的「已沉睡」「生病」「健康」等狀態文字作為替代，這些並非您建立的標籤，也不會出現在標籤列表中。</p>
                        {tags && tags.length > 0 ? (
                            <div style={{ marginTop: '8px' }}>
                                <p style={{ marginBottom: '6px', fontWeight: 600 }}>您目前的標籤：</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {tags.map(t => (
                                        <Tag key={t.id} name={t.name} color={t.color} />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '6px' }}>尚無自訂標籤。點擊小羊 → 基本資料 → 管理標籤 即可新增。</p>
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

                        <h4>7. 外觀更換規則</h4>
                        <ul>
                            <li><strong>關懷度解鎖:</strong> 當該隻小羊的累積關懷度大於 <strong>100</strong> 時，便能解鎖更換外觀的功能 (若該羊種有額外外觀)。</li>
                            <li><strong>管理員權限:</strong> 系統管理員不受此限，可隨時替換任意小羊的外觀。</li>
                        </ul>

                        <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-muted)' }}>
                            <em>"信心若沒有行為就是死的。"</em>
                        </p>
                    </div>
                )}

                {activeTab === 'ABOUT' && (
                    <div className="modal-content" style={{ padding: '16px' }}>
                        <div style={{
                            textAlign: 'center',
                            padding: '20px 0',
                            marginBottom: '20px',
                            borderBottom: '1px solid var(--border-subtle)'
                        }}>
                            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🐑</div>
                            <h4 style={{ margin: '0 0 5px 0', fontSize: '1.2rem' }}>小羊牧場</h4>
                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>版本 v1.0.1 (Beta)</p>
                        </div>

                        <div style={{ marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-muted-light)', textAlign: 'center' }}>
                            <p>Designed for NLCIT Ministry</p>
                            <p>&copy; 2024 Sheep Care Project</p>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};
