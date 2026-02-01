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





                {/* Add Sheep Button (Primary Action) */}
                <button
                    className="action-btn adopt-btn"
                    onClick={() => setShowAddModal(true)}
                    style={{
                        background: 'var(--color-action-blue)', /* New Blue */
                        color: 'white',
                        minWidth: '160px', /* Shrink slightly to fit 3 icons if needed */
                        height: '60px',
                        borderRadius: '30px',
                        fontSize: '1.2rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                        boxShadow: '0 4px 0 #3d92ad' // Darker blue shadow
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
