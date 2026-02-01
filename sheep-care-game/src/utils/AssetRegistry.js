// AssetRegistry.js
// Central manifest for all static assets. 
// This allows us to change file paths in one place without breaking the app.

export const ASSETS = {
  ENVIRONMENT: {
    SKY: {
      DAY_GRAIDENT: '/assets/environment/sky/day_gradient.svg',
    },
    MOUNTAINS: {
      BG: '/assets/environment/mountains/mountain_bg.svg',
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
    TREES: [
      '/assets/decorations/trees/tree_01.svg',
      '/assets/decorations/trees/tree_02.svg',
      '/assets/decorations/trees/tree_03.svg',
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
    ]
  },
  SHEEP: {
    CLASSIC_WHITE: '/assets/sheep/classic_white.svg',
    GHOST: '/assets/sheep/ghost.svg',
  },
  // Fallback map for mapping DB skin keys to local assets if DB url is missing
  SKIN_MAP: {
    'classic_white': '/assets/sheep/classic_white.svg',
    'ghost_default': '/assets/sheep/ghost.svg',
  }
};

// Helper to get random asset from a list
export const getRandomAsset = (list) => {
  if (!list || list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
};
