import React from 'react';
import { WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import './ConnectionErrorOverlay.css';

export const ConnectionErrorOverlay = ({ type = 'TIMEOUT' }) => {
    const handleReload = () => {
        window.location.reload();
    };

    return (
        <div className="conn-error-overlay">
            <div className="conn-error-card">
                <div className="conn-error-icon-wrap">
                    {type === 'TIMEOUT' ? (
                        <WifiOff className="conn-error-icon" size={48} />
                    ) : (
                        <AlertCircle className="conn-error-icon" size={48} />
                    )}
                </div>

                <h2 className="conn-error-title">
                    {type === 'TIMEOUT' ? '咩～ 網路好像斷開了' : '糟糕，牧場斷訊了'}
                </h2>

                <p className="conn-error-msg">
                    {type === 'TIMEOUT'
                        ? '抓不到牧場資料，這可能是網路不穩造成的。為了保險起見，我們暫時停止進入遊戲。'
                        : '讀取資料時發生錯誤。請確認您的行動數據或 WiFi 連線是否正常。'}
                </p>

                <div className="conn-error-tip">
                    <span>💡 提示：您可以嘗試切換網路，或開啟再關閉飛航模式重試。</span>
                </div>

                <button className="conn-error-btn" onClick={handleReload}>
                    <RefreshCw size={18} />
                    立即重新整理
                </button>
            </div>
        </div>
    );
};
