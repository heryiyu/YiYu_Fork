
import React from 'react';
import { useGame } from '../context/GameContext';

export const Controls = ({ onOpenList, isCollapsed, onToggleCollapse }) => {
    const { adoptSheep, sheep, currentUser, logout, saveToCloud } = useGame();

    return (
        <div className={`controls-container ${isCollapsed ? 'collapsed' : ''}`}>
            {/* Toggle Button */}
            <button
                className="collapse-toggle-btn"
                onClick={onToggleCollapse}
                title={isCollapsed ? "展開工具列" : "收起工具列"}
            >
                {isCollapsed ? '🔼' : '🔽'}
            </button>

            {!isCollapsed && (
                <>
                    <div className="stats-panel" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <div style={{ fontSize: '0.9rem' }}>👋 嗨，牧羊人 <strong>{currentUser}</strong></div>
                        <div><strong>目前羊隻:</strong> {(sheep || []).length} 隻 🐑</div>
                    </div>

                    {/* Sheep List Button */}
                    <button
                        className="action-btn"
                        style={{
                            background: '#fff',
                            color: '#333',
                            border: '1px solid #ccc',
                            marginRight: '10px',
                            fontSize: '1.2rem',
                            padding: '8px 12px'
                        }}
                        onClick={onOpenList}
                        title="羊群名冊"
                    >
                        📋
                    </button>

                    <button
                        className="action-btn adopt-btn"
                        onClick={adoptSheep}
                        style={{
                            background: '#66bb6a',
                            color: 'white',
                            minWidth: '120px'
                        }}
                    >
                        新增小羊 🐑
                    </button>

                    <button
                        className="action-btn"
                        style={{
                            padding: '10px 15px',
                            fontSize: '0.9rem',
                            background: 'white',
                            color: '#555',
                            marginLeft: 'auto',
                            marginRight: '10px',
                            border: '1px solid #ccc',
                            borderRadius: '20px'
                        }}
                        onClick={() => { saveToCloud(); alert('已手動同步!'); }}
                        title="系統會自動存檔，也可以點此手動備份"
                    >
                        ☁️ 備份
                    </button>

                    <button
                        className="action-btn"
                        onClick={logout}
                        style={{
                            background: '#ff5252',
                            color: 'white',
                            padding: '10px 20px',
                            fontSize: '1rem',
                            border: 'none',
                            borderRadius: '20px',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                        }}
                        title="登出"
                    >
                        登出 🚪
                    </button>
                </>
            )}
        </div>
    );
};
