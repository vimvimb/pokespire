export type PathState = 'visited' | 'available' | 'locked';

interface Props {
  fromPos: { x: number; y: number };
  toPos: { x: number; y: number };
  state: PathState;
  isDetour?: boolean;
}

/** Evaluate a cubic Bezier at parameter t (0–1). */
function bezierPoint(
  p0: number, p1: number, p2: number, p3: number, t: number,
): number {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

/** Evaluate the derivative of a cubic Bezier at t. */
function bezierTangent(
  p0: number, p1: number, p2: number, p3: number, t: number,
): number {
  const u = 1 - t;
  return 3 * u * u * (p1 - p0) + 6 * u * t * (p2 - p1) + 3 * t * t * (p3 - p2);
}

/** Small double-arrow chevron rendered perpendicular to the path. */
function DetourArrow(
  { cx, cy, angle, color, opacity }: { cx: number; cy: number; angle: number; color: string; opacity: number },
) {
  // Two opposing chevrons forming ◇-style arrows along path direction
  const size = 4;
  const gap = 2.5; // half-gap between the two chevron tips
  return (
    <g transform={`translate(${cx},${cy}) rotate(${angle})`} opacity={opacity}>
      {/* Forward chevron (pointing along path) */}
      <polyline
        points={`${-size},${-size + gap} 0,${gap} ${size},${-size + gap}`}
        stroke={color}
        strokeWidth={1.2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Backward chevron (pointing against path) */}
      <polyline
        points={`${-size},${size - gap} 0,${-gap} ${size},${size - gap}`}
        stroke={color}
        strokeWidth={1.2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

export function MapPath({ fromPos, toPos, state, isDetour }: Props) {
  // Cubic Bezier with control points at 40% horizontal offset
  const dx = toPos.x - fromPos.x;
  const cpOffset = dx * 0.4;
  const cp1x = fromPos.x + cpOffset;
  const cp1y = fromPos.y;
  const cp2x = toPos.x - cpOffset;
  const cp2y = toPos.y;
  const d = `M ${fromPos.x} ${fromPos.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${toPos.x} ${toPos.y}`;

  // Detour decorations: arrows + label at midpoint
  let detourDecor: React.ReactNode = null;
  if (isDetour) {
    const stateColor = state === 'available' ? '#60a5fa'
      : state === 'visited' ? '#d4c9a8'
      : '#8895a7';
    const stateOpacity = state === 'locked' ? 0.3 : state === 'visited' ? 0.6 : 0.85;

    // Compute midpoint and tangent angle
    const mx = bezierPoint(fromPos.x, cp1x, cp2x, toPos.x, 0.5);
    const my = bezierPoint(fromPos.y, cp1y, cp2y, toPos.y, 0.5);
    const tdx = bezierTangent(fromPos.x, cp1x, cp2x, toPos.x, 0.5);
    const tdy = bezierTangent(fromPos.y, cp1y, cp2y, toPos.y, 0.5);
    // Keep text right-side-up: flip if angle would render upside-down
    let angleDeg = Math.atan2(tdy, tdx) * (180 / Math.PI);
    if (angleDeg > 90) angleDeg -= 180;
    else if (angleDeg < -90) angleDeg += 180;

    // Place arrows at 25% and 75% along path
    const arrowTs = [0.25, 0.75];
    const arrows = arrowTs.map(t => {
      const ax = bezierPoint(fromPos.x, cp1x, cp2x, toPos.x, t);
      const ay = bezierPoint(fromPos.y, cp1y, cp2y, toPos.y, t);
      const atdx = bezierTangent(fromPos.x, cp1x, cp2x, toPos.x, t);
      const atdy = bezierTangent(fromPos.y, cp1y, cp2y, toPos.y, t);
      const aAngle = Math.atan2(atdy, atdx) * (180 / Math.PI) + 90; // perpendicular → along path
      return (
        <DetourArrow
          key={t}
          cx={ax}
          cy={ay}
          angle={aAngle}
          color={stateColor}
          opacity={stateOpacity}
        />
      );
    });

    detourDecor = (
      <g>
        {arrows}
        {/* "DETOUR" label at midpoint, following path angle */}
        <g transform={`translate(${mx},${my})`}>
          {/* Background pill */}
          <rect
            x={-24} y={-7}
            width={48} height={14}
            rx={4}
            fill="rgba(15,15,23,0.7)"
            stroke={stateColor}
            strokeWidth={0.7}
            opacity={stateOpacity}
            transform={`rotate(${angleDeg})`}
          />
          <text
            x={0} y={0}
            textAnchor="middle"
            dominantBaseline="central"
            fill={stateColor}
            fontSize={7}
            fontWeight="bold"
            letterSpacing="0.14em"
            opacity={stateOpacity}
            style={{ fontFamily: 'inherit', textTransform: 'uppercase' } as React.CSSProperties}
            transform={`rotate(${angleDeg})`}
          >
            DETOUR
          </text>
        </g>
      </g>
    );
  }

  if (state === 'visited') {
    return (
      <g>
        <path
          d={d}
          stroke="#d4c9a8"
          strokeWidth={2.5}
          fill="none"
          opacity={0.5}
        />
        {detourDecor}
      </g>
    );
  }

  if (state === 'available') {
    return (
      <g>
        {/* Glow underlay */}
        <path
          d={d}
          stroke="#60a5fa"
          strokeWidth={4}
          fill="none"
          opacity={0.15}
        />
        {/* Marching dashes */}
        <path
          d={d}
          stroke="#60a5fa"
          strokeWidth={2.5}
          fill="none"
          opacity={0.7}
          strokeDasharray="8 6"
          style={{ animation: 'pathMarch 1.2s linear infinite' }}
        />
        <style>{`
          @keyframes pathMarch {
            to { stroke-dashoffset: -14; }
          }
        `}</style>
        {detourDecor}
      </g>
    );
  }

  // Locked — faint solid line showing the route
  return (
    <g>
      <path
        d={d}
        stroke="#8895a7"
        strokeWidth={1.5}
        fill="none"
        opacity={0.18}
      />
      {detourDecor}
    </g>
  );
}
