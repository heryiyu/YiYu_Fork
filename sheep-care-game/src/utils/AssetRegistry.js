// AssetRegistry.js
// Central manifest for all static assets. 
// This allows us to change file paths in one place without breaking the app.

export const ASSETS = {
  ENVIRONMENT: {
    SKY: {
      DAY_GRAIDENT: '/assets/environment/sky/day_gradient.svg',
    },
    MOUNTAINS: {
      BG: [
        '/assets/environment/mountains/mountain_bg_01.svg',
        '/assets/environment/mountains/mountain_bg_02.svg',
        '/assets/environment/mountains/mountain_bg_03.svg',
      ]
    },
    CLOUDS: [
      '/assets/environment/clouds/cloud_01.svg',
      '/assets/environment/clouds/cloud_02.svg',
      '/assets/environment/clouds/cloud_03.svg',
      '/assets/environment/clouds/cloud_04.svg',
    ],
    TERRAIN: {
      GRASS_BASE: '/assets/environment/terrain/grass_base.svg',
    }
  },
  DECORATIONS: {
    TREES_SINGLE: [
      '/assets/decorations/trees/tree_01.svg',
      '/assets/decorations/trees/tree_02.svg',
    ],
    TREES_GROUP: [
      '/assets/decorations/trees/tree_group_01.svg',
      '/assets/decorations/trees/tree_group_02.svg',
    ],
    BUSHES: [
      '/assets/decorations/bushes/bush_01.svg',
      '/assets/decorations/bushes/bush_02.svg',
      '/assets/decorations/bushes/bush_03.svg',
    ],
    GRASS: [
      '/assets/decorations/grass/grass_01.svg',
      '/assets/decorations/grass/grass_02.svg',
      '/assets/decorations/grass/grass_03.svg',
    ],
    GRASS_EDGES: [
      '/assets/decorations/grass_edges/edge_01.svg',
      '/assets/decorations/grass_edges/edge_02.svg',
      '/assets/decorations/grass_edges/edge_03.svg',
      '/assets/decorations/grass_edges/edge_04.svg',
    ]
  },
  SHEEP_VARIANTS: {
    CLASSIC_WHITE: {
      HEALTHY: '/assets/sheep/classic_white.png',
      SICK: '/assets/sheep/classic_white_sick.png',
    },
    BLACK: {
      HEALTHY: '/assets/sheep/black.png',
      SICK: '/assets/sheep/black_sick.png',
    },
    FLUFFY_WHITE: {
      HEALTHY: '/assets/sheep/fluffy_white.png',
      SICK: '/assets/sheep/fluffy_white_sick.png',
    },
    PINK: {
      HEALTHY: '/assets/sheep/pink.png',
      SICK: '/assets/sheep/pink_sick.png',
    },
    BROWN: {
      HEALTHY: '/assets/sheep/brown.png',
      SICK: '/assets/sheep/brown_sick.png',
    },
    GHOST: '/assets/sheep/ghost.png',
  },

  // Helper for UI Dropdowns
  VARIANT_OPTIONS: [
    { id: 'CLASSIC_WHITE', label: '經典白羊' },
    { id: 'FLUFFY_WHITE', label: '蓬鬆白羊' },
    { id: 'BLACK', label: '黑羊' },
    { id: 'BROWN', label: '棕羊' },
    { id: 'PINK', label: '粉紅羊' },
  ]
};

// Helper to get random asset from a list
export const getRandomAsset = (list) => {
  if (!list || list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
};
