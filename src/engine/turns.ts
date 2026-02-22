import type { CombatState, BattleAction, LogEntry, Combatant, Position } from './types';
import {
  getCurrentCombatant, checkBattleEnd, removeDeadFromTurnOrder, advanceRound,
  getCombatant, nextEntryId,
} from './combat';
import { processStartOfTurnStatuses, processEndOfTurnStatuses, applyStatus } from './status';
import { drawCards, discardHand } from './deck';
import { playCard, resolvePrimedDetonation } from './cards';
import { getStatus } from './status';
import { onTurnStart, onTurnEnd } from './passives';
import { getMove } from '../data/loaders';
import { getValidSwitchTargets } from './position';
import { processItemOnSwitch, getItemMaxSwitches } from './itemEffects';

// ============================================================
// Turn Sequence — Section 4 of spec
// ============================================================

export interface TurnState {
  /** Whether the current combatant's turn has started (steps 1-4 done). */
  turnStarted: boolean;
  /** Whether the turn is waiting for player input. */
  waitingForInput: boolean;
}

/**
 * Start a combatant's turn: Steps 1-4.
 * Returns logs and whether the turn was skipped by sleep.
 */
export function startTurn(state: CombatState): { logs: LogEntry[]; skipped: boolean } {
  const logs: LogEntry[] = [];
  const combatant = getCurrentCombatant(state);

  // Primed Self-KO: detonation-only turn (no energy, no draw, no cards)
  if (combatant.primedSelfKo) {
    const detLogs = resolvePrimedDetonation(state, combatant);
    logs.push(...detLogs);
    removeDeadFromTurnOrder(state);
    checkBattleEnd(state);
    return { logs, skipped: true };
  }

  logs.push({
    round: state.round,
    combatantId: combatant.id,
    message: `--- ${combatant.name}'s turn ---`,
  });

  // Step 1: Start-of-turn status ticks
  const startLogs = processStartOfTurnStatuses(state, combatant);
  logs.push(...startLogs);

  // Check if combatant died from start-of-turn effects
  if (!combatant.alive) {
    removeDeadFromTurnOrder(state);
    checkBattleEnd(state);
    return { logs, skipped: true };
  }

  // Step 2: Gain energy
  const currentEntry = state.turnOrder[state.currentTurnIndex];
  const isBonusTurn = currentEntry?.bonusTurn === true;

  if (isBonusTurn) {
    // Bonus turn (Quick Claw): gain exactly 1 energy
    combatant.energy = Math.min(combatant.energy + 1, combatant.energyCap);
    logs.push({
      round: state.round,
      combatantId: combatant.id,
      message: `Quick Claw: ${combatant.name} gets a bonus turn with 1 energy! (Energy: ${combatant.energy})`,
    });
  } else {
    // Normal energy gain (Sleep reduces by 1, Fatigue reduces by stacks)
    const sleep = getStatus(combatant, 'sleep');
    const isSleeping = sleep && sleep.stacks > 0;
    const fatigue = getStatus(combatant, 'fatigue');
    const fatigueStacks = fatigue ? fatigue.stacks : 0;
    const energyGain = Math.max(0, combatant.energyPerTurn - (isSleeping ? 1 : 0) - fatigueStacks);
    combatant.energy = Math.min(combatant.energy + energyGain, combatant.energyCap);

    // Fatigue: all stacks clear at once at the start of your turn
    if (fatigueStacks > 0) {
      combatant.statuses = combatant.statuses.filter(s => s.type !== 'fatigue');
      logs.push({
        round: state.round,
        combatantId: combatant.id,
        message: `${combatant.name} is fatigued! Loses ${fatigueStacks} energy (Fatigue ${fatigueStacks}). Fatigue wears off. (Energy: ${combatant.energy})`,
      });
    }

    if (isSleeping) {
      logs.push({
        round: state.round,
        combatantId: combatant.id,
        message: `${combatant.name} is drowsy! Gains ${energyGain} energy (${combatant.energyPerTurn} - 1 Sleep). (Energy: ${combatant.energy})`,
      });
    } else if (fatigueStacks === 0) {
      logs.push({
        round: state.round,
        combatantId: combatant.id,
        message: `${combatant.name} gains ${energyGain} energy. (Energy: ${combatant.energy})`,
      });
    }
  }

  // Step 4: Hand is already pre-drawn from end of previous turn (or initializeBattle)

  // Step 4.5: Trigger passive abilities (after drawing)
  const passiveLogs = onTurnStart(state, combatant, getMove);
  logs.push(...passiveLogs);

  return { logs, skipped: false };
}

/**
 * Process a player/AI action during Step 5.
 */
