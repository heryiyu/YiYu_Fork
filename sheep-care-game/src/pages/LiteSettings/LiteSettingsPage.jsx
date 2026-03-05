import React from 'react';
import { SettingsContent } from './SettingsContent';
import { LiteProfileCard } from './LiteProfileCard';
import { ArrowLeft } from 'lucide-react';
import './LiteSettingsPage.css';

export const LiteSettingsPage = ({ onClose }) => {
    const [activeTab, setActiveTab] = React.useState('QUEUE');

    return (
        <div className="lite-page-container fade-in">
            <div className="lite-page-header">
                <button className="lite-page-back-btn" onClick={onClose}>
                    <ArrowLeft size={20} /> 返回列表
                </button>
                <h2 className="lite-page-title">⚙️ 系統設定</h2>
                <div style={{ width: '100px' }}>{/* Spacer for flex alignment */}</div>
            </div>

            <div className="lite-page-content lite-settings-page">
                <LiteProfileCard />
                <div className="lite-page-card" style={{ marginTop: '20px' }}>
                    <SettingsContent
                        activeTab={activeTab}
                        onChangeTab={setActiveTab}
                    />
                </div>
            </div>
        </div>
    );
};
