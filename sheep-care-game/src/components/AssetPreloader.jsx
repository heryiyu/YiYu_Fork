import React, { useEffect, useState } from 'react';
import { ASSETS } from '../utils/AssetRegistry';
import '../styles/design-tokens.css';

export const AssetPreloader = ({ onLoaded }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const assetsToLoad = [
            ASSETS.ENVIRONMENT.SKY.DAY_GRAIDENT,
            // Mountains might be an array now
            Array.isArray(ASSETS.ENVIRONMENT.MOUNTAINS.BG) ? ASSETS.ENVIRONMENT.MOUNTAINS.BG[0] : ASSETS.ENVIRONMENT.MOUNTAINS.BG,
            ASSETS.SHEEP_VARIANTS.CLASSIC_WHITE.HEALTHY,
            ASSETS.SHEEP_VARIANTS.GHOST,
            // Preload a few trees/clouds to be safe
            ASSETS.ENVIRONMENT.CLOUDS[0],
            ASSETS.DECORATIONS.TREES_SINGLE[0]
        ];

        let loadedCount = 0;

        const loadImage = (src) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.src = src;
                img.onload = () => resolve(src);
                img.onerror = () => resolve(src); // Continue even if fail
            });
        };

        const loadAll = async () => {
            for (const src of assetsToLoad) {
                await loadImage(src);
                loadedCount++;
                setProgress(Math.round((loadedCount / assetsToLoad.length) * 100));
            }
            // Small artificial delay for UX (so specific animation can finish)
            setTimeout(() => {
                onLoaded();
            }, 500);
        };

        loadAll();
    }, [onLoaded]);

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'var(--color-primary-cream)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999
        }}>
            <div style={{ fontSize: '40px', marginBottom: '20px', animation: 'bounce 1s infinite' }}>
                🐑
            </div>
            <div style={{
                color: 'var(--color-text-brown)',
                fontSize: '1.2rem', fontWeight: 'bold',
                fontFamily: 'sans-serif'
            }}>
                Loading Farm... {progress}%
            </div>
        </div>
    );
};
