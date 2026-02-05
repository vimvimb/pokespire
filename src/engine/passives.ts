/**
 * Passive Ability System
 *
 * Passives are triggered at specific hook points in the battle engine:
 * - onTurnStart: After drawing hand at the start of a turn
 * - onDamageDealt: After damage is dealt (after block)
 * - onStatusApplied: When a status is applied to a target
 * - onTurnEnd: At the end of a turn (to reset per-turn flags)
 */

import type { CombatState, Combatant, LogEntry, MoveDefinition } from './types';
import { applyStatus, getEffectiveSpeed } from './status';

// ============================================================
// Helper Functions
// ============================================================

/**
 * Get adjacent enemies in the same row as the target.
 * Adjacent means columns that differ by 1.
 */
export function getAdjacentEnemies(
  state: CombatState,
  target: Combatant
): Combatant[] {
  const enemies = state.combatants.filter(
    c => c.side === target.side && c.alive && c.id !== target.id && c.position.row === target.position.row
  );

  // Adjacent means column differs by exactly 1
  return enemies.filter(e => Math.abs(e.position.column - target.position.column) === 1);
}

/**
 * Find the highest-cost FIRE card in a combatant's hand.
 * Tie-breaker: first in hand order (lowest index).
 */
export function findHighestCostFireCard(
  combatant: Combatant,
  getMove: (id: string) => MoveDefinition
): { cardId: string; index: number; cost: number } | null {
  let highestIdx = -1;
  let highestCost = -1;

  for (let i = 0; i < combatant.hand.length; i++) {
    const move = getMove(combatant.hand[i]);
    // Only consider fire-type cards
    if (move.type !== 'fire') continue;

    if (move.cost > highestCost) {
      highestCost = move.cost;
      highestIdx = i;
    }
  }

  if (highestIdx === -1) return null;

  return {
    cardId: combatant.hand[highestIdx],
    index: highestIdx,
    cost: highestCost,
  };
}

// ============================================================
// Passive Hooks
// ============================================================

/**
 * Called at the START of a combatant's turn, AFTER drawing hand.
 * Used for: Inferno Momentum
 */
export function onTurnStart(
  state: CombatState,
  combatant: Combatant,
  getMove: (id: string) => MoveDefinition
): LogEntry[] {
  const logs: LogEntry[] = [];

  // Reset per-turn flags
  combatant.turnFlags.blazeStrikeUsedThisTurn = false;
  combatant.turnFlags.infernoMomentumReducedIndex = null;

  // Inferno Momentum: Reduce highest-cost FIRE card's cost by 3
  if (combatant.passiveIds.includes('inferno_momentum')) {
    const highest = findHighestCostFireCard(combatant, getMove);
    if (highest && highest.cost > 0) {
      combatant.turnFlags.infernoMomentumReducedIndex = highest.index;
      const move = getMove(highest.cardId);
      const newCost = Math.max(0, highest.cost - 3);
      logs.push({
        round: state.round,
        combatantId: combatant.id,
        message: `Inferno Momentum: ${move.name} cost reduced to ${newCost}!`,
      });
    }
  }

  // Baby Shell: Gain 3 Block at turn start
  if (combatant.passiveIds.includes('baby_shell')) {
    combatant.block += 3;
    logs.push({
      round: state.round,
      combatantId: combatant.id,
      message: `Baby Shell: Gained 3 Block!`,
    });
  }

  return logs;
}

/**
 * Check if Blaze Strike should trigger for this attack.
 * Used for: Blaze Strike (first Fire attack deals double damage)
 * Returns whether the multiplier should apply, and marks it as used.
 */
export function checkBlazeStrike(
  state: CombatState,
  attacker: Combatant,
  card: MoveDefinition
): { shouldApply: boolean; logs: LogEntry[] } {
  const logs: LogEntry[] = [];

  // Blaze Strike: First Fire attack each turn deals double damage
  if (attacker.passiveIds.includes('blaze_strike') && card.type === 'fire' && !attacker.turnFlags.blazeStrikeUsedThisTurn) {
    attacker.turnFlags.blazeStrikeUsedThisTurn = true;
    logs.push({
      round: state.round,
      combatantId: attacker.id,
      message: `Blaze Strike: ${card.name} deals double damage!`,
    });
    return { shouldApply: true, logs };
  }

  return { shouldApply: false, logs };
}

