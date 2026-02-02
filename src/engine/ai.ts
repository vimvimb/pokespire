import type { BattleState, PokemonCombatState, Action } from './types';
import { getCardDefinition } from '../config/cards';
import type { CardDefinition } from '../config/cards';

function getCardPriority(card: CardDefinition): number {
  // Priority: 1 = highest (damage), 2 = medium (status/debuff), 3 = lowest (defensive/other)
  if (card.effect.type === 'damage') {
    return 1;
  } else if (card.effect.type === 'status') {
    return 2;
  } else {
    return 3;
  }
}

function getAffordableCards(
  pokemon: PokemonCombatState
): Array<{ card: CardDefinition; cardId: string }> {
  return pokemon.hand
    .map(cardId => {
      const card = getCardDefinition(cardId);
      return card ? { card, cardId } : null;
    })
    .filter((item): item is { card: CardDefinition; cardId: string } => 
      item !== null && item.card.cost <= pokemon.currentMana
    )
    .sort((a, b) => getCardPriority(a.card) - getCardPriority(b.card));
}

function getFrontMostAlivePlayer(battleState: BattleState): PokemonCombatState | undefined {
  return battleState.playerParty.find(p => p.currentHp > 0);
}

export function chooseEnemyAction(battleState: BattleState, enemy: PokemonCombatState): Action[] {
  const actions: Action[] = [];
  let remainingMana = enemy.currentMana;
  const affordableCards = getAffordableCards(enemy);

  // Greedily play cards in priority order
  for (const { card, cardId } of affordableCards) {
    if (remainingMana < card.cost) {
      continue;
    }

    // Determine target
    let targetIds: string[] | undefined;
    
    if (card.effect.type === 'damage' || card.effect.type === 'status') {
      if (card.effect.target === 'all') {
        // Multi-target, no explicit targets needed
        targetIds = undefined;
      } else {
        // Single target - front-most alive player
        const target = getFrontMostAlivePlayer(battleState);
        if (target) {
          targetIds = [target.pokemonId];
        } else {
          continue; // No valid target
        }
      }
    } else if (card.effect.type === 'heal' || card.effect.type === 'block') {
      if (card.effect.target === 'all') {
        targetIds = undefined;
      } else {
        // Single target - self for heals/blocks
        targetIds = [enemy.pokemonId];
      }
    } else if (card.effect.type === 'buff') {
      if (card.effect.target === 'all') {
        targetIds = undefined;
      } else {
        targetIds = [enemy.pokemonId];
      }
    }

    actions.push({
      type: 'playCard',
      cardId,
      casterId: enemy.pokemonId,
      targetIds,
    });

    remainingMana -= card.cost;
  }

  // Always end turn after playing cards
  actions.push({
    type: 'endTurn',
  });

  return actions;
}
