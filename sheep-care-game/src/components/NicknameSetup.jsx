import React, { useState } from 'react';
import { useGame } from '../context/GameContext';

export const NicknameSetup = () => {
    const { updateNickname } = useGame();
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('請輸入暱稱');
            return;
        }
        if (name.length > 12) {
            setError('暱稱太長囉 (最多 12 字)');
            return;
        }
        updateNickname(name.trim());
    };

    return (
        <div className="debug-editor-overlay" style={{ background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)' }}>
            <div className="simple-editor" style={{ width: '300px', textAlign: 'center', padding: '30px' }}>
                <h2 style={{ marginBottom: '20px', color: '#333' }}>✨ 歡迎來到牧場</h2>
                <p style={{ color: '#666', marginBottom: '25px', lineHeight: '1.6' }}>
                    為了讓羊群認識您<br />
                    請告訴我們您的暱稱
                </p>

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                            setError('');
                        }}
                        placeholder="請輸入您的暱稱"
                        style={{
                            width: '100%',
                            padding: '12px',
                            marginBottom: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            outline: 'none',
                            textAlign: 'center'
                        }}
                        autoFocus
                    />
                    {error && <div style={{ color: 'red', fontSize: '0.9rem', marginBottom: '15px' }}>{error}</div>}

                    <button
                        type="submit"
                        disabled={!name.trim()}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: name.trim() ? '#66bb6a' : '#ccc',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1.1rem',
                            cursor: name.trim() ? 'pointer' : 'not-allowed',
                            transition: 'background 0.2s',
                            marginTop: '10px'
                        }}
                    >
                        開始牧羊 🐑
                    </button>
                </form>
            </div>
        </div>
    );
};
