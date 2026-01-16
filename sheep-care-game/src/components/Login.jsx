
import React, { useState } from 'react';
import { useGame } from '../context/GameContext';

export const Login = () => {
    const { loginUser, registerUser, sendVerificationEntry, message } = useGame();

    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [step, setStep] = useState(1);       // 1: Email, 2: Details for Register

    // Form Data
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [internalMsg, setInternalMsg] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!username || !password) return;
        setLoading(true);
        const res = await loginUser(username, password);
        setLoading(false);
        if (res.status === 'error') {
            setInternalMsg(res.message);
        }
    };

    const handleSendCode = async () => {
        if (!email.includes('@')) {
            setInternalMsg("請輸入有效的 Email");
            return;
        }
        setLoading(true);
        setInternalMsg("發送中...");
        const res = await sendVerificationEntry(email);
        setLoading(false);

        if (res.status === 'success') {
            setStep(2); // Move to next step
            setInternalMsg("驗證碼已寄出，請檢查信箱 (含垃圾郵件)");
        } else {
            setInternalMsg("發送失敗: " + res.message);
        }
    };

    const handleRegister = async () => {
        if (!code || !username || !password) {
            setInternalMsg("請填寫所有欄位");
            return;
        }
        setLoading(true);
        const res = await registerUser(username, email, password, code);
        setLoading(false);

        if (res.status === 'success') {
            alert("註冊成功！請登入");
            setMode('login');
            setStep(1);
            setInternalMsg("");
        } else {
            setInternalMsg("註冊失敗: " + res.message);
        }
    };

    return (
        <div className="debug-editor-overlay" style={{ background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' }}>
            <div className="simple-editor" style={{ width: '320px', textAlign: 'center', padding: '30px' }}>
                <h2 style={{ margin: '0 0 20px 0' }}>
                    {mode === 'login' ? '🐑 牧羊人登入' : '📝 新手註冊'}
                </h2>

                {/* Error / Status Message */}
                {(internalMsg || message) && (
                    <div style={{
                        background: '#fff3cd', color: '#856404', padding: '10px',
                        borderRadius: '5px', marginBottom: '15px', fontSize: '0.9rem'
                    }}>
                        {internalMsg || message}
                    </div>
                )}

                {/* LOGIN FORM */}
                {mode === 'login' && (
                    <form onSubmit={handleLogin}>
                        <input
                            type="text" placeholder="牧羊人帳號 (Name)"
                            value={username} onChange={e => setUsername(e.target.value)}
                            className="login-input"
                        />
                        <input
                            type="password" placeholder="密碼"
                            value={password} onChange={e => setPassword(e.target.value)}
                            className="login-input"
                        />
                        <button type="submit" className="save-btn login-btn" disabled={loading}>
                            {loading ? '登入中...' : '登入牧場 🏠'}
                        </button>

                        <p style={{ marginTop: '15px', fontSize: '0.9rem', color: '#666' }}>
                            還沒有帳號嗎？ <br />
                            <span
                                style={{ color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}
                                onClick={() => { setMode('register'); setStep(1); setInternalMsg(''); }}
                            >
                                前往註冊
                            </span>
                        </p>
                    </form>
                )}

                {/* REGISTER FORM */}
                {mode === 'register' && (
                    <div>
                        {step === 1 && (
                            <div>
                                <p style={{ fontSize: '0.9rem' }}>第一步：Email 驗證</p>
                                <input
                                    type="email" placeholder="您的 Email 信箱"
                                    value={email} onChange={e => setEmail(e.target.value)}
                                    className="login-input"
                                />
                                <button onClick={handleSendCode} className="save-btn login-btn" disabled={loading}>
                                    {loading ? '發送中...' : '發送驗證碼 ✉️'}
                                </button>
                            </div>
                        )}

                        {step === 2 && (
                            <div>
                                <p style={{ fontSize: '0.9rem' }}>第二步：設定帳號密碼</p>
                                <input
                                    type="text" placeholder="輸入 6 位數驗證碼"
                                    value={code} onChange={e => setCode(e.target.value)}
                                    className="login-input"
                                    maxLength={6}
                                />
                                <input
                                    type="text" placeholder="設定帳號名稱"
                                    value={username} onChange={e => setUsername(e.target.value)}
                                    className="login-input"
                                />
                                <input
                                    type="password" placeholder="設定密碼"
                                    value={password} onChange={e => setPassword(e.target.value)}
                                    className="login-input"
                                />
                                <button onClick={handleRegister} className="save-btn login-btn" disabled={loading}>
                                    {loading ? '註冊中...' : '完成註冊 ✨'}
                                </button>
                            </div>
                        )}

                        <p style={{ marginTop: '15px', fontSize: '0.9rem', color: '#666' }}>
                            已經有帳號了？ <br />
                            <span
                                style={{ color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}
                                onClick={() => { setMode('login'); setInternalMsg(''); }}
                            >
                                返回登入
                            </span>
                        </p>
                    </div>
                )}
            </div>

            <style>{`
            .login-input {
                width: 100%;
                padding: 12px;
                margin-bottom: 10px;
                border: 1px solid #ddd;
                border-radius: 8px;
                font-size: 1rem;
                box-sizing: border-box;
            }
            .login-btn {
                width: 100%;
                padding: 12px;
                font-size: 1.1rem;
                background: #4caf50;
            }
            .login-btn:disabled {
                background: #ccc;
                cursor: not-allowed;
            }
        `}</style>
        </div>
    );
};
