// Simple seeded random number generator for testability
class SeededRandom {
  private seed: number;

  constructor(seed: number = Date.now()) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  setSeed(seed: number): void {
    this.seed = seed;
  }
}

let globalRandom = new SeededRandom();

export function setRandomSeed(seed: number): void {
  globalRandom = new SeededRandom(seed);
}

export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(globalRandom.next() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function createDeck(cardIds: string[]): string[] {
  return shuffle(cardIds);
}

export function drawCards(
  deck: string[],
  hand: string[],
  discard: string[],
  count: number
): { deck: string[]; hand: string[]; discard: string[] } {
  let newDeck = [...deck];
  let newHand = [...hand];
  let newDiscard = [...discard];

  for (let i = 0; i < count; i++) {
    if (newDeck.length === 0) {
      // Reshuffle discard into deck
      newDeck = shuffle(newDiscard);
      newDiscard = [];
    }
    if (newDeck.length > 0) {
      const card = newDeck.shift()!;
      newHand.push(card);
    }
  }

  return {
    deck: newDeck,
    hand: newHand,
    discard: newDiscard,
  };
}

export function playCard(
  hand: string[],
  cardId: string,
  discard: string[]
): { hand: string[]; discard: string[] } {
  const newHand = [...hand];
  const newDiscard = [...discard];
  const cardIndex = newHand.indexOf(cardId);
  
  if (cardIndex === -1) {
    throw new Error(`Card ${cardId} not found in hand`);
  }

  newHand.splice(cardIndex, 1);
  newDiscard.push(cardId);

  return {
    hand: newHand,
    discard: newDiscard,
  };
}
