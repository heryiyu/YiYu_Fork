import React from 'react';
import { ScheduleListContent } from '../../components/modals/ScheduleListContent';
import './LiteSchedulePage.css';

export const LiteSchedulePage = ({ onClose }) => {
    return (
        <div className="lite-page lite-schedule-page">
            <ScheduleListContent onClose={onClose} />
        </div>
    );
};
