
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
                    <h4>1. 照顧羊群</h4>
                    <p>歡迎你，牧羊人！你的目標是養育一群健康快樂的羊群。</p>

                    <h4>2. 每日禱告限額 (3次/隻)</h4>
                    <p><strong>規則:</strong> 上帝的恩典雖無限，但小羊需要時間消化祝福。</p>
                    <ul>
                        <li>每一隻小羊，每天最多只能接受 <strong>3 次</strong> 禱告。</li>
                        <li>次數會在每天換日後重置。</li>
                        <li>請確保您每天都有去關心 **每一隻** 小羊，不要偏心喔！</li>
                    </ul>

                    <h4>3. 健康與狀態</h4>
                    <p>系統會隨著時間自然消耗小羊的健康。如果太久沒回來 (超過24小時)，牠們會變得非常虛弱！</p>
                    <ul>
                        <li><strong>健康:</strong> 圓潤快樂。</li>
                        <li><strong>生病/受傷:</strong> 需要多次禱告才能治癒。</li>
                    </ul>

                    <h4>4. 觀察與紀錄</h4>
                    <p>你可以點擊小羊的 ✏️ 鉛筆圖示，在<strong>備註欄</strong>寫下牠的需求（例如：「這隻昨天沒吃到飯」）。</p>

                    <p style={{ textAlign: 'center', marginTop: '20px' }}>
                        <em>"勤勞的牧羊人，羊群必昌盛。"</em>
                    </p>
                </div>

                <div className="editor-actions">
                    <button className="save-btn" onClick={onClose}>我瞭解了</button>
                </div>
            </div>
        </div>
    );
};
