import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';

export const Login = () => {
    const { loginWithLine, loginAsAdmin, isLoading, message, isInClient } = useGame();
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    // Default to LINE Login (Standard for all users)
    const [showAdminLogin, setShowAdminLogin] = useState(false);
    const [adminUser, setAdminUser] = useState(''); // Restored to fix ReferenceError
    // const [adminPass, setAdminPass] = useState(''); // Kept if needed later, but commented out if unused to avoid lint errors? No, user asked to restore it. 
    // Actually, looking at the code, adminPass isn't used in handleAdminLogin. But I'll define it to be safe or just define adminUser.
    // The error was specifically "adminUser is not defined". 
    // I'll just restore adminUser for now as that's the crash. 
    // Wait, let's restore both to be clean.
    const [adminPass, setAdminPass] = useState('');

    // Effect removed: We no longer auto-switch to Admin login if not in client.
    // Users can manually click "Admin Access" if needed.


    const handleAdminLogin = (e) => {
        e.preventDefault();
        // Check Credentials - Username only per request
        const validUser = import.meta.env.VITE_ADMIN_USER || 'admin';

        if (adminUser === validUser) {
            loginAsAdmin();
        } else {
            alert('帳號錯誤');
        }
    };

    return (
        <div className="debug-editor-overlay" style={{ background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' }}>
            <div className="simple-editor" style={{ width: '320px', textAlign: 'center', padding: '30px' }}>
                <h2 style={{ margin: '0 0 20px 0' }}>
                    {showAdminLogin ? '🔧 管理員後台' : '🐑 牧羊人登入'}
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
                        {!showAdminLogin ? (
                            // LINE LOGIN VIEW (Default for Mobile)
                            <>
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

                                {!isInClient && (
                                    <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                                        <button
                                            onClick={() => setShowAdminLogin(true)}
                                            style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: '0.8rem' }}
                                        >
                                            Admin Access
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            // ADMIN LOGIN VIEW (Default for Browser)
                            <form onSubmit={handleAdminLogin} style={{ textAlign: 'left' }}>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#666', marginBottom: '5px' }}>帳號</label>
                                    <input
                                        type="text"
                                        value={adminUser}
                                        onChange={(e) => setAdminUser(e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                                        placeholder="預設: admin"
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        type="submit"
                                        style={{ flex: 1, padding: '10px', background: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'white' }}
                                    >
                                        登入
                                    </button>
                                </div>
                                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowAdminLogin(false)}
                                        style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: '0.8rem' }}
                                    >
                                        切換至 LINE 登入
                                    </button>
                                </div>
                            </form>
                        )}
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
