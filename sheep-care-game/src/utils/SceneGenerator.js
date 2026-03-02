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
    // y: Horizon at 33% from top of viewport = 67% from bottom of content
    const HORIZON_Y = 67;
    // Parallax scrolling layers require a much wider generation base to avoid blank spots
    // We expand the generation bounds to [-100, 200] so it fills the 200% scrolling container
    const numMountains = Math.floor(rng.range(5, 8)); // Increased count for wider area
    const mountainAssets = ASSETS.ENVIRONMENT.MOUNTAINS.BG;
    for (let i = 0; i < numMountains; i++) {
        // Pick random variant from array
        const list = Array.isArray(mountainAssets) ? mountainAssets : [mountainAssets];
        const src = list[Math.floor(rng.range(0, list.length))];
        elements.push({
            id: `mtn-${i}`,
            type: 'MOUNTAIN',
            src: src,
            // Evenly distribute them across the super-wide range rather than purely random
            x: -100 + (300 / numMountains) * i + rng.range(-15, 15),
            y: HORIZON_Y,
            scale: rng.range(2, 3),
            zIndex: 0
        });
    }

    // --- 2. HORIZON ZONE (Trees) ---
    // A. Tree Groups (Sparse)
    const numGroups = Math.floor(rng.range(2, 4));
    const trees = [];

    const placeTree = (type, assetList, count, scaleRange) => {
        if (!assetList) return;
        for (let i = 0; i < count; i++) {
            let attempts = 0;
            let x = 0;
            let valid = false;
            while (attempts < 20 && !valid) {
                // Wide spawn bounding to fill 200% scroller
                x = -100 + (300 / count) * i + rng.range(-20, 20);
                if (!isColliding(x, HORIZON_Y, trees, 15)) { // Wide berth
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
                    zIndex: 2, // Behind Grass Base (3) but in front of Mountains (0)
                    duration: rng.range(4, 6)
                });
            }
        }
    };

    placeTree('tree-group', ASSETS.DECORATIONS.TREES_GROUP, numGroups, [0.8, 1.2]);

    // B. Single Trees (Slightly fewer)
    const numSingles = Math.floor(rng.range(8, 14));
    placeTree('tree-single', ASSETS.DECORATIONS.TREES_SINGLE, numSingles, [0.6, 1.0]);

    elements.push(...trees);

    // --- 3. HORIZON EDGE (Grass Strip - Continuous) ---
    // Since we now use CSS repeat-x for the horizon grass, we only need to provide ONE random grass src to the scene
    const edges = [{
        id: `horizon-grass-base`,
        type: 'HORIZON_GRASS',
        src: getRandomAsset(ASSETS.DECORATIONS.GRASS_EDGES),
        x: 0,
        y: 64,
        scale: 1,
        zIndex: 6
    }];
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
            y = rng.range(35, 60); // Constrained to Grass Terrain (Above 33%)
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
                scale: rng.range(1, 1.5),
                zIndex: Math.floor(100 - y)
            });
        }
    }
    elements.push(...fieldItems);

    // --- 5. FOREGROUND SEAM (Y: ~33%) ---
    // Provide ONE base grass src for the repetitive background
    const fgSeamWith = [{
        id: `fg-seam-base`,
        type: 'FOREGROUND_SEAM_ITEM',
        subType: 'HORIZON_GRASS', // Marks it as the grass texture
        src: getRandomAsset(ASSETS.DECORATIONS.GRASS_EDGES),
        x: 0,
        y: 33,
        scale: 1,
        zIndex: 101
    }];

    // Generate a sparse number of random bushes
    const numBushes = Math.floor(rng.range(6, 12));
    for (let i = 0; i < numBushes; i++) {
        // Distribute them evenly over the 300% parallax window
        const bushX = -100 + (300 / numBushes) * i + rng.range(-15, 15);
        fgSeamWith.push({
            id: `fg-bush-${i}`,
            type: 'FOREGROUND_SEAM_ITEM',
            subType: 'BUSH',
            src: getRandomAsset(ASSETS.DECORATIONS.BUSHES),
            x: bushX,
            y: 33,
            width: rng.range(8, 12) + 'em',
            scale: rng.range(0.9, 1.1),
            zIndex: 101
        });
    }

    elements.push(...fgSeamWith);

    // --- 6. FOREGROUND DECOR (Scattered Grass ONLY) ---
    // Scattered grass on the Foreground Block surface (0-33%)
    const foregroundDecor = [];
    const numFgGrass = Math.floor(rng.range(6, 12));
    for (let i = 0; i < numFgGrass; i++) {
        foregroundDecor.push({
            id: `fg-grass-${i}`,
            type: 'GRASS',
            src: getRandomAsset(ASSETS.DECORATIONS.GRASS),
            x: rng.range(0, 100),
            y: rng.range(5, 30), // Within the 33% block
            scale: rng.range(1.0, 1.4), // Larger in FG
            zIndex: 102
        });
    }

    // --- 6. CLOUDS (Generated Positions) ---
    // Explicitly place clouds to avoid overlap
    const clouds = [];
    const cloudAssets = ASSETS.ENVIRONMENT.CLOUDS;
    // Scale up the cloud count because the scrolling area is 300% wide (-100 to 200)
    const numClouds = Math.floor(rng.range(9, 15));

    for (let i = 0; i < numClouds; i++) {
        let attempts = 0;
        let x = 0, y = 0;
        let valid = false;
        // Check collision against other clouds
        while (attempts < 20 && !valid) {
            // Span across the entire parallax scrolling length
            x = rng.range(-100, 200);
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
                scale: rng.range(0.8, 1.2),
                duration: rng.range(20, 30) // Deterministic duration
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