export function processAction(
  state: CombatState,
  action: BattleAction,
): LogEntry[] {
  const logs: LogEntry[] = [];
  const combatant = getCurrentCombatant(state);

  if (action.type === 'play_card') {
    const cardLogs = playCard(state, combatant, action);
    logs.push(...cardLogs);

    // If the combatant just became primed, insert a deferred turn at end of turn order
    if (combatant.primedSelfKo) {
      state.turnOrder.push({
        entryId: nextEntryId(),
        combatantId: combatant.id,
        hasActed: false,
      });
    }

    // Remove dead from turn order
    removeDeadFromTurnOrder(state);
    checkBattleEnd(state);
  } else if (action.type === 'switch_position') {
    const switchLogs = executeSwitchPosition(state, combatant, action.targetPosition);
    logs.push(...switchLogs);
  }
  // end_turn is handled in endTurn()

  return logs;
}

const BASE_SWITCH_COST = 1;

/**
 * Get the maximum switches per turn for a combatant.
 * Class-assigned combatants use class-specific limit (default 1).
 * Regular combatants get 3.
 */
export function getMaxSwitches(combatant: Combatant): number {
  const itemLimit = getItemMaxSwitches(combatant);
  if (itemLimit !== null) return itemLimit;
  return 3;
}

/**
 * Get the effective switch cost for a combatant.
 * Base cost is 1 for all combatants.
 */
export function getSwitchCost(_combatant: Combatant): number {
  return BASE_SWITCH_COST;
}

/**
 * Execute a position switch for a combatant.
 * Costs energy (2 base, 1 with Download), once per turn.
 * Swaps with ally if target is occupied, applying swap passives.
 */
function executeSwitchPosition(
  state: CombatState,
  combatant: Combatant,
  targetPos: Position
): LogEntry[] {
  const logs: LogEntry[] = [];
  const switchCost = getSwitchCost(combatant);

  // Validate: enough energy
  if (combatant.energy < switchCost) {
    logs.push({
      round: state.round,
      combatantId: combatant.id,
      message: `${combatant.name} doesn't have enough energy to switch!`,
    });
    return logs;
  }

  // Validate: hasn't exceeded max switches this turn
  const maxSwitches = getMaxSwitches(combatant);
  if (combatant.turnFlags.switchesThisTurn >= maxSwitches) {
    logs.push({
      round: state.round,
      combatantId: combatant.id,
      message: `${combatant.name} has no switches remaining!`,
    });
    return logs;
  }

  // Validate: target is adjacent
  const validTargets = getValidSwitchTargets(state, combatant);
  const isValid = validTargets.some(
    p => p.row === targetPos.row && p.column === targetPos.column
  );
  if (!isValid) {
    logs.push({
      round: state.round,
      combatantId: combatant.id,
      message: `${combatant.name} can't switch to that position!`,
    });
    return logs;
  }

  // Deduct energy and set flag
  combatant.energy -= switchCost;
  combatant.turnFlags.switchesThisTurn++;

  // Check if target position is occupied by an alive ally
  const occupant = state.combatants.find(
    c => c.side === combatant.side &&
         c.alive &&
         c.position.row === targetPos.row &&
         c.position.column === targetPos.column
  );

  const oldPos = { ...combatant.position };

  if (occupant) {
    // Swap positions
    occupant.position = oldPos;
    combatant.position = targetPos;
    logs.push({
      round: state.round,
      combatantId: combatant.id,
      message: `${combatant.name} and ${occupant.name} swap positions! (Energy: ${combatant.energy})`,
    });

    // --- Swap passives (only trigger when swapping with an ally) ---

    // Download: Grant ally 5 Block
    if (combatant.passiveIds.includes('download')) {
      occupant.block += 5;
      logs.push({
        round: state.round,
        combatantId: combatant.id,
        message: `Download: ${occupant.name} gains 5 Block!`,
      });
    }

    // Data Transfer: Grant ally 2 Evasion and 2 Strength
    if (combatant.passiveIds.includes('data_transfer')) {
      applyStatus(state, occupant, 'evasion', 2, combatant.id);
      applyStatus(state, occupant, 'strength', 2, combatant.id);
      logs.push({
        round: state.round,
        combatantId: combatant.id,
        message: `Data Transfer: ${occupant.name} gains 2 Evasion and 2 Strength!`,
      });
    }

    // Overclock: Each swap reduces highest-cost card's cost by 1 more this turn
    if (combatant.passiveIds.includes('overclock')) {
      combatant.turnFlags.overclockReduction += 1;
      // Find highest-cost card for the log message
      let highestCost = -1;
      let highestName = '';
      for (let i = 0; i < combatant.hand.length; i++) {
        const card = getMove(combatant.hand[i]);
        if (card.cost > highestCost) {
          highestCost = card.cost;
          highestName = card.name;
        }
      }
      if (highestName) {
        const totalReduction = combatant.turnFlags.overclockReduction;
        logs.push({
          round: state.round,
          combatantId: combatant.id,
          message: `Overclock: ${highestName} costs ${totalReduction} less this turn!`,
        });
      }
    }

    // Upload: Grant ally 1 energy
    if (combatant.passiveIds.includes('upload')) {
      const energyGained = Math.min(1, occupant.energyCap - occupant.energy);
      if (energyGained > 0) {
        occupant.energy += energyGained;
        logs.push({
          round: state.round,
          combatantId: combatant.id,
          message: `Upload: ${occupant.name} gains 1 energy!`,
        });
      }
    }

  } else {
    // Move to empty cell
    combatant.position = targetPos;
    logs.push({
      round: state.round,
      combatantId: combatant.id,
      message: `${combatant.name} moves to ${targetPos.row} row! (Energy: ${combatant.energy})`,
    });
  }

  // --- Item effects that trigger on any switch (swap or move to empty) ---
  logs.push(...processItemOnSwitch(state, combatant, oldPos));

  return logs;
}

