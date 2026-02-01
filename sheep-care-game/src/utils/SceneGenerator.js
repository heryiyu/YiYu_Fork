import { ASSETS, getRandomAsset } from './AssetRegistry';

// Simple Linear Congruential Generator for seeded randomness
class SeededRandom {
    constructor(seedString) {
        // Convert string to numeric seed
        let h = 0x811c9dc5;
        for (let i = 0; i < seedString.length; i++) {
            h ^= seedString.charCodeAt(i);
            h = Math.imul(h, 0x01000193);
        }
        this.seed = h >>> 0;
    }

    // Returns float between 0 and 1
    next() {
        this.seed = (Math.imul(this.seed, 1664525) + 1013904223) | 0;
        return ((this.seed >>> 0) / 4294967296); // Normalize to 0-1
    }

    // Returns float between min and max
    range(min, max) {
        return min + this.next() * (max - min);
    }
}

/**
 * Generates a consistent scene layout for a specific user.
 * @param {string} userId - The user ID to seed the generation.
 * @returns {object} - Structured scene data (mountains, trees, foreground, etc.)
 */
export const generateScene = (userId = 'guest') => {
    const rng = new SeededRandom(userId);
    const elements = [];

    // --- 1. MOUNTAIN ZONE (Deep Background) ---
    // y: 65%+, Sits on horizon
    const numMountains = Math.floor(rng.range(2, 4));
    for (let i = 0; i < numMountains; i++) {
        elements.push({
            id: `mtn-${i}`,
            type: 'MOUNTAIN',
            src: ASSETS.ENVIRONMENT.MOUNTAINS.BG,
            x: rng.range(0, 100),
            y: rng.range(65, 70), // On Horizon
            scale: rng.range(2, 3),
            zIndex: 0
        });
    }

    // --- 2. HORIZON ZONE (Tree Line) ---
    // y: ~60-65%
    // Dense line of trees to block the bottom of mountains
    const numTrees = Math.floor(rng.range(15, 25));
    for (let i = 0; i < numTrees; i++) {
        elements.push({
            id: `tree-${i}`,
            type: 'TREE',
            src: getRandomAsset(ASSETS.DECORATIONS.TREES),
            x: rng.range(-10, 110),
            y: rng.range(62, 68), // sit on horizon
            scale: rng.range(0.5, 0.9), // Smaller because they are far
            zIndex: 5
        });
    }

    // --- 3. HORIZON EDGE (Grass Strip) ---
    // y: ~65% (Seam)
    const stripWidth = 20;
    const numStrips = Math.ceil(100 / stripWidth) + 2;
    for (let i = 0; i < numStrips; i++) {
        elements.push({
            id: `horizon-grass-${i}`,
            type: 'HORIZON_GRASS',
            src: getRandomAsset(ASSETS.DECORATIONS.GRASS_EDGES),
            x: (i * stripWidth) - 10,
            y: 64, // Precise alignment with horizon color block
            scale: 1,
            zIndex: 6
        });
    }

    // --- 4. PLAY ZONE (The Field) ---
    // y: 15-60% (Between foreground and horizon)
    const numFieldGrass = Math.floor(rng.range(10, 20));
    for (let i = 0; i < numFieldGrass; i++) {
        const y = rng.range(15, 60);
        elements.push({
            id: `field-grass-${i}`,
            type: 'GRASS',
            src: getRandomAsset(ASSETS.DECORATIONS.GRASS),
            x: rng.range(5, 95),
            y: y,
            scale: rng.range(0.5, 0.8),
            zIndex: Math.floor(100 - y) // Higher Y = Farther = Lower Z
        });
    }

    // --- 5. FOREGROUND ZONE (Color Block + Decoration) ---
    // y: 0-15%
    const foregroundDecor = [];
    const numFgGrass = Math.floor(rng.range(5, 10));
    for (let i = 0; i < numFgGrass; i++) {
        foregroundDecor.push({
            id: `fg-grass-${i}`,
            type: 'GRASS',
            src: getRandomAsset(ASSETS.DECORATIONS.GRASS),
            x: rng.range(0, 100),
            y: rng.range(20, 80), // Relative to FG container (0-15%)
            scale: rng.range(0.8, 1.2),
            zIndex: 102
        });
    }

    return {
        // useTokens flag tells renderer to use CSS vars instead of image src
        useTokens: true,
        elements: elements.sort((a, b) => a.zIndex - b.zIndex),
        foreground: {
            decorations: foregroundDecor,
            baseColor: 'var(--color-grass-foreground)'
        },
        clouds: ASSETS.ENVIRONMENT.CLOUDS
    };
};
