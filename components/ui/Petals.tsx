// Falling Kae Farang petals — pure CSS, deterministic (no hydration mismatch).
const PETALS = Array.from({ length: 14 }, (_, i) => ({
  left: (i * 73) % 100,
  t: 14 + ((i * 7) % 9),
  d: -((i * 3.1) % 14),
  dx: ((i % 2 ? 1 : -1) * (40 + ((i * 17) % 80))),
  r: 240 + ((i * 53) % 240),
  o: 0.45 + ((i * 13) % 40) / 100,
  soft: i % 3 === 0,
}));

export function Petals() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {PETALS.map((p, i) => (
        <span
          key={i}
          className="petal"
          style={
            {
              left: `${p.left}%`,
              background: p.soft ? "var(--c-pink-soft)" : undefined,
              "--petal-t": `${p.t}s`,
              "--petal-d": `${p.d}s`,
              "--petal-dx": `${p.dx}px`,
              "--petal-r": `${p.r}deg`,
              "--petal-o": p.o,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
