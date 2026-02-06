import type { PokemonData, Position, Combatant } from '../engine/types';
import type { RunState, RunPokemon, MapNode, BattleNode } from './types';
import { getPokemon } from '../data/loaders';
import { ACT1_NODES, getNodeById } from './nodes';
import {
  getProgressionTree,
  getRungForLevel,
  canLevelUp,
  type ProgressionRung,
} from './progression';

// ============================================================
// EXP Constants
// ============================================================

/** EXP required per level up */
export const EXP_PER_LEVEL = 2;

// ============================================================
// Run State Management
// ============================================================

/**
 * Create initial run state from party selection.
 * Starts at the spawn node with 1 EXP (from entering the run).
 */
export function createRunState(
  party: PokemonData[],
  positions: Position[],
  seed?: number
): RunState {
  const runParty: RunPokemon[] = party.map((pokemon, i) => {
    // Get the initial passive from the progression tree (level 1 rung)
    const tree = getProgressionTree(pokemon.id);
    const initialRung = tree ? getRungForLevel(tree, 1) : null;
    const initialPassives = initialRung?.passiveId && initialRung.passiveId !== 'none'
      ? [initialRung.passiveId]
      : [];

    return {
      baseFormId: pokemon.id,
      formId: pokemon.id,
      currentHp: pokemon.maxHp,
      maxHp: pokemon.maxHp,
      maxHpModifier: 0,
      deck: [...pokemon.deck],
      position: positions[i],
      level: 1,
      exp: 1, // Start with 1 EXP (from spawn node)
      passiveIds: initialPassives,
    };
  });

  // Deep copy nodes to avoid mutating the original
  const nodes = ACT1_NODES.map(node => ({ ...node }));

  // Mark spawn as completed
  const spawnNode = nodes.find(n => n.type === 'spawn');
  if (spawnNode) {
    spawnNode.completed = true;
  }

  return {
    seed: seed ?? Date.now(),
    party: runParty,
    currentNodeId: 's0-spawn', // Start at spawn
    visitedNodeIds: ['s0-spawn'],
    nodes,
  };
}

/**
 * Get current node from run state.
 */
export function getCurrentNode(run: RunState): MapNode | null {
  return getNodeById(run.nodes, run.currentNodeId) ?? null;
}

/**
 * Get nodes that can be moved to from the current position.
 * Returns nodes connected to the current node that haven't been visited.
 */
export function getAvailableNextNodes(run: RunState): MapNode[] {
  const currentNode = getCurrentNode(run);
  if (!currentNode) return [];

  return currentNode.connectsTo
    .map(id => getNodeById(run.nodes, id))
    .filter((n): n is MapNode => n !== undefined);
}

/**
 * Move to a specific node (player choice in branching).
 * Marks the node as completed and grants EXP.
 */
export function moveToNode(run: RunState, nodeId: string): RunState {
  const targetNode = getNodeById(run.nodes, nodeId);
  if (!targetNode) return run;

  // Verify this is a valid move (connected to current node)
  const currentNode = getCurrentNode(run);
  if (!currentNode || !currentNode.connectsTo.includes(nodeId)) {
    return run;
  }

  // Update nodes to mark target as completed
  const newNodes = run.nodes.map(node => {
    if (node.id !== nodeId) return node;
    return { ...node, completed: true };
  });

  // Grant EXP for visiting the node
  const newParty = run.party.map(pokemon => ({
    ...pokemon,
    exp: pokemon.exp + 1,
  }));

  return {
    ...run,
    currentNodeId: nodeId,
    visitedNodeIds: [...run.visitedNodeIds, nodeId],
    nodes: newNodes,
    party: newParty,
  };
}

/**
 * Check if the run is complete (boss defeated).
 */
export function isRunComplete(run: RunState): boolean {
  const bossNode = run.nodes.find(n => n.type === 'battle' && n.stage === 8);
  return bossNode?.completed ?? false;
}

