import React from 'react';
import { useGame } from '../context/GameContext';

export const SkinManager = ({ onClose }) => {
    const { skins, toggleSkinPublic, isAdmin } = useGame();

    if (!isAdmin) return null;

    return (
        <div className="debug-editor-overlay" onClick={onClose}>
            <div className="simple-editor" onClick={e => e.stopPropagation()}
                style={{
                    width: '90%',
                    maxWidth: '900px',
                    height: '85vh',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '0', // Full bleed for header/footer
                    background: '#f4f6f8', // App-like background
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.2)'
                }}>

                {/* Header */}
                <div style={{
                    padding: '15px 20px',
                    background: '#ffffff',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderBottom: '1px solid #e0e0e0',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}>
                    <div>
                        <h3 style={{ margin: 0, color: '#1a237e', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            🎨 皮膚圖鑑管理
                            <span style={{ fontSize: '0.8rem', background: '#e3f2fd', color: '#1565c0', padding: '2px 8px', borderRadius: '12px' }}>
                                Admin Panel
                            </span>
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: '#f5f5f5', border: 'none', width: '32px', height: '32px', borderRadius: '50%',
                            display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', fontSize: '1.2rem', color: '#666'
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Content Grid */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '20px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '20px',
                    alignContent: 'start'
                }}>
                    {skins.length === 0 ? (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#888', padding: '40px' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📂</div>
                            目前沒有任何皮膚數據
                        </div>
                    ) : (
                        skins.map(skin => (
                            <div key={skin.id} style={{
                                background: '#ffffff',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                transition: 'transform 0.2s',
                                border: '1px solid #eee'
                            }}>
                                {/* Image Preview Area */}
                                <div style={{
                                    height: '160px',
                                    background: '#f8f9fa',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    borderBottom: '1px solid #f0f0f0',
                                    position: 'relative',
                                    backgroundImage: 'radial-gradient(#e0e0e0 1px, transparent 1px)',
                                    backgroundSize: '10px 10px'
                                }}>
                                    {skin.data?.url ? (
                                        <img src={skin.data.url} alt={skin.name} style={{ width: '80%', height: '80%', objectFit: 'contain', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }} />
                                    ) : (
                                        <span style={{ fontSize: '3rem', opacity: 0.3 }}>🖼️</span>
                                    )}
                                    {/* Type Badge */}
                                    <div style={{
                                        position: 'absolute', top: '10px', right: '10px',
                                        background: 'rgba(255,255,255,0.9)', padding: '2px 8px', borderRadius: '8px',
                                        fontSize: '0.75rem', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                        color: '#333', // Explicit dark color
                                        userSelect: 'none' // Prevent selection
                                    }}>
                                        造型
                                    </div>
                                </div>

                                {/* Info Card */}
                                <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <h4 style={{ margin: '0 0 5px 0', color: '#37474f', fontSize: '1rem' }}>
                                        {skin.name || '未命名'}
                                    </h4>

                                    <div style={{ fontSize: '0.75rem', color: '#78909c', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            👤 {skin.created_by === 'admin' ? '官方 (Admin)' : (skin.created_by?.substring(0, 6) + '...')}
                                        </span>
                                        <span style={{ fontFamily: 'monospace', opacity: 0.7 }}>
                                            #{skin.id.substring(0, 8)}
                                        </span>
                                    </div>

                                    {/* Action Area */}
                                    <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #f0f0f0' }}>
                                        <label style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            cursor: 'pointer', userSelect: 'none'
                                        }}>
                                            <span style={{
                                                fontSize: '0.85rem',
                                                color: skin.is_public ? '#43a047' : '#e53935',
                                                fontWeight: 'bold'
                                            }}>
                                                {skin.is_public ? '🌐 公開' : '🔒 私有'}
                                            </span>

                                            <div style={{
                                                position: 'relative', width: '40px', height: '22px',
                                                background: skin.is_public ? '#4caf50' : '#cfd8dc',
                                                borderRadius: '20px', transition: 'background 0.3s'
                                            }}>
                                                <input
                                                    type="checkbox"
                                                    checked={skin.is_public || false}
                                                    onChange={(e) => toggleSkinPublic(skin.id, e.target.checked)}
                                                    style={{ display: 'none' }}
                                                />
                                                <div style={{
                                                    position: 'absolute', top: '2px', left: skin.is_public ? '20px' : '2px',
                                                    width: '18px', height: '18px', background: 'white',
                                                    borderRadius: '50%', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                                    transition: 'left 0.3s'
                                                }} />
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '10px 20px', background: '#fff', borderTop: '1px solid #e0e0e0',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    color: '#666', fontSize: '0.85rem'
                }}>
                    <span>共 {skins.length} 個項目</span>
                    <span style={{ color: '#aaa' }}>管理權限 valid</span>
                </div>
            </div>
        </div>
    );
};
