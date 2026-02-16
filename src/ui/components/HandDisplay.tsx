import { useState, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import type { Combatant } from '../../engine/types';
import { getMove } from '../../data/loaders';
import { getEffectiveCost } from '../../engine/cards';
import { CardDisplay } from './CardDisplay';

export interface HandDisplayRef {
  getCardPosition: (index: number) => { x: number; y: number } | null;
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

export const HandDisplay = forwardRef<HandDisplayRef, Props>(function HandDisplay(
  { combatant, selectedIndex, onSelectCard, onDragStart, onDragEnd, draggingIndex, unplayableCardIndices, tutorialHighlightCardType },
  ref
) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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

  // Expose getCardPosition to parent via ref
  useImperativeHandle(ref, () => ({
    getCardPosition,
  }), [getCardPosition]);

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
  );
});
