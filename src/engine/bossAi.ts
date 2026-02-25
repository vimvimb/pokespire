import type { CombatState, Combatant, BattleAction } from './types';
import { getValidSwitchTargets, getAdjacentPositions } from './position';
import { getSwitchCost, getMaxSwitches } from './turns';

// ============================================================
// Boss AI — Per-boss decision logic that runs before normal AI
// ============================================================

type BossAiHandler = (
  state: CombatState,
  combatant: Combatant,
  cardsPlayedThisTurn: number,
) => BattleAction | null;

const BOSS_AI_REGISTRY: Record<string, BossAiHandler> = {
  celebi: celebiAi,
};

/**
 * Check boss AI registry for a custom action.
 * Returns null if no boss handler exists or the handler defers to normal AI.
 */
export function getBossAiAction(
  state: CombatState,
  combatant: Combatant,
  cardsPlayedThisTurn: number,
): BattleAction | null {
  const handler = BOSS_AI_REGISTRY[combatant.pokemonId];
  if (!handler) return null;
  return handler(state, combatant, cardsPlayedThisTurn);
}

// ============================================================
// Celebi AI — Rewind-focused switching
// ============================================================

/**
 * Celebi's boss AI decision tree:
 * 1. Only consider switching before any cards/switches this turn
 * 2. Must have rewind passive, enough energy, and switches remaining
 * 3. Priority 1: Switch with most-damaged adjacent ally (>20% HP lost)
 * 4. Priority 2: Reposition toward more allies if no damaged ally qualifies
 * 5. Otherwise: fall through to normal card scoring
 */
function celebiAi(
  state: CombatState,
  combatant: Combatant,
  cardsPlayedThisTurn: number,
): BattleAction | null {
  // Only switch before any cards or switches this turn
  if (cardsPlayedThisTurn > 0) return null;
  if (combatant.turnFlags.switchesThisTurn > 0) return null;

  // Must have rewind passive
  if (!combatant.passiveIds.includes('rewind')) return null;

  // Must be able to afford a switch and have switches remaining
  const switchCost = getSwitchCost(combatant);
  if (combatant.energy < switchCost) return null;
  if (combatant.turnFlags.switchesThisTurn >= getMaxSwitches(combatant)) return null;

  const validPositions = getValidSwitchTargets(state, combatant);
  if (validPositions.length === 0) return null;

  // --- Priority 1: Rewind switch with most-damaged adjacent ally ---
  const allies = state.combatants.filter(
    c => c.side === combatant.side && c.alive && c.id !== combatant.id,
  );

  let bestAlly: Combatant | null = null;
  let bestHpLost = 0;

  for (const ally of allies) {
    // Must be in an adjacent position (valid switch target)
    const isAdjacent = validPositions.some(
      p => p.row === ally.position.row && p.column === ally.position.column,
    );
    if (!isAdjacent) continue;

    // Compare current HP to start-of-round snapshot (or maxHp if no snapshot)
    const snapshotHp = state.roundStartSnapshots?.[ally.id]?.hp ?? ally.maxHp;
    const hpLost = snapshotHp - ally.hp;
    const lossPercent = hpLost / ally.maxHp;

    if (lossPercent > 0.2 && hpLost > bestHpLost) {
      bestHpLost = hpLost;
      bestAlly = ally;
    }
  }

  if (bestAlly) {
    return {
      type: 'switch_position',
      targetPosition: { ...bestAlly.position },
    };
  }

  // --- Priority 2: Reposition toward more allies ---
  const emptyPositions = validPositions.filter(pos => {
    return !state.combatants.some(
      c => c.side === combatant.side &&
           c.alive &&
           c.position.row === pos.row &&
           c.position.column === pos.column,
    );
  });

  if (emptyPositions.length > 0 && allies.length > 0) {
    // Count how many alive allies are adjacent to current position
    const currentAdjacentAllyCount = countAdjacentAllies(state, combatant, combatant.position);

    let bestPos = emptyPositions[0];
    let bestCount = -1;

    for (const pos of emptyPositions) {
      const count = countAdjacentAlliesAtPosition(state, combatant, pos);
      if (count > bestCount) {
        bestCount = count;
        bestPos = pos;
      }
    }

    // Only reposition if it gains adjacency
    if (bestCount > currentAdjacentAllyCount) {
      return {
        type: 'switch_position',
        targetPosition: bestPos,
      };
    }
  }

  // Fall through to normal AI
  return null;
}

/** Count alive allies adjacent to a combatant's current position. */
function countAdjacentAllies(
  state: CombatState,
  combatant: Combatant,
  position: { row: string; column: number },
): number {
  const adjacent = getAdjacentPositions(position as { row: 'front' | 'back'; column: 0 | 1 | 2 });
  let count = 0;
  for (const pos of adjacent) {
    const occupant = state.combatants.find(
      c => c.side === combatant.side &&
           c.alive &&
           c.id !== combatant.id &&
           c.position.row === pos.row &&
           c.position.column === pos.column,
    );
    if (occupant) count++;
  }
  return count;
}

/** Count alive allies that would be adjacent if combatant moved to a given position. */
function countAdjacentAlliesAtPosition(
  state: CombatState,
  combatant: Combatant,
  position: { row: string; column: number },
): number {
  return countAdjacentAllies(state, combatant, position);
}
