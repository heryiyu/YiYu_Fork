import { useRef, useMemo, useCallback } from 'react';

export const usePanGesture = (enabled, scaleFactor = 1) => {
    const panState = useRef({ x: 0, y: 0, startX: 0, startY: 0, isPanning: false });
    const domRef = useRef(null);
    const rafRef = useRef(null);

    // Reset logic
    const reset = useCallback(() => {
        panState.current = { x: 0, y: 0, startX: 0, startY: 0, isPanning: false };
        if (domRef.current) domRef.current.style.transform = 'translate(0px, 0px)';
    }, []);

    const handlers = useMemo(() => ({
        onPointerDown: (e) => {
            if (!enabled) return;
            panState.current.isPanning = true;
            panState.current.startX = e.clientX - panState.current.x;
            panState.current.startY = e.clientY - panState.current.y;
            e.currentTarget.setPointerCapture(e.pointerId);
            // Dynamic cursor handling if needed, usually passed down or handled by CSS class
        },
        onPointerMove: (e) => {
            if (!enabled || !panState.current.isPanning) return;
            const x = e.clientX - panState.current.startX;
            const y = e.clientY - panState.current.startY;
            panState.current.x = x;
            panState.current.y = y;

            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(() => {
                if (domRef.current) {
                    domRef.current.style.transform = `translate(${x / scaleFactor}px, ${y / scaleFactor}px)`;
                }
            });
        },
        onPointerUp: (e) => {
            panState.current.isPanning = false;
        },
        onPointerLeave: (e) => {
            // Optional: Stop panning on leave? Or keep until Up?
            // Usually Up is enough due to capture, but standard is safe.
            // Actually, if we have setPointerCapture, leave doesn't fire until release or loose capture.
            // So we might not need explicit leave logic if capture is good.
            // But existing code had it. Let's keep it simple.
        }
    }), [enabled, scaleFactor]);

    return { domRef, handlers, reset, panState };
};