/**
 * Get the current stage (column) in the map.
 */
export function getCurrentStage(run: RunState): number {
  const currentNode = getCurrentNode(run);
  return currentNode?.stage ?? 0;
}

// ============================================================
// Pokemon State Modifications
// ============================================================

/**
 * Apply percentage heal to a specific Pokemon.
 * Used by rest events for the "heal 30%" option.
 */
export function applyPercentHeal(
  run: RunState,
  pokemonIndex: number,
  percent: number
): RunState {
  const newParty = run.party.map((pokemon, i) => {
    if (i !== pokemonIndex) return pokemon;
    const healAmount = Math.floor(pokemon.maxHp * percent);
    const newCurrentHp = Math.min(pokemon.currentHp + healAmount, pokemon.maxHp);
    return {
      ...pokemon,
      currentHp: newCurrentHp,
    };
  });

  return { ...run, party: newParty };
}

/**
 * Apply max HP boost to a specific Pokemon.
 * Used by rest events for the "+10 max HP" option.
 * Also heals by the same amount.
 */
export function applyMaxHpBoost(
  run: RunState,
  pokemonIndex: number,
  boost: number
): RunState {
  const newParty = run.party.map((pokemon, i) => {
    if (i !== pokemonIndex) return pokemon;
    const newMaxHpModifier = pokemon.maxHpModifier + boost;
    const newMaxHp = pokemon.maxHp + boost;
    const newCurrentHp = Math.min(pokemon.currentHp + boost, newMaxHp);
    return {
      ...pokemon,
      maxHp: newMaxHp,
      maxHpModifier: newMaxHpModifier,
      currentHp: newCurrentHp,
    };
  });

  return { ...run, party: newParty };
}

/**
 * Grant EXP to a specific Pokemon.
 * Used by rest events for the "meditate" option.
 */
export function applyExpBoost(
  run: RunState,
  pokemonIndex: number,
  amount: number
): RunState {
  const newParty = run.party.map((pokemon, i) => {
    if (i !== pokemonIndex) return pokemon;
    return {
      ...pokemon,
      exp: pokemon.exp + amount,
    };
  });

  return { ...run, party: newParty };
}

/**
 * Add a card to a Pokemon's deck.
 */
export function addCardToDeck(
  run: RunState,
  pokemonIndex: number,
  cardId: string
): RunState {
  const newParty = run.party.map((pokemon, i) => {
    if (i !== pokemonIndex) return pokemon;
    return {
      ...pokemon,
      deck: [...pokemon.deck, cardId],
    };
  });

  return { ...run, party: newParty };
}

/**
 * Sync battle results back to run state.
 * Copies HP from combat combatants back to RunPokemon.
 */
export function syncBattleResults(
  run: RunState,
  combatants: Combatant[]
): RunState {
  const playerCombatants = combatants.filter(c => c.side === 'player');

  const newParty = run.party.map((pokemon, i) => {
    const combatant = playerCombatants.find(c => c.slotIndex === i);
    if (!combatant) return pokemon;
    return {
      ...pokemon,
      currentHp: Math.max(0, combatant.hp),
    };
  });

  return { ...run, party: newParty };
}

// ============================================================
// Battle Helpers
// ============================================================

/**
 * Convert RunPokemon back to PokemonData for battle initialization.
 * Uses the current formId for base stats, plus run modifications.
 */
export function getRunPokemonData(runPokemon: RunPokemon): PokemonData {
  const formPokemon = getPokemon(runPokemon.formId);
  return {
    ...formPokemon,
    id: runPokemon.formId,
    maxHp: runPokemon.maxHp,
    deck: [...runPokemon.deck],
  };
}

/**
 * Get positions array from run party.
 */
export function getRunPositions(run: RunState): Position[] {
  return run.party.map(p => p.position);
}

/**
 * Get the current node as a BattleNode (type guard).
 */
