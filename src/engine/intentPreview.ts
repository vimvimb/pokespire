import type { CombatState, Combatant, MoveType, MoveRange } from './types';
import { getCombatant } from './combat';
import { startTurn, processAction, endTurn } from './turns';
import { chooseEnemyAction } from './ai';
import { getMove } from '../data/loaders';
import { isAoERange } from './position';
import { resolveTargets } from './cards';
import { calculateDamagePreview } from './preview';

export interface IntentDamagePreview {
  totalDamage: number;
  typeEffectiveness: number;
  effectivenessLabel: string | null;
  blockedAmount: number;
  isMultiHit: boolean;
  hits: number;
  finalDamage: number;  // per-hit damage
}

export interface EnemyIntent {
  sequenceNumber: number;
  sourceId: string;
  cardId: string;
  cardName: string;
  moveType: MoveType;
  range: MoveRange;
  isSelfTarget: boolean;
  isAoE: boolean;
  targetIds: string[];
  wouldKO: Record<string, boolean>;
  damageByTarget: Record<string, IntentDamagePreview>;
  cardCost: number;
}

const MAX_ACTIONS_PER_ENEMY = 20;

/**
 * Simulate all remaining enemy turns in the current round and return
 * a map of enemy combatant ID → ordered list of intents.
 *
 * This deep-clones the combat state and runs the full AI loop on the clone,
 * so it has zero side effects on the real game state.
 */
