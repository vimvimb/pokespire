import { useState, useEffect, useCallback, useRef } from 'react';
import type { MoveType } from '../../engine/types';

// Types for battle events
export interface BattleEvent {
  id: string;
  type: 'damage' | 'heal' | 'block' | 'status' | 'card_played' | 'energy';
  targetId?: string;
  sourceId?: string;
  value?: number;
  text?: string;
  timestamp: number;
}

// Status applied animation event
export interface StatusAppliedEvent {
  id: string;
  targetId: string;
  statusType: string;
  stacks: number;
  isBuff: boolean;
  timestamp: number;
}

const BUFF_STATUSES = new Set(['strength', 'haste', 'evasion', 'mobile', 'energize', 'luck']);

const STATUS_DISPLAY: Record<string, { icon: string; color: string }> = {
  burn: { icon: '🔥', color: '#ef4444' },
  poison: { icon: '☠️', color: '#a855f7' },
  paralysis: { icon: '⚡', color: '#facc15' },
  slow: { icon: '🐌', color: '#6b7280' },
  enfeeble: { icon: '💔', color: '#f97316' },
  sleep: { icon: '💤', color: '#818cf8' },
  leech: { icon: '🌿', color: '#22c55e' },
  evasion: { icon: '💨', color: '#67e8f9' },
  strength: { icon: '💪', color: '#ef4444' },
  haste: { icon: '💨', color: '#22d3ee' },
  taunt: { icon: '☝️', color: '#dc2626' },
  fatigue: { icon: '😵', color: '#94a3b8' },
  mobile: { icon: '🏃', color: '#38bdf8' },
  energize: { icon: '🔋', color: '#fbbf24' },
  luck: { icon: '⭐', color: '#a78bfa' },
};

// Card fly animation event
export interface CardFlyEvent {
  id: string;
  cardName: string;
  cardType: MoveType;
  startPos: { x: number; y: number };
  targetPositions: { x: number; y: number }[];
  timestamp: number;
  isBlockCard?: boolean;  // If true, show shield animation instead of attack
}

interface FloatingNumberProps {
  event: BattleEvent;
  position: { x: number; y: number };
  onComplete: () => void;
}

// Floating damage/heal number that animates upward and fades
function FloatingNumber({ event, position, onComplete }: FloatingNumberProps) {
  const [opacity, setOpacity] = useState(1);
  const [offsetY, setOffsetY] = useState(0);

  // Use a ref so the animation effect doesn't restart when onComplete changes.
  // Inline arrow functions (e.g. `() => removeEvent(id)`) create a new reference
  // every render, which would cause the effect to re-run and restart the animation.
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    // Animate upward and fade out
    const startTime = Date.now();
    const duration = 1000; // 1 second animation
    let frameId: number;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      setOffsetY(-60 * progress); // Move up 60px
      setOpacity(1 - progress * 0.8); // Fade to 20% opacity

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      } else {
        onCompleteRef.current();
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const color = event.type === 'damage' ? '#ef4444'
    : event.type === 'heal' ? '#4ade80'
    : event.type === 'block' ? '#60a5fa'
    : event.type === 'energy' ? '#facc15'
    : '#facc15';

  const prefix = event.type === 'damage' ? '-'
    : event.type === 'heal' ? '+'
    : event.type === 'block' ? '🛡️+'
    : event.type === 'energy' ? '⚡+'
    : '';

  return (
    <div
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y + offsetY,
        transform: 'translate(-50%, -50%)',
        fontSize: 28,
        fontWeight: 'bold',
        color,
        textShadow: '2px 2px 4px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.5)',
        opacity,
        pointerEvents: 'none',
        zIndex: 100,
        whiteSpace: 'nowrap',
      }}
    >
      {prefix}{event.value}
    </div>
  );
}

interface CardPlayedBannerProps {
  sourceName: string;
  cardName: string;
  subtitle?: string;
  onComplete: () => void;
}

