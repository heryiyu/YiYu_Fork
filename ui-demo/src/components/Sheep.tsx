import { motion } from 'motion/react';

interface SheepProps {
  color: string;
  x: number;
  y: number;
  delay?: number;
}

export function Sheep({ color, x, y, delay = 0 }: SheepProps) {
  return (
    <motion.div
      className="absolute"
      style={{ left: x, top: y }}
      initial={{ y: 0 }}
      animate={{ y: [-2, 2, -2] }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    >
      <svg width="60" height="50" viewBox="0 0 60 50">
        {/* Body - fluffy wool */}
        <ellipse cx="30" cy="28" rx="18" ry="15" fill={color} />
        <circle cx="20" cy="25" r="8" fill={color} />
        <circle cx="40" cy="25" r="8" fill={color} />
        <circle cx="25" cy="18" r="7" fill={color} />
        <circle cx="35" cy="18" r="7" fill={color} />
        <circle cx="30" cy="15" r="6" fill={color} />
        
        {/* Head */}
        <ellipse cx="45" cy="22" rx="8" ry="9" fill={getHeadColor(color)} />
        
        {/* Ears */}
        <ellipse cx="43" cy="16" rx="3" ry="5" fill={getHeadColor(color)} />
        <ellipse cx="50" cy="16" rx="3" ry="5" fill={getHeadColor(color)} />
        
        {/* Eyes */}
        <circle cx="44" cy="21" r="1.5" fill="#2d3436" />
        <circle cx="49" cy="21" r="1.5" fill="#2d3436" />
        
        {/* Nose */}
        <ellipse cx="47" cy="25" rx="2" ry="1.5" fill="#e17b77" opacity="0.6" />
        
        {/* Legs */}
        <rect x="20" y="38" width="4" height="10" rx="2" fill={getHeadColor(color)} />
        <rect x="28" y="38" width="4" height="10" rx="2" fill={getHeadColor(color)} />
        <rect x="36" y="38" width="4" height="10" rx="2" fill={getHeadColor(color)} />
        <rect x="44" y="38" width="4" height="10" rx="2" fill={getHeadColor(color)} />
        
        {/* Hooves */}
        <rect x="20" y="46" width="4" height="3" fill="#2d3436" />
        <rect x="28" y="46" width="4" height="3" fill="#2d3436" />
        <rect x="36" y="46" width="4" height="3" fill="#2d3436" />
        <rect x="44" y="46" width="4" height="3" fill="#2d3436" />
        
        {/* Tail */}
        <circle cx="14" cy="28" r="4" fill={color} />
      </svg>
    </motion.div>
  );
}

function getHeadColor(bodyColor: string): string {
  // Map body colors to appropriate head/leg colors
  const colorMap: { [key: string]: string } = {
    '#ffffff': '#f5e6d3', // white wool -> cream face
    '#ffe4e1': '#ffb6c1', // pink wool -> pink face
    '#f4a460': '#d2691e', // orange wool -> brown face
    '#2d3436': '#1a1a1a', // black wool -> dark face
    '#d3d3d3': '#a9a9a9', // gray wool -> darker gray face
    '#faf0e6': '#e6d5c3', // cream wool -> tan face
  };
  
  return colorMap[bodyColor] || '#f5e6d3';
}

export const SHEEP_COLORS = [
  '#ffffff',  // white
  '#ffe4e1',  // pink
  '#f4a460',  // orange/brown
  '#2d3436',  // black
  '#d3d3d3',  // gray
  '#faf0e6',  // cream
];
