
import React from 'react';
import { useGame } from '../context/GameContext';

export const Login = () => {
    const { loginWithLine, isLoading, message } = useGame();
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    return (
        <div className="debug-editor-overlay" style={{ background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' }}>
            <div className="simple-editor" style={{ width: '320px', textAlign: 'center', padding: '30px' }}>
                <h2 style={{ margin: '0 0 20px 0' }}>
                    🐑 牧羊人登入
                </h2>

                {/* Status Message */}
                {message && (
                    <div style={{
                        background: '#fff3cd', color: '#856404', padding: '10px',
                        borderRadius: '5px', marginBottom: '15px', fontSize: '0.9rem'
                    }}>
                        {message}
                    </div>
                )}

                {isLoading ? (
                    <div style={{ color: '#666', padding: '20px' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⏳</div>
                        正在連接 LINE...
                    </div>
                ) : (
                    <div>
                        <p style={{ color: '#555', marginBottom: '20px', lineHeight: '1.5' }}>
                            歡迎回到牧場！<br />
                            請使用 LINE 帳號直接登入<br />
                        </p>

                        <button
                            onClick={loginWithLine}
                            className="line-login-btn"
                            style={isLocal ? { background: '#666' } : {}}
                        >
                            <span style={{ marginRight: '10px', fontSize: '1.2rem', fontWeight: 'bold' }}>{isLocal ? '🛠️' : 'LINE'}</span>
                            {isLocal ? 'Test Login' : 'Login 登入'}
                        </button>

                        <p style={{ marginTop: '20px', fontSize: '0.8rem', color: '#999' }}>
                            第一次登入將自動建立新帳號
                        </p>
                    </div>
                )}
            </div>

            <style>{`
            .line-login-btn {
                width: 100%;
                padding: 12px;
                font-size: 1.1rem;
                background: #06C755;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s;
            }
            .line-login-btn:hover {
                background: #05b34c;
            }
            .line-login-btn:active {
                background: #049f43;
            }
        `}</style>
        </div>
    );
};
