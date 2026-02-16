import { useState, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import type { Combatant, MoveDefinition } from '../../engine/types';
import { getMove } from '../../data/loaders';
import { getEffectiveCost } from '../../engine/cards';
import { CardDisplay } from './CardDisplay';

export interface HandDisplayRef {
  getCardPosition: (index: number) => { x: number; y: number } | null;
  /** Capture a ghost snapshot of the card at `index` before it leaves the hand. */
  triggerVanish: (index: number, burning?: boolean) => void;
}

function isAttackCard(cardId: string): boolean {
  try {
    const move = getMove(cardId.replace(/__parental$/, ""));
    return move.effects.some(
      (e) =>
        e.type === "damage" ||
        e.type === "multi_hit" ||
        e.type === "recoil" ||
        e.type === "self_ko" ||
        e.type === "heal_on_hit",
    );
  } catch {
    return false;
  }
}

function isDefendCard(cardId: string): boolean {
  return cardId === "defend" || cardId.replace(/__parental$/, "") === "defend";
}

interface Props {
  combatant: Combatant;
  selectedIndex: number | null;
  onSelectCard: (index: number) => void;
  onDragStart?: (index: number) => void;
  onDragEnd?: () => void;
  draggingIndex?: number | null;
  unplayableCardIndices?: Set<number>;
  /** When set, add data-tutorial-id to the first matching card for the connector arrow */
  tutorialHighlightCardType?: "attack" | "defend";
}

const HOVER_SCALE = 1.35;
const HOVER_LIFT = -30; // px upward
const NEIGHBOR_SHIFT = 20; // px outward for immediate neighbors

// Ghost card: a snapshot of a vanishing card, rendered at its last known position
interface GhostCard {
  id: string;
  cardId: string;
  card: MoveDefinition;
  combatant: Combatant;
  rect: { left: number; top: number; width: number; height: number };
  burning: boolean;
  // Pre-generated random seeds for ember particles (stable across re-renders)
  emberSeeds: { xPct: number; yPct: number; delay: number; size: number; drift: number }[];
}

function generateEmberSeeds(): GhostCard['emberSeeds'] {
  return Array.from({ length: 8 }, () => ({
    xPct: Math.random(),          // 0–1 across card width
    yPct: 0.3 + Math.random() * 0.7, // start in bottom 70% of card
    delay: Math.random() * 0.4,   // staggered start (0–0.4 of duration)
    size: 3 + Math.random() * 4,  // 3–7px
    drift: (Math.random() - 0.5) * 20, // horizontal drift px
  }));
}

export const HandDisplay = forwardRef<HandDisplayRef, Props>(function HandDisplay(
  { combatant, selectedIndex, onSelectCard, onDragStart, onDragEnd, draggingIndex, unplayableCardIndices, tutorialHighlightCardType },
  ref
) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [ghostCards, setGhostCards] = useState<GhostCard[]>([]);

  // Refs to track card DOM positions
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const getCardPosition = useCallback((index: number): { x: number; y: number } | null => {
    const el = cardRefs.current.get(index);
    if (!el) return null;

    const rect = el.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }, []);

  const triggerVanish = useCallback((index: number, burning = false) => {
    const el = cardRefs.current.get(index);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cardId = combatant.hand[index];
    if (!cardId) return;
    const card = getMove(cardId);

    setGhostCards(prev => [...prev, {
      id: `ghost-${Date.now()}-${Math.random()}`,
      cardId,
      card,
      combatant,
      rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      burning,
      emberSeeds: burning ? generateEmberSeeds() : [],
    }]);
  }, [combatant]);

  const removeGhostCard = useCallback((id: string) => {
    setGhostCards(prev => prev.filter(g => g.id !== id));
  }, []);

  // Expose getCardPosition and triggerVanish to parent via ref
  useImperativeHandle(ref, () => ({
    getCardPosition,
    triggerVanish,
  }), [getCardPosition, triggerVanish]);

  // Find index of first card matching tutorial highlight type (for data-tutorial-id)
  let firstMatchIdx: number | null = null;
  if (tutorialHighlightCardType) {
    for (let i = 0; i < combatant.hand.length; i++) {
      const id = combatant.hand[i];
      if (tutorialHighlightCardType === "attack" && isAttackCard(id)) {
        firstMatchIdx = i;
        break;
      }
      if (tutorialHighlightCardType === "defend" && isDefendCard(id)) {
        firstMatchIdx = i;
        break;
      }
    }
  }

  return (
    <>
      <div style={{
        display: 'flex',
        gap: 12,
        justifyContent: 'center',
        alignItems: 'flex-end',
      }}>
        {combatant.hand.map((cardId, idx) => {
          const card = getMove(cardId);
          // Use centralized cost calculation (includes Quick Feet, Hustle, Inferno Momentum)
          const effectiveCost = getEffectiveCost(combatant, idx);
          const canAfford = combatant.energy >= effectiveCost && !unplayableCardIndices?.has(idx);

          const isDragging = draggingIndex === idx;

          // Compute transform for fan effect
          let translateX = 0;
          let translateY = 0;
          let scale = 1;
          let zIndex = 1;

          if (hoveredIndex !== null && !isDragging) {
            const distance = idx - hoveredIndex;
            if (distance === 0) {
              // Hovered card: scale up + lift
              scale = HOVER_SCALE;
              translateY = HOVER_LIFT;
              zIndex = 10;
            } else {
              // Neighbors shift outward; amount decreases with distance
              const sign = distance > 0 ? 1 : -1;
              const absDist = Math.abs(distance);
              if (absDist <= 2) {
                translateX = sign * NEIGHBOR_SHIFT / absDist;
              }
              zIndex = 1;
            }
          }

          const tutorialId =
            firstMatchIdx === idx && tutorialHighlightCardType
              ? tutorialHighlightCardType === "attack"
                ? "tutorial-card-attack"
                : "tutorial-card-defend"
              : undefined;

          return (
            <div
              key={`${cardId}-${idx}`}
              {...(tutorialId ? { "data-tutorial-id": tutorialId } : {})}
              ref={(el) => {
                if (el) {
                  cardRefs.current.set(idx, el);
                } else {
                  cardRefs.current.delete(idx);
                }
              }}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                transform: `translateX(${translateX}px) translateY(${translateY}px) scale(${scale})`,
                transformOrigin: 'center bottom',
                transition: 'transform 0.15s ease-out',
                zIndex,
                position: 'relative',
              }}
            >
              <CardDisplay
                cardId={cardId}
                handIndex={idx}
                card={card}
                combatant={combatant}
                canAfford={canAfford}
                isSelected={selectedIndex === idx}
                onClick={() => onSelectCard(idx)}
                onDragStart={() => onDragStart?.(idx)}
                onDragEnd={onDragEnd}
                isDragging={isDragging}
              />
            </div>
          );
        })}
      </div>

      {/* Ghost vanish cards — rendered at fixed viewport position */}
      {ghostCards.map(ghost => ghost.burning ? (
        // Consuming Flame: card burns away with ember particles
        <div
          key={ghost.id}
          onAnimationEnd={(e) => {
            // Only remove on the main wrapper animation end (not child animations)
            if (e.target === e.currentTarget) removeGhostCard(ghost.id);
          }}
          style={{
            position: 'fixed',
            left: ghost.rect.left,
            top: ghost.rect.top,
            width: ghost.rect.width,
            zIndex: 1000,
            pointerEvents: 'none',
            animation: 'ghostBurnCard 900ms ease-in forwards',
          }}
        >
          {/* The actual card, darkening as it burns */}
          <div style={{ position: 'relative' }}>
            <CardDisplay
              card={ghost.card}
              combatant={ghost.combatant}
              canAfford={true}
              isSelected={false}
              onClick={() => {}}
            />
            {/* Fire overlay that intensifies over the card */}
            <div style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 8,
              animation: 'ghostBurnOverlay 900ms ease-in forwards',
              pointerEvents: 'none',
            }} />
          </div>

          {/* Ember particles floating up from the card */}
          {ghost.emberSeeds.map((seed, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: seed.xPct * ghost.rect.width,
                top: seed.yPct * ghost.rect.height,
                width: seed.size,
                height: seed.size,
                borderRadius: '50%',
                background: 'radial-gradient(circle, #fbbf24 0%, #f97316 60%, #ef4444 100%)',
                boxShadow: '0 0 4px rgba(249, 115, 22, 0.8)',
                pointerEvents: 'none',
                animation: `ghostEmber 700ms ${seed.delay * 900}ms ease-out forwards`,
                opacity: 0,
                // CSS custom properties for per-particle drift
                '--ember-drift': `${seed.drift}px`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      ) : (
        // Normal vanish: simple rise and fade
        <div
          key={ghost.id}
          onAnimationEnd={() => removeGhostCard(ghost.id)}
          style={{
            position: 'fixed',
            left: ghost.rect.left,
            top: ghost.rect.top,
            width: ghost.rect.width,
            zIndex: 1000,
            pointerEvents: 'none',
            animation: 'ghostRiseCard 600ms ease-out forwards',
          }}
        >
          <CardDisplay
            card={ghost.card}
            combatant={ghost.combatant}
            canAfford={true}
            isSelected={false}
            onClick={() => {}}
          />
        </div>
      ))}

      {ghostCards.length > 0 && (
        <style>{`
          /* Normal vanish: rise and fade */
          @keyframes ghostRiseCard {
            0%   { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-60px); }
          }

          /* Burning vanish: glow, darken, shrink away */
          @keyframes ghostBurnCard {
            0%   { opacity: 1; transform: scale(1) translateY(0); filter: brightness(1); }
            30%  { opacity: 1; transform: scale(1.02) translateY(-4px); filter: brightness(1.15); }
            70%  { opacity: 0.7; transform: scale(0.92) translateY(-12px); filter: brightness(0.6); }
            100% { opacity: 0; transform: scale(0.75) translateY(-30px); filter: brightness(0.2); }
          }

          /* Fire overlay: transparent -> orange glow -> dark char */
          @keyframes ghostBurnOverlay {
            0%   { background: transparent; box-shadow: none; }
            20%  { background: rgba(249, 115, 22, 0.1); box-shadow: inset 0 0 12px rgba(249, 115, 22, 0.4), 0 0 8px rgba(249, 115, 22, 0.3); }
            50%  { background: rgba(249, 115, 22, 0.25); box-shadow: inset 0 0 20px rgba(239, 68, 68, 0.5), 0 0 16px rgba(249, 115, 22, 0.5); }
            80%  { background: rgba(120, 30, 0, 0.5); box-shadow: inset 0 0 30px rgba(239, 68, 68, 0.3), 0 0 8px rgba(0, 0, 0, 0.4); }
            100% { background: rgba(20, 10, 5, 0.7); box-shadow: none; }
          }

          /* Ember particle: appear, float up, fade */
          @keyframes ghostEmber {
            0%   { opacity: 0; transform: translate(0, 0) scale(1); }
            15%  { opacity: 1; transform: translate(0, -5px) scale(1.1); }
            100% { opacity: 0; transform: translate(var(--ember-drift, 0px), -60px) scale(0.4); }
          }
        `}</style>
      )}
    </>
  );
});
