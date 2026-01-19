export const SHEEP_TYPES = {
  LAMB: {
    id: 'lamb',
    name: '小羊',
    description: '剛出生的小羊，需要細心呵護。',
    growthThreshold: 100, // Grows after 100 care
    nextStage: 'strong',
    icon: '🐑'
  },
  STRONG: {
    id: 'strong',
    name: '強壯的羊',
    description: '經歷了成長，變得強壯有力。',
    growthThreshold: 100, // Grows after 100 more care
    nextStage: 'human',
    icon: '🐏'
  },
  HUMAN: {
    id: 'human',
    name: '榮耀的羊', // User said "Human Shaped", giving a poetic name but ID is 'human'
    description: '充滿靈性，有了人的樣式。',
    growthThreshold: null, // Final stage
    nextStage: null,
    icon: '🧍'
  }
};
