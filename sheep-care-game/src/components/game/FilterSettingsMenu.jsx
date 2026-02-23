import React, { useRef, useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { CloseButton } from '../ui/CloseButton';
import { Checkbox } from '../ui/Checkbox';

export const FilterSettingsMenu = ({ filters, hiddenFilterIds, onToggle, onManageTags, onClose, anchorRef }) => {
    const menuRef = useRef(null);
    const scrollRef = useRef(null);
    const [position, setPosition] = useState({ bottom: 0, right: 0, top: 'auto' });
    const [showFadeOverlay, setShowFadeOverlay] = useState(false);

    const checkScrollState = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        const { scrollHeight, clientHeight, scrollTop } = el;
        const hasOverflow = scrollHeight > clientHeight;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 2;
        setShowFadeOverlay(hasOverflow && !isAtBottom);
    }, []);

    useEffect(() => {
        const id = requestAnimationFrame(() => checkScrollState());
        return () => cancelAnimationFrame(id);
    }, [checkScrollState, filters]);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const ro = new ResizeObserver(() => requestAnimationFrame(checkScrollState));
        ro.observe(el);
        return () => ro.disconnect();
    }, [checkScrollState]);

    useEffect(() => {
        const updatePosition = () => {
            if (anchorRef?.current) {
                const rect = anchorRef.current.getBoundingClientRect();
                const isUpperHalf = rect.top < window.innerHeight / 2;

                setPosition({
                    top: isUpperHalf ? rect.bottom + 8 : 'auto',
                    bottom: isUpperHalf ? 'auto' : window.innerHeight - rect.top + 8,
                    right: window.innerWidth - rect.right
                });
            }
        };
        updatePosition();
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);
        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [anchorRef]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target) && anchorRef?.current && !anchorRef.current.contains(e.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose, anchorRef]);

    return ReactDOM.createPortal(
        <div
            ref={menuRef}
            className="filter-settings-menu"
            style={{
                position: 'fixed',
                top: position.top,
                bottom: position.bottom,
                right: position.right,
                minWidth: '200px',
                maxHeight: '280px',
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--card-inner-bg, #fff)',
                borderRadius: '12px',
                boxShadow: 'var(--shadow-card)',
                border: '1px solid var(--border-subtle, rgba(0,0,0,0.1))',
                zIndex: 'var(--z-modal-overlay)'
            }}
        >
            <div style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <div className="filter-settings-header">
                    <span>顯示篩選</span>
                    <CloseButton ariaLabel="關閉篩選設定" onClick={onClose} />
                </div>
                <div
                    ref={scrollRef}
                    onScroll={checkScrollState}
                    style={{ padding: '0 12px 0', flex: 1, minHeight: 0, overflowY: 'auto' }}
                >
                    {filters.map((f) => {
                        const isHidden = hiddenFilterIds.has(f.id);
                        return (
                            <label
                                key={f.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '6px 0',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem'
                                }}
                            >
                                <Checkbox
                                    checked={!isHidden}
                                    onChange={() => onToggle(f.id)}
                                    ariaLabel={f.label}
                                />
                                {f.color ? (
                                    <span
                                        style={{
                                            width: 10,
                                            height: 10,
                                            borderRadius: 4,
                                            background: f.color
                                        }}
                                    />
                                ) : null}
                                <span>{f.label}</span>
                            </label>
                        );
                    })}
                </div>
                {showFadeOverlay && (
                    <div
                        aria-hidden
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: 45,
                            background: 'linear-gradient(to top, var(--card-inner-bg, #fff) 0%, transparent 100%)',
                            pointerEvents: 'none',
                            transition: 'opacity 0.2s ease'
                        }}
                    />
                )}
            </div>
            <div style={{ borderTop: '1px solid rgba(0,0,0,0.1)', padding: '12px', flexShrink: 0 }}>
                <button
                    type="button"
                    className="modal-btn-secondary"
                    onClick={onManageTags}
                    style={{ width: '100%', fontSize: '0.85rem', padding: '8px 12px' }}
                >
                    管理標籤
                </button>
            </div>
        </div>,
        document.body
    );
};