/**
 * End the current combatant's turn: Steps 6-7 + advance.
 */
export function endTurn(state: CombatState): LogEntry[] {
  const logs: LogEntry[] = [];
  const combatant = getCurrentCombatant(state);

  // Step 6: Discard remaining hand
  if (combatant.hand.length > 0) {
    discardHand(combatant);
  }

  // Step 6.5: Pre-draw next hand (so enemy hands are visible during player turn)
  if (combatant.alive) {
    drawCards(combatant);
  }

  // Step 7: End-of-turn status ticks
  const endLogs = processEndOfTurnStatuses(combatant, state.round);
  logs.push(...endLogs);

  // Step 7.5: Trigger end-of-turn passive abilities
  const passiveEndLogs = onTurnEnd(state, combatant);
  logs.push(...passiveEndLogs);

  // Check death from end-of-turn effects
  removeDeadFromTurnOrder(state);
  checkBattleEnd(state);

  if (state.phase !== 'ongoing') return logs;

  // Mark as acted and advance
  const advLogs = advanceToNextTurn(state);
  logs.push(...advLogs);

  return logs;
}

/**
 * Skip turn (for sleep) and advance.
 */
export function skipTurnAndAdvance(state: CombatState): LogEntry[] {
  // No end-of-turn status ticks when sleep-skipped (sleep skips steps 3-7)
  // But wait — spec says sleep skips "steps 3 through 7", which includes step 7.
  // So NO end-of-turn status ticks.

  if (state.phase !== 'ongoing') return [];

  return advanceToNextTurn(state);
}

/**
 * Mark current combatant as acted, advance to next.
 * If everyone has acted, start a new round.
 */
function advanceToNextTurn(state: CombatState): LogEntry[] {
  const logs: LogEntry[] = [];

  // Guard: if the current entry was already acted (duplicate endTurn call), bail out.
  // This prevents state corruption from race conditions in the UI layer.
  if (state.turnOrder[state.currentTurnIndex]?.hasActed) {
    return logs;
  }

  // Mark current as acted
  state.turnOrder[state.currentTurnIndex].hasActed = true;

  // Check if all have acted
  const allActed = state.turnOrder.every(e => e.hasActed);

  if (allActed) {
    // Round boundary
    const roundLogs = advanceRound(state);
    logs.push(...roundLogs);
  } else {
    // Find the next un-acted combatant anywhere in the queue.
    // After mid-round speed rebuilds, un-acted combatants may be at
    // earlier indices than the current position, so we can't just scan forward.
    const nextUnacted = state.turnOrder.findIndex(e => !e.hasActed);
    if (nextUnacted >= 0) {
      state.currentTurnIndex = nextUnacted;
    }
  }

  return logs;
}

/**
 * Slipstream: Move all allies to act immediately after the current combatant.
 * Triggered when using Gust with the Slipstream passive.
 * Protected allies cannot be pushed behind enemies by speed changes for the rest of the round.
 */
export function applySlipstream(state: CombatState, combatant: Combatant): LogEntry[] {
  const logs: LogEntry[] = [];
  const currentIdx = state.currentTurnIndex;

  // Find allies that haven't acted yet (excluding current combatant)
  const allyIndices: number[] = [];
  for (let i = currentIdx + 1; i < state.turnOrder.length; i++) {
    const entry = state.turnOrder[i];
    if (entry.hasActed) continue;
    const c = getCombatant(state, entry.combatantId);
    if (c.side === combatant.side && c.id !== combatant.id && c.alive) {
      allyIndices.push(i);
    }
  }

  if (allyIndices.length === 0) return logs;

  // Extract ally entries (in reverse order to maintain relative order when removing)
  const allyEntries = allyIndices.map(i => state.turnOrder[i]);

  // Remove allies from their current positions (in reverse order)
  for (let i = allyIndices.length - 1; i >= 0; i--) {
    state.turnOrder.splice(allyIndices[i], 1);
  }

  // Insert allies right after current combatant
  state.turnOrder.splice(currentIdx + 1, 0, ...allyEntries);

  // Mark these allies as Slipstream-protected for the rest of the round
  // They won't be pushed behind enemies when speed changes
  const allyIds = allyEntries.map(e => e.combatantId);
  state.slipstreamProtectedIds = [...state.slipstreamProtectedIds, ...allyIds];

  const allyNames = allyEntries.map(e => getCombatant(state, e.combatantId).name);
  logs.push({
    round: state.round,
    combatantId: combatant.id,
    message: `${combatant.name}'s gust stirs up a slipstream! ${allyNames.join(', ')} will act next!`,
  });

  return logs;
}
