import { motion } from 'motion/react';

export function BackgroundDecorations() {
  return (
    <motion.div
      className="absolute bottom-64 left-0 w-[200%] h-40"
      animate={{ x: [0, -1920] }}
      transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
    >
      {/* Duplicate trees for seamless scrolling */}
      {[...Array(2)].map((_, setIndex) => (
        <div key={setIndex} className="absolute left-0 w-1/2 h-full" style={{ left: `${setIndex * 50}%` }}>
          {/* Tree Group 1 - Tall trees */}
          <div className="absolute" style={{ left: '8%', bottom: 0 }}>
            <TreeTall color="#5a7a6a" />
          </div>
          <div className="absolute" style={{ left: '10%', bottom: 0 }}>
            <TreeTall color="#4d6b5d" />
          </div>
          <div className="absolute" style={{ left: '12%', bottom: 0 }}>
            <TreeTall color="#607d70" />
          </div>
          <div className="absolute" style={{ left: '13.5%', bottom: 0 }}>
            <TreeTall color="#536e61" />
          </div>
          <div className="absolute" style={{ left: '15%', bottom: 0 }}>
            <TreeTall color="#5a7a6a" />
          </div>
          
          {/* Tree Group 2 - Round trees */}
          <div className="absolute" style={{ left: '25%', bottom: 0 }}>
            <TreeRound color="#6b8e7f" />
          </div>
          
          {/* Tree Group 3 - Fluffy trees */}
          <div className="absolute" style={{ left: '38%', bottom: 0 }}>
            <TreeFluffy color="#7a9688" />
          </div>
          
          {/* More single trees scattered */}
          <div className="absolute" style={{ left: '55%', bottom: 0 }}>
            <TreeRound color="#5d7d6f" />
          </div>
          
          <div className="absolute" style={{ left: '72%', bottom: 0 }}>
            <TreeTall color="#4d6b5d" />
          </div>
          
          <div className="absolute" style={{ left: '85%', bottom: 0 }}>
            <TreeFluffy color="#6b8e7f" />
          </div>
        </div>
      ))}
    </motion.div>
  );
}

function TreeTall({ color }: { color: string }) {
  return (
    <svg width="40" height="80" viewBox="0 0 40 80">
      {/* Trunk */}
      <rect x="16" y="50" width="8" height="30" fill="#5d4e37" />
      {/* Foliage - tall pine shape */}
      <ellipse cx="20" cy="45" rx="15" ry="20" fill={color} />
      <ellipse cx="20" cy="35" rx="12" ry="16" fill={color} />
      <ellipse cx="20" cy="25" rx="10" ry="14" fill={color} />
      <ellipse cx="20" cy="18" rx="8" ry="10" fill={color} />
    </svg>
  );
}

function TreeRound({ color }: { color: string }) {
  return (
    <svg width="50" height="70" viewBox="0 0 50 70">
      {/* Trunk */}
      <rect x="20" y="45" width="10" height="25" fill="#5d4e37" />
      {/* Foliage - round bushy */}
      <circle cx="25" cy="30" r="22" fill={color} />
      <circle cx="15" cy="32" r="15" fill={color} opacity="0.9" />
      <circle cx="35" cy="32" r="15" fill={color} opacity="0.9" />
    </svg>
  );
}

function TreeFluffy({ color }: { color: string }) {
  return (
    <svg width="55" height="75" viewBox="0 0 55 75">
      {/* Trunk */}
      <rect x="22" y="48" width="10" height="27" fill="#5d4e37" />
      {/* Foliage - fluffy irregular */}
      <circle cx="27" cy="35" r="18" fill={color} />
      <circle cx="18" cy="30" r="12" fill={color} opacity="0.95" />
      <circle cx="36" cy="30" r="12" fill={color} opacity="0.95" />
      <circle cx="27" cy="22" r="14" fill={color} opacity="0.9" />
      <circle cx="20" cy="40" r="10" fill={color} opacity="0.85" />
      <circle cx="34" cy="40" r="10" fill={color} opacity="0.85" />
    </svg>
  );
}
