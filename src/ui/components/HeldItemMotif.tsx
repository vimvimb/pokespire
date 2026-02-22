/**
 * Held-item SVG motifs — enamel-pin style icons.
 *
 * Design language matches ItemMotif.tsx (shop items):
 *   • Two-tone colour palette (dark base + light accent)
 *   • Opacity layering for depth (fills 0.15-0.3, strokes 0.4-0.7)
 *   • Diamond sparkle accents
 *   • Simple geometric shapes, rounded edges
 *
 * ViewBox is 32×32 — designed to sit inside the circular HeldItemBadge.
 */

interface Props {
  itemId: string;
  size?: number;
}

export function HeldItemMotif({ itemId, size = 28 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      style={{ display: 'block' }}
    >
      {renderIcon(itemId)}
    </svg>
  );
}

/* ── helpers ────────────────────────────────────────────────────────── */

/** Small diamond sparkle — reused across icons */
function sparkle(x: number, y: number, color: string, opacity = 0.45) {
  return (
    <path
      d={`M${x} ${y - 2} L${x + 1.5} ${y} L${x} ${y + 2} L${x - 1.5} ${y} Z`}
      stroke={color}
      strokeWidth="0.5"
      fill="none"
      opacity={opacity}
    />
  );
}

/* ── icon renderer ──────────────────────────────────────────────────── */

