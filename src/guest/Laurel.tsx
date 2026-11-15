/*
 * Gold laurel drawings, as on the couple's printed table cards: outlined
 * leaves with a vein, along a fine stem. Decorative only (aria-hidden);
 * they take the text colour (currentColor), so CSS sets the gold.
 */

type Point = { x: number; y: number; angle: number }

/** One outlined leaf, pointing along +x from the origin, with its vein. */
function Leaf({ x, y, angle, size }: Point & { size: number }) {
  return (
    <g
      transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${angle.toFixed(1)}) scale(${(size / 16).toFixed(3)})`}
    >
      <path d="M0 0 C4 -4.6 11 -4.6 16 0 C11 4.6 4 4.6 0 0 Z" vectorEffect="non-scaling-stroke" />
      <path d="M1.5 0 L12.5 0" vectorEffect="non-scaling-stroke" />
    </g>
  )
}

/** Leaves on both sides of a curved stem, alternating, smaller towards the tip. */
function leavesAlong(
  pointAt: (t: number) => { x: number; y: number },
  count: number,
  size: number,
): Array<Point & { size: number }> {
  const leaves: Array<Point & { size: number }> = []
  for (let i = 0; i < count; i++) {
    const t = (i + 0.6) / (count + 0.4)
    const p = pointAt(t)
    const q = pointAt(Math.min(1, t + 0.01))
    const along = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI
    const side = i % 2 === 0 ? -1 : 1
    leaves.push({ ...p, angle: along + side * 38, size: size * (1 - t * 0.45) })
  }
  return leaves
}

/**
 * A garland arching across the top of a card: two branches from the middle,
 * curving down to the sides. `flip` turns it upside down for the bottom.
 */
export function Garland({ className, flip }: { className?: string; flip?: boolean }) {
  // Right half of the stem, from the middle (t = 0) to the right tip (t = 1).
  const right = (t: number) => ({ x: 120 + 104 * t, y: 12 + 30 * t * t })
  const half = leavesAlong(right, 10, 23)
  const stem = 'M120 12 Q172 12 224 42'
  return (
    <svg
      className={className}
      viewBox="0 0 240 52"
      aria-hidden="true"
      focusable="false"
      style={flip ? { transform: 'scaleY(-1)' } : undefined}
    >
      <g fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round">
        {[1, -1].map((dir) => (
          <g key={dir} transform={dir === -1 ? 'translate(240 0) scale(-1 1)' : undefined}>
            <path d={stem} />
            {half.map((leaf, i) => (
              <Leaf key={i} {...leaf} />
            ))}
          </g>
        ))}
        <circle cx="120" cy="12" r="1.6" fill="currentColor" />
      </g>
    </svg>
  )
}

/** A small round wreath (open at the bottom), to circle the guest's table on the plan. */
export function Wreath({ className }: { className?: string }) {
  const r = 40
  // From the bottom gap up each side to the top: angles in degrees, 0 = right.
  const side = (from: number, to: number) => (t: number) => {
    const a = ((from + (to - from) * t) * Math.PI) / 180
    return { x: 50 + r * Math.cos(a), y: 50 + r * Math.sin(a) }
  }
  const leaves = [...leavesAlong(side(115, 265), 8, 13), ...leavesAlong(side(65, -85), 8, 13)]
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
        <path
          d={`M${50 + r * Math.cos((115 * Math.PI) / 180)} ${50 + r * Math.sin((115 * Math.PI) / 180)} A${r} ${r} 0 0 1 ${50 + r * Math.cos((265 * Math.PI) / 180)} ${50 + r * Math.sin((265 * Math.PI) / 180)}`}
        />
        <path
          d={`M${50 + r * Math.cos((65 * Math.PI) / 180)} ${50 + r * Math.sin((65 * Math.PI) / 180)} A${r} ${r} 0 0 0 ${50 + r * Math.cos((-85 * Math.PI) / 180)} ${50 + r * Math.sin((-85 * Math.PI) / 180)}`}
        />
        {leaves.map((leaf, i) => (
          <Leaf key={i} {...leaf} />
        ))}
      </g>
    </svg>
  )
}
