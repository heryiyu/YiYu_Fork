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

    // --- Helper: Check Collision (Simple Distance Check) ---
    // Returns true if position (x, y) collides with any existing element of similar type
    // We treat x as primary factor (horizontal overlap) because y provides depth.
    // However, for pure 2D composition, we check Euclidean distance scaled for aspect ratio.
    const isColliding = (x, y, existingElements, threshold = 8) => {
        for (let el of existingElements) {
            // Only check collision against same 'layer' or visually similar items
            // But here we just want to avoid clutter generally.
            const dx = x - el.x;
            const dy = (y - el.y) * 2; // Weight Y more heavily? No, usually Y is depth.
            // Let's just check simple distance.
            const dist = Math.sqrt(dx * dx + (y - el.y) * (y - el.y));
            if (dist < threshold) return true;
        }
        return false;
    };

    // --- 1. MOUNTAIN ZONE (Deep Background) ---
    // y: Fixed at HORIZON_Y (Renderer handles offset)
    const HORIZON_Y = 65;
    const numMountains = Math.floor(rng.range(2, 4));
    const mountainAssets = ASSETS.ENVIRONMENT.MOUNTAINS.BG;
    for (let i = 0; i < numMountains; i++) {
        // Pick random variant from array
        const list = Array.isArray(mountainAssets) ? mountainAssets : [mountainAssets];
        const src = list[Math.floor(rng.range(0, list.length))];
        elements.push({
            id: `mtn-${i}`,
            type: 'MOUNTAIN',
            src: src,
            x: rng.range(0, 100),
            y: HORIZON_Y,
            scale: rng.range(2, 3),
            zIndex: 0
        });
    }

    // --- 2. HORIZON ZONE (Trees) ---
    // A. Tree Groups (Sparse)
    const numGroups = Math.floor(rng.range(1, 3)); // 1 or 2 groups max
    const trees = [];

    const placeTree = (type, assetList, count, scaleRange) => {
        if (!assetList) return;
        for (let i = 0; i < count; i++) {
            let attempts = 0;
            let x = 0;
            let valid = false;
            while (attempts < 20 && !valid) {
                x = rng.range(-5, 105);
                if (!isColliding(x, HORIZON_Y, trees, 12)) { // Wide berth
                    valid = true;
                }
                attempts++;
            }
            if (valid) {
                trees.push({
                    id: `${type}-${i}`,
                    type: 'TREE',
                    src: getRandomAsset(assetList),
                    x: x,
                    y: HORIZON_Y,
                    scale: rng.range(scaleRange[0], scaleRange[1]),
                    zIndex: 2 // Behind Grass Base (3) but in front of Mountains (0)
                });
            }
        }
    };

    placeTree('tree-group', ASSETS.DECORATIONS.TREES_GROUP, numGroups, [0.8, 1.2]);

    // B. Single Trees (Dense)
    const numSingles = Math.floor(rng.range(8, 12));
    placeTree('tree-single', ASSETS.DECORATIONS.TREES_SINGLE, numSingles, [0.6, 1.0]);

    elements.push(...trees);

    // --- 3. HORIZON EDGE (Grass Strip - Continuous) ---
    // y: ~65% (Seam). Continuous placement with 4px gap.
    const edges = [];

    // Width map (Numeric for calculation)
    const getEdgeWidthVal = (src) => {
        if (src.includes('edge_01')) return 16;
        if (src.includes('edge_02')) return 65;
        if (src.includes('edge_03')) return 20;
        if (src.includes('edge_04')) return 2;
        return 20;
    };

    let currentX = -10; // Start slightly off-screen
    const MAX_WIDTH = 2500; // Generate enough to cover wide screens

    while (currentX < MAX_WIDTH) {
        const src = getRandomAsset(ASSETS.DECORATIONS.GRASS_EDGES);
        const w = getEdgeWidthVal(src);

        edges.push({
            id: `horizon-grass-${currentX}`,
            type: 'HORIZON_GRASS',
            src: src,
            x: currentX, // Now in PIXELS
            y: 64,
            width: `${w}px`,
            scale: 1,
            zIndex: 6
        });

        currentX += (w + 4); // Width + 4px gap
    }
    elements.push(...edges);

    // --- 4. PLAY ZONE (The Field) ---
    // y: 15-60% (Between foreground and horizon)
    const numFieldGrass = Math.floor(rng.range(8, 15));
    const fieldItems = [];
    for (let i = 0; i < numFieldGrass; i++) {
        let attempts = 0;
        let x = 0, y = 0;
        let valid = false;

        while (attempts < 10 && !valid) {
            x = rng.range(5, 95);
            y = rng.range(15, 60);
            if (!isColliding(x, y, fieldItems, 10)) valid = true;
            attempts++;
        }

        if (valid) {
            fieldItems.push({
                id: `field-grass-${i}`,
                type: 'GRASS',
                src: getRandomAsset(ASSETS.DECORATIONS.GRASS),
                x: x,
                y: y,
                scale: rng.range(0.5, 0.8),
                zIndex: Math.floor(100 - y)
            });
        }
    }
    elements.push(...fieldItems);

    // --- 5. FOREGROUND ZONE (Color Block + Decoration) ---
    // y: 0-15%
    const foregroundDecor = [];

    // A. Bushes (On Seam line, Top of FG block)
    const numBushes = Math.floor(rng.range(3, 6));
    for (let i = 0; i < numBushes; i++) {
        let attempts = 0;
        let x = 0;
        let valid = false;
        while (attempts < 10 && !valid) {
            x = rng.range(5, 95);
            if (!isColliding(x, 100, foregroundDecor, 15)) valid = true;
            attempts++;
        }
        if (valid) {
            foregroundDecor.push({
                id: `fg-bush-${i}`,
                type: 'BUSH',
                src: getRandomAsset(ASSETS.DECORATIONS.BUSHES),
                x: x,
                y: 100, // Top of FG block
                scale: rng.range(0.8, 1.1),
                rotation: 0,
                zIndex: 101
            });
        }
    }

    // B. FG Grass (Scattered)
    const numFgGrass = Math.floor(rng.range(4, 8));
    for (let i = 0; i < numFgGrass; i++) {
        foregroundDecor.push({
            id: `fg-grass-${i}`,
            type: 'GRASS',
            src: getRandomAsset(ASSETS.DECORATIONS.GRASS),
            x: rng.range(0, 100),
            y: rng.range(20, 80),
            scale: rng.range(0.8, 1.2),
            zIndex: 102
        });
    }

    // --- 6. CLOUDS (Generated Positions) ---
    // Explicitly place clouds to avoid overlap
    const clouds = [];
    const cloudAssets = ASSETS.ENVIRONMENT.CLOUDS;
    const numClouds = Math.floor(rng.range(3, 5));

    for (let i = 0; i < numClouds; i++) {
        let attempts = 0;
        let x = 0, y = 0;
        let valid = false;
        // Check collision against other clouds
        while (attempts < 20 && !valid) {
            x = rng.range(0, 90);
            y = rng.range(5, 25);
            let collision = false;
            for (let c of clouds) {
                const dx = x - c.x;
                const dy = (y - c.y) * 2;
                if (Math.sqrt(dx * dx + dy * dy) < 20) collision = true;
            }
            if (!collision) valid = true;
            attempts++;
        }
        if (valid) {
            clouds.push({
                src: cloudAssets[i % cloudAssets.length],
                x: x,
                y: y,
                scale: rng.range(0.8, 1.2)
            })
        }
    }

    return {
        // useTokens flag tells renderer to use CSS vars instead of image src
        useTokens: true,
        elements: elements.sort((a, b) => a.zIndex - b.zIndex),
        foreground: {
            decorations: foregroundDecor,
            baseColor: 'var(--color-grass-foreground)'
        },
        clouds: clouds // Now an array of objects
    };
};
