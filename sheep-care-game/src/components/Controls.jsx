import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { AddSheepModal } from './AddSheepModal';

export const Controls = ({ onOpenList }) => {
    const { adoptSheep } = useGame();
    const [showAddModal, setShowAddModal] = useState(false);

    const handleConfirmAdd = (data) => {
        if (Array.isArray(data)) {
            data.forEach(item => adoptSheep(item));
        } else {
            adoptSheep(data);
        }
        setShowAddModal(false);
    };

    return (
        <div className="controls-container">
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', width: '100%', justifyContent: 'center' }}>

                {/* Sheep List Button */}
                <button
                    className="action-btn"
                    style={{
                        background: '#fff',
                        color: '#333',
                        border: '1px solid #ccc',
                        width: '60px', height: '60px',
                        borderRadius: '20px',
                        fontSize: '1.8rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 0 #9e9e9e'
                    }}
                    onClick={onOpenList}
                    title="羊群名冊"
                >
                    📋
                </button>

                {/* Manual Save Button (For Debugging Persistence) */}
                <button
                    className="action-btn"
                    style={{
                        background: '#e3f2fd',
                        color: '#1565c0',
                        border: '1px solid #90caf9',
                        width: '60px', height: '60px',
                        borderRadius: '20px',
                        fontSize: '1.5rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 0 #64b5f6'
                    }}
                    onClick={() => useGame().saveToCloud()} // Force Save
                    title="強制存檔"
                >
                    💾
                </button>

                {/* Add Sheep Button (Primary Action) */}
                <button
                    className="action-btn adopt-btn"
                    onClick={() => setShowAddModal(true)}
                    style={{
                        background: '#66bb6a', /* Green */
                        color: 'white',
                        minWidth: '160px', /* Shrink slightly to fit 3 icons if needed */
                        height: '60px',
                        borderRadius: '30px',
                        fontSize: '1.2rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                        boxShadow: '0 4px 0 #388e3c'
                    }}
                >
                    <span style={{ fontSize: '1.5rem' }}>➕</span> 新增
                </button>

            </div>

            {showAddModal && (
                <AddSheepModal
                    onConfirm={handleConfirmAdd}
                    onCancel={() => setShowAddModal(false)}
                />
            )}
        </div>
    );
};
