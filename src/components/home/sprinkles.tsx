// Decorative sprinkles (hero + featured card only, per DESIGN.md).
const COLORS = ["#ffffff", "#ff861c", "#7ec8e3", "#f7d154", "#b6e3a1", "#c7b5f5"];

export function Sprinkles({ count = 18, seed = 7, className = "" }: { count?: number; seed?: number; className?: string }) {
  // Deterministic pseudo-random value per sprinkle + property (same on server and client)
  const r = (i: number, k: number) => { const x = Math.sin(seed * 7919 + i * 104.729 + k * 12.9898) * 43758.5453; return x - Math.floor(x); };
  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="absolute h-[7px] w-[22px] rounded-full"
          style={{ left: `${(r(i, 1) * 94).toFixed(2)}%`, top: `${(r(i, 2) * 92).toFixed(2)}%`, backgroundColor: COLORS[i % COLORS.length], transform: `rotate(${Math.floor(r(i, 3) * 180)}deg)`, opacity: 0.9 }}
        />
      ))}
    </div>
  );
}