/**
 * Called AFTER damage is dealt (after block reduction).
 * Used for: Kindling (add +1 Burn if unblocked Fire attack)
 */
export function onDamageDealt(
  state: CombatState,
  attacker: Combatant,
  target: Combatant,
  card: MoveDefinition,
  damageDealt: number // Damage that actually got through (after block)
): LogEntry[] {
  const logs: LogEntry[] = [];

  // Kindling: Unblocked Fire attacks apply +1 Burn
  if (attacker.passiveIds.includes('kindling') && card.type === 'fire' && damageDealt > 0) {
    applyStatus(state, target, 'burn', 1, attacker.id);
    logs.push({
      round: state.round,
      combatantId: attacker.id,
      message: `Kindling: +1 Burn applied to ${target.name}!`,
    });

    // Trigger Spreading Flames if attacker has it (even if target died)
    const spreadLogs = onStatusApplied(state, attacker, target, 'burn', 1);
    logs.push(...spreadLogs);
  }

  // Fortified Cannons: Gain Block equal to half damage dealt on Water attacks
  if (attacker.passiveIds.includes('fortified_cannons') && card.type === 'water' && damageDealt > 0) {
    const blockGain = Math.floor(damageDealt / 2);
    if (blockGain > 0) {
      attacker.block += blockGain;
      logs.push({
        round: state.round,
        combatantId: attacker.id,
        message: `Fortified Cannons: Gained ${blockGain} Block!`,
      });
    }
  }

  // Baby Vines: Unblocked Grass attacks apply Leech (+2 with Overgrow)
  if (attacker.passiveIds.includes('baby_vines') && card.type === 'grass' && damageDealt > 0) {
    const leechAmount = attacker.passiveIds.includes('overgrow') ? 2 : 1;
    applyStatus(state, target, 'leech', leechAmount, attacker.id);
    logs.push({
      round: state.round,
      combatantId: attacker.id,
      message: `Baby Vines: +${leechAmount} Leech applied to ${target.name}!`,
    });

    // Trigger Spreading Spores
    const spreadLogs = onStatusApplied(state, attacker, target, 'leech', leechAmount);
    logs.push(...spreadLogs);
  }

  // Numbing Strike: Unblocked Electric attacks apply +1 Paralysis
  if (attacker.passiveIds.includes('numbing_strike') && card.type === 'electric' && damageDealt > 0) {
    applyStatus(state, target, 'paralysis', 1, attacker.id);
    logs.push({
      round: state.round,
      combatantId: attacker.id,
      message: `Numbing Strike: +1 Paralysis applied to ${target.name}!`,
    });
  }

  return logs;
}

/**
 * Called when a status is applied.
 * Used for: Spreading Flames (spread Burn to adjacent enemies)
 */
export function onStatusApplied(
  state: CombatState,
  source: Combatant,
  target: Combatant,
  statusType: string,
  _stacks: number
): LogEntry[] {
  const logs: LogEntry[] = [];

  // Spreading Flames: When applying Burn, also apply 1 Burn to adjacent enemies
  if (source.passiveIds.includes('spreading_flames') && statusType === 'burn') {
    const adjacent = getAdjacentEnemies(state, target);
    for (const adj of adjacent) {
      // Apply 1 Burn to each adjacent enemy
      // Note: This should NOT trigger Spreading Flames recursively
      // We handle this by only checking the source's passive, not re-checking
      applyStatusDirect(state, adj, 'burn', 1, source.id);
      logs.push({
        round: state.round,
        combatantId: source.id,
        message: `Spreading Flames: 1 Burn spreads to ${adj.name}!`,
      });
    }
  }

  // Spreading Spores: Apply 1 Leech to adjacent enemies
  if (source.passiveIds.includes('spreading_spores') && statusType === 'leech') {
    const adjacent = getAdjacentEnemies(state, target);
    for (const adj of adjacent) {
      applyStatusDirect(state, adj, 'leech', 1, source.id);
      logs.push({
        round: state.round,
        combatantId: source.id,
        message: `Spreading Spores: 1 Leech spreads to ${adj.name}!`,
      });
    }
  }

  return logs;
}

