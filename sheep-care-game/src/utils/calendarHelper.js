/**
 * Generates a Google Calendar "Add Event" URL.
 * Format: https://www.google.com/calendar/render?action=TEMPLATE&text=TITLE&dates=START/END&details=NOTES&location=LOCATION
 * 
 * @param {Object} plan - The spiritual plan object
 * @param {Object} sheep - The sheep object associated with the plan
 * @returns {string} The generated Google Calendar URL
 */
export const generateGoogleCalendarUrl = (plan, sheep) => {
    if (!plan || !plan.scheduled_time) return '';

    const title = encodeURIComponent(`牧羊規劃：${plan.action} (${sheep?.name || '未知小羊'})`);

    // Format dates: YYYYMMDDTHHmmSSZ
    const startDate = new Date(plan.scheduled_time);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Default to 1 hour duration

    const formatToGoogle = (date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const dates = `${formatToGoogle(startDate)}/${formatToGoogle(endDate)}`;

    const location = encodeURIComponent(plan.location || '');
    const details = encodeURIComponent(
        `小羊：${sheep?.name || '未知'}\n行動：${plan.action}\n內容：${plan.content || '無'}\n\n來自小羊牧場遊戲`
    );

    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
};
