import { Sheep, SHEEP_COLORS } from './Sheep';

interface SheepData {
  id: number;
  color: string;
  x: number;
  y: number;
  delay: number;
}

export function SheepHerd({ count }: { count: number }) {
  // Generate random sheep positions
  const sheep: SheepData[] = Array.from({ length: count }, (_, i) => ({
    id: i,
    color: SHEEP_COLORS[Math.floor(Math.random() * SHEEP_COLORS.length)],
    x: Math.random() * 85 + 5, // 5% to 90% of container width
    y: Math.random() * 45 + 10, // Spread across middle area
    delay: Math.random() * 2,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none">
      {sheep.map((s) => (
        <div key={s.id} className="absolute" style={{ left: `${s.x}%`, top: `${s.y}%` }}>
          <Sheep color={s.color} x={0} y={0} delay={s.delay} />
        </div>
      ))}
    </div>
  );
}
