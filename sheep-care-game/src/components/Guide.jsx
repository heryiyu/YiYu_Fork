
import React from 'react';

export const Guide = ({ onClose }) => {
    return (
        <div className="debug-editor-overlay">
            <div className="simple-editor" style={{ width: '400px', textAlign: 'left' }}>
                <div className="editor-header">
                    <h3>📖 牧羊人手冊</h3>
                    <button className="close-btn" onClick={onClose}>✖</button>
                </div>

                <div style={{ maxHeight: '60vh', overflowY: 'auto', fontSize: '0.9rem', lineHeight: '1.5', color: '#000' }}>
                    <h4>1. 每日照顧與進化</h4>
                    <p>上帝限制了每日的影響力，讓成長循序漸進：</p>
                    <ul>
                        <li><strong>禱告 (Prayer):</strong> 每隻小羊每天最多 <strong>3 次</strong>。</li>
                        <li><strong>健康 (Health):</strong> 每次禱告恢復生命，主要依賴持續的關心。</li>
                        <li><strong>生命三階段 (關愛值):</strong>
                            <div style={{ background: '#e3f2fd', padding: '8px', borderRadius: '4px', margin: '5px 0', fontSize: '0.85rem' }}>
                                🥚 <strong>小羊 (Lamb):</strong> 需累積 100 關愛值，滿了將進化並歸零。<br />
                                🐏 <strong>強壯的羊 (Strong):</strong> 需再累積 100 關愛值，將進化為榮耀的羊。<br />
                                🧍 <strong>榮耀的羊 (Glory):</strong> 最終形態，充滿靈性的樣式。
                            </div>
                        </li>
                    </ul>

                    <h4>2. 離線與自然衰退</h4>
                    <p>即使不在線上，時間仍在流動：</p>
                    <ul>
                        <li><strong>離線機制:</strong> 下次登入時，系統會根據您離開的時間計算健康流失。</li>
                        <li><strong>狀態影響:</strong> 生病或受傷的小羊，健康流失速度會更快。</li>
                        <li><strong>自動降級:</strong> 若健康歸零，榮耀的羊會變回強壯，強壯會變回小羊...直到死亡。</li>
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

                    <p style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
                        <em>"信心若沒有行為就是死的。"</em>
                    </p>
                </div>

                <div className="editor-actions">
                    <button className="save-btn" onClick={onClose}>我瞭解了</button>
                </div>
            </div>
        </div>
    );
};
