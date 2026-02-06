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
    const numGroups = Math.floor(rng.range(1, 2)); // 1 group max
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
                    zIndex: 2, // Behind Grass Base (3) but in front of Mountains (0)
                    duration: rng.range(4, 6)
                });
            }
        }
    };

    placeTree('tree-group', ASSETS.DECORATIONS.TREES_GROUP, numGroups, [0.8, 1.2]);

    // B. Single Trees (Slightly fewer)
    const numSingles = Math.floor(rng.range(5, 8));
    placeTree('tree-single', ASSETS.DECORATIONS.TREES_SINGLE, numSingles, [0.6, 1.0]);

    elements.push(...trees);

    // --- 3. HORIZON EDGE (Grass Strip - Continuous) ---
    // y: ~65% (Seam). Continuous placement with 0.4em (4px) gap.
    const edges = [];

    // Width map (In EM units relative to base 10px)
    const getEdgeWidthVal = (src) => {
        if (src.includes('edge_01')) return 2.5;
        if (src.includes('edge_02')) return 8;
        if (src.includes('edge_03')) return 3;
        if (src.includes('edge_04')) return 0.5;
        return 2.0;
    };

    const MIN_X = -125; // Extend left for pan/zoom; symmetric buffer
    const MAX_WIDTH = 250; // Cover ~2500px equivalent
    let currentX = MIN_X;

    while (currentX < MAX_WIDTH) {
        const src = getRandomAsset(ASSETS.DECORATIONS.GRASS_EDGES);
        const w = getEdgeWidthVal(src);

        edges.push({
            id: `horizon-grass-${currentX}`,
            type: 'HORIZON_GRASS',
            src: src,
            x: currentX, // Now in EM
            y: 64,
            width: `${w}em`,
            scale: 1,
            zIndex: 6
        });

        currentX += (w + 0.4); // Width + 0.4em gap
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
    // Continuous line of Edges + Bushes
    const fgSeamWith = [];

    // Width map for Bushes (em)
    const getBushWidthVal = (src) => {
        if (src.includes('bush_01')) return 12;
        if (src.includes('bush_02')) return 10;
        if (src.includes('bush_03')) return 8;
        return 10;
    };

    let fgCurrentX = MIN_X; // Symmetric with horizon for pan/zoom
    const FG_Y = 33; // 1/3 height from bottom context

    while (fgCurrentX < MAX_WIDTH) {
        // Randomly decide: Edge or Bush?
        // Bushes should be less frequent than edges to look nice
        const isBush = rng.next() > 0.7; // 30% chance of bush

        let src, w, type;

        if (isBush) {
            src = getRandomAsset(ASSETS.DECORATIONS.BUSHES);
            w = getBushWidthVal(src);
            type = 'BUSH';
        } else {
            src = getRandomAsset(ASSETS.DECORATIONS.GRASS_EDGES);
            w = getEdgeWidthVal(src);
            type = 'HORIZON_GRASS'; // We reuse the edge asset type name or create new
        }

        fgSeamWith.push({
            id: `fg-seam-${fgCurrentX}`,
            type: 'FOREGROUND_SEAM_ITEM', // New type identifier
            subType: type, // To know which asset class it is
            src: src,
            x: fgCurrentX,
            y: FG_Y,
            width: `${w}em`,
            scale: isBush ? rng.range(0.9, 1.1) : 1, // Slight variation for bushes
            zIndex: 101
        });

        fgCurrentX += (w + 0.4); // Gap 0.4em consistent with horizon
    }

    // Add to specific 'foregroundSeam' list in output, or main elements
    // We'll add to elements with high Z-index, but distinctive ID
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
