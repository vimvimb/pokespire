import type { BattleState, PokemonCombatState, Action, BattleResult } from './types';
import type { PokemonId } from '../config/pokemon';
import { getPokemonStats } from '../config/pokemon';
import { getStarterDeck } from '../config/cards';
import { createDeck, drawCards, playCard as moveCardToDiscard } from './deck';
import { resolveCardEffect, getCardTargets } from './cards';
import { getCardDefinition } from '../config/cards';
import { processEndOfTurnStatuses, resetBlock } from './status';

export function createBattleState(
  playerParty: Array<{ pokemonId: PokemonId; playerId?: string; playerName?: string }>,
  enemies: Array<{ pokemonId: PokemonId }>
): BattleState {
  const playerCombatStates: PokemonCombatState[] = playerParty.map(p => {
    const stats = getPokemonStats(p.pokemonId);
    const deck = createDeck(getStarterDeck(p.pokemonId));
    const { hand, deck: remainingDeck } = drawCards(deck, [], [], 5);
    
    return {
      pokemonId: p.pokemonId,
      playerId: p.playerId,
      currentHp: stats.maxHp,
      maxHp: stats.maxHp,
      currentMana: stats.maxMana,
      maxMana: stats.maxMana,
      manaRegen: stats.manaRegen,
      speed: stats.speed,
      block: 0,
      statuses: [],
      buffs: [],
      hand,
      deck: remainingDeck,
      discard: [],
      hasActedThisRound: false,
    };
  });

  const enemyCombatStates: PokemonCombatState[] = enemies.map(e => {
    const stats = getPokemonStats(e.pokemonId);
    const deck = createDeck(getStarterDeck(e.pokemonId));
    const { hand, deck: remainingDeck } = drawCards(deck, [], [], 5);
    
    return {
      pokemonId: e.pokemonId,
      currentHp: stats.maxHp,
      maxHp: stats.maxHp,
      currentMana: stats.maxMana,
      maxMana: stats.maxMana,
      manaRegen: stats.manaRegen,
      speed: stats.speed,
      block: 0,
      statuses: [],
      buffs: [],
      hand,
      deck: remainingDeck,
      discard: [],
      hasActedThisRound: false,
    };
  });

  const allCombatants = [...playerCombatStates, ...enemyCombatStates];
  const turnOrder = calculateTurnOrder(allCombatants);

  return {
    playerParty: playerCombatStates,
    enemies: enemyCombatStates,
    turnOrder,
    currentTurnIndex: 0,
    currentRound: 1,
    roundActed: new Set(),
    result: 'ongoing',
  };
}

export function calculateTurnOrder(combatants: PokemonCombatState[]): PokemonCombatState[] {
  return [...combatants]
    .filter(p => p.currentHp > 0)
    .sort((a, b) => b.speed - a.speed);
}

export function checkBattleEnd(battleState: BattleState): BattleResult {
  const alivePlayers = battleState.playerParty.filter(p => p.currentHp > 0);
  const aliveEnemies = battleState.enemies.filter(e => e.currentHp > 0);

  if (alivePlayers.length === 0) {
    return 'defeat';
  }
  if (aliveEnemies.length === 0) {
    return 'victory';
  }
  return 'ongoing';
}

function startNewRound(battleState: BattleState): BattleState {
  // Reset block for all combatants
  const newPlayerParty = battleState.playerParty.map(resetBlock);
  const newEnemies = battleState.enemies.map(resetBlock);
  
  // Recalculate turn order
  const allCombatants = [...newPlayerParty, ...newEnemies];
  const turnOrder = calculateTurnOrder(allCombatants);
  
  // Reset round tracking
  const newRoundActed = new Set<string>();
  
  // Mark all as not acted
  const updatedPlayerParty = newPlayerParty.map(p => ({ ...p, hasActedThisRound: false }));
  const updatedEnemies = newEnemies.map(e => ({ ...e, hasActedThisRound: false }));

  return {
    ...battleState,
    playerParty: updatedPlayerParty,
    enemies: updatedEnemies,
    turnOrder,
    currentTurnIndex: 0,
    currentRound: battleState.currentRound + 1,
    roundActed: newRoundActed,
  };
}

function startPokemonTurn(pokemon: PokemonCombatState): PokemonCombatState {
  // Regenerate mana
  const newMana = Math.min(
    pokemon.maxMana,
    pokemon.currentMana + pokemon.manaRegen
  );

  // Draw 5 cards at start of turn
  const { hand, deck, discard } = drawCards(pokemon.deck, pokemon.hand, pokemon.discard, 5);

  return {
    ...pokemon,
    currentMana: newMana,
    hand,
    deck,
    discard,
  };
}

