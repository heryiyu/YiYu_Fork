import React, { useState } from 'react';
import { Portal } from './ui/Portal';
import '../styles/design-tokens.css';

// ...

export const IntroVideo = ({ onClose, onComplete }) => {
    const [isPlaying, setIsPlaying] = useState(false);

    // Using YouTube Thumbnail
    const videoId = "tqupdMUIVWQ";
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    const handlePlay = () => {
        setIsPlaying(true);
    };

    return (
        <Portal>
            <div style={{
                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                background: 'rgba(0,0,0,0.9)', zIndex: 'var(--z-cursor)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(5px)'
            }}>
                {/* ... existing content ... */}
                <div style={{ width: '90%', maxWidth: '640px', background: '#000', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>

                    <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                        {!isPlaying ? (
                            <div
                                style={{
                                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                    backgroundImage: `url(${thumbnailUrl})`,
                                    backgroundSize: 'cover', backgroundPosition: 'center',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer'
                                }}
                                onClick={handlePlay}
                            >
                                {/* Play Button Overlay */}
                                <div style={{
                                    width: '64px', height: '64px',
                                    background: 'rgba(0,0,0,0.7)', borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: '2px solid #fff'
                                }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M8 5V19L19 12L8 5Z" />
                                    </svg>
                                </div>
                                <div style={{
                                    position: 'absolute', bottom: '10px', left: '10px',
                                    color: 'white', background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '4px',
                                    fontSize: '0.8rem'
                                }}>
                                    點擊播放影片
                                </div>
                            </div>
                        ) : (
                            <iframe
                                src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                                title="Intro Video"
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        )}
                    </div>
                </div>

                <button
                    onClick={onComplete || onClose}
                    style={{
                        marginTop: '30px', padding: '10px 30px', fontSize: '1.1rem',
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.5)',
                        color: '#fff',
                        borderRadius: '30px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.borderColor = '#fff'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; }}
                >
                    {isPlaying ? "略過 (Skip)" : "不看影片，直接開始"}
                </button>
                <p style={{ color: '#888', marginTop: '12px', fontSize: '0.9rem' }}>
                    ※ 日後可至「牧羊人手冊」重溫
                </p>
            </div>
        </Portal>
    );
};
