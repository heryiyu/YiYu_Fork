import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export const Portal = ({ children }) => {
    const [mountNode, setMountNode] = useState(null);

    useEffect(() => {
        setMountNode(document.body);
    }, []);

    return mountNode ? createPortal(children, mountNode) : null;
};
