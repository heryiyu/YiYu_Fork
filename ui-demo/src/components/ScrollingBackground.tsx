import { motion } from 'motion/react';

export function ScrollingBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Sky */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-200 to-sky-100" />
      
      {/* Clouds - first layer */}
      <motion.div
        className="absolute top-16 left-0 w-[200%] flex gap-64"
        animate={{ x: [0, -1920] }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      >
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-64 min-w-[960px]">
            <Cloud x={100} y={20} />
            <Cloud x={400} y={40} />
            <Cloud x={700} y={30} />
          </div>
        ))}
      </motion.div>
      
      {/* Mountains - background */}
      <div className="absolute bottom-32 left-0 w-full">
        <svg viewBox="0 0 1440 200" className="w-full h-32" preserveAspectRatio="none">
          <path d="M0,100 Q200,20 400,100 T800,100 T1200,100 T1600,100 L1600,200 L0,200 Z" 
                fill="#a5b4d4" opacity="0.6"/>
          <path d="M200,120 Q400,40 600,120 T1000,120 T1400,120 T1800,120 L1800,200 L200,200 Z" 
                fill="#8fa3c9" opacity="0.7"/>
        </svg>
      </div>
      
      {/* Grass - scrolling */}
      <motion.div
        className="absolute bottom-0 left-0 w-[200%] h-64 bg-gradient-to-b from-green-300 to-green-400"
        animate={{ x: [0, -1920] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        {/* Grass texture pattern */}
        <div className="absolute inset-0 opacity-20">
          {[...Array(100)].map((_, i) => (
            <div
              key={i}
              className="absolute bottom-0 w-1 bg-green-600"
              style={{
                left: `${i * 2}%`,
                height: `${Math.random() * 20 + 10}px`,
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function Cloud({ x, y }: { x: number; y: number }) {
  return (
    <div className="absolute" style={{ left: x, top: y }}>
      <svg width="120" height="50" viewBox="0 0 120 50">
        <ellipse cx="30" cy="30" rx="25" ry="20" fill="white" opacity="0.9"/>
        <ellipse cx="55" cy="25" rx="30" ry="22" fill="white" opacity="0.9"/>
        <ellipse cx="80" cy="28" rx="28" ry="20" fill="white" opacity="0.9"/>
        <ellipse cx="95" cy="32" rx="20" ry="15" fill="white" opacity="0.9"/>
      </svg>
    </div>
  );
}
