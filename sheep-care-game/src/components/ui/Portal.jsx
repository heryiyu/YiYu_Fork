import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export const Portal = ({ children }) => {
    return createPortal(children, document.body);
};