/**
 * Direct status application without triggering passive hooks.
 * Used internally to prevent infinite recursion.
 */
function applyStatusDirect(
  state: CombatState,
  target: Combatant,
  statusType: string,
  stacks: number,
  sourceId: string
): void {
  // Use the regular applyStatus but mark it as non-recursive
  applyStatus(state, target, statusType as any, stacks, sourceId);
}

/**
 * Called at the END of a combatant's turn.
 */
export function onTurnEnd(
  _state: CombatState,
  _combatant: Combatant
): LogEntry[] {
  // Currently no passives trigger at turn end
  // Pressure Hull is handled at round boundary in processRoundBoundary
  return [];
}

/**
 * Check if a card effect is an attack (has damage effect).
 */
export function isAttackCard(card: MoveDefinition): boolean {
  return card.effects.some(e => e.type === 'damage');
}

/**
 * Check if Bastion Barrage should provide bonus damage.
 * Bastion Barrage: Water attacks deal +25% of current Block as bonus damage.
 */
export function checkBastionBarrage(
  state: CombatState,
  attacker: Combatant,
  card: MoveDefinition
): { bonusDamage: number; logs: LogEntry[] } {
  const logs: LogEntry[] = [];

  if (attacker.passiveIds.includes('bastion_barrage') && card.type === 'water' && attacker.block > 0) {
    const bonus = Math.floor(attacker.block * 0.25);
    if (bonus > 0) {
      logs.push({
        round: state.round,
        combatantId: attacker.id,
        message: `Bastion Barrage: +${bonus} bonus damage from Block!`,
      });
      return { bonusDamage: bonus, logs };
    }
  }

  return { bonusDamage: 0, logs };
}

/**
 * Check if Counter-Current should provide bonus damage.
 * Counter-Current: Deal bonus damage to slower enemies (floor((yourSpeed - theirSpeed) / 2)).
 */
export function checkCounterCurrent(
  state: CombatState,
  attacker: Combatant,
  target: Combatant
): { bonusDamage: number; logs: LogEntry[] } {
  const logs: LogEntry[] = [];

  if (!attacker.passiveIds.includes('counter_current')) {
    return { bonusDamage: 0, logs };
  }

  const attackerSpeed = getEffectiveSpeed(attacker);
  const targetSpeed = getEffectiveSpeed(target);

  if (attackerSpeed <= targetSpeed) {
    return { bonusDamage: 0, logs };
  }

  const bonus = Math.floor((attackerSpeed - targetSpeed) / 2);
  if (bonus > 0) {
    logs.push({
      round: state.round,
      combatantId: attacker.id,
      message: `Counter-Current: +${bonus} bonus damage (speed ${attackerSpeed} vs ${targetSpeed})!`,
    });
  }

  return { bonusDamage: bonus, logs };
}

/**
 * Check if Static Field should reduce incoming damage.
 * Static Field: Take reduced damage from slower enemies (floor((yourSpeed - theirSpeed) / 2)).
 */
export function checkStaticField(
  state: CombatState,
  attacker: Combatant,
  target: Combatant
): { reduction: number; logs: LogEntry[] } {
  const logs: LogEntry[] = [];

  if (!target.passiveIds.includes('static_field')) {
    return { reduction: 0, logs };
  }

  const attackerSpeed = getEffectiveSpeed(attacker);
  const targetSpeed = getEffectiveSpeed(target);

  if (targetSpeed <= attackerSpeed) {
    return { reduction: 0, logs };
  }

  const reduction = Math.floor((targetSpeed - attackerSpeed) / 2);
  if (reduction > 0) {
    logs.push({
      round: state.round,
      combatantId: target.id,
      message: `Static Field: -${reduction} damage (speed ${targetSpeed} vs ${attackerSpeed})!`,
    });
  }

  return { reduction, logs };
}
