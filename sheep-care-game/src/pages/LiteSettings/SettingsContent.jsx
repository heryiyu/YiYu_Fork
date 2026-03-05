import React from 'react';
import { useGameState, useGameActions, useUserAuth } from '../../context/GameContext/useGame';
import { ModalHint } from '../../components/modals/ModalHint';
import { Slider } from '../../components/ui/Slider';
import { Tag } from '../../components/ui/Tag';

export const SettingsContent = ({ activeTab, onChangeTab, onSave }) => {
    const { tags, sheep } = useGameState();
    const { updateSetting, toggleQueue } = useGameActions();
    const { settings } = useUserAuth();

    // Filter out deleted sheep to get accurate count
    const activeQueuedCount = (settings?.queuedSheepIds || []).filter(id => sheep.some(s => s.id === id)).length;

    const handleToggleSheep = (sheepId, isCurrentlySelected) => {
        if (isCurrentlySelected) {
            toggleQueue(sheepId);
        } else {
            if (activeQueuedCount < 10) {
                toggleQueue(sheepId);
            }
        }
    };

    return (
        <>
            {/* Tabs */}
            <div className="modal-tabs">
                <button
                    className={`modal-tab ${activeTab === 'QUEUE' ? 'modal-tab-active' : ''}`}
                    onClick={() => onChangeTab('QUEUE')}
                >
                    🏕️ 列隊
                </button>
                <button
                    className={`modal-tab ${activeTab === 'GUIDE' ? 'modal-tab-active' : ''}`}
                    onClick={() => onChangeTab('GUIDE')}
                >
                    📖 遊戲說明書
                </button>
                <button
                    className={`modal-tab ${activeTab === 'ABOUT' ? 'modal-tab-active' : ''}`}
                    onClick={() => onChangeTab('ABOUT')}
                >
                    ℹ️ 關於
                </button>
            </div>

            <div className="modal-scroll" style={{ marginTop: '0' }}>
                {activeTab === 'QUEUE' && (
                    <div className="modal-content" style={{ padding: '10px' }}>
                        <div className="form-group">
                            <h4 style={{ marginBottom: '8px', color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                🏕️ 認領名單 (指定列隊小羊)
                            </h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted-light)', marginBottom: '12px', lineHeight: '1.4' }}>
                                請列出你的認領名單NO.1-NO.10<br />
                                <strong>目前已選擇：<span style={{ color: (activeQueuedCount >= 10) ? 'var(--text-status)' : 'var(--palette-blue-action)' }}>{activeQueuedCount} / 10</span></strong>
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
                                        const isSelected = settings?.queuedSheepIds?.includes(s.id);
                                        const atLimit = activeQueuedCount >= 10;

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
                                                        健康度: {Math.round(s.health)}%
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
                        <h4>🐑 1. 首頁牧場與名單</h4>
                        <ul>
                            <li><strong>位置:</strong> 遊戲主畫面。</li>
                            <li><strong>功能:</strong> 畫面上方為「牧場」(顯示已列隊/釘選的小羊)，下方為「認領名單」列表。點擊清單下方的 <strong>「+ 新增」</strong> 按鈕，即可將新的關懷對象加入牧場。</li>
                        </ul>

                        <h4>🔍 2. 羊隻互動與紀錄</h4>
                        <ul>
                            <li><strong>位置:</strong> 點擊牧場上的小羊，或從上方清單點選一隻羊，打開詳細資料。</li>
                            <li><strong>互動紀錄:</strong> 可以對該羊隻<strong>寫筆記</strong>、記錄關懷狀況與代禱事項。</li>
                            <li><strong>關懷度解鎖:</strong> 新增筆記與互動會提升關懷度。當關懷度累積達 <strong>100</strong> 時，即解鎖更換小羊外觀(造型)功能。</li>
                        </ul>

                        <h4>🏕️ 3. 釘選與列隊</h4>
                        <ul>
                            <li><strong>位置:</strong> 羊隻詳細資料介面的「📌 釘選」，與本設定介面中的「🏕️ 列隊」清單。</li>
                            <li><strong>釘選:</strong> 將該小羊排在名單最上方，方便優先關注。</li>
                            <li><strong>列隊:</strong> 您可在列隊設定中勾選最多 10 隻小羊，讓他們出現於首頁的牧場草地中(建議選擇3隻以上避免小羊孤單)。</li>
                        </ul>

                        <h4>⏰ 4. 預約排程與提醒</h4>
                        <ul>
                            <li><strong>預約關懷:</strong> 羊隻詳細資料中點擊「📅 預約」，可設定下次關懷日期。</li>
                            <li><strong>牧羊人週記:</strong> 點擊首頁右上角「🗓️ 週記」圖示，能一覽所有已排程的關懷計畫。</li>
                            <li><strong>推播通知:</strong> 點擊首頁右上角「🔔 鈴鐺」圖示，可開啟每日 8:00、12:00、18:30 的牧羊通知。</li>
                        </ul>

                        <h4>💖 5. 健康度與甦醒</h4>
                        <ul>
                            <li><strong>日常禱告:</strong> 每天可關心小羊(每天最多3次，每次恢復 <strong>+6 健康度</strong>)。</li>
                            <li><strong>自然流失:</strong> 隨時間流動健康度會自然下降(每天約13%)；當日有被照顧的羊流失率降至約6%。</li>
                            <li><strong>甦醒儀式:</strong> 若小羊沉睡了，連續 <strong>5 天</strong> 對其進行「喚醒禱告」，第5天後小羊將甦醒並恢復為健康狀態。</li>
                        </ul>

                        <h4>🏷️ 6. 小羊標籤 (Tags)</h4>
                        <p style={{ margin: '8px 0' }}>可自訂標籤分類小羊，在羊隻詳細資料選擇「管理標籤」新增。卡片上會顯示您為該小羊設定的第一個標籤。</p>
                        {tags && tags.length > 0 ? (
                            <div style={{ marginTop: '8px', marginBottom: '16px' }}>
                                <p style={{ marginBottom: '6px', fontWeight: 600 }}>您目前的標籤：</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {tags.map(t => (
                                        <Tag key={t.id} name={t.name} color={t.color} />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '6px', marginBottom: '16px' }}>尚無自訂標籤。點擊小羊 → 基本資料 → 管理標籤 即可新增。</p>
                        )}

                        <h4>⚙️ 7. 系統設定與模式</h4>
                        <ul>
                            <li><strong>切換模式:</strong> 您可將應用切換為「簡潔模式 (Lite Mode)」，該模式會關閉背景動畫，介面也較適合手機單手快速瀏覽。</li>
                            <li><strong>資料備份:</strong> 使用 LINE 帳號登入，系統會自動在雲端備份您的羊群資料。</li>
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
                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>版本 v1.1.0 (Beta)</p>
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
