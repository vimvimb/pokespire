interface Props {
  classId: string;
  color: string;
  size?: number;
}

export function ClassIcon({ classId, color, size = 48 }: Props) {
  const main = color;
  const faint = color + '66';
  const subtle = color + '33';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      style={{ display: 'block' }}
    >
      {renderIcon(classId, main, faint, subtle)}
    </svg>
  );
}

function renderIcon(
  id: string,
  main: string,
  faint: string,
  subtle: string,
) {
  switch (id) {
    /* ── Defensive ─────────────────────────────────────────── */

    case 'rogue':
      // Dagger with shadow wisps — provoke via column movement
      return (
        <g>
          {/* Blade */}
          <path
            d="M24 5L28 26L24 30L20 26Z"
            stroke={main}
            strokeWidth="1.5"
            fill={subtle}
          />
          <line
            x1="24" y1="8" x2="24" y2="24"
            stroke={main}
            strokeWidth="0.6"
            opacity={0.4}
          />
          {/* Crossguard */}
          <path
            d="M15 26Q24 30 33 26"
            stroke={main}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          {/* Handle + pommel */}
          <line
            x1="24" y1="30" x2="24" y2="39"
            stroke={main}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="24" cy="41" r="2" fill={faint} stroke={main} strokeWidth="1" />
          {/* Shadow wisps */}
          <path d="M14 16Q10 14 8 18" stroke={faint} strokeWidth="1" fill="none" />
          <path d="M34 16Q38 14 40 18" stroke={faint} strokeWidth="1" fill="none" />
          <path d="M12 22Q8 24 10 28" stroke={subtle} strokeWidth="0.8" fill="none" />
          <path d="M36 22Q40 24 38 28" stroke={subtle} strokeWidth="0.8" fill="none" />
        </g>
      );

    case 'vanguard':
      // Kite shield with center boss — steadfast defense
      return (
        <g>
          <path
            d="M24 4L38 12L38 28L24 44L10 28L10 12Z"
            stroke={main}
            strokeWidth="1.5"
            fill={subtle}
          />
          {/* Bands */}
          <line x1="12" y1="20" x2="36" y2="20" stroke={main} strokeWidth="1.2" />
          <line x1="24" y1="6" x2="24" y2="42" stroke={faint} strokeWidth="0.8" />
          {/* Boss */}
          <circle cx="24" cy="22" r="5" stroke={main} strokeWidth="1.2" fill={faint} />
          <circle cx="24" cy="22" r="2" fill={main} opacity={0.7} />
          {/* Rivets */}
          <circle cx="15" cy="14" r="1.2" fill={main} opacity={0.4} />
          <circle cx="33" cy="14" r="1.2" fill={main} opacity={0.4} />
          <circle cx="15" cy="28" r="1.2" fill={main} opacity={0.4} />
          <circle cx="33" cy="28" r="1.2" fill={main} opacity={0.4} />
        </g>
      );

    case 'defender':
      // Split shield with energy flowing between halves — block sharing
      return (
        <g>
          {/* Left half */}
          <path
            d="M22 6L10 12L10 28L22 40Z"
            stroke={main}
            strokeWidth="1.5"
            fill={subtle}
          />
          {/* Right half */}
          <path
            d="M26 6L38 12L38 28L26 40Z"
            stroke={main}
            strokeWidth="1.5"
            fill={subtle}
          />
          {/* Energy bridge between halves */}
          <line x1="24" y1="10" x2="24" y2="15" stroke={main} strokeWidth="1.5" opacity={0.8} />
          <line x1="24" y1="19" x2="24" y2="24" stroke={main} strokeWidth="1.5" opacity={0.6} />
          <line x1="24" y1="28" x2="24" y2="33" stroke={main} strokeWidth="1.5" opacity={0.4} />
          {/* Glow dots */}
          <circle cx="24" cy="12" r="1.5" fill={main} opacity={0.6} />
          <circle cx="24" cy="24" r="1.5" fill={main} opacity={0.4} />
          <circle cx="24" cy="36" r="1.5" fill={main} opacity={0.3} />
        </g>
      );

    case 'interceptor':
      // Arrow deflecting off a shield — damage redirect
      return (
        <g>
          {/* Shield (right side) */}
          <path
            d="M30 8L40 14L40 32L30 42L22 32L22 14Z"
            stroke={main}
            strokeWidth="1.5"
            fill={subtle}
          />
          <circle cx="31" cy="24" r="3" stroke={main} strokeWidth="1" fill={faint} />
          {/* Incoming arrow */}
          <line x1="4" y1="22" x2="20" y2="22" stroke={main} strokeWidth="1.5" strokeLinecap="round" />
          <path
            d="M16 18L22 22L16 26"
            stroke={main}
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Deflection sparks */}
          <circle cx="22" cy="22" r="2.5" fill={main} opacity={0.4} />
          <line x1="18" y1="16" x2="14" y2="12" stroke={faint} strokeWidth="1" strokeLinecap="round" />
          <line x1="18" y1="28" x2="14" y2="32" stroke={faint} strokeWidth="1" strokeLinecap="round" />
          <line x1="16" y1="20" x2="10" y2="16" stroke={subtle} strokeWidth="0.8" strokeLinecap="round" />
        </g>
      );

    /* ── Offensive ──────────────────────────────────────────── */

    case 'deadshot':
      // Crosshair scope — precision sniper
      return (
        <g>
          <circle cx="24" cy="24" r="16" stroke={main} strokeWidth="1.5" fill="none" />
          <circle cx="24" cy="24" r="8" stroke={faint} strokeWidth="1" fill={subtle} />
          {/* Crosshair lines */}
          <line x1="24" y1="4" x2="24" y2="14" stroke={main} strokeWidth="1.5" />
          <line x1="24" y1="34" x2="24" y2="44" stroke={main} strokeWidth="1.5" />
          <line x1="4" y1="24" x2="14" y2="24" stroke={main} strokeWidth="1.5" />
          <line x1="34" y1="24" x2="44" y2="24" stroke={main} strokeWidth="1.5" />
          {/* Center dot */}
          <circle cx="24" cy="24" r="2" fill={main} opacity={0.8} />
          {/* Tick marks */}
          <line x1="20" y1="8" x2="20" y2="10" stroke={faint} strokeWidth="1" />
          <line x1="28" y1="8" x2="28" y2="10" stroke={faint} strokeWidth="1" />
          <line x1="20" y1="38" x2="20" y2="40" stroke={faint} strokeWidth="1" />
          <line x1="28" y1="38" x2="28" y2="40" stroke={faint} strokeWidth="1" />
        </g>
      );

    case 'guerilla':
      // Double vertical arrows — row-switching hit-and-run
      return (
        <g>
          {/* Up arrow */}
          <path
            d="M24 4L32 14L27 14L27 22L21 22L21 14L16 14Z"
            stroke={main}
            strokeWidth="1.5"
            fill={subtle}
          />
          {/* Down arrow */}
          <path
            d="M24 44L16 34L21 34L21 26L27 26L27 34L32 34Z"
            stroke={main}
            strokeWidth="1.5"
            fill={subtle}
          />
          {/* Motion streaks */}
          <line x1="10" y1="10" x2="14" y2="10" stroke={faint} strokeWidth="1" strokeLinecap="round" />
          <line x1="8" y1="14" x2="14" y2="14" stroke={faint} strokeWidth="0.8" strokeLinecap="round" />
          <line x1="34" y1="34" x2="38" y2="34" stroke={faint} strokeWidth="1" strokeLinecap="round" />
          <line x1="34" y1="38" x2="40" y2="38" stroke={faint} strokeWidth="0.8" strokeLinecap="round" />
        </g>
      );

    case 'necromancer':
      // Skull with dark energy wisps — power from death
      return (
        <g>
          {/* Skull dome */}
          <path
            d="M14 26Q14 10 24 8Q34 10 34 26"
            stroke={main}
            strokeWidth="1.5"
            fill={subtle}
          />
          {/* Jaw */}
          <path
            d="M14 26L14 30Q16 38 20 36L22 34L24 36L26 34L28 36Q32 38 34 30L34 26"
            stroke={main}
            strokeWidth="1.5"
            fill={subtle}
          />
          {/* Eye sockets */}
          <ellipse cx="19" cy="22" rx="3.5" ry="4" fill={faint} stroke={main} strokeWidth="1" />
          <ellipse cx="29" cy="22" rx="3.5" ry="4" fill={faint} stroke={main} strokeWidth="1" />
          {/* Pupils */}
          <circle cx="19" cy="22" r="1.2" fill={main} opacity={0.9} />
          <circle cx="29" cy="22" r="1.2" fill={main} opacity={0.9} />
          {/* Nose */}
          <path d="M22 27L24 30L26 27" stroke={main} strokeWidth="1" fill="none" />
          {/* Dark wisps rising */}
          <path d="M18 8Q16 2 12 4" stroke={faint} strokeWidth="1" fill="none" />
          <path d="M24 6Q24 0 28 1" stroke={faint} strokeWidth="1" fill="none" />
          <path d="M30 8Q32 2 36 4" stroke={faint} strokeWidth="1" fill="none" />
        </g>
      );

    case 'pugilist':
      // Fist with impact star — up-close brawler
      return (
        <g>
          {/* Fist body */}
          <rect
            x="12" y="12" width="20" height="16" rx="4"
            stroke={main}
            strokeWidth="1.5"
            fill={subtle}
          />
          {/* Thumb */}
          <rect
            x="8" y="20" width="6" height="10" rx="3"
            stroke={main}
            strokeWidth="1.5"
            fill={faint}
          />
          {/* Knuckle bumps */}
          <path d="M15 12Q17 7 19 12" stroke={main} strokeWidth="1.2" fill={faint} />
          <path d="M21 12Q23 7 25 12" stroke={main} strokeWidth="1.2" fill={faint} />
          <path d="M27 12Q29 7 31 12" stroke={main} strokeWidth="1.2" fill={faint} />
          {/* Wrist */}
          <rect
            x="16" y="28" width="12" height="8" rx="2"
            stroke={main}
            strokeWidth="1"
            fill={subtle}
          />
          {/* Impact lines */}
          <line x1="36" y1="8" x2="42" y2="4" stroke={main} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="38" y1="14" x2="44" y2="14" stroke={faint} strokeWidth="1" strokeLinecap="round" />
          <line x1="36" y1="20" x2="42" y2="24" stroke={faint} strokeWidth="1" strokeLinecap="round" />
        </g>
      );

    /* ── Support ────────────────────────────────────────────── */

    case 'bard':
      // Lyre / harp with musical notes — energy transfer
      return (
        <g>
          {/* Lyre frame */}
          <path
            d="M16 36L16 16Q16 6 24 6Q32 6 32 16L32 36"
            stroke={main}
            strokeWidth="1.5"
            fill="none"
          />
          {/* Lyre horns curving outward */}
          <path d="M16 16Q12 10 10 6" stroke={main} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M32 16Q36 10 38 6" stroke={main} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {/* Crossbar */}
          <line x1="16" y1="20" x2="32" y2="20" stroke={main} strokeWidth="1.2" />
          {/* Strings */}
          <line x1="20" y1="20" x2="20" y2="36" stroke={faint} strokeWidth="0.8" />
          <line x1="24" y1="20" x2="24" y2="36" stroke={faint} strokeWidth="0.8" />
          <line x1="28" y1="20" x2="28" y2="36" stroke={faint} strokeWidth="0.8" />
          {/* Base */}
          <line x1="14" y1="36" x2="34" y2="36" stroke={main} strokeWidth="1.5" strokeLinecap="round" />
          {/* Musical notes */}
          <circle cx="8" cy="28" r="2" fill={faint} />
          <line x1="10" y1="28" x2="10" y2="20" stroke={faint} strokeWidth="1" />
          <circle cx="40" cy="24" r="1.5" fill={subtle} />
          <line x1="41.5" y1="24" x2="41.5" y2="18" stroke={subtle} strokeWidth="0.8" />
        </g>
      );

    case 'herald':
      // Herald's trumpet with sound waves — speed buff
      return (
        <g>
          {/* Trumpet body */}
          <path
            d="M8 28L8 20L28 16L28 32Z"
            stroke={main}
            strokeWidth="1.5"
            fill={subtle}
          />
          {/* Bell flare */}
          <path
            d="M28 14Q36 12 38 10L38 38Q36 36 28 34"
            stroke={main}
            strokeWidth="1.5"
            fill={faint}
          />
          {/* Mouthpiece */}
          <rect x="4" y="21" width="5" height="6" rx="1.5" stroke={main} strokeWidth="1" fill={faint} />
          {/* Sound wave arcs */}
          <path d="M40 18Q44 24 40 30" stroke={main} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M43 14Q48 24 43 34" stroke={faint} strokeWidth="1" fill="none" strokeLinecap="round" />
          {/* Valve dots */}
          <circle cx="18" cy="22" r="1.5" fill={main} opacity={0.5} />
          <circle cx="22" cy="21" r="1.5" fill={main} opacity={0.5} />
        </g>
      );

    case 'priest':
      // Staff with radiant cross — healing aura
      return (
        <g>
          {/* Staff */}
          <line x1="24" y1="8" x2="24" y2="44" stroke={main} strokeWidth="2" strokeLinecap="round" />
          {/* Cross bar */}
          <line x1="16" y1="16" x2="32" y2="16" stroke={main} strokeWidth="2" strokeLinecap="round" />
          {/* Radiant glow */}
          <circle cx="24" cy="16" r="8" stroke={faint} strokeWidth="1" fill={subtle} />
          {/* Light rays */}
          <line x1="24" y1="4" x2="24" y2="7" stroke={faint} strokeWidth="1" strokeLinecap="round" />
          <line x1="14" y1="10" x2="16" y2="12" stroke={faint} strokeWidth="1" strokeLinecap="round" />
          <line x1="34" y1="10" x2="32" y2="12" stroke={faint} strokeWidth="1" strokeLinecap="round" />
          <line x1="14" y1="22" x2="16" y2="20" stroke={faint} strokeWidth="1" strokeLinecap="round" />
          <line x1="34" y1="22" x2="32" y2="20" stroke={faint} strokeWidth="1" strokeLinecap="round" />
          {/* Sparkle dots */}
          <circle cx="12" cy="8" r="1" fill={subtle} />
          <circle cx="36" cy="8" r="1" fill={subtle} />
          <circle cx="10" cy="18" r="0.8" fill={subtle} />
          <circle cx="38" cy="18" r="0.8" fill={subtle} />
        </g>
      );

    case 'captain':
      // Battle standard / flag — leadership aura
      return (
        <g>
          {/* Pole */}
          <line x1="16" y1="4" x2="16" y2="44" stroke={main} strokeWidth="2" strokeLinecap="round" />
          {/* Pole cap */}
          <circle cx="16" cy="4" r="2.5" fill={faint} stroke={main} strokeWidth="1" />
          {/* Flag body */}
          <path
            d="M16 8L40 12L38 20L40 28L16 24Z"
            stroke={main}
            strokeWidth="1.5"
            fill={subtle}
          />
          {/* Flag emblem — star */}
          <path
            d="M28 16L30 19L33 19L31 21L32 24L28 22L24 24L25 21L23 19L26 19Z"
            stroke={main}
            strokeWidth="0.8"
            fill={faint}
          />
          {/* Flag ripple lines */}
          <path d="M20 12Q26 14 34 13" stroke={faint} strokeWidth="0.6" fill="none" />
          <path d="M20 20Q26 22 34 21" stroke={faint} strokeWidth="0.6" fill="none" />
          {/* Ground base */}
          <line x1="10" y1="44" x2="22" y2="44" stroke={faint} strokeWidth="1.5" strokeLinecap="round" />
        </g>
      );

    /* ── Specialist ─────────────────────────────────────────── */

    case 'renegade':
      // Broken chain — lone operative
      return (
        <g>
          {/* Left chain link */}
          <rect
            x="4" y="16" width="14" height="16" rx="5"
            stroke={main}
            strokeWidth="1.5"
            fill="none"
          />
          <rect
            x="7" y="19" width="8" height="10" rx="3"
            fill={subtle}
          />
          {/* Right chain link */}
          <rect
            x="30" y="16" width="14" height="16" rx="5"
            stroke={main}
            strokeWidth="1.5"
            fill="none"
          />
          <rect
            x="33" y="19" width="8" height="10" rx="3"
            fill={subtle}
          />
          {/* Break energy / sparks between the links */}
          <line x1="20" y1="20" x2="24" y2="22" stroke={main} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="24" y1="26" x2="28" y2="28" stroke={main} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="22" y1="18" x2="26" y2="20" stroke={faint} strokeWidth="1" strokeLinecap="round" />
          <line x1="22" y1="30" x2="26" y2="28" stroke={faint} strokeWidth="1" strokeLinecap="round" />
          {/* Spark dots */}
          <circle cx="24" cy="20" r="1.5" fill={main} opacity={0.6} />
          <circle cx="24" cy="28" r="1.5" fill={main} opacity={0.6} />
          <circle cx="21" cy="24" r="1" fill={faint} />
          <circle cx="27" cy="24" r="1" fill={faint} />
          {/* Outward energy lines */}
          <line x1="22" y1="14" x2="20" y2="10" stroke={faint} strokeWidth="0.8" strokeLinecap="round" />
          <line x1="26" y1="14" x2="28" y2="10" stroke={faint} strokeWidth="0.8" strokeLinecap="round" />
          <line x1="22" y1="34" x2="20" y2="38" stroke={faint} strokeWidth="0.8" strokeLinecap="round" />
          <line x1="26" y1="34" x2="28" y2="38" stroke={faint} strokeWidth="0.8" strokeLinecap="round" />
        </g>
      );

    default:
      // Fallback — simple diamond
      return (
        <g>
          <path d="M24 8L36 24L24 40L12 24Z" stroke={main} strokeWidth="1.5" fill={subtle} />
          <circle cx="24" cy="24" r="3" fill={main} opacity={0.5} />
        </g>
      );
  }
}
