import type { Combatant } from './types';

// ============================================================
// Deck Management
// ============================================================

/** Fisher-Yates shuffle (in-place, returns same array). */
export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Draw cards until hand has `handSize` cards, or both draw and discard are empty.
 * If draw pile is empty, reshuffle discard into draw pile first.
 */
export function drawCards(combatant: Combatant): string[] {
  const drawn: string[] = [];

  while (combatant.hand.length < combatant.handSize) {
    if (combatant.drawPile.length === 0) {
      if (combatant.discardPile.length === 0) break; // nothing left to draw
      // Reshuffle discard into draw pile
      combatant.drawPile = shuffle([...combatant.discardPile]);
      combatant.discardPile = [];
    }
    const card = combatant.drawPile.pop()!;
    combatant.hand.push(card);
    drawn.push(card);
  }

  return drawn;
}

/**
 * Discard all cards in hand to discard pile.
 */
export function discardHand(combatant: Combatant): void {
  combatant.discardPile.push(...combatant.hand);
  combatant.hand = [];
}