export function processTurn(
  battleState: BattleState,
  action: Action
): BattleState {
  if (battleState.result !== 'ongoing') {
    return battleState;
  }

  let newBattleState = { ...battleState };
  const currentCombatant = newBattleState.turnOrder[newBattleState.currentTurnIndex];
  
  if (!currentCombatant || currentCombatant.currentHp <= 0) {
    // Skip dead combatants
    return advanceToNextTurn(newBattleState);
  }

  // Check if we need to start a new round
  const allActed = newBattleState.turnOrder.every(p => 
    p.currentHp <= 0 || newBattleState.roundActed.has(p.pokemonId)
  );
  
  if (allActed) {
    newBattleState = startNewRound(newBattleState);
    // Re-get current combatant after round reset
    const newCurrent = newBattleState.turnOrder[newBattleState.currentTurnIndex];
    if (!newCurrent || newCurrent.currentHp <= 0) {
      return advanceToNextTurn(newBattleState);
    }
  }

  // Start turn (regenerate mana, draw cards)
  if (!newBattleState.roundActed.has(currentCombatant.pokemonId)) {
    const updatedCombatant = startPokemonTurn(currentCombatant);
    
    // Update in appropriate array
    if (updatedCombatant.playerId) {
      const index = newBattleState.playerParty.findIndex(p => p.pokemonId === updatedCombatant.pokemonId);
      if (index >= 0) {
        newBattleState.playerParty[index] = updatedCombatant;
      }
    } else {
      const index = newBattleState.enemies.findIndex(e => e.pokemonId === updatedCombatant.pokemonId);
      if (index >= 0) {
        newBattleState.enemies[index] = updatedCombatant;
      }
    }
    
    // Update turn order
    const turnOrderIndex = newBattleState.turnOrder.findIndex(p => p.pokemonId === updatedCombatant.pokemonId);
    if (turnOrderIndex >= 0) {
      newBattleState.turnOrder[turnOrderIndex] = updatedCombatant;
    }
  }

  // Process action
  if (action.type === 'playCard') {
    newBattleState = processPlayCard(newBattleState, action);
  } else if (action.type === 'endTurn') {
    newBattleState = processEndTurn(newBattleState);
  }

  // Check battle end
  newBattleState.result = checkBattleEnd(newBattleState);

  return newBattleState;
}

function processPlayCard(
  battleState: BattleState,
  action: Action & { type: 'playCard' }
): BattleState {
  const currentCombatant = battleState.turnOrder[battleState.currentTurnIndex];
  if (!currentCombatant || currentCombatant.pokemonId !== action.casterId) {
    return battleState; // Invalid action
  }

  const card = getCardDefinition(action.cardId);
  if (!card) {
    return battleState; // Invalid card
  }

  // Check if can afford
  if (currentCombatant.currentMana < card.cost) {
    return battleState; // Can't afford
  }

  // Get targets
  const targets = getCardTargets(card, currentCombatant, battleState, action.targetIds);
  if (targets.length === 0 && card.effect.type !== 'block' && card.effect.target !== 'all') {
    return battleState; // No valid targets
  }

  // Resolve card effect
  let newBattleState = resolveCardEffect(card, currentCombatant, targets, battleState);

  // Update caster's mana and hand (use updated state from card effect resolution)
  const casterParty = currentCombatant.playerId ? newBattleState.playerParty : newBattleState.enemies;
  const casterIndex = casterParty.findIndex(p => p.pokemonId === action.casterId);
  if (casterIndex >= 0) {
    // Get the updated caster (block may have been updated by card effect)
    const updatedCaster = casterParty[casterIndex];
    const { hand, discard } = moveCardToDiscard(
      updatedCaster.hand,
      action.cardId,
      updatedCaster.discard
    );
    
    // Update only mana, hand, and discard - preserve block and other stats from card effect
    casterParty[casterIndex] = {
      ...updatedCaster,
      currentMana: updatedCaster.currentMana - card.cost,
      hand,
      discard,
    };
    
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/052177c7-b559-47bb-b50f-ee17a791e993',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'battle.ts:250',message:'Updated caster after card play',data:{casterId:action.casterId,block:casterParty[casterIndex].block,mana:casterParty[casterIndex].currentMana},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    // Update turn order with the updated caster
    const turnOrderIndex = newBattleState.turnOrder.findIndex(p => p.pokemonId === currentCombatant.pokemonId);
    if (turnOrderIndex >= 0) {
      newBattleState.turnOrder[turnOrderIndex] = casterParty[casterIndex];
    }
  }

  return newBattleState;
}

function processEndTurn(battleState: BattleState): BattleState {
  const currentCombatant = battleState.turnOrder[battleState.currentTurnIndex];
  if (!currentCombatant) {
    return advanceToNextTurn(battleState);
  }

  // Process end-of-turn status effects
  let newBattleState = { ...battleState };
  const casterParty = currentCombatant.playerId ? newBattleState.playerParty : newBattleState.enemies;
  const casterIndex = casterParty.findIndex(p => p.pokemonId === currentCombatant.pokemonId);
  
  if (casterIndex >= 0) {
    const updatedCaster = processEndOfTurnStatuses(casterParty[casterIndex]);
    casterParty[casterIndex] = updatedCaster;
    
    // Update turn order
    const turnOrderIndex = newBattleState.turnOrder.findIndex(p => p.pokemonId === currentCombatant.pokemonId);
    if (turnOrderIndex >= 0) {
      newBattleState.turnOrder[turnOrderIndex] = updatedCaster;
    }
  }

  // Mark as acted this round
  newBattleState.roundActed.add(currentCombatant.pokemonId);

  // Check battle end after status effects
  newBattleState.result = checkBattleEnd(newBattleState);
  if (newBattleState.result !== 'ongoing') {
    return newBattleState;
  }

  return advanceToNextTurn(newBattleState);
}

function advanceToNextTurn(battleState: BattleState): BattleState {
  let nextIndex = battleState.currentTurnIndex + 1;
  
  // Find next alive combatant that hasn't acted
  while (nextIndex < battleState.turnOrder.length) {
    const next = battleState.turnOrder[nextIndex];
    if (next.currentHp > 0 && !battleState.roundActed.has(next.pokemonId)) {
      return {
        ...battleState,
        currentTurnIndex: nextIndex,
      };
    }
    nextIndex++;
  }

  // If we've gone through everyone, start new round
  return startNewRound(battleState);
}