function renderIcon(id: string) {
  switch (id) {

    /* ─── BEGINNER (Kanto City Set) ────────────────────────────── */

    case 'viridian_target':
      // Green bullseye — provoke on column switch
      return (
        <g>
          <circle cx="16" cy="16" r="10" fill="#15803d" opacity={0.15} stroke="#4ade80" strokeWidth="1.2" />
          <circle cx="16" cy="16" r="6.5" stroke="#4ade80" strokeWidth="0.9" fill="none" opacity={0.35} />
          <circle cx="16" cy="16" r="3" fill="#4ade80" opacity={0.25} stroke="#4ade80" strokeWidth="0.8" />
          <circle cx="16" cy="16" r="1.2" fill="#4ade80" opacity={0.6} />
          {/* Arrow hitting target */}
          <line x1="24" y1="8" x2="17.5" y2="14.5" stroke="#86efac" strokeWidth="1" opacity={0.5} />
          <path d="M24 8 L21.5 9.5 L22.5 11.5 Z" fill="#86efac" opacity={0.5} />
          {sparkle(6, 8, '#4ade80')}
          {sparkle(26, 24, '#4ade80', 0.3)}
        </g>
      );

    case 'pewter_stone':
      // Grey stone with shield facet — block + auto-provoke
      return (
        <g>
          <path d="M10 8 L20 6 L26 12 L24 22 L16 26 L8 22 L6 14 Z" fill="#78716c" opacity={0.2} stroke="#a8a29e" strokeWidth="1.2" />
          <path d="M16 13 L19 15 L19 19 L16 21 L13 19 L13 15 Z" fill="#a8a29e" opacity={0.2} stroke="#d6d3d1" strokeWidth="0.8" />
          <line x1="8" y1="14" x2="11" y2="16" stroke="#a8a29e" strokeWidth="0.5" opacity={0.3} />
          <line x1="22" y1="10" x2="20" y2="14" stroke="#a8a29e" strokeWidth="0.5" opacity={0.3} />
          <path d="M12 9 Q10 7 12 6" stroke="#d6d3d1" strokeWidth="0.6" fill="none" opacity={0.4} />
          {sparkle(26, 6, '#a8a29e', 0.35)}
        </g>
      );

    case 'pallet_cannon':
      // Cannon with colorful blast — +5 column damage
      return (
        <g>
          {/* Barrel */}
          <rect x="6" y="13" width="16" height="7" rx="2.5" fill="#dc2626" opacity={0.2} stroke="#f87171" strokeWidth="1.2" />
          {/* Rear cap */}
          <rect x="4" y="15" width="4" height="3" rx="1" fill="#f87171" opacity={0.25} />
          {/* Muzzle flare */}
          <path d="M22 13 L26 11 L26 22 L22 20 Z" fill="#dc2626" opacity={0.18} stroke="#f87171" strokeWidth="1" />
          {/* Wheel */}
          <circle cx="10" cy="24" r="3" fill="#dc2626" opacity={0.15} stroke="#f87171" strokeWidth="0.9" />
          <circle cx="10" cy="24" r="1.2" fill="#f87171" opacity={0.3} />
          {/* Blast sparks */}
          <path d="M27 12 L29 9 M27 16 L30 16 M27 20 L29 23" stroke="#fbbf24" strokeWidth="0.8" fill="none" opacity={0.5} />
          <circle cx="28" cy="9" r="1" fill="#fbbf24" opacity={0.3} />
          {/* Color accent stripes */}
          <line x1="12" y1="13" x2="12" y2="20" stroke="#3b82f6" strokeWidth="0.6" opacity={0.3} />
          <line x1="16" y1="13" x2="16" y2="20" stroke="#fbbf24" strokeWidth="0.6" opacity={0.3} />
          {sparkle(4, 8, '#f87171')}
        </g>
      );

    case 'cerulean_tear':
      // Blue teardrop — heal front ally in column
      return (
        <g>
          <path d="M16 5 Q22 14 22 19 Q22 26 16 27 Q10 26 10 19 Q10 14 16 5 Z" fill="#2563eb" opacity={0.18} stroke="#60a5fa" strokeWidth="1.2" />
          <path d="M16 10 Q19 16 19 19 Q19 23 16 24 Q13 23 13 19 Q13 16 16 10 Z" fill="#60a5fa" opacity={0.15} />
          <ellipse cx="16" cy="20" rx="2.5" ry="3" fill="#93c5fd" opacity={0.2} />
          <path d="M12 15 Q11 12 13 11" stroke="#93c5fd" strokeWidth="0.6" fill="none" opacity={0.5} />
          {sparkle(6, 12, '#60a5fa', 0.4)}
          {sparkle(26, 8, '#60a5fa', 0.3)}
        </g>
      );

    case 'vermilion_spark':
      // Red-orange lightning bolt — contact provoke
      return (
        <g>
          <path d="M18 4 L12 15 L17 15 L10 28" stroke="#ea580c" strokeWidth="2.5" fill="none" opacity={0.2} />
          <path d="M18 4 L12 15 L17 15 L10 28" stroke="#fb923c" strokeWidth="1.5" fill="none" opacity={0.5} />
          <path d="M18 4 L12 15 L17 15 L10 28" stroke="#fdba74" strokeWidth="0.7" fill="none" opacity={0.4} />
          <circle cx="10" cy="28" r="2" fill="#fb923c" opacity={0.15} />
          {/* Spark arcs */}
          <path d="M22 10 Q24 8 26 10" stroke="#fb923c" strokeWidth="0.7" fill="none" opacity={0.3} />
          <path d="M6 18 Q4 16 6 14" stroke="#fb923c" strokeWidth="0.7" fill="none" opacity={0.3} />
          {sparkle(24, 20, '#fb923c', 0.4)}
          {sparkle(6, 6, '#fb923c', 0.3)}
        </g>
      );

    case 'celadon_leaf':
      // Green leaf — heal at combat end
      return (
        <g>
          <path d="M16 4 Q26 10 24 20 Q22 28 16 28 Q10 28 8 20 Q6 10 16 4 Z" fill="#16a34a" opacity={0.18} stroke="#4ade80" strokeWidth="1.2" />
          {/* Midrib */}
          <path d="M16 6 L16 26" stroke="#4ade80" strokeWidth="0.8" opacity={0.4} />
          {/* Veins */}
          <path d="M16 10 Q12 12 10 16" stroke="#4ade80" strokeWidth="0.6" fill="none" opacity={0.3} />
          <path d="M16 14 Q12 16 9 20" stroke="#4ade80" strokeWidth="0.6" fill="none" opacity={0.3} />
          <path d="M16 10 Q20 12 22 16" stroke="#4ade80" strokeWidth="0.6" fill="none" opacity={0.3} />
          <path d="M16 14 Q20 16 23 20" stroke="#4ade80" strokeWidth="0.6" fill="none" opacity={0.3} />
          {/* Highlight */}
          <path d="M10 10 Q9 8 11 7" stroke="#86efac" strokeWidth="0.6" fill="none" opacity={0.45} />
          {sparkle(26, 8, '#4ade80', 0.4)}
          {sparkle(6, 24, '#4ade80', 0.3)}
        </g>
      );

    case 'saffron_spoon':
      // Bent golden spoon — enfeeble on column switch
      return (
        <g>
          {/* Spoon bowl */}
          <ellipse cx="16" cy="9" rx="5" ry="4.5" fill="#ca8a04" opacity={0.18} stroke="#facc15" strokeWidth="1.2" />
          <ellipse cx="16" cy="9" rx="2.5" ry="2" stroke="#fde047" strokeWidth="0.6" fill="none" opacity={0.25} />
          {/* Handle */}
          <path d="M16 13.5 L16 26" stroke="#facc15" strokeWidth="2" opacity={0.3} />
          <path d="M16 13.5 L16 26" stroke="#fde047" strokeWidth="1" opacity={0.5} />
          {/* Slight bend */}
          <path d="M16 22 Q18 24 16 26" stroke="#facc15" strokeWidth="1.5" opacity={0.4} />
          {/* Highlight */}
          <path d="M13 7 Q12 5 14 5" stroke="#fef08a" strokeWidth="0.6" fill="none" opacity={0.5} />
          {/* Psychic waves */}
          <path d="M22 14 Q24 12 26 14" stroke="#facc15" strokeWidth="0.6" fill="none" opacity={0.2} />
          <path d="M8 16 Q6 14 8 12" stroke="#facc15" strokeWidth="0.6" fill="none" opacity={0.2} />
          {sparkle(6, 6, '#facc15', 0.4)}
          {sparkle(26, 20, '#facc15', 0.3)}
        </g>
      );

    case 'lavender_tombstone':
      // Purple tombstone with cross — energy on column kill
      return (
        <g>
          {/* Tombstone body */}
          <path d="M10 28 L10 12 Q10 6 16 6 Q22 6 22 12 L22 28 Z" fill="#7c3aed" opacity={0.18} stroke="#a78bfa" strokeWidth="1.2" />
          {/* Base */}
          <rect x="8" y="26" width="16" height="3" rx="1" fill="#7c3aed" opacity={0.15} stroke="#a78bfa" strokeWidth="0.8" />
          {/* Cross */}
          <line x1="16" y1="11" x2="16" y2="22" stroke="#a78bfa" strokeWidth="1" opacity={0.4} />
          <line x1="12" y1="16" x2="20" y2="16" stroke="#a78bfa" strokeWidth="1" opacity={0.4} />
          {/* Highlight */}
          <path d="M12 9 Q12 7 14 7" stroke="#c4b5fd" strokeWidth="0.6" fill="none" opacity={0.4} />
          {/* Ghost wisps */}
          <circle cx="8" cy="8" r="1" fill="#a78bfa" opacity={0.2} />
          <circle cx="24" cy="10" r="0.8" fill="#a78bfa" opacity={0.15} />
          {sparkle(6, 14, '#a78bfa', 0.35)}
          {sparkle(26, 22, '#a78bfa', 0.3)}
        </g>
      );

    case 'cinnabar_ash':
      // Red volcanic embers/flame — draw on vanish
      return (
        <g>
          {/* Main flame */}
          <path d="M16 8 Q20 14 18 20 Q17 24 16 24 Q15 24 14 20 Q12 14 16 8 Z" fill="#dc2626" opacity={0.2} stroke="#f87171" strokeWidth="1.2" />
          {/* Inner flame */}
          <path d="M16 12 Q18 16 17 19 Q16.5 21 16 21 Q15.5 21 15 19 Q14 16 16 12 Z" fill="#f87171" opacity={0.25} />
          {/* Core glow */}
          <ellipse cx="16" cy="18" rx="1.5" ry="2" fill="#fca5a5" opacity={0.3} />
          {/* Floating embers */}
          <circle cx="10" cy="10" r="1.5" fill="#f87171" opacity={0.2} stroke="#f87171" strokeWidth="0.5" />
          <circle cx="22" cy="12" r="1" fill="#f87171" opacity={0.15} stroke="#f87171" strokeWidth="0.5" />
          <circle cx="8" cy="18" r="0.8" fill="#f87171" opacity={0.12} />
          <circle cx="24" cy="6" r="1.2" fill="#fb923c" opacity={0.2} stroke="#fb923c" strokeWidth="0.4" />
          {sparkle(26, 18, '#f87171', 0.35)}
          {sparkle(6, 24, '#f87171', 0.3)}
        </g>
      );

    case 'fuchsia_shuriken':
      // Pink four-pointed star — halve damage, double status
      return (
        <g>
          {/* Outer star */}
          <path d="M16 2 L19 13 L30 16 L19 19 L16 30 L13 19 L2 16 L13 13 Z" fill="#c026d3" opacity={0.15} stroke="#e879f9" strokeWidth="1.2" />
          {/* Inner star */}
          <path d="M16 8 L18 13 L23 16 L18 19 L16 24 L14 19 L9 16 L14 13 Z" stroke="#e879f9" strokeWidth="0.7" fill="none" opacity={0.3} />
          {/* Center */}
          <circle cx="16" cy="16" r="2.5" fill="#e879f9" opacity={0.3} stroke="#e879f9" strokeWidth="0.8" />
          <circle cx="16" cy="16" r="1" fill="#f0abfc" opacity={0.5} />
          {/* Highlight */}
          <path d="M10 8 Q9 6 11 6" stroke="#f0abfc" strokeWidth="0.6" fill="none" opacity={0.4} />
          {sparkle(6, 24, '#e879f9', 0.4)}
          {sparkle(26, 6, '#e879f9', 0.35)}
        </g>
      );

    /* ─── COMMON ─────────────────────────────────────────────────── */

    case 'leftovers':
      // Red apple with green leaf — passive healing
      return (
        <g>
          {/* Apple body */}
          <ellipse cx="16" cy="18" rx="8" ry="9" fill="#ef4444" opacity={0.25} stroke="#f87171" strokeWidth="1.2" />
          {/* Apple dimple */}
          <path d="M14 10 Q16 12 18 10" stroke="#f87171" strokeWidth="0.8" fill="none" opacity={0.4} />
          {/* Stem */}
          <line x1="16" y1="10" x2="16" y2="7" stroke="#a16207" strokeWidth="1" opacity={0.6} />
          {/* Leaf */}
          <path d="M16 8 Q20 5 22 7 Q20 9 16 8 Z" fill="#22c55e" opacity={0.4} stroke="#4ade80" strokeWidth="0.6" />
          {/* Highlight */}
          <path d="M11 15 Q10 12 13 11" stroke="#fca5a5" strokeWidth="0.6" fill="none" opacity={0.4} />
          {sparkle(6, 14, '#f87171')}
        </g>
      );

    case 'shell_bell':
      // Golden bell with clapper — heal on hit
      return (
        <g>
          {/* Bell body */}
          <path d="M10 14 Q10 24 16 26 Q22 24 22 14" fill="#f59e0b" opacity={0.2} stroke="#fbbf24" strokeWidth="1.2" />
          {/* Bell rim */}
          <path d="M9 24 Q16 28 23 24" stroke="#fbbf24" strokeWidth="1.2" fill="none" opacity={0.5} />
          {/* Clapper */}
          <circle cx="16" cy="25" r="1.5" fill="#fbbf24" opacity={0.5} />
          {/* Handle loop */}
          <path d="M13 14 Q13 9 16 8 Q19 9 19 14" stroke="#fbbf24" strokeWidth="1" fill="none" opacity={0.5} />
          {/* Sound waves */}
          <path d="M24 16 Q26 18 24 20" stroke="#fbbf24" strokeWidth="0.7" fill="none" opacity={0.3} />
          <path d="M26 14 Q29 18 26 22" stroke="#fbbf24" strokeWidth="0.5" fill="none" opacity={0.2} />
          {sparkle(6, 10, '#fbbf24')}
        </g>
      );

    case 'wide_lens':
      // Convex lens — +damage all attacks
      return (
        <g>
          {/* Lens body */}
          <circle cx="16" cy="16" r="9" fill="#a855f7" opacity={0.12} stroke="#c084fc" strokeWidth="1.2" />
          {/* Inner lens ring */}
          <circle cx="16" cy="16" r="6" stroke="#c084fc" strokeWidth="0.8" fill="none" opacity={0.35} />
          {/* Lens refraction lines */}
          <line x1="12" y1="12" x2="14" y2="14" stroke="#c084fc" strokeWidth="0.7" opacity={0.4} />
          <line x1="12" y1="14" x2="13" y2="15" stroke="#c084fc" strokeWidth="0.5" opacity={0.3} />
          {/* Highlight arc */}
          <path d="M11 12 Q10 9 14 8" stroke="#e9d5ff" strokeWidth="0.7" fill="none" opacity={0.5} />
          {/* Crosshair dot */}
          <circle cx="16" cy="16" r="1.5" fill="#c084fc" opacity={0.35} />
          {sparkle(25, 8, '#c084fc')}
          {sparkle(5, 24, '#c084fc', 0.3)}
        </g>
      );

    /* ─── UNCOMMON ───────────────────────────────────────────────── */

    case 'iron_plate':
      // Steel shield plate — block scaling
      return (
        <g>
          {/* Shield body */}
          <path d="M16 5 L26 10 L26 20 L16 27 L6 20 L6 10 Z" fill="#60a5fa" opacity={0.15} stroke="#93c5fd" strokeWidth="1.2" />
          {/* Inner shield */}
          <path d="M16 9 L22 12 L22 19 L16 23 L10 19 L10 12 Z" stroke="#93c5fd" strokeWidth="0.7" fill="none" opacity={0.35} />
          {/* Horizontal band */}
          <line x1="8" y1="15" x2="24" y2="15" stroke="#93c5fd" strokeWidth="0.8" opacity={0.3} />
          {/* Rivets */}
          <circle cx="10" cy="15" r="1" fill="#93c5fd" opacity={0.3} />
          <circle cx="22" cy="15" r="1" fill="#93c5fd" opacity={0.3} />
          {/* Shine */}
          <path d="M10 10 Q9 8 12 7" stroke="#bfdbfe" strokeWidth="0.6" fill="none" opacity={0.4} />
          {sparkle(26, 6, '#93c5fd', 0.35)}
        </g>
      );

    case 'buddy_guard':
      // Two overlapping shields — column damage reduction
      return (
        <g>
          {/* Back shield */}
          <path d="M19 6 L26 9 L26 17 L19 22 L12 17 L12 9 Z" fill="#f59e0b" opacity={0.12} stroke="#fbbf24" strokeWidth="0.9" />
          {/* Front shield */}
          <path d="M13 10 L20 13 L20 21 L13 26 L6 21 L6 13 Z" fill="#f59e0b" opacity={0.18} stroke="#fbbf24" strokeWidth="1.2" />
          {/* Heart/guard emblem on front shield */}
          <path d="M13 15 Q11 13 13 12 Q15 13 13 15" fill="#fbbf24" opacity={0.4} />
          <path d="M13 15 L13 18" stroke="#fbbf24" strokeWidth="0.8" opacity={0.4} />
          {/* Shine */}
          <path d="M8 12 Q8 10 10 10" stroke="#fde68a" strokeWidth="0.6" fill="none" opacity={0.4} />
          {sparkle(25, 24, '#fbbf24', 0.3)}
        </g>
      );

    case 'choice_band':
      // Red headband/armband — +damage attacks only
      return (
        <g>
          {/* Band — thick curved strip */}
          <path d="M6 18 Q16 6 26 18" stroke="#ef4444" strokeWidth="3" fill="none" opacity={0.3} />
          <path d="M6 18 Q16 6 26 18" stroke="#f87171" strokeWidth="1.5" fill="none" opacity={0.5} />
          {/* Knot tails */}
          <path d="M24 18 Q28 22 26 26" stroke="#f87171" strokeWidth="1.2" fill="none" opacity={0.4} />
          <path d="M26 18 Q29 24 28 28" stroke="#f87171" strokeWidth="1" fill="none" opacity={0.3} />
          {/* Power symbol */}
          <path d="M14 14 L16 10 L18 14" stroke="#fca5a5" strokeWidth="0.8" fill="none" opacity={0.5} />
          <line x1="16" y1="10" x2="16" y2="8" stroke="#fca5a5" strokeWidth="0.8" opacity={0.4} />
          {sparkle(8, 24, '#f87171')}
        </g>
      );

    case 'focus_sash':
      // Ribbon sash with clasp — survive lethal hit
      return (
        <g>
          {/* Sash diagonal */}
          <line x1="8" y1="6" x2="24" y2="26" stroke="#fbbf24" strokeWidth="3" opacity={0.25} />
          <line x1="8" y1="6" x2="24" y2="26" stroke="#fcd34d" strokeWidth="1.5" opacity={0.5} />
          {/* Clasp — diamond at center */}
          <path d="M16 16 L18 14 L20 16 L18 18 Z" fill="#fbbf24" opacity={0.5} stroke="#fcd34d" strokeWidth="0.8" />
          {/* Ribbon tails at bottom */}
          <path d="M23 25 Q26 28 24 30" stroke="#fcd34d" strokeWidth="1" fill="none" opacity={0.4} />
          <path d="M25 26 Q27 30 26 32" stroke="#fcd34d" strokeWidth="0.8" fill="none" opacity={0.3} />
          {/* Ribbon tails at top */}
          <path d="M9 7 Q6 4 8 2" stroke="#fcd34d" strokeWidth="1" fill="none" opacity={0.4} />
          <path d="M7 6 Q5 2 6 0" stroke="#fcd34d" strokeWidth="0.8" fill="none" opacity={0.3} />
          {sparkle(26, 8, '#fcd34d', 0.4)}
        </g>
      );

    case 'guerrilla_boots':
      // Combat boot — position-based bonuses
      return (
        <g>
          {/* Boot body */}
          <path d="M10 12 L10 24 L24 24 L24 20 L18 20 L18 8 L14 8 L10 12 Z" fill="#ef4444" opacity={0.2} stroke="#f87171" strokeWidth="1.2" />
          {/* Boot sole */}
          <rect x="9" y="24" width="16" height="3" rx="1" fill="#f87171" opacity={0.3} stroke="#f87171" strokeWidth="0.8" />
          {/* Lace marks */}
          <line x1="13" y1="12" x2="17" y2="12" stroke="#fca5a5" strokeWidth="0.7" opacity={0.4} />
          <line x1="12" y1="15" x2="17" y2="15" stroke="#fca5a5" strokeWidth="0.7" opacity={0.4} />
          <line x1="11" y1="18" x2="17" y2="18" stroke="#fca5a5" strokeWidth="0.7" opacity={0.4} />
          {/* Speed lines */}
          <line x1="4" y1="14" x2="8" y2="14" stroke="#f87171" strokeWidth="0.6" opacity={0.3} />
          <line x1="3" y1="18" x2="8" y2="18" stroke="#f87171" strokeWidth="0.5" opacity={0.25} />
          {sparkle(26, 8, '#f87171', 0.35)}
        </g>
      );

    case 'smoke_ball':
      // Smoke bomb sphere — provoke on switch
      return (
        <g>
          {/* Main sphere */}
          <circle cx="16" cy="18" r="9" fill="#6b7280" opacity={0.2} stroke="#9ca3af" strokeWidth="1.2" />
          {/* Shading arc */}
          <path d="M10 14 Q12 10 17 10" stroke="#d1d5db" strokeWidth="0.6" fill="none" opacity={0.4} />
          {/* Fuse/wick */}
          <path d="M16 9 Q14 6 15 4" stroke="#d1d5db" strokeWidth="0.9" fill="none" opacity={0.5} />
          <circle cx="15" cy="4" r="1.2" fill="#f59e0b" opacity={0.4} />
          {/* Smoke wisps */}
          <path d="M7 14 Q4 11 6 9" stroke="#9ca3af" strokeWidth="0.7" fill="none" opacity={0.3} />
          <path d="M25 14 Q28 11 26 9" stroke="#9ca3af" strokeWidth="0.7" fill="none" opacity={0.3} />
          {/* Smoke puffs */}
          <circle cx="5" cy="8" r="1.5" stroke="#9ca3af" strokeWidth="0.5" fill="none" opacity={0.2} />
          <circle cx="27" cy="8" r="1.2" stroke="#9ca3af" strokeWidth="0.5" fill="none" opacity={0.2} />
        </g>
      );

    case 'sacred_ash':
      // Golden flame/ash — back-row healing
      return (
        <g>
          {/* Ash pile base */}
          <ellipse cx="16" cy="26" rx="9" ry="3" fill="#f59e0b" opacity={0.15} stroke="#fbbf24" strokeWidth="0.8" />
          {/* Phoenix flame */}
          <path d="M16 6 Q22 14 20 20 Q18 24 16 24 Q14 24 12 20 Q10 14 16 6 Z" fill="#f59e0b" opacity={0.2} stroke="#fbbf24" strokeWidth="1.2" />
          {/* Inner flame */}
          <path d="M16 12 Q19 16 18 20 Q17 22 16 22 Q15 22 14 20 Q13 16 16 12 Z" fill="#fbbf24" opacity={0.25} />
          {/* Core glow */}
          <ellipse cx="16" cy="19" rx="2" ry="3" fill="#fde68a" opacity={0.3} />
          {sparkle(6, 10, '#fbbf24', 0.4)}
          {sparkle(26, 12, '#fbbf24', 0.35)}
          {sparkle(24, 24, '#fcd34d', 0.3)}
        </g>
      );

    case 'scope_lens':
      // Telescope/scope tube — +damage single-target
      return (
        <g>
          {/* Scope tube */}
          <rect x="7" y="13" width="18" height="7" rx="3" fill="#06b6d4" opacity={0.18} stroke="#22d3ee" strokeWidth="1.2" />
          {/* Front lens */}
          <ellipse cx="26" cy="16.5" rx="3" ry="4.5" fill="#06b6d4" opacity={0.15} stroke="#22d3ee" strokeWidth="1" />
          {/* Rear eyepiece */}
          <rect x="4" y="14" width="4" height="5" rx="2" fill="#22d3ee" opacity={0.25} stroke="#22d3ee" strokeWidth="0.8" />
          {/* Lens glint */}
          <path d="M24 13 Q25 11 27 12" stroke="#a5f3fc" strokeWidth="0.6" fill="none" opacity={0.5} />
          {/* Focus ring */}
          <line x1="15" y1="13" x2="15" y2="20" stroke="#22d3ee" strokeWidth="0.6" opacity={0.3} />
          <line x1="18" y1="13" x2="18" y2="20" stroke="#22d3ee" strokeWidth="0.6" opacity={0.3} />
          {sparkle(14, 7, '#22d3ee', 0.4)}
        </g>
      );

    case 'sniper_scope':
      // Crosshair reticle — +damage to column
      return (
        <g>
          {/* Outer ring */}
          <circle cx="16" cy="16" r="10" stroke="#22d3ee" strokeWidth="1.2" fill="#06b6d4" opacity={0.1} />
          {/* Inner ring */}
          <circle cx="16" cy="16" r="5" stroke="#22d3ee" strokeWidth="0.8" fill="none" opacity={0.35} />
          {/* Crosshair lines */}
          <line x1="16" y1="4" x2="16" y2="10" stroke="#22d3ee" strokeWidth="0.9" opacity={0.5} />
          <line x1="16" y1="22" x2="16" y2="28" stroke="#22d3ee" strokeWidth="0.9" opacity={0.5} />
          <line x1="4" y1="16" x2="10" y2="16" stroke="#22d3ee" strokeWidth="0.9" opacity={0.5} />
          <line x1="22" y1="16" x2="28" y2="16" stroke="#22d3ee" strokeWidth="0.9" opacity={0.5} />
          {/* Center dot */}
          <circle cx="16" cy="16" r="1.5" fill="#22d3ee" opacity={0.5} />
          {/* Tick marks */}
          <line x1="16" y1="11" x2="16" y2="12.5" stroke="#67e8f9" strokeWidth="0.6" opacity={0.3} />
          <line x1="16" y1="19.5" x2="16" y2="21" stroke="#67e8f9" strokeWidth="0.6" opacity={0.3} />
          <line x1="11" y1="16" x2="12.5" y2="16" stroke="#67e8f9" strokeWidth="0.6" opacity={0.3} />
          <line x1="19.5" y1="16" x2="21" y2="16" stroke="#67e8f9" strokeWidth="0.6" opacity={0.3} />
        </g>
      );

    case 'quick_claw':
      // Sharp claw with lightning spark — +speed
      return (
        <g>
          {/* Claw */}
          <path d="M18 6 Q22 10 20 16 L16 26 L14 26 L16 16 Q14 10 18 6 Z" fill="#eab308" opacity={0.2} stroke="#fde047" strokeWidth="1.2" />
          {/* Claw tip highlight */}
          <path d="M17 8 Q19 6 18 4" stroke="#fef08a" strokeWidth="0.6" fill="none" opacity={0.5} />
          {/* Second smaller claw */}
          <path d="M10 10 Q12 12 11 18 L10 22 L9 22 L10 18 Q8 14 10 10 Z" fill="#eab308" opacity={0.15} stroke="#fde047" strokeWidth="0.9" />
          {/* Lightning bolt */}
          <path d="M24 8 L22 14 L25 14 L22 20" stroke="#fde047" strokeWidth="1" fill="none" opacity={0.5} />
          {sparkle(6, 8, '#fde047', 0.4)}
          {sparkle(26, 24, '#fde047', 0.3)}
        </g>
      );

    /* ─── RARE ───────────────────────────────────────────────────── */

    case 'life_orb':
      // Glowing crimson orb with inner cross — damage+self-damage
      return (
        <g>
          {/* Outer glow */}
          <circle cx="16" cy="16" r="11" fill="#ec4899" opacity={0.08} />
          {/* Orb body */}
          <circle cx="16" cy="16" r="8" fill="#ec4899" opacity={0.2} stroke="#f472b6" strokeWidth="1.2" />
          {/* Inner ring */}
          <circle cx="16" cy="16" r="4.5" stroke="#f472b6" strokeWidth="0.7" fill="none" opacity={0.3} />
          {/* Cross emblem */}
          <line x1="16" y1="12" x2="16" y2="20" stroke="#f472b6" strokeWidth="1" opacity={0.5} />
          <line x1="12" y1="16" x2="20" y2="16" stroke="#f472b6" strokeWidth="1" opacity={0.5} />
          {/* Highlight */}
          <path d="M11 12 Q10 9 13 9" stroke="#fbcfe8" strokeWidth="0.6" fill="none" opacity={0.5} />
          {sparkle(26, 6, '#f472b6', 0.4)}
          {sparkle(5, 26, '#f472b6', 0.3)}
        </g>
      );

    case 'assault_vest':
      // Armored vest — +block, attacks only
      return (
        <g>
          {/* Vest body */}
          <path d="M10 10 L8 14 L8 26 L14 26 L14 20 L18 20 L18 26 L24 26 L24 14 L22 10 Z" fill="#22c55e" opacity={0.18} stroke="#4ade80" strokeWidth="1.2" />
          {/* Shoulder pads */}
          <path d="M10 10 Q6 8 4 10 L8 14" fill="#22c55e" opacity={0.15} stroke="#4ade80" strokeWidth="0.9" />
          <path d="M22 10 Q26 8 28 10 L24 14" fill="#22c55e" opacity={0.15} stroke="#4ade80" strokeWidth="0.9" />
          {/* Neck opening */}
          <path d="M12 10 Q16 6 20 10" stroke="#4ade80" strokeWidth="0.8" fill="none" opacity={0.4} />
          {/* Center seam */}
          <line x1="16" y1="10" x2="16" y2="20" stroke="#4ade80" strokeWidth="0.7" opacity={0.3} />
          {/* Armor plate lines */}
          <line x1="10" y1="18" x2="14" y2="18" stroke="#4ade80" strokeWidth="0.5" opacity={0.25} />
          <line x1="18" y1="18" x2="22" y2="18" stroke="#4ade80" strokeWidth="0.5" opacity={0.25} />
          {sparkle(27, 6, '#4ade80', 0.35)}
        </g>
      );

    case 'metronome_item':
      // Metronome with pendulum — stacking damage
      return (
        <g>
          {/* Metronome body — trapezoid */}
          <path d="M12 28 L20 28 L18 8 L14 8 Z" fill="#8b5cf6" opacity={0.18} stroke="#a78bfa" strokeWidth="1.2" />
          {/* Pendulum arm — tilted */}
          <line x1="16" y1="24" x2="22" y2="8" stroke="#a78bfa" strokeWidth="1" opacity={0.5} />
          {/* Pendulum weight */}
          <circle cx="22" cy="8" r="2" fill="#a78bfa" opacity={0.4} stroke="#a78bfa" strokeWidth="0.8" />
          {/* Scale markings */}
          <line x1="14.5" y1="12" x2="17.5" y2="12" stroke="#c4b5fd" strokeWidth="0.5" opacity={0.3} />
          <line x1="14" y1="16" x2="18" y2="16" stroke="#c4b5fd" strokeWidth="0.5" opacity={0.3} />
          <line x1="13.5" y1="20" x2="18.5" y2="20" stroke="#c4b5fd" strokeWidth="0.5" opacity={0.3} />
          {/* Pivot point */}
          <circle cx="16" cy="24" r="1.2" fill="#c4b5fd" opacity={0.4} />
          {/* Musical note accent */}
          <circle cx="7" cy="12" r="1.5" fill="#a78bfa" opacity={0.3} />
          <line x1="8.5" y1="12" x2="8.5" y2="6" stroke="#a78bfa" strokeWidth="0.7" opacity={0.3} />
          <path d="M8.5 6 Q11 5 11 7" stroke="#a78bfa" strokeWidth="0.7" fill="none" opacity={0.3} />
        </g>
      );

    case 'eviolite':
      // Faceted crystal/diamond — +max HP
      return (
        <g>
          {/* Diamond shape */}
          <path d="M16 4 L26 14 L16 28 L6 14 Z" fill="#06b6d4" opacity={0.15} stroke="#22d3ee" strokeWidth="1.2" />
          {/* Top facets */}
          <line x1="16" y1="4" x2="16" y2="14" stroke="#22d3ee" strokeWidth="0.7" opacity={0.3} />
          <line x1="6" y1="14" x2="26" y2="14" stroke="#22d3ee" strokeWidth="0.7" opacity={0.3} />
          {/* Facet lines */}
          <line x1="16" y1="4" x2="10" y2="14" stroke="#22d3ee" strokeWidth="0.5" opacity={0.25} />
          <line x1="16" y1="4" x2="22" y2="14" stroke="#22d3ee" strokeWidth="0.5" opacity={0.25} />
          <line x1="10" y1="14" x2="16" y2="28" stroke="#22d3ee" strokeWidth="0.5" opacity={0.25} />
          <line x1="22" y1="14" x2="16" y2="28" stroke="#22d3ee" strokeWidth="0.5" opacity={0.25} />
          {/* Inner glow */}
          <path d="M16 10 L20 14 L16 20 L12 14 Z" fill="#67e8f9" opacity={0.15} />
          {/* Highlight */}
          <path d="M10 10 Q9 8 11 7" stroke="#a5f3fc" strokeWidth="0.6" fill="none" opacity={0.5} />
          {sparkle(4, 6, '#22d3ee', 0.4)}
          {sparkle(27, 22, '#22d3ee', 0.35)}
        </g>
      );

    /* ─── BOSS ───────────────────────────────────────────────────── */

    case 'choice_specs':
      // Spectacles/glasses — +damage, type-locked
      return (
        <g>
          {/* Left lens */}
          <circle cx="11" cy="16" r="5.5" fill="#a855f7" opacity={0.15} stroke="#c084fc" strokeWidth="1.2" />
          {/* Right lens */}
          <circle cx="22" cy="16" r="5.5" fill="#a855f7" opacity={0.15} stroke="#c084fc" strokeWidth="1.2" />
          {/* Bridge */}
          <path d="M16 15 Q16.5 13 17 15" stroke="#c084fc" strokeWidth="1" fill="none" opacity={0.5} />
          {/* Left arm */}
          <path d="M6 14 Q2 14 2 12" stroke="#c084fc" strokeWidth="0.9" fill="none" opacity={0.4} />
          {/* Right arm */}
          <path d="M27 14 Q30 14 30 12" stroke="#c084fc" strokeWidth="0.9" fill="none" opacity={0.4} />
          {/* Lens glints */}
          <path d="M8 13 Q7 11 9 11" stroke="#e9d5ff" strokeWidth="0.6" fill="none" opacity={0.5} />
          <path d="M19 13 Q18 11 20 11" stroke="#e9d5ff" strokeWidth="0.6" fill="none" opacity={0.5} />
          {sparkle(16, 6, '#c084fc', 0.4)}
        </g>
      );

    case 'toxic_orb':
      // Poison orb with skull motif — self-poison+damage
      return (
        <g>
          {/* Outer glow */}
          <circle cx="16" cy="16" r="11" fill="#a855f7" opacity={0.06} />
          {/* Orb body */}
          <circle cx="16" cy="16" r="8.5" fill="#a855f7" opacity={0.2} stroke="#c084fc" strokeWidth="1.2" />
          {/* Skull — simplified */}
          <ellipse cx="16" cy="14" rx="4" ry="3.5" fill="#c084fc" opacity={0.25} stroke="#c084fc" strokeWidth="0.8" />
          {/* Eye sockets */}
          <circle cx="14" cy="13.5" r="1.2" fill="none" stroke="#c084fc" strokeWidth="0.8" opacity={0.5} />
          <circle cx="18" cy="13.5" r="1.2" fill="none" stroke="#c084fc" strokeWidth="0.8" opacity={0.5} />
          {/* Jaw */}
          <line x1="14" y1="18" x2="18" y2="18" stroke="#c084fc" strokeWidth="0.7" opacity={0.4} />
          <line x1="14" y1="18" x2="14" y2="20" stroke="#c084fc" strokeWidth="0.5" opacity={0.3} />
          <line x1="16" y1="18" x2="16" y2="20" stroke="#c084fc" strokeWidth="0.5" opacity={0.3} />
          <line x1="18" y1="18" x2="18" y2="20" stroke="#c084fc" strokeWidth="0.5" opacity={0.3} />
          {/* Bubbles */}
          <circle cx="24" cy="8" r="1.5" stroke="#c084fc" strokeWidth="0.5" fill="none" opacity={0.3} />
          <circle cx="7" cy="24" r="1" stroke="#c084fc" strokeWidth="0.5" fill="none" opacity={0.25} />
          <circle cx="26" cy="22" r="0.8" stroke="#c084fc" strokeWidth="0.4" fill="none" opacity={0.2} />
        </g>
      );

    case 'expert_belt':
      // Martial arts belt with star emblem — super-effective bonus
      return (
        <g>
          {/* Belt — horizontal band */}
          <rect x="4" y="13" width="24" height="6" rx="2" fill="#6b7280" opacity={0.2} stroke="#9ca3af" strokeWidth="1.2" />
          {/* Belt knot at center */}
          <rect x="13" y="11" width="6" height="10" rx="1.5" fill="#6b7280" opacity={0.25} stroke="#9ca3af" strokeWidth="1" />
          {/* Knot tails */}
          <path d="M14 21 Q12 26 10 28" stroke="#9ca3af" strokeWidth="1" fill="none" opacity={0.4} />
          <path d="M18 21 Q20 26 22 28" stroke="#9ca3af" strokeWidth="1" fill="none" opacity={0.4} />
          {/* Star emblem */}
          <path d="M16 12 L17 14.5 L19.5 14.5 L17.5 16 L18.5 18.5 L16 17 L13.5 18.5 L14.5 16 L12.5 14.5 L15 14.5 Z" fill="#fbbf24" opacity={0.45} stroke="#fbbf24" strokeWidth="0.5" />
          {sparkle(5, 8, '#9ca3af', 0.35)}
          {sparkle(27, 8, '#9ca3af', 0.3)}
        </g>
      );

    /* ─── NEW COMMON ─────────────────────────────────────────────── */

    case 'rocky_helmet':
      // Spiked helmet — thorns on battle start
      return (
        <g>
          {/* Helmet dome */}
          <path d="M8 22 L8 14 Q8 6 16 6 Q24 6 24 14 L24 22 Z" fill="#78716c" opacity={0.2} stroke="#a8a29e" strokeWidth="1.2" />
          {/* Visor slit */}
          <line x1="10" y1="16" x2="22" y2="16" stroke="#a8a29e" strokeWidth="1" opacity={0.4} />
          {/* Spikes */}
          <path d="M16 6 L16 2" stroke="#d6d3d1" strokeWidth="1.2" opacity={0.5} />
          <path d="M10 10 L7 6" stroke="#d6d3d1" strokeWidth="1" opacity={0.4} />
          <path d="M22 10 L25 6" stroke="#d6d3d1" strokeWidth="1" opacity={0.4} />
          <circle cx="16" cy="2" r="1.2" fill="#d6d3d1" opacity={0.4} />
          <circle cx="7" cy="6" r="1" fill="#d6d3d1" opacity={0.35} />
          <circle cx="25" cy="6" r="1" fill="#d6d3d1" opacity={0.35} />
          {/* Rim */}
          <line x1="6" y1="22" x2="26" y2="22" stroke="#a8a29e" strokeWidth="1.2" opacity={0.4} />
          {sparkle(6, 14, '#a8a29e', 0.35)}
        </g>
      );

    case 'big_root':
      // Gnarled root — +50% healing
      return (
        <g>
          {/* Main root */}
          <path d="M16 4 Q12 8 14 14 Q12 18 10 22 Q8 26 6 28" stroke="#22c55e" strokeWidth="2" fill="none" opacity={0.4} />
          <path d="M16 4 Q20 10 18 16 Q20 20 24 24" stroke="#22c55e" strokeWidth="1.5" fill="none" opacity={0.35} />
          {/* Branch roots */}
          <path d="M14 14 Q10 16 8 14" stroke="#4ade80" strokeWidth="1" fill="none" opacity={0.3} />
          <path d="M18 16 Q22 14 24 16" stroke="#4ade80" strokeWidth="1" fill="none" opacity={0.3} />
          {/* Root knobs */}
          <circle cx="16" cy="4" r="2" fill="#22c55e" opacity={0.3} stroke="#4ade80" strokeWidth="0.8" />
          <circle cx="6" cy="28" r="1.5" fill="#4ade80" opacity={0.2} />
          <circle cx="24" cy="24" r="1.5" fill="#4ade80" opacity={0.2} />
          {/* Healing sparkles */}
          {sparkle(24, 8, '#4ade80', 0.4)}
          {sparkle(8, 20, '#4ade80', 0.3)}
        </g>
      );

    case 'bright_powder':
      // Glittering powder — evasion in front row
      return (
        <g>
          {/* Powder cloud */}
          <circle cx="12" cy="14" r="5" fill="#fde68a" opacity={0.15} stroke="#fcd34d" strokeWidth="0.8" />
          <circle cx="20" cy="16" r="5.5" fill="#fde68a" opacity={0.12} stroke="#fcd34d" strokeWidth="0.8" />
          <circle cx="16" cy="20" r="4.5" fill="#fde68a" opacity={0.1} stroke="#fcd34d" strokeWidth="0.8" />
          {/* Sparkle particles */}
          {sparkle(8, 8, '#fcd34d', 0.5)}
          {sparkle(24, 10, '#fcd34d', 0.45)}
          {sparkle(16, 6, '#fcd34d', 0.4)}
          {sparkle(6, 22, '#fcd34d', 0.35)}
          {sparkle(26, 22, '#fcd34d', 0.3)}
          {sparkle(16, 26, '#fcd34d', 0.4)}
          {/* Central bright dot */}
          <circle cx="16" cy="16" r="2" fill="#fef08a" opacity={0.4} />
        </g>
      );

    case 'razor_fang':
      // Sharp fang — first attack +8 damage
      return (
        <g>
          {/* Fang */}
          <path d="M12 6 Q14 4 16 6 L18 22 Q16 26 14 22 Z" fill="#e5e7eb" opacity={0.25} stroke="#d1d5db" strokeWidth="1.2" />
          {/* Second fang */}
          <path d="M18 8 Q20 6 22 8 L23 18 Q22 21 20 18 Z" fill="#e5e7eb" opacity={0.18} stroke="#d1d5db" strokeWidth="1" />
          {/* Blood drop */}
          <path d="M16 24 Q17 26 16 27 Q15 26 16 24 Z" fill="#ef4444" opacity={0.4} />
          {/* Edge gleam */}
          <path d="M13 8 Q12 6 14 5" stroke="#f3f4f6" strokeWidth="0.6" fill="none" opacity={0.5} />
          {sparkle(6, 14, '#d1d5db', 0.4)}
          {sparkle(26, 12, '#d1d5db', 0.35)}
        </g>
      );

    case 'toxic_plate':
      // Poison-dripping plate — poison all enemies at start
      return (
        <g>
          {/* Plate body */}
          <path d="M8 10 L24 10 L22 24 L10 24 Z" fill="#a855f7" opacity={0.18} stroke="#c084fc" strokeWidth="1.2" />
          {/* Skull symbol */}
          <circle cx="16" cy="15" r="3" fill="#c084fc" opacity={0.2} stroke="#c084fc" strokeWidth="0.8" />
          <circle cx="14.5" cy="14.5" r="0.8" fill="#c084fc" opacity={0.5} />
          <circle cx="17.5" cy="14.5" r="0.8" fill="#c084fc" opacity={0.5} />
          {/* Dripping poison */}
          <path d="M12 24 L11 28" stroke="#c084fc" strokeWidth="0.8" opacity={0.35} />
          <path d="M16 24 L16 27" stroke="#c084fc" strokeWidth="0.8" opacity={0.3} />
          <path d="M20 24 L21 28" stroke="#c084fc" strokeWidth="0.8" opacity={0.25} />
          <circle cx="11" cy="28" r="1" fill="#c084fc" opacity={0.2} />
          <circle cx="16" cy="27" r="0.8" fill="#c084fc" opacity={0.2} />
          {sparkle(6, 6, '#c084fc', 0.35)}
          {sparkle(26, 18, '#c084fc', 0.3)}
        </g>
      );

    case 'power_herb':
      // Small leafy herb — turn 1 energy
      return (
        <g>
          {/* Stem */}
          <path d="M16 28 L16 14 Q14 10 16 8" stroke="#22c55e" strokeWidth="1.2" fill="none" opacity={0.5} />
          {/* Leaves */}
          <path d="M16 12 Q22 8 24 10 Q22 14 16 12 Z" fill="#22c55e" opacity={0.3} stroke="#4ade80" strokeWidth="0.8" />
          <path d="M16 16 Q10 12 8 14 Q10 18 16 16 Z" fill="#22c55e" opacity={0.25} stroke="#4ade80" strokeWidth="0.8" />
          <path d="M16 20 Q22 18 22 20 Q20 22 16 20 Z" fill="#22c55e" opacity={0.2} stroke="#4ade80" strokeWidth="0.7" />
          {/* Energy glow at top */}
          <circle cx="16" cy="8" r="2.5" fill="#fde047" opacity={0.2} stroke="#fde047" strokeWidth="0.6" />
          {sparkle(8, 8, '#4ade80', 0.4)}
          {sparkle(26, 22, '#4ade80', 0.3)}
        </g>
      );

    case 'adrenaline_orb':
      // Pulsing orb — every 5 attacks gain energy
      return (
        <g>
          {/* Outer pulse */}
          <circle cx="16" cy="16" r="11" stroke="#ef4444" strokeWidth="0.6" fill="none" opacity={0.15} />
          <circle cx="16" cy="16" r="9" stroke="#ef4444" strokeWidth="0.8" fill="none" opacity={0.2} />
          {/* Orb body */}
          <circle cx="16" cy="16" r="7" fill="#ef4444" opacity={0.18} stroke="#f87171" strokeWidth="1.2" />
          {/* Heart/pulse line */}
          <path d="M10 16 L13 16 L14 12 L16 20 L18 14 L19 16 L22 16" stroke="#f87171" strokeWidth="1" fill="none" opacity={0.5} />
          {/* Core */}
          <circle cx="16" cy="16" r="2" fill="#fca5a5" opacity={0.3} />
          {sparkle(26, 6, '#f87171', 0.35)}
        </g>
      );

    case 'venom_sac':
      // Bulging sac — transfer poison on KO
      return (
        <g>
          {/* Sac body */}
          <ellipse cx="16" cy="16" rx="8" ry="9" fill="#a855f7" opacity={0.2} stroke="#c084fc" strokeWidth="1.2" />
          {/* Internal veins */}
          <path d="M12 12 Q16 16 12 20" stroke="#c084fc" strokeWidth="0.6" fill="none" opacity={0.3} />
          <path d="M20 12 Q16 16 20 20" stroke="#c084fc" strokeWidth="0.6" fill="none" opacity={0.3} />
          {/* Drip at bottom */}
          <path d="M16 25 L16 28" stroke="#c084fc" strokeWidth="0.8" opacity={0.35} />
          <circle cx="16" cy="29" r="1.2" fill="#c084fc" opacity={0.25} />
          {/* Highlight */}
          <path d="M11 11 Q10 9 13 9" stroke="#e9d5ff" strokeWidth="0.6" fill="none" opacity={0.4} />
          {sparkle(6, 6, '#c084fc', 0.35)}
          {sparkle(26, 24, '#c084fc', 0.3)}
        </g>
      );

    case 'sitrus_berry':
      // Yellow citrus fruit — draw on first damage
      return (
        <g>
          {/* Berry body */}
          <ellipse cx="16" cy="17" rx="8" ry="8.5" fill="#eab308" opacity={0.22} stroke="#fbbf24" strokeWidth="1.2" />
          {/* Stem */}
          <line x1="16" y1="9" x2="16" y2="6" stroke="#65a30d" strokeWidth="1" opacity={0.5} />
          {/* Leaf */}
          <path d="M16 7 Q20 4 22 6 Q20 8 16 7 Z" fill="#22c55e" opacity={0.35} stroke="#4ade80" strokeWidth="0.6" />
          {/* Texture lines */}
          <path d="M12 14 Q16 12 20 14" stroke="#fcd34d" strokeWidth="0.6" fill="none" opacity={0.3} />
          <path d="M11 18 Q16 16 21 18" stroke="#fcd34d" strokeWidth="0.6" fill="none" opacity={0.25} />
          {/* Highlight */}
          <path d="M11 13 Q10 11 13 10" stroke="#fef08a" strokeWidth="0.6" fill="none" opacity={0.4} />
          {sparkle(6, 12, '#fbbf24', 0.4)}
        </g>
      );

    case 'protective_pads':
      // Padded gloves — block from attack combos
      return (
        <g>
          {/* Pad body */}
          <rect x="8" y="8" width="16" height="18" rx="4" fill="#3b82f6" opacity={0.18} stroke="#60a5fa" strokeWidth="1.2" />
          {/* Padding lines */}
          <line x1="12" y1="12" x2="20" y2="12" stroke="#93c5fd" strokeWidth="0.8" opacity={0.3} />
          <line x1="12" y1="16" x2="20" y2="16" stroke="#93c5fd" strokeWidth="0.8" opacity={0.3} />
          <line x1="12" y1="20" x2="20" y2="20" stroke="#93c5fd" strokeWidth="0.8" opacity={0.3} />
          {/* Shield symbol */}
          <path d="M16 13 L18.5 15 L18.5 18 L16 20 L13.5 18 L13.5 15 Z" stroke="#93c5fd" strokeWidth="0.7" fill="#60a5fa" opacity={0.2} />
          {sparkle(6, 6, '#60a5fa', 0.35)}
          {sparkle(26, 26, '#60a5fa', 0.3)}
        </g>
      );

    case 'slow_start_gem':
      // Dim gem that powers up — draw bonus from patience
      return (
        <g>
          {/* Gem body */}
          <path d="M16 4 L26 14 L16 28 L6 14 Z" fill="#8b5cf6" opacity={0.15} stroke="#a78bfa" strokeWidth="1.2" />
          {/* Inner facets */}
          <line x1="16" y1="4" x2="16" y2="14" stroke="#a78bfa" strokeWidth="0.6" opacity={0.25} />
          <line x1="6" y1="14" x2="26" y2="14" stroke="#a78bfa" strokeWidth="0.6" opacity={0.25} />
          <line x1="16" y1="14" x2="16" y2="28" stroke="#c4b5fd" strokeWidth="0.5" opacity={0.2} />
          {/* Slow clock symbol */}
          <circle cx="16" cy="16" r="3.5" stroke="#c4b5fd" strokeWidth="0.8" fill="none" opacity={0.3} />
          <line x1="16" y1="16" x2="16" y2="13.5" stroke="#c4b5fd" strokeWidth="0.7" opacity={0.4} />
          <line x1="16" y1="16" x2="18" y2="17" stroke="#c4b5fd" strokeWidth="0.7" opacity={0.4} />
          {sparkle(6, 6, '#a78bfa', 0.4)}
          {sparkle(26, 24, '#a78bfa', 0.3)}
        </g>
      );

    case 'oran_berry':
      // Blue berry — end of battle heal
      return (
        <g>
          {/* Berry body */}
          <ellipse cx="16" cy="17" rx="7.5" ry="8" fill="#3b82f6" opacity={0.22} stroke="#60a5fa" strokeWidth="1.2" />
          {/* Stem */}
          <line x1="16" y1="9" x2="15" y2="5" stroke="#65a30d" strokeWidth="1" opacity={0.5} />
          {/* Leaf */}
          <path d="M15 6 Q11 4 10 6 Q12 8 15 6 Z" fill="#22c55e" opacity={0.35} stroke="#4ade80" strokeWidth="0.6" />
          {/* Shine */}
          <path d="M11 13 Q10 11 13 10" stroke="#93c5fd" strokeWidth="0.6" fill="none" opacity={0.45} />
          {/* Cross heal mark */}
          <line x1="16" y1="14" x2="16" y2="20" stroke="#93c5fd" strokeWidth="0.8" opacity={0.3} />
          <line x1="13" y1="17" x2="19" y2="17" stroke="#93c5fd" strokeWidth="0.8" opacity={0.3} />
          {sparkle(24, 8, '#60a5fa', 0.4)}
        </g>
      );

    /* ─── NEW RARE ───────────────────────────────────────────────── */

    case 'kings_rock':
      // Crown — apply slow on debuff
      return (
        <g>
          {/* Crown base */}
          <rect x="6" y="18" width="20" height="6" rx="1.5" fill="#eab308" opacity={0.2} stroke="#fbbf24" strokeWidth="1.2" />
          {/* Crown points */}
          <path d="M6 18 L6 10 L11 14 L16 6 L21 14 L26 10 L26 18" stroke="#fbbf24" strokeWidth="1.2" fill="#eab308" opacity={0.15} />
          {/* Jewels on points */}
          <circle cx="6" cy="10" r="1.5" fill="#ef4444" opacity={0.4} />
          <circle cx="16" cy="6" r="1.5" fill="#3b82f6" opacity={0.4} />
          <circle cx="26" cy="10" r="1.5" fill="#22c55e" opacity={0.4} />
          {/* Band detail */}
          <line x1="8" y1="20" x2="24" y2="20" stroke="#fcd34d" strokeWidth="0.6" opacity={0.3} />
          {sparkle(4, 4, '#fbbf24', 0.4)}
          {sparkle(28, 4, '#fbbf24', 0.35)}
        </g>
      );

    case 'moxie_charm':
      // Trophy/medal — energy + draw on KO
      return (
        <g>
          {/* Ribbon */}
          <path d="M10 4 L16 10 L22 4" stroke="#ef4444" strokeWidth="2" fill="none" opacity={0.3} />
          <path d="M10 4 L16 10 L22 4" stroke="#f87171" strokeWidth="1" fill="none" opacity={0.5} />
          {/* Medal body */}
          <circle cx="16" cy="18" r="8" fill="#eab308" opacity={0.2} stroke="#fbbf24" strokeWidth="1.2" />
          {/* Star emblem */}
          <path d="M16 12 L17.5 15 L21 15 L18 17.5 L19 21 L16 19 L13 21 L14 17.5 L11 15 L14.5 15 Z" fill="#fbbf24" opacity={0.4} stroke="#fcd34d" strokeWidth="0.5" />
          {/* Shine */}
          <path d="M11 14 Q10 12 12 11" stroke="#fef08a" strokeWidth="0.6" fill="none" opacity={0.4} />
          {sparkle(6, 8, '#fbbf24', 0.35)}
        </g>
      );

    case 'sturdy_charm':
      // Shield with diamond — damage floor
      return (
        <g>
          {/* Shield */}
          <path d="M16 4 L26 10 L26 20 L16 28 L6 20 L6 10 Z" fill="#6b7280" opacity={0.18} stroke="#9ca3af" strokeWidth="1.2" />
          {/* Inner shield */}
          <path d="M16 8 L22 12 L22 19 L16 24 L10 19 L10 12 Z" stroke="#d1d5db" strokeWidth="0.8" fill="none" opacity={0.3} />
          {/* Diamond emblem */}
          <path d="M16 12 L19 16 L16 20 L13 16 Z" fill="#d1d5db" opacity={0.25} stroke="#e5e7eb" strokeWidth="0.8" />
          {/* Number 5 */}
          <text x="16" y="18" textAnchor="middle" fill="#d1d5db" fontSize="6" fontWeight="bold" opacity={0.5}>5</text>
          {sparkle(6, 6, '#9ca3af', 0.35)}
          {sparkle(26, 26, '#9ca3af', 0.3)}
        </g>
      );

    /* ─── NEW BOSS ───────────────────────────────────────────────── */

    case 'choice_scarf':
      // Flowing scarf — +energy, card limit
      return (
        <g>
          {/* Scarf body — flowing wave */}
          <path d="M4 14 Q10 8 16 14 Q22 20 28 14" stroke="#60a5fa" strokeWidth="3" fill="none" opacity={0.25} />
          <path d="M4 14 Q10 8 16 14 Q22 20 28 14" stroke="#93c5fd" strokeWidth="1.5" fill="none" opacity={0.5} />
          {/* Scarf tails */}
          <path d="M4 14 Q2 18 4 22" stroke="#93c5fd" strokeWidth="1.2" fill="none" opacity={0.4} />
          <path d="M28 14 Q30 18 28 22" stroke="#93c5fd" strokeWidth="1.2" fill="none" opacity={0.4} />
          {/* Speed lines */}
          <line x1="8" y1="22" x2="14" y2="22" stroke="#60a5fa" strokeWidth="0.6" opacity={0.25} />
          <line x1="10" y1="24" x2="18" y2="24" stroke="#60a5fa" strokeWidth="0.5" opacity={0.2} />
          <line x1="12" y1="26" x2="20" y2="26" stroke="#60a5fa" strokeWidth="0.4" opacity={0.15} />
          {sparkle(16, 6, '#93c5fd', 0.4)}
          {sparkle(24, 26, '#93c5fd', 0.3)}
        </g>
      );

    case 'black_sludge':
      // Oozing dark mass — energy + conditional heal/damage
      return (
        <g>
          {/* Sludge pool */}
          <ellipse cx="16" cy="22" rx="10" ry="5" fill="#7c3aed" opacity={0.2} stroke="#a855f7" strokeWidth="1" />
          {/* Sludge blobs */}
          <circle cx="12" cy="14" r="4" fill="#7c3aed" opacity={0.25} stroke="#a855f7" strokeWidth="1" />
          <circle cx="20" cy="12" r="3.5" fill="#7c3aed" opacity={0.2} stroke="#a855f7" strokeWidth="0.9" />
          <circle cx="16" cy="18" r="5" fill="#7c3aed" opacity={0.18} stroke="#a855f7" strokeWidth="1.1" />
          {/* Toxic bubbles */}
          <circle cx="8" cy="10" r="1.5" stroke="#c084fc" strokeWidth="0.5" fill="none" opacity={0.3} />
          <circle cx="24" cy="8" r="1" stroke="#c084fc" strokeWidth="0.5" fill="none" opacity={0.25} />
          <circle cx="22" cy="18" r="1.2" stroke="#c084fc" strokeWidth="0.5" fill="none" opacity={0.2} />
          {/* Drip */}
          <path d="M14 8 Q14 6 15 4" stroke="#a855f7" strokeWidth="0.8" fill="none" opacity={0.3} />
          {sparkle(26, 4, '#a855f7', 0.35)}
        </g>
      );

    case 'flame_orb':
      // Burning orb — energy + self-burn
      return (
        <g>
          {/* Outer glow */}
          <circle cx="16" cy="16" r="11" fill="#f97316" opacity={0.08} />
          {/* Orb body */}
          <circle cx="16" cy="16" r="8" fill="#f97316" opacity={0.2} stroke="#fb923c" strokeWidth="1.2" />
          {/* Flame top */}
          <path d="M12 12 Q14 6 16 8 Q18 6 20 12" stroke="#fb923c" strokeWidth="1" fill="#f97316" opacity={0.2} />
          <path d="M14 10 Q16 4 18 10" stroke="#fdba74" strokeWidth="0.7" fill="none" opacity={0.4} />
          {/* Inner glow */}
          <circle cx="16" cy="16" r="3.5" fill="#fdba74" opacity={0.2} />
          <circle cx="16" cy="16" r="1.5" fill="#fef08a" opacity={0.3} />
          {/* Embers */}
          <circle cx="8" cy="8" r="1" fill="#fb923c" opacity={0.2} />
          <circle cx="24" cy="10" r="0.8" fill="#fb923c" opacity={0.15} />
          {sparkle(6, 22, '#fb923c', 0.35)}
          {sparkle(26, 22, '#fb923c', 0.3)}
        </g>
      );

    /* ─── fallback ───────────────────────────────────────────────── */

    default:
      // Generic gem — fallback
      return (
        <g>
          <circle cx="16" cy="16" r="8" fill="#9ca3af" opacity={0.15} stroke="#9ca3af" strokeWidth="1.2" />
          <circle cx="16" cy="16" r="3" fill="#9ca3af" opacity={0.25} />
          {sparkle(6, 8, '#9ca3af', 0.3)}
        </g>
      );
  }
}