export function simulateEnemyIntents(
  state: CombatState,
): Map<string, EnemyIntent[]> {
  const result = new Map<string, EnemyIntent[]>();

  // Deep clone the state — structuredClone handles nested objects and Sets
  let clone: CombatState;
  try {
    clone = structuredClone(state);
  } catch {
    return result;
  }

  let sequenceNumber = 1;

  // Snapshot the combatant IDs to simulate BEFORE we start modifying the clone.
  // We can't iterate by index because processAction → removeDeadFromTurnOrder
  // may remove entries and shift indices, causing us to skip combatants.
  const startIndex = clone.currentTurnIndex + 1;
  const idsToSimulate = clone.turnOrder
    .slice(startIndex)
    .filter(e => !e.hasActed)
    .map(e => e.combatantId);

  for (const id of idsToSimulate) {
    // Find current index in the (possibly modified) turn order.
    // Prefer unacted entries to handle deferred turns (primed self-KO)
    // where the same combatant ID appears twice.
    const entryIndex = clone.turnOrder.findIndex(e => e.combatantId === id && !e.hasActed);
    if (entryIndex < 0) continue; // removed (died before their turn)

    const entry = clone.turnOrder[entryIndex];
    if (entry.hasActed) continue;
    if (clone.phase !== 'ongoing') break;

    let combatant: Combatant;
    try {
      combatant = getCombatant(clone, id);
    } catch {
      continue;
    }

    if (!combatant.alive) continue;

    // Set up clone so this combatant is the "current" one
    clone.currentTurnIndex = entryIndex;

    // Primed Self-KO: generate detonation intent BEFORE startTurn resolves it
    if (combatant.primedSelfKo && combatant.side === 'enemy') {
      const primedCard = getMove(combatant.primedSelfKo.cardId);
      const aliveEnemies = clone.combatants.filter(c => c.alive && c.side !== combatant.side);
      const targetIds = aliveEnemies.map(t => t.id);

      // Compute damage previews against each target
      const damageByTarget: Record<string, IntentDamagePreview> = {};
      for (const target of aliveEnemies) {
        try {
          const preview = calculateDamagePreview(clone, combatant, target, primedCard);
          if (preview) {
            damageByTarget[target.id] = {
              totalDamage: preview.totalDamage,
              typeEffectiveness: preview.typeEffectiveness,
              effectivenessLabel: preview.effectivenessLabel,
              blockedAmount: preview.blockedAmount,
              isMultiHit: preview.isMultiHit,
              hits: preview.hits,
              finalDamage: preview.finalDamage,
            };
          }
        } catch {
          // skip
        }
      }

      // Check which targets would be KO'd
      const wouldKO: Record<string, boolean> = {};
      for (const target of aliveEnemies) {
        const dmg = damageByTarget[target.id];
        wouldKO[target.id] = dmg ? dmg.totalDamage >= target.hp : false;
      }

      const intents: EnemyIntent[] = [{
        sequenceNumber: sequenceNumber++,
        sourceId: combatant.id,
        cardId: primedCard.id,
        cardName: primedCard.name,
        moveType: primedCard.type,
        range: primedCard.range,
        isSelfTarget: false,
        isAoE: true,
        targetIds,
        wouldKO,
        damageByTarget,
        cardCost: 0,
      }];
      result.set(combatant.id, intents);
    }

    // Start the turn (energy gain, status ticks, passives)
    try {
      const { skipped } = startTurn(clone);
      if (skipped) {
        // Turn was skipped (e.g., fainted from status damage, or primed detonation)
        continue;
      }
    } catch {
      continue;
    }

    if (combatant.side === 'enemy') {
      // Simulate the enemy AI loop — record each action as an intent
      const intents: EnemyIntent[] = [];
      let actionsPlayed = 0;

      while (actionsPlayed < MAX_ACTIONS_PER_ENEMY && clone.phase === 'ongoing') {
        const action = chooseEnemyAction(clone, actionsPlayed);
        if (action.type === 'end_turn') break;
        if (action.type !== 'play_card') break;

        // Look up card definition
        let card;
        try {
          card = getMove(action.cardInstanceId);
        } catch {
          break;
        }

        const isSelfTarget = card.range === 'self' || card.range === 'any_ally';
        const isAoE = isAoERange(card.range);

        // Determine target IDs using the same resolveTargets as the real engine
        let targetIds: string[] = [];
        if (isSelfTarget) {
          targetIds = [combatant.id];
        } else if (isAoE) {
          const targets = resolveTargets(clone, combatant, card.range, action.targetId);
          targetIds = targets.map(t => t.id);
        } else if (action.targetId) {
          targetIds = [action.targetId];
        }

        // Compute per-target damage previews BEFORE processAction
        // (so damage reflects pre-action state, e.g. before block is consumed)
        const damageByTarget: Record<string, IntentDamagePreview> = {};
        if (!isSelfTarget) {
          for (const tid of targetIds) {
            try {
              const target = getCombatant(clone, tid);
              const preview = calculateDamagePreview(clone, combatant, target, card);
              if (preview) {
                damageByTarget[tid] = {
                  totalDamage: preview.totalDamage,
                  typeEffectiveness: preview.typeEffectiveness,
                  effectivenessLabel: preview.effectivenessLabel,
                  blockedAmount: preview.blockedAmount,
                  isMultiHit: preview.isMultiHit,
                  hits: preview.hits,
                  finalDamage: preview.finalDamage,
                };
              }
            } catch {
              // target not found, skip
            }
          }
        }

        // Process the action on the clone
        try {
          processAction(clone, action);
        } catch {
          break;
        }

        // Check KO status
        const wouldKO: Record<string, boolean> = {};
        for (const tid of targetIds) {
          try {
            const target = getCombatant(clone, tid);
            wouldKO[tid] = !target.alive;
          } catch {
            // If getCombatant throws, combatant was removed — treat as KO
            wouldKO[tid] = true;
          }
        }

        intents.push({
          sequenceNumber: sequenceNumber++,
          sourceId: combatant.id,
          cardId: card.id,
          cardName: card.name,
          moveType: card.type,
          range: card.range,
          isSelfTarget,
          isAoE,
          targetIds: isSelfTarget ? [] : targetIds,
          wouldKO: isSelfTarget ? {} : wouldKO,
          damageByTarget,
          cardCost: card.cost,
        });

        actionsPlayed++;

        if (clone.phase !== 'ongoing') break;
      }

      if (intents.length > 0) {
        result.set(combatant.id, intents);
      }
    }

    // End the turn (discard, draw, status ticks, advance)
    try {
      endTurn(clone);
    } catch {
      break;
    }
  }

  return result;
}
