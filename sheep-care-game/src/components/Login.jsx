/**
 * Login Modal - SPECIAL COMPONENT
 *
 * This is the app's first-screen entry point and must create a strong first impression.
 * It uses a distinct layout: NO modal-header container, NO orange bar.
 * Title (icon + text) lives directly in the modal content for a compact, welcoming look.
 *
 * DO NOT refactor this to use the standard modal-header pattern (orange bar, close button).
 * Treat this as a special case. Any changes should preserve its unique design.
 */
import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { ASSETS } from '../utils/AssetRegistry';

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
        <div className="debug-editor-overlay" style={{ background: 'var(--bg-modal-overlay)' }}>
            <div className="modal-card modal-card--sm login-modal">
                <div className="modal-form" style={{ textAlign: 'center', padding: '24px' }}>
                {/* Title: icon + text directly in content (no header container). See file annotation. */}
                <div className="login-modal-title">
                    {showAdminLogin ? (
                        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, color: 'var(--palette-sheep-brown)' }}>🔧 管理員後台</h3>
                    ) : (
                        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, color: 'var(--palette-sheep-brown)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            <img
                                src={ASSETS.SHEEP_VARIANTS.CLASSIC_WHITE.HEALTHY}
                                alt=""
                                className="login-modal-icon"
                            />
                            牧羊人登入
                        </h3>
                    )}
                </div>

                {/* Status Message */}
                {message && (
                    <div style={{
                        background: 'var(--bg-card-secondary)', color: 'var(--text-status)', padding: '10px',
                        borderRadius: '5px', marginBottom: '8px', fontSize: '0.9rem'
                    }}>
                        {message}
                    </div>
                )}

                {isLoading ? (
                    <div style={{ color: 'var(--text-secondary)', padding: '20px' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '6px' }}>⏳</div>
                        正在連接 LINE...
                    </div>
                ) : (
                    <div>
                        {!showAdminLogin ? (
                            // LINE LOGIN VIEW (Default for Mobile)
                            <>
                                <p style={{ color: 'var(--text-body)', marginBottom: '12px', lineHeight: '1.5' }}>
                                    歡迎回到牧場！<br />
                                    請使用 LINE 帳號直接登入<br />
                                </p>

                                <button
                                    onClick={loginWithLine}
                                    className="line-login-btn"
                                    style={isLocal ? { background: 'var(--text-muted)' } : {}}
                                >
                                    <span style={{ marginRight: '10px', fontSize: '1.2rem', fontWeight: 'bold' }}>{isLocal ? '🛠️' : 'LINE'}</span>
                                    {isLocal ? 'Test Login' : 'Login 登入'}
                                </button>

                                {isLocal && (
                                    <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
                                        <button
                                            onClick={() => setShowAdminLogin(true)}
                                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}
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
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>帳號</label>
                                    <input
                                        type="text"
                                        value={adminUser}
                                        onChange={(e) => setAdminUser(e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-subtle)', boxSizing: 'border-box', background: 'white' }}
                                        placeholder="請輸入管理員密碼"
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        type="submit"
                                        style={{ flex: 1, padding: '10px', background: 'var(--btn-primary-bg)', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'white' }}
                                    >
                                        登入
                                    </button>
                                </div>
                                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowAdminLogin(false)}
                                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}
                                    >
                                        切換至 LINE 登入
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}
                </div>
            </div>

            <style>{`
            /* Login modal: compact gaps. See file annotation. */
            .login-modal .modal-form {
                gap: 8px;
            }
            .login-modal .login-modal-title {
                margin-bottom: 8px;
            }
            .login-modal .login-modal-icon {
                width: 48px;
                height: 48px;
                object-fit: contain;
            }
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
