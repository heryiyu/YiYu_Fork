import React from 'react';
import { GuideContent } from './GuideContent';
import { ArrowLeft } from 'lucide-react';
import './LiteGuidePage.css';

export const LiteGuidePage = ({ onClose }) => {
    const [activeTab, setActiveTab] = React.useState('MANUAL');

    return (
        <div className="lite-page-container fade-in">
            <div className="lite-page-header">
                <button className="lite-page-back-btn" onClick={onClose}>
                    <ArrowLeft size={20} /> 返回列表
                </button>
                <h2 className="lite-page-title">📖 牧羊人手冊</h2>
                <div style={{ width: '100px' }}>{/* Spacer for flex alignment */}</div>
            </div>

            <div className="lite-page-content lite-guide-page">
                <div className="lite-page-card">
                    <GuideContent
                        activeTab={activeTab}
                        onChangeTab={setActiveTab}
                    />
                </div>
            </div>
        </div>
    );
};