export function getCurrentBattleNode(run: RunState): BattleNode | null {
  const node = getCurrentNode(run);
  if (node?.type === 'battle') return node;
  return null;
}

// ============================================================
// Experience & Leveling Functions
// ============================================================

/**
 * Check if a Pokemon can level up.
 * Requires EXP_PER_LEVEL (2) EXP and not at max level.
 */
export function canPokemonLevelUp(pokemon: RunPokemon): boolean {
  return canLevelUp(pokemon.level, pokemon.exp);
}

/**
 * Get the next rung a Pokemon will unlock if they level up.
 */
export function getNextRung(pokemon: RunPokemon): ProgressionRung | null {
  const tree = getProgressionTree(pokemon.baseFormId);
  if (!tree) return null;
  return getRungForLevel(tree, pokemon.level + 1);
}

/**
 * Apply a level-up to a Pokemon.
 * - Consumes EXP_PER_LEVEL (2) EXP
 * - Increments level
 * - Applies rung effects (evolution, HP boost, cards, passive)
 */
export function applyLevelUp(run: RunState, pokemonIndex: number): RunState {
  const pokemon = run.party[pokemonIndex];
  if (!pokemon) return run;

  // Check eligibility
  if (!canPokemonLevelUp(pokemon)) return run;

  const tree = getProgressionTree(pokemon.baseFormId);
  if (!tree) return run;

  const nextRung = getRungForLevel(tree, pokemon.level + 1);
  if (!nextRung) return run;

  // Calculate new form and stats
  const newFormId = nextRung.evolvesTo ?? pokemon.formId;
  const newFormData = getPokemon(newFormId);

  // Calculate HP:
  // newMaxHp = newForm.baseMaxHp + existing modifiers + rung's HP boost
  const newMaxHpModifier = pokemon.maxHpModifier + nextRung.hpBoost;
  const newMaxHp = newFormData.maxHp + newMaxHpModifier;

  // Preserve damage taken: damageTaken = oldMaxHp - currentHp
  const damageTaken = pokemon.maxHp - pokemon.currentHp;
  const newCurrentHp = Math.max(0, newMaxHp - damageTaken);

  // Add new cards to deck
  const newDeck = [...pokemon.deck, ...nextRung.cardsToAdd];

  // Add new passive to the list (if it's not 'none' and not already present)
  const newPassiveIds = [...pokemon.passiveIds];
  if (nextRung.passiveId !== 'none' && !newPassiveIds.includes(nextRung.passiveId)) {
    newPassiveIds.push(nextRung.passiveId);
  }

  // Build updated Pokemon
  const updatedPokemon: RunPokemon = {
    ...pokemon,
    formId: newFormId,
    level: pokemon.level + 1,
    exp: pokemon.exp - EXP_PER_LEVEL,
    maxHp: newMaxHp,
    maxHpModifier: newMaxHpModifier,
    currentHp: newCurrentHp,
    deck: newDeck,
    passiveIds: newPassiveIds,
  };

  // Update party
  const newParty = run.party.map((p, i) =>
    i === pokemonIndex ? updatedPokemon : p
  );

  return { ...run, party: newParty };
}

/**
 * Check if any party member has a level-up available.
 */
export function anyPokemonCanLevelUp(run: RunState): boolean {
  return run.party.some(p => canPokemonLevelUp(p));
}

// ============================================================
// Legacy compatibility (deprecated)
// ============================================================

/** @deprecated Use applyMaxHpBoost instead */
export function applyHpBoost(
  run: RunState,
  pokemonIndex: number,
  boost: number
): RunState {
  return applyMaxHpBoost(run, pokemonIndex, boost);
}

/** @deprecated No longer used with branching maps */
export function advanceNode(run: RunState): RunState {
  // For backwards compatibility, just return the run as-is
  return run;
}

/** @deprecated No longer used with branching maps */
export function grantExpToParty(run: RunState): RunState {
  // EXP is now granted in moveToNode
  return run;
}
