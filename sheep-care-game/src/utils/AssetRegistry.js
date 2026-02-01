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
  SHEEP: {
    CLASSIC_WHITE: '/assets/sheep/classic_white.png',
    GHOST: '/assets/sheep/ghost.png',
  },
  // Fallback map for mapping DB skin keys to local assets if DB url is missing
  SKIN_MAP: {
    'classic_white': '/assets/sheep/classic_white.png',
    'ghost_default': '/assets/sheep/ghost.png',
  }
};

// Helper to get random asset from a list
export const getRandomAsset = (list) => {
  if (!list || list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
};
