
import React, { useState } from 'react';

export const Guide = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState('MANUAL'); // 'MANUAL' (Secret) | 'SYSTEM' (System)
    return (
        <div className="debug-editor-overlay" onClick={onClose}>
            <div className="simple-editor" style={{ width: '400px', textAlign: 'left' }}>
                <div className="editor-header">
                    <h3>📖 牧羊人手冊</h3>
                    <button className="close-btn" onClick={onClose}>✖</button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', borderBottom: '1px solid #ddd', paddingBottom: '0' }}>
                    <button
                        onClick={() => setActiveTab('MANUAL')}
                        style={{
                            padding: '8px 16px',
                            border: 'none',
                            background: activeTab === 'MANUAL' ? 'var(--color-primary-cream)' : 'transparent',
                            borderBottom: activeTab === 'MANUAL' ? '3px solid #ff9800' : 'none',
                            fontWeight: 'bold',
                            color: activeTab === 'MANUAL' ? '#333' : '#999',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        📜 領人歸主秘笈
                    </button>
                    <button
                        onClick={() => setActiveTab('SYSTEM')}
                        style={{
                            padding: '8px 16px',
                            border: 'none',
                            background: activeTab === 'SYSTEM' ? 'var(--color-primary-cream)' : 'transparent',
                            borderBottom: activeTab === 'SYSTEM' ? '3px solid var(--color-action-blue)' : 'none',
                            fontWeight: 'bold',
                            color: activeTab === 'SYSTEM' ? '#333' : '#999',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        ⚙️ 系統說明
                    </button>
                </div>

                <div style={{ maxHeight: '60vh', overflowY: 'auto', fontSize: '0.9rem', lineHeight: '1.5', color: '#000' }}>

                    {/* Secret Manual Content */}
                    {activeTab === 'MANUAL' && (
                        <div className="guide-content manual">
                            <h4 style={{ color: '#e65100' }}>🔥 領人歸主七招</h4>
                            <p>得人如得魚，七步帶領人歸向主：</p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                                <div style={{ background: '#fff3e0', padding: '10px', borderRadius: '8px' }}>
                                    <strong style={{ color: '#ef6c00' }}>1. 接觸關懷 (Contact & Care)</strong>
                                    <p style={{ margin: '5px 0 0', fontSize: '0.85rem' }}>主動建立關係，真誠關心對方的生活與狀況，成為朋友。</p>
                                </div>
                                <div style={{ background: '#fff3e0', padding: '10px', borderRadius: '8px' }}>
                                    <strong style={{ color: '#ef6c00' }}>2. 發現需要 (Discover Needs)</strong>
                                    <p style={{ margin: '5px 0 0', fontSize: '0.85rem' }}>在傾聽中看見對方心裡的欠缺與軟弱，找到福音切入點。</p>
                                </div>
                                <div style={{ background: '#fff3e0', padding: '10px', borderRadius: '8px' }}>
                                    <strong style={{ color: '#ef6c00' }}>3. 分享見證 (Share Testimony)</strong>
                                    <p style={{ margin: '5px 0 0', fontSize: '0.85rem' }}>分享神在你生命中的作為與改變，見證是做出來的，不是說出來的。</p>
                                </div>
                                <div style={{ background: '#ffe0b2', padding: '10px', borderRadius: '8px' }}>
                                    <strong style={{ color: '#f57c00' }}>4. 權能服事 (Power Ministry)</strong>
                                    <p style={{ margin: '5px 0 0', fontSize: '0.85rem' }}>為對方的需要禱告，邀請聖靈動工，經歷神的真實與大能。</p>
                                </div>
                                <div style={{ background: '#ffe0b2', padding: '10px', borderRadius: '8px' }}>
                                    <strong style={{ color: '#f57c00' }}>5. 決志信主 (Decision to Believe)</strong>
                                    <p style={{ margin: '5px 0 0', fontSize: '0.85rem' }}>把握時機，清楚傳講福音，邀請對方打開心門接受耶穌。</p>
                                </div>
                                <div style={{ background: '#ffcc80', padding: '10px', borderRadius: '8px' }}>
                                    <strong style={{ color: '#fb8c00' }}>6. 靈修生活 (Spiritual Life)</strong>
                                    <p style={{ margin: '5px 0 0', fontSize: '0.85rem' }}>陪伴初信者建立讀經禱告的生活，幫助他在真理上札根。</p>
                                </div>
                                <div style={{ background: '#ffcc80', padding: '10px', borderRadius: '8px' }}>
                                    <strong style={{ color: '#fb8c00' }}>7. 作主見證 (Witness for the Lord)</strong>
                                    <p style={{ margin: '5px 0 0', fontSize: '0.85rem' }}>鼓勵他也能為主作見證，將這份愛傳遞出去，生生不息。</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* System Guide Content */}
                    {activeTab === 'SYSTEM' && (
                        <div className="guide-content system">
                            <h4>1. 每日照顧與進化</h4>
                            <p>上帝限制了每日的影響力，讓成長循序漸進：</p>
                            <ul>
                                <li><strong>禱告 (Prayer):</strong> 每隻小羊每天最多 <strong>3 次</strong> (每次恢復 <strong>+6 負擔</strong>)。</li>
                                <li><strong>負擔 (Burden):</strong> 每次禱告恢復負擔，代表對靈魂的負擔與關愛。</li>
                                <li><strong>生命三階段 (負擔指數):</strong>
                                    <div style={{ background: '#e3f2fd', padding: '8px', borderRadius: '4px', margin: '5px 0', fontSize: '0.85rem' }}>
                                        🍂 <strong>虛弱 (Weak):</strong> 負擔 &lt; 40，小羊看起來無精打采。<br />
                                        🐑 <strong>健康 (Healthy):</strong> 負擔 40-79，精神飽滿的樣子。<br />
                                        💪 <strong>強壯 (Strong):</strong> 負擔 &ge; 80，長出羊角，強壯有力！
                                    </div>
                                </li>
                            </ul>

                            <h4>2. 離線與自然衰退</h4>
                            <p>即使不在線上，時間仍在流動：</p>
                            <ul>
                                <li><strong>離線機制:</strong> 負擔會自然流失 (每天約 <strong>13%</strong>)。</li>
                                <li><strong>守望保護:</strong> 當日有被禱告的小羊，流失大幅減緩至約 <strong>6%</strong>！</li>
                                <li><strong>狀態影響:</strong> 生病或受傷流失更快 (每天約 <strong>17-20%</strong>)。</li>
                            </ul>

                            <h4>3. 死亡與復活 (Miracle)</h4>
                            <p>死亡不是終點，信心能喚回生命：</p>
                            <ul>
                                <li><strong>墓碑:</strong> 小羊死亡後會化為墓碑，您可以修改墓誌銘與追憶。</li>
                                <li><strong>復活儀式:</strong> 連續 <strong>5 天</strong> 進行「迫切認領禱告」(每天1次)。</li>
                                <li><strong>奇蹟:</strong> 第 5 次禱告後，小羊將復活！(保留姓名與靈程，重置為健康小羊)。</li>
                                <li><strong>中斷歸零:</strong> 若中斷一天沒禱告，進度將歸零重來。</li>
                            </ul>

                            <h4>4. 靈程與資料管理</h4>
                            <ul>
                                <li><strong>靈程 (Maturity):</strong> 可設定小羊的屬靈階段 (新朋友/慕道友/基督徒...)。</li>
                                <li><strong>使用說明:</strong> 請使用 LINE 帳號登入，系統會自動備份您的羊群資料。</li>
                            </ul>

                            <h4>5. 提醒與通知 (Bell)</h4>
                            <ul>
                                <li><strong>鈴鐺按鈕 (右上方):</strong> 點擊鈴鐺可開啟/關閉牧羊提醒。</li>
                                <li><strong>開啟後:</strong> 系統將在適當時間提醒您回來關心羊群的狀況。</li>
                            </ul>

                            <p style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
                                <em>"信心若沒有行為就是死的。"</em>
                            </p>
                        </div>
                    )}
                </div>

                <div className="editor-actions">
                    <button className="save-btn" onClick={onClose}>我瞭解了</button>
                </div>
            </div>
        </div>
    );
};