// Banner that shows what card was played (or charging status)
function CardPlayedBanner({ sourceName, cardName, subtitle, onComplete }: CardPlayedBannerProps) {
  const [opacity, setOpacity] = useState(0);
  const [scale, setScale] = useState(0.8);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const isCharging = !!subtitle;
  const holdDuration = isCharging ? 1000 : 600;
  const borderColor = isCharging ? '#f97316' : '#facc15';
  const titleColor = isCharging ? '#f97316' : '#facc15';

  useEffect(() => {
    // Fade in, hold, fade out
    const startTime = Date.now();
    const fadeInDuration = 150;
    const fadeOutDuration = 200;
    const totalDuration = fadeInDuration + holdDuration + fadeOutDuration;
    let frameId: number;

    const animate = () => {
      const elapsed = Date.now() - startTime;

      if (elapsed < fadeInDuration) {
        // Fade in
        const progress = elapsed / fadeInDuration;
        setOpacity(progress);
        setScale(0.8 + 0.2 * progress);
      } else if (elapsed < fadeInDuration + holdDuration) {
        // Hold
        setOpacity(1);
        setScale(1);
      } else if (elapsed < totalDuration) {
        // Fade out
        const progress = (elapsed - fadeInDuration - holdDuration) / fadeOutDuration;
        setOpacity(1 - progress);
      } else {
        onCompleteRef.current();
        return;
      }

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      style={{
        position: 'absolute',
        top: '35%',
        left: '50%',
        transform: `translate(-50%, -50%) scale(${scale})`,
        padding: '12px 24px',
        background: 'rgba(30, 30, 46, 0.95)',
        border: `2px solid ${borderColor}`,
        borderRadius: 12,
        opacity,
        pointerEvents: 'none',
        zIndex: 200,
        textAlign: 'center',
        boxShadow: isCharging
          ? `0 4px 20px rgba(0,0,0,0.5), 0 0 20px rgba(249,115,22,0.4)`
          : '0 4px 20px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{ fontSize: 14, color: '#94a3b8' }}>{sourceName}</div>
      <div style={{ fontSize: 20, fontWeight: 'bold', color: titleColor }}>{cardName}</div>
      {subtitle && (
        <div style={{ fontSize: 12, color: '#ef4444', fontWeight: 'bold', marginTop: 4, letterSpacing: 2 }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

// Type colors for card fly animations (matches CardDisplay)
const MOVE_TYPE_COLORS: Record<MoveType, string> = {
  normal: '#a8a878',
  fire: '#f08030',
  water: '#6890f0',
  grass: '#78c850',
  electric: '#f8d030',
  poison: '#a040a0',
  flying: '#a890f0',
  psychic: '#f85888',
  dark: '#705848',
  fighting: '#c03028',
  ice: '#98d8d8',
  bug: '#a8b820',
  dragon: '#7038f8',
  ghost: '#705898',
  rock: '#b8a038',
  ground: '#e0c068',
  steel: '#b8b8d0',
  fairy: '#ee99ac',
  item: '#4ade80',
};

// Animation configuration
const CARD_FLY_CONFIG = {
  FLIGHT_DURATION: 300,    // ms to reach target
  IMPACT_DURATION: 200,    // ms for burst effect
  TRAIL_LENGTH: 4,         // ghost positions
  SPLIT_POINT: 0.5,        // when AoE splits (0-1)
  CARD_SIZE: { width: 55, height: 70 },  // Larger for better visibility
};

interface CardFlyAnimationProps {
  event: CardFlyEvent;
  onComplete: () => void;
}

// Shield shape component for block cards
function ShieldShape({ size, color, style }: { size: number; color: string; style?: React.CSSProperties }) {
  return (
    <div style={{
      width: size,
      height: size * 1.15,
      position: 'relative',
      ...style,
    }}>
      {/* Shield body */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(180deg, rgba(255,255,255,0.95) 0%, ${color} 60%, ${color}cc 100%)`,
        borderRadius: `${size * 0.15}px ${size * 0.15}px ${size * 0.5}px ${size * 0.5}px`,
        border: `3px solid ${color}`,
        boxShadow: `0 0 20px ${color}, 0 0 40px ${color}88, inset 0 0 15px rgba(255,255,255,0.5)`,
      }} />
      {/* Shield emblem (inner circle) */}
      <div style={{
        position: 'absolute',
        top: '25%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: size * 0.4,
        height: size * 0.4,
        borderRadius: '50%',
        background: `radial-gradient(circle, rgba(255,255,255,0.8) 0%, ${color}88 100%)`,
        border: `2px solid ${color}`,
      }} />
    </div>
  );
}

// Flying card animation component
function CardFlyAnimation({ event, onComplete }: CardFlyAnimationProps) {
  const [phase, setPhase] = useState<'flying' | 'impact' | 'done'>('flying');
  const [progress, setProgress] = useState(0);
  const [trailPositions, setTrailPositions] = useState<{ x: number; y: number; opacity: number }[]>([]);
  const [splitProgress, setSplitProgress] = useState(0);

  const isBlockCard = event.isBlockCard ?? false;
  const blockColor = '#60a5fa';  // Blue for block/shield
  const typeColor = isBlockCard ? blockColor : (MOVE_TYPE_COLORS[event.cardType] || MOVE_TYPE_COLORS.normal);
  const isMultiTarget = event.targetPositions.length > 1;

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const startTime = Date.now();
    const { FLIGHT_DURATION, IMPACT_DURATION, TRAIL_LENGTH, SPLIT_POINT } = CARD_FLY_CONFIG;
    let frameId: number;

    const animate = () => {
      const elapsed = Date.now() - startTime;

      if (phase === 'flying') {
        const flightProgress = Math.min(elapsed / FLIGHT_DURATION, 1);
        setProgress(flightProgress);

        // Update trail positions (previous positions with fading opacity)
        const currentPos = getCurrentPosition(flightProgress);
        setTrailPositions(prev => {
          const newTrail = [
            { ...currentPos, opacity: 0.6 },
            ...prev.slice(0, TRAIL_LENGTH - 1).map((p, i) => ({
              ...p,
              opacity: 0.6 - (i + 1) * (0.6 / TRAIL_LENGTH)
            }))
          ];
          return newTrail;
        });

        // For multi-target, track split progress
        if (isMultiTarget && flightProgress > SPLIT_POINT) {
          setSplitProgress((flightProgress - SPLIT_POINT) / (1 - SPLIT_POINT));
        }

        if (flightProgress >= 1) {
          setPhase('impact');
        } else {
          frameId = requestAnimationFrame(animate);
        }
      } else if (phase === 'impact') {
        const impactElapsed = elapsed - FLIGHT_DURATION;
        const impactProgress = Math.min(impactElapsed / IMPACT_DURATION, 1);
        setProgress(impactProgress);

        if (impactProgress >= 1) {
          setPhase('done');
          onCompleteRef.current();
        } else {
          frameId = requestAnimationFrame(animate);
        }
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [phase, isMultiTarget]); // eslint-disable-line react-hooks/exhaustive-deps

  // Calculate current position during flight
  const getCurrentPosition = (t: number) => {
    const { startPos, targetPositions } = event;
    // For single target or pre-split, fly toward first target
    const target = targetPositions[0];

    // Ease-out cubic for smooth deceleration
    const eased = 1 - Math.pow(1 - t, 3);

    return {
      x: startPos.x + (target.x - startPos.x) * eased,
      y: startPos.y + (target.y - startPos.y) * eased,
    };
  };

  // Get split positions for multi-target
  const getSplitPositions = () => {
    if (!isMultiTarget || splitProgress === 0) return [];

    const { startPos, targetPositions } = event;
    const { SPLIT_POINT } = CARD_FLY_CONFIG;

    // Calculate the split point position
    const splitPos = {
      x: startPos.x + (targetPositions[0].x - startPos.x) * SPLIT_POINT,
      y: startPos.y + (targetPositions[0].y - startPos.y) * SPLIT_POINT,
    };

    // Each particle flies from split point to its target
    return targetPositions.map(target => {
      const eased = 1 - Math.pow(1 - splitProgress, 3);
      return {
        x: splitPos.x + (target.x - splitPos.x) * eased,
        y: splitPos.y + (target.y - splitPos.y) * eased,
      };
    });
  };

  if (phase === 'done') return null;

  const { CARD_SIZE } = CARD_FLY_CONFIG;
  const currentPos = getCurrentPosition(progress);
  const scale = phase === 'flying' ? 1 - progress * 0.4 : 1; // Shrink during flight
  const rotation = phase === 'flying' ? progress * 360 : 0; // Rotate during flight

  // Render impact effect at all target positions
  if (phase === 'impact') {
    if (isBlockCard) {
      // Shield pulse effect - shield appears and pulses once
      const pulseScale = 1 + Math.sin(progress * Math.PI) * 0.3; // Pulse up then down
      const pulseOpacity = 1 - progress * 0.5; // Fade out towards end

      return (
        <>
          {event.targetPositions.map((target, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: target.x,
                top: target.y,
                transform: `translate(-50%, -50%) scale(${pulseScale})`,
                opacity: pulseOpacity,
                pointerEvents: 'none',
                zIndex: 150,
              }}
            >
              <ShieldShape size={70} color={typeColor} />
              {/* Pulse ring */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 90 + progress * 40,
                height: 100 + progress * 40,
                borderRadius: '15px 15px 50% 50%',
                border: `3px solid ${typeColor}`,
                opacity: 1 - progress,
                boxShadow: `0 0 20px ${typeColor}`,
              }} />
            </div>
          ))}
        </>
      );
    } else {
      // Attack burst effect - expanding explosion
      const impactScale = 1 + progress * 2;
      const impactOpacity = 1 - progress;

      return (
        <>
          {event.targetPositions.map((target, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: target.x,
                top: target.y,
                transform: `translate(-50%, -50%) scale(${impactScale})`,
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: `radial-gradient(circle, rgba(255,255,255,0.8) 0%, ${typeColor} 30%, ${typeColor}00 70%)`,
                boxShadow: `0 0 30px ${typeColor}, 0 0 60px ${typeColor}88`,
                opacity: impactOpacity,
                pointerEvents: 'none',
                zIndex: 150,
              }}
            />
          ))}
        </>
      );
    }
  }

  // Flying phase - render card/shield and trail
  const splitPositions = getSplitPositions();

  // For block cards, render shield shapes; for attack cards, render cards
  if (isBlockCard) {
    return (
      <>
        {/* Trail ghost shields */}
        {trailPositions.map((pos, i) => (
          <div
            key={`trail-${i}`}
            style={{
              position: 'absolute',
              left: pos.x,
              top: pos.y,
              transform: `translate(-50%, -50%) scale(${scale * 0.7})`,
              opacity: pos.opacity * 0.5,
              pointerEvents: 'none',
              zIndex: 149 - i,
            }}
          >
            <div style={{
              width: 45,
              height: 52,
              background: `linear-gradient(180deg, rgba(255,255,255,0.3) 0%, ${typeColor}44 100%)`,
              borderRadius: '8px 8px 50% 50%',
              border: `2px solid ${typeColor}44`,
            }} />
          </div>
        ))}

        {/* Main flying shield */}
        <div
          style={{
            position: 'absolute',
            left: currentPos.x,
            top: currentPos.y,
            transform: `translate(-50%, -50%) scale(${scale})`,
            pointerEvents: 'none',
            zIndex: 150,
          }}
        >
          <ShieldShape size={55} color={typeColor} />
        </div>
      </>
    );
  }

  return (
    <>
      {/* Trail ghost cards */}
      {trailPositions.map((pos, i) => (
        <div
          key={`trail-${i}`}
          style={{
            position: 'absolute',
            left: pos.x,
            top: pos.y,
            transform: `translate(-50%, -50%) scale(${scale * 0.8})`,
            width: CARD_SIZE.width,
            height: CARD_SIZE.height,
            borderRadius: 6,
            background: `linear-gradient(180deg, rgba(255,255,255,0.3) 0%, ${typeColor}44 100%)`,
            border: `2px solid ${typeColor}66`,
            opacity: pos.opacity,
            pointerEvents: 'none',
            zIndex: 149 - i,
          }}
        />
      ))}

      {/* Main flying card (or split particles) */}
      {splitPositions.length > 0 ? (
        // Multi-target: render split particles (energy orbs)
        splitPositions.map((pos, i) => (
          <div
            key={`split-${i}`}
            style={{
              position: 'absolute',
              left: pos.x,
              top: pos.y,
              transform: `translate(-50%, -50%) scale(${0.6}) rotate(${rotation}deg)`,
              width: CARD_SIZE.width * 0.6,
              height: CARD_SIZE.height * 0.6,
              borderRadius: 6,
              background: `radial-gradient(ellipse at 30% 30%, rgba(255,255,255,0.9) 0%, ${typeColor} 50%, ${typeColor}cc 100%)`,
              border: `2px solid ${typeColor}`,
              boxShadow: `0 0 16px ${typeColor}, 0 0 32px ${typeColor}88, inset 0 0 8px rgba(255,255,255,0.5)`,
              pointerEvents: 'none',
              zIndex: 150,
            }}
          />
        ))
      ) : (
        // Single target or pre-split: render main card
        <div
          style={{
            position: 'absolute',
            left: currentPos.x,
            top: currentPos.y,
            transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
            width: CARD_SIZE.width,
            height: CARD_SIZE.height,
            borderRadius: 6,
            background: `linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.7) 40%, ${typeColor} 100%)`,
            border: `3px solid ${typeColor}`,
            boxShadow: `0 0 20px ${typeColor}, 0 0 40px ${typeColor}88, 0 2px 8px rgba(0,0,0,0.4)`,
            pointerEvents: 'none',
            zIndex: 150,
          }}
        />
      )}
    </>
  );
}

// Status applied animation: arrows + icon pop
interface StatusAppliedAnimationProps {
  event: StatusAppliedEvent;
  position: { x: number; y: number };
  onComplete: () => void;
}

function StatusAppliedAnimation({ event, position, onComplete }: StatusAppliedAnimationProps) {
  const [progress, setProgress] = useState(0);

  const display = STATUS_DISPLAY[event.statusType] || { icon: '?', color: '#888' };
  const arrowColor = event.isBuff ? '#4ade80' : '#ef4444';
  const direction = event.isBuff ? -1 : 1; // -1 = up, 1 = down

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const startTime = Date.now();
    const duration = 800;
    let frameId: number;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const p = Math.min(elapsed / duration, 1);
      setProgress(p);

      if (p < 1) {
        frameId = requestAnimationFrame(animate);
      } else {
        onCompleteRef.current();
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Arrow positions: 3 arrows spread horizontally, staggered timing
  const arrows = [
    { xOff: -28, delay: 0 },
    { xOff: 0, delay: 0.12 },
    { xOff: 28, delay: 0.24 },
  ];

  // Icon pop: scale up then fade
  const iconPhase = Math.max(0, progress - 0.1) / 0.9; // starts slightly after arrows
  const iconScale = iconPhase < 0.3
    ? (iconPhase / 0.3) * 1.3 // scale up to 1.3
    : iconPhase < 0.5
      ? 1.3 - (iconPhase - 0.3) / 0.2 * 0.3 // settle to 1.0
      : 1.0;
  const iconOpacity = iconPhase < 0.6 ? 1 : 1 - (iconPhase - 0.6) / 0.4;

  return (
    <>
      {/* Directional arrows */}
      {arrows.map((arrow, i) => {
        const localP = Math.max(0, Math.min(1, (progress - arrow.delay) / 0.6));
        // Each arrow slides 50px in direction, fading in then out
        const slideY = localP * 50 * direction;
        const arrowOpacity = localP < 0.3 ? localP / 0.3 : localP < 0.7 ? 1 : 1 - (localP - 0.7) / 0.3;
        const arrowChar = event.isBuff ? '▲' : '▼';

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: position.x + arrow.xOff,
              top: position.y + slideY - (event.isBuff ? 20 : -20),
              transform: 'translate(-50%, -50%)',
              fontSize: 22,
              fontWeight: 'bold',
              color: arrowColor,
              opacity: arrowOpacity,
              textShadow: `0 0 8px ${arrowColor}, 0 0 16px ${arrowColor}88`,
              pointerEvents: 'none',
              zIndex: 160,
            }}
          >
            {arrowChar}
          </div>
        );
      })}

      {/* Status icon pop */}
      {iconPhase > 0 && (
        <div
          style={{
            position: 'absolute',
            left: position.x,
            top: position.y - 10,
            transform: `translate(-50%, -50%) scale(${iconScale})`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            opacity: iconOpacity,
            pointerEvents: 'none',
            zIndex: 170,
          }}
        >
          <div style={{
            fontSize: 36,
            filter: `drop-shadow(0 0 6px ${display.color}) drop-shadow(0 0 12px ${display.color}88)`,
          }}>
            {display.icon}
          </div>
          {event.stacks > 1 && (
            <div style={{
              fontSize: 16,
              fontWeight: 'bold',
              color: display.color,
              textShadow: '0 1px 3px rgba(0,0,0,0.8)',
            }}>
              x{event.stacks}
            </div>
          )}
        </div>
      )}

      {/* Brief color flash behind the Pokemon */}
      {progress < 0.4 && (
        <div
          style={{
            position: 'absolute',
            left: position.x,
            top: position.y,
            transform: 'translate(-50%, -50%)',
            width: 80 + progress * 60,
            height: 80 + progress * 60,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${display.color}44 0%, ${display.color}00 70%)`,
            opacity: 1 - progress / 0.4,
            pointerEvents: 'none',
            zIndex: 155,
          }}
        />
      )}
    </>
  );
}

// Sand Stream animation event (Tyranitar passive)
export interface SandStreamEvent {
  id: string;
  sourceId: string;
  targetIds: string[];
  damage: number;
  timestamp: number;
}

interface SandStreamAnimationProps {
  event: SandStreamEvent;
  sourcePosition: { x: number; y: number };
  targetPositions: { x: number; y: number }[];
  onComplete: () => void;
}

// Sandstorm vortex that swirls around the source, then blasts outward to all targets
function SandStreamAnimation({ event: _event, sourcePosition, targetPositions, onComplete }: SandStreamAnimationProps) {
  const [progress, setProgress] = useState(0);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Stable random offsets for scatter particles (generated once)
  const scatterRef = useRef<Array<{ angle: number; speed: number; size: number; color: number }>>([]);
  if (scatterRef.current.length === 0) {
    for (let i = 0; i < 40; i++) {
      scatterRef.current.push({
        angle: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 1.5,
        size: 2 + Math.random() * 4,
        color: Math.floor(Math.random() * 3),
      });
    }
  }

  useEffect(() => {
    const startTime = Date.now();
    const duration = 1500;
    let frameId: number;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const p = Math.min(elapsed / duration, 1);
      setProgress(p);

      if (p < 1) {
        frameId = requestAnimationFrame(animate);
      } else {
        onCompleteRef.current();
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const ease = 1 - Math.pow(1 - progress, 3);

  const sand = '#e0c068';
  const sandLight = '#f0d888';
  const sandBright = '#f8e8a0';
  const sandDark = '#c8a848';
  const sandDeep = '#a08030';
  const sandColors = [sandBright, sandLight, sand, sandDark, sandDeep];

  // Phase 1: Vortex builds (0 – 0.45)
  // Phase 2: Sandstorm wave blasts to targets (0.35 – 0.75) — overlaps vortex for seamless transition
  // Phase 3: Impact explosions on targets (0.7 – 1.0)
  const vortexProgress = Math.min(progress / 0.45, 1);
  const vortexEase = 1 - Math.pow(1 - vortexProgress, 2);

  const blastStart = 0.35;
  const blastEnd = 0.75;
  const blastProgress = progress < blastStart ? 0 : progress > blastEnd ? 1 : (progress - blastStart) / (blastEnd - blastStart);
  const blastEase = 1 - Math.pow(1 - blastProgress, 2);

  const impactStart = 0.7;
  const impactProgress = progress < impactStart ? 0 : (progress - impactStart) / (1 - impactStart);

  // Vortex opacity: fade in fast, start fading once blast is underway
  const vortexOpacity = progress < 0.1
    ? progress / 0.1
    : progress < 0.45
      ? 1
      : progress < 0.65
        ? 1 - (progress - 0.45) / 0.2
        : 0;

  // Vortex scale: pop in, hold, then expand outward as it dissipates
  const vortexScale = vortexProgress < 0.15
    ? (vortexProgress / 0.15) * 1.2
    : vortexProgress < 0.3
      ? 1.2 - (vortexProgress - 0.15) / 0.15 * 0.2
      : progress < 0.45
        ? 1.0
        : 1.0 + (progress - 0.45) * 1.5;

  const svgSize = 180;

  // Generate vortex particles — 5 concentric rings, many more particles
  const vortexParticles: Array<{ cx: number; cy: number; r: number; opacity: number; colorIdx: number }> = [];
  const numRings = 5;
  const particlesPerRing = 10;
  for (let ring = 0; ring < numRings; ring++) {
    const baseRadius = 12 + ring * 12;
    const radius = baseRadius * vortexEase;
    const speed = (numRings - ring) * 1.4;
    for (let p = 0; p < particlesPerRing; p++) {
      const angle = (p / particlesPerRing) * Math.PI * 2 + ease * speed * Math.PI * 2 + ring * 0.5;
      const wobble = Math.sin(ease * 10 + p * 1.3 + ring) * 4;
      const cx = Math.cos(angle) * (radius + wobble);
      const cy = Math.sin(angle) * (radius + wobble) * 0.55;
      const size = 2 + ring * 0.7 + Math.sin(ease * 8 + p + ring) * 1;
      const particleOpacity = vortexOpacity * (0.4 + ring * 0.12);
      vortexParticles.push({ cx, cy, r: size, opacity: particleOpacity, colorIdx: (p + ring) % 5 });
    }
  }

  return (
    <>
      {/* Full-screen sand haze overlay — tints the whole battlefield */}
      {progress > 0.05 && progress < 0.85 && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: `linear-gradient(180deg, ${sand}00 0%, ${sandDark}18 40%, ${sand}22 60%, ${sand}00 100%)`,
            opacity: progress < 0.15 ? (progress - 0.05) / 0.1 : progress > 0.7 ? (0.85 - progress) / 0.15 : 1,
            pointerEvents: 'none',
            zIndex: 150,
          }}
        />
      )}

      {/* Large sandy glow pulse behind source */}
      {vortexOpacity > 0 && (
        <div
          style={{
            position: 'absolute',
            left: sourcePosition.x,
            top: sourcePosition.y,
            transform: 'translate(-50%, -50%)',
            width: 160 + vortexEase * 80,
            height: 160 + vortexEase * 80,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${sand}55 0%, ${sandDark}33 30%, ${sand}11 60%, transparent 80%)`,
            opacity: vortexOpacity,
            pointerEvents: 'none',
            zIndex: 155,
          }}
        />
      )}

      {/* SVG vortex — large spinning sandstorm */}
      {vortexOpacity > 0 && (
        <div
          style={{
            position: 'absolute',
            left: sourcePosition.x,
            top: sourcePosition.y,
            transform: `translate(-50%, -50%) scale(${vortexScale})`,
            opacity: vortexOpacity,
            pointerEvents: 'none',
            zIndex: 170,
            filter: `drop-shadow(0 0 10px ${sand}) drop-shadow(0 0 24px ${sand}88) drop-shadow(0 0 40px ${sandDark}44)`,
          }}
        >
          <svg width={svgSize} height={svgSize} viewBox="-90 -90 180 180" fill="none">
            {/* Thick swirl arcs — multiple per ring for a denser look */}
            {[0, 1, 2, 3, 4].map(ring => {
              const r = (12 + ring * 12) * vortexEase;
              const speed = (5 - ring) * 1.4;
              // Two arcs per ring, offset 180°
              return [0, 180].map(offset => {
                const startAngle = ease * speed * 360 + offset + ring * 30;
                const sweep = 100 + ring * 15;
                const a1 = (startAngle * Math.PI) / 180;
                const a2 = ((startAngle + sweep) * Math.PI) / 180;
                const ySquash = 0.55;
                const x1 = Math.cos(a1) * r;
                const y1 = Math.sin(a1) * r * ySquash;
                const x2 = Math.cos(a2) * r;
                const y2 = Math.sin(a2) * r * ySquash;
                return (
                  <path
                    key={`${ring}-${offset}`}
                    d={`M ${x1} ${y1} A ${r} ${r * ySquash} 0 0 1 ${x2} ${y2}`}
                    stroke={sandColors[ring]}
                    strokeWidth={3 - ring * 0.3}
                    strokeOpacity={0.25 + (ring < 3 ? 0.15 : 0)}
                    strokeLinecap="round"
                    fill="none"
                  />
                );
              });
            })}

            {/* Sand particles orbiting in the vortex */}
            {vortexParticles.map((p, i) => (
              <circle
                key={i}
                cx={p.cx}
                cy={p.cy}
                r={p.r}
                fill={sandColors[p.colorIdx]}
                opacity={p.opacity}
              />
            ))}
          </svg>
        </div>
      )}

      {/* Blast phase: wide sand wave from source to each target — 3 parallel streams per target */}
      {blastProgress > 0 && blastProgress < 1 && targetPositions.map((targetPos, ti) => {
        const dx = targetPos.x - sourcePosition.x;
        const dy = targetPos.y - sourcePosition.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        // Perpendicular offset direction
        const perpX = -dy / dist;
        const perpY = dx / dist;

        const stagger = ti * 0.06;
        const thisProgress = Math.max(0, Math.min((blastEase - stagger) / (1 - stagger * targetPositions.length), 1));

        // 3 parallel streams: center + two flanking
        const streams = [0, -14, 14];

        return (
          <div key={`blast-${ti}`}>
            {streams.map((offsetPx, si) => {
              const ox = perpX * offsetPx;
              const oy = perpY * offsetPx;
              const px = sourcePosition.x + dx * thisProgress + ox;
              const py = sourcePosition.y + dy * thisProgress + oy;
              const isCenterStream = si === 0;
              const streamWidth = isCenterStream ? 18 : 12;
              const streamHeight = isCenterStream ? 10 : 7;

              return (
                <div key={si}>
                  {/* Leading sand chunk */}
                  <div
                    style={{
                      position: 'absolute',
                      left: px,
                      top: py,
                      width: streamWidth,
                      height: streamHeight,
                      borderRadius: '50%',
                      background: `radial-gradient(ellipse, ${isCenterStream ? sandBright : sandLight} 0%, ${sand} 50%, transparent 100%)`,
                      transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                      opacity: (isCenterStream ? 0.95 : 0.7) * (1 - thisProgress * 0.2),
                      pointerEvents: 'none',
                      zIndex: 160,
                      filter: isCenterStream ? `drop-shadow(0 0 6px ${sand}) drop-shadow(0 0 12px ${sandDark}88)` : `drop-shadow(0 0 4px ${sandDark})`,
                    }}
                  />
                  {/* Trailing sand particles — 5 per stream */}
                  {[0.04, 0.09, 0.15, 0.22, 0.30].map((offset, j) => {
                    const tp = Math.max(0, thisProgress - offset);
                    const tx = sourcePosition.x + dx * tp + ox * (1 - j * 0.15);
                    const ty = sourcePosition.y + dy * tp + oy * (1 - j * 0.15);
                    const jitter = Math.sin(j * 3.7 + si * 2 + ti) * 3;
                    return (
                      <div
                        key={j}
                        style={{
                          position: 'absolute',
                          left: tx + jitter,
                          top: ty + jitter * 0.5,
                          width: (isCenterStream ? 10 : 7) - j * 1.2,
                          height: (isCenterStream ? 6 : 4) - j * 0.6,
                          borderRadius: '50%',
                          background: sandColors[(j + si + ti) % 5],
                          transform: `translate(-50%, -50%) rotate(${angle + jitter * 3}deg)`,
                          opacity: (0.6 - j * 0.1) * (1 - thisProgress * 0.4),
                          pointerEvents: 'none',
                          zIndex: 159,
                        }}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Impact explosions on targets — large burst + scatter particles + expanding rings */}
      {impactProgress > 0 && targetPositions.map((targetPos, ti) => {
        const impactEase = 1 - Math.pow(1 - impactProgress, 2);
        const burstScale = 1 + impactEase * 3;
        const burstOpacity = 1 - impactEase;
        const scatter = scatterRef.current;

        return (
          <div key={`impact-${ti}`}>
            {/* Bright central flash */}
            <div
              style={{
                position: 'absolute',
                left: targetPos.x,
                top: targetPos.y,
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: sandBright,
                transform: `translate(-50%, -50%) scale(${1 + impactEase * 0.5})`,
                opacity: impactProgress < 0.3 ? 1 : Math.max(0, 1 - (impactProgress - 0.3) / 0.3),
                pointerEvents: 'none',
                zIndex: 172,
                filter: `drop-shadow(0 0 8px ${sandLight}) drop-shadow(0 0 16px ${sand})`,
              }}
            />

            {/* Large radial burst */}
            <div
              style={{
                position: 'absolute',
                left: targetPos.x,
                top: targetPos.y,
                width: 70,
                height: 70,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${sandLight}aa 0%, ${sand}66 30%, ${sandDark}33 60%, transparent 80%)`,
                transform: `translate(-50%, -50%) scale(${burstScale})`,
                opacity: burstOpacity,
                pointerEvents: 'none',
                zIndex: 166,
              }}
            />

            {/* Expanding ring 1 */}
            <div
              style={{
                position: 'absolute',
                left: targetPos.x,
                top: targetPos.y,
                width: 50,
                height: 50,
                borderRadius: '50%',
                border: `3px solid ${sandLight}`,
                transform: `translate(-50%, -50%) scale(${burstScale * 1.2})`,
                opacity: burstOpacity * 0.7,
                pointerEvents: 'none',
                zIndex: 167,
              }}
            />

            {/* Expanding ring 2 (delayed) */}
            {impactProgress > 0.15 && (
              <div
                style={{
                  position: 'absolute',
                  left: targetPos.x,
                  top: targetPos.y,
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  border: `2px solid ${sand}`,
                  transform: `translate(-50%, -50%) scale(${1 + (impactEase - 0.15) * 4})`,
                  opacity: Math.max(0, burstOpacity - 0.2) * 0.5,
                  pointerEvents: 'none',
                  zIndex: 167,
                }}
              />
            )}

            {/* Scatter particles — sand debris flying outward from impact */}
            {scatter.slice(ti * 10, ti * 10 + 10).concat(scatter.slice(0, Math.max(0, 10 - (scatter.length - ti * 10)))).map((s, j) => {
              const scatterDist = 20 + s.speed * impactEase * 50;
              const sx = targetPos.x + Math.cos(s.angle + ti) * scatterDist;
              const sy = targetPos.y + Math.sin(s.angle + ti) * scatterDist;
              return (
                <div
                  key={`scatter-${ti}-${j}`}
                  style={{
                    position: 'absolute',
                    left: sx,
                    top: sy,
                    width: s.size * (1 - impactEase * 0.5),
                    height: s.size * 0.6 * (1 - impactEase * 0.5),
                    borderRadius: '50%',
                    background: sandColors[s.color],
                    transform: 'translate(-50%, -50%)',
                    opacity: burstOpacity * 0.8,
                    pointerEvents: 'none',
                    zIndex: 168,
                  }}
                />
              );
            })}
          </div>
        );
      })}
    </>
  );
}

// Rewind clock animation event (Celebi passive)
export interface RewindEvent {
  id: string;
  targetId: string;
  timestamp: number;
}

interface RewindAnimationProps {
  event: RewindEvent;
  position: { x: number; y: number };
  onComplete: () => void;
}

// SVG clock face that spins counter-clockwise with a green Celebi glow
function RewindAnimation({ event: _event, position, onComplete }: RewindAnimationProps) {
  const [progress, setProgress] = useState(0);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const startTime = Date.now();
    const duration = 900;
    let frameId: number;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const p = Math.min(elapsed / duration, 1);
      setProgress(p);

      if (p < 1) {
        frameId = requestAnimationFrame(animate);
      } else {
        onCompleteRef.current();
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Easing: fast start, smooth settle
  const ease = 1 - Math.pow(1 - progress, 3);

  // Clock hands rotate counter-clockwise (negative): minute hand 2 full turns, hour hand 1
  const minuteAngle = -ease * 720;
  const hourAngle = -ease * 360;

  // Scale: pop in then settle
  const scale = progress < 0.15
    ? (progress / 0.15) * 1.2
    : progress < 0.3
      ? 1.2 - (progress - 0.15) / 0.15 * 0.2
      : 1.0;

  // Opacity: hold then fade
  const opacity = progress < 0.65 ? 1 : 1 - (progress - 0.65) / 0.35;

  const green = '#4ade80';
  const greenDark = '#22c55e';
  const size = 72;

  return (
    <>
      {/* Green radial pulse behind */}
      {progress < 0.5 && (
        <div
          style={{
            position: 'absolute',
            left: position.x,
            top: position.y,
            transform: 'translate(-50%, -50%)',
            width: size + progress * 80,
            height: size + progress * 80,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${green}33 0%, ${green}00 70%)`,
            opacity: 1 - progress / 0.5,
            pointerEvents: 'none',
            zIndex: 155,
          }}
        />
      )}

      {/* SVG clock face */}
      <div
        style={{
          position: 'absolute',
          left: position.x,
          top: position.y,
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          pointerEvents: 'none',
          zIndex: 170,
          filter: `drop-shadow(0 0 8px ${green}) drop-shadow(0 0 16px ${green}88)`,
        }}
      >
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          {/* Outer ring */}
          <circle
            cx="50" cy="50" r="46"
            stroke={green}
            strokeWidth="3"
            fill="rgba(15, 15, 23, 0.85)"
          />
          {/* Inner glow ring */}
          <circle
            cx="50" cy="50" r="42"
            stroke={green}
            strokeWidth="1"
            strokeOpacity="0.3"
            fill="none"
          />

          {/* Hour tick marks */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 - 90) * Math.PI / 180;
            const isCardinal = i % 3 === 0;
            const r1 = isCardinal ? 36 : 38;
            const r2 = 42;
            return (
              <line
                key={i}
                x1={50 + r1 * Math.cos(angle)}
                y1={50 + r1 * Math.sin(angle)}
                x2={50 + r2 * Math.cos(angle)}
                y2={50 + r2 * Math.sin(angle)}
                stroke={green}
                strokeWidth={isCardinal ? 2.5 : 1.5}
                strokeLinecap="round"
                strokeOpacity={isCardinal ? 1 : 0.5}
              />
            );
          })}

          {/* Hour hand (short, thick) */}
          <line
            x1="50" y1="50"
            x2="50" y2="26"
            stroke={green}
            strokeWidth="3.5"
            strokeLinecap="round"
            transform={`rotate(${hourAngle} 50 50)`}
          />

          {/* Minute hand (long, thinner) */}
          <line
            x1="50" y1="50"
            x2="50" y2="16"
            stroke={greenDark}
            strokeWidth="2.5"
            strokeLinecap="round"
            transform={`rotate(${minuteAngle} 50 50)`}
          />

          {/* Center dot */}
          <circle cx="50" cy="50" r="3" fill={green} />

          {/* Counter-clockwise arrow arc (decorative, at bottom) */}
          <path
            d={`M 68 78 A 24 24 0 0 0 32 78`}
            stroke={green}
            strokeWidth="2"
            fill="none"
            strokeOpacity={0.6}
            strokeLinecap="round"
          />
          {/* Arrowhead pointing counter-clockwise (left side) */}
          <polygon
            points="32,78 36,73 37,80"
            fill={green}
            fillOpacity={0.6}
          />
        </svg>
      </div>
    </>
  );
}

// Hook to manage battle effects
export function useBattleEffects() {
  const [events, setEvents] = useState<BattleEvent[]>([]);
  const [cardBanner, setCardBanner] = useState<{ sourceName: string; cardName: string; subtitle?: string; id: string } | null>(null);
  const [cardFlyEvents, setCardFlyEvents] = useState<CardFlyEvent[]>([]);

  const addEvent = useCallback((event: Omit<BattleEvent, 'id' | 'timestamp'>) => {
    const newEvent: BattleEvent = {
      ...event,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    };
    setEvents(prev => [...prev, newEvent]);
  }, []);

  const showCardPlayed = useCallback((sourceName: string, cardName: string, subtitle?: string) => {
    setCardBanner({ sourceName, cardName, subtitle, id: `${Date.now()}` });
  }, []);

  const removeEvent = useCallback((id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  }, []);

  const clearCardBanner = useCallback(() => {
    setCardBanner(null);
  }, []);

  const triggerCardFly = useCallback((event: Omit<CardFlyEvent, 'id' | 'timestamp'>) => {
    const newEvent: CardFlyEvent = {
      ...event,
      id: `fly-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    };
    setCardFlyEvents(prev => [...prev, newEvent]);
  }, []);

  const removeCardFlyEvent = useCallback((id: string) => {
    setCardFlyEvents(prev => prev.filter(e => e.id !== id));
  }, []);

  const [statusAppliedEvents, setStatusAppliedEvents] = useState<StatusAppliedEvent[]>([]);

  const triggerStatusApplied = useCallback((event: { targetId: string; statusType: string; stacks: number }) => {
    const newEvent: StatusAppliedEvent = {
      ...event,
      id: `status-${Date.now()}-${Math.random()}`,
      isBuff: BUFF_STATUSES.has(event.statusType),
      timestamp: Date.now(),
    };
    setStatusAppliedEvents(prev => [...prev, newEvent]);
  }, []);

  const removeStatusAppliedEvent = useCallback((id: string) => {
    setStatusAppliedEvents(prev => prev.filter(e => e.id !== id));
  }, []);

  const [rewindEvents, setRewindEvents] = useState<RewindEvent[]>([]);

  const triggerRewind = useCallback((targetId: string) => {
    const newEvent: RewindEvent = {
      id: `rewind-${Date.now()}-${Math.random()}`,
      targetId,
      timestamp: Date.now(),
    };
    setRewindEvents(prev => [...prev, newEvent]);
  }, []);

  const removeRewindEvent = useCallback((id: string) => {
    setRewindEvents(prev => prev.filter(e => e.id !== id));
  }, []);

  const [sandStreamEvents, setSandStreamEvents] = useState<SandStreamEvent[]>([]);

  const triggerSandStream = useCallback((sourceId: string, targetIds: string[], damage: number) => {
    const newEvent: SandStreamEvent = {
      id: `sandstream-${Date.now()}-${Math.random()}`,
      sourceId,
      targetIds,
      damage,
      timestamp: Date.now(),
    };
    setSandStreamEvents(prev => [...prev, newEvent]);
  }, []);

  const removeSandStreamEvent = useCallback((id: string) => {
    setSandStreamEvents(prev => prev.filter(e => e.id !== id));
  }, []);

  return {
    events,
    cardBanner,
    cardFlyEvents,
    statusAppliedEvents,
    rewindEvents,
    sandStreamEvents,
    addEvent,
    showCardPlayed,
    removeEvent,
    clearCardBanner,
    triggerCardFly,
    removeCardFlyEvent,
    triggerStatusApplied,
    removeStatusAppliedEvent,
    triggerRewind,
    removeRewindEvent,
    triggerSandStream,
    removeSandStreamEvent,
  };
}

interface BattleEffectsLayerProps {
  events: BattleEvent[];
  cardBanner: { sourceName: string; cardName: string; subtitle?: string; id: string } | null;
  cardFlyEvents: CardFlyEvent[];
  statusAppliedEvents: StatusAppliedEvent[];
  rewindEvents: RewindEvent[];
  sandStreamEvents: SandStreamEvent[];
  getPositionForCombatant: (combatantId: string) => { x: number; y: number } | null;
  onEventComplete: (id: string) => void;
  onBannerComplete: () => void;
  onCardFlyComplete: (id: string) => void;
  onStatusAppliedComplete: (id: string) => void;
  onRewindComplete: (id: string) => void;
  onSandStreamComplete: (id: string) => void;
}

// The visual layer that renders all effects
export function BattleEffectsLayer({
  events,
  cardBanner,
  cardFlyEvents,
  statusAppliedEvents,
  rewindEvents,
  sandStreamEvents,
  getPositionForCombatant,
  onEventComplete,
  onBannerComplete,
  onCardFlyComplete,
  onStatusAppliedComplete,
  onRewindComplete,
  onSandStreamComplete,
}: BattleEffectsLayerProps) {
  return (
    <>
      {/* Sand Stream animations */}
      {sandStreamEvents.map(event => {
        const sourcePos = getPositionForCombatant(event.sourceId);
        if (!sourcePos) return null;
        const targetPositions = event.targetIds
          .map(id => getPositionForCombatant(id))
          .filter((p): p is { x: number; y: number } => p !== null);
        if (targetPositions.length === 0) return null;
        return (
          <SandStreamAnimation
            key={event.id}
            event={event}
            sourcePosition={sourcePos}
            targetPositions={targetPositions}
            onComplete={() => onSandStreamComplete(event.id)}
          />
        );
      })}

      {/* Card fly animations */}
      {cardFlyEvents.map(event => (
        <CardFlyAnimation
          key={event.id}
          event={event}
          onComplete={() => onCardFlyComplete(event.id)}
        />
      ))}

      {/* Status applied animations */}
      {statusAppliedEvents.map(event => {
        const position = getPositionForCombatant(event.targetId);
        if (!position) return null;
        return (
          <StatusAppliedAnimation
            key={event.id}
            event={event}
            position={position}
            onComplete={() => onStatusAppliedComplete(event.id)}
          />
        );
      })}

      {/* Rewind clock animations */}
      {rewindEvents.map(event => {
        const position = getPositionForCombatant(event.targetId);
        if (!position) return null;
        return (
          <RewindAnimation
            key={event.id}
            event={event}
            position={position}
            onComplete={() => onRewindComplete(event.id)}
          />
        );
      })}

      {/* Floating numbers */}
      {events.map(event => {
        if (!event.targetId || event.value === undefined) return null;
        const position = getPositionForCombatant(event.targetId);
        if (!position) return null;

        return (
          <FloatingNumber
            key={event.id}
            event={event}
            position={position}
            onComplete={() => onEventComplete(event.id)}
          />
        );
      })}

      {/* Card played banner */}
      {cardBanner && (
        <CardPlayedBanner
          key={cardBanner.id}
          sourceName={cardBanner.sourceName}
          cardName={cardBanner.cardName}
          subtitle={cardBanner.subtitle}
          onComplete={onBannerComplete}
        />
      )}
    </>
  );
}
