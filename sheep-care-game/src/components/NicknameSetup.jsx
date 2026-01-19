import React, { useState } from 'react';
import { useGame } from '../context/GameContext';

export const NicknameSetup = () => {
    const { updateUserName, currentUser } = useGame();
    const [name, setName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) {
            updateUserName(name.trim());
        }
    };

    return (
        <div className="debug-editor-overlay" style={{ background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' }}>
            <div className="simple-editor" style={{ width: '320px', textAlign: 'center', padding: '30px' }}>
                <h2 style={{ margin: '0 0 20px 0' }}>🐑 歡迎來到牧場！</h2>

                <p style={{ color: '#555', marginBottom: '20px', lineHeight: '1.5' }}>
                    初次見面，請問該如何稱呼您？
                </p>

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="請輸入您的暱稱"
                        style={{
                            width: '90%',
                            padding: '12px',
                            fontSize: '1rem',
                            border: '2px solid #ddd',
                            borderRadius: '8px',
                            marginBottom: '20px',
                            textAlign: 'center'
                        }}
                        autoFocus
                    />

                    <button
                        type="submit"
                        disabled={!name.trim()}
                        style={{
                            width: '100%',
                            padding: '12px',
                            fontSize: '1.1rem',
                            background: name.trim() ? '#66bb6a' : '#ccc',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: name.trim() ? 'pointer' : 'not-allowed',
                            transition: 'background 0.2s'
                        }}
                    >
                        開始牧羊 🌿
                    </button>

                    <p style={{ marginTop: '15px', fontSize: '0.8rem', color: '#999' }}>
                        您隨時可以在「設定」中修改暱稱
                    </p>
                </form>
            </div>
        </div>
    );
};
