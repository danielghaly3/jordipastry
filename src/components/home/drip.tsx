// Glaze dripping from the bottom of a colored band. Deterministic shapes so server and client match.
export function Drip({ className = "", color = "var(--pink)" }: { className?: string; color?: string }) {
  const W = 1440, base = 14;
  const drips = [60, 170, 245, 390, 520, 600, 760, 905, 980, 1130, 1260, 1370].map((cx, i) => ({
    cx, w: 26 + ((i * 37) % 22), len: 22 + ((i * 53) % 44),
  }));
  let d = `M0,0 H${W} V${base}`;
  for (const { cx, w, len } of [...drips].reverse()) {
    const r = w / 2;
    d += ` H${cx + r + 8} Q${cx + r},${base} ${cx + r},${base + 8} V${base + len - r} A${r},${r} 0 0 1 ${cx - r},${base + len - r} V${base + 8} Q${cx - r},${base} ${cx - r - 8},${base}`;
  }
  d += " H0 Z";
  return (
    <svg viewBox={`0 0 ${W} 80`} preserveAspectRatio="none" className={`block h-[40px] w-full md:h-[60px] ${className}`} aria-hidden="true">
      <path d={d} fill={color} />
    </svg>
  );
}
