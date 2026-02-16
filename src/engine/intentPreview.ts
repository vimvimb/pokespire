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

  // Walk all remaining un-acted entries in turn order
  // We start from the entry AFTER the current one (current is the player whose turn it is)
  const startIndex = clone.currentTurnIndex + 1;

  for (let i = startIndex; i < clone.turnOrder.length; i++) {
    const entry = clone.turnOrder[i];
    if (entry.hasActed) continue;
    if (clone.phase !== 'ongoing') break;

    let combatant: Combatant;
    try {
      combatant = getCombatant(clone, entry.combatantId);
    } catch {
      continue;
    }

    if (!combatant.alive) continue;

    // Set up clone so this combatant is the "current" one
    clone.currentTurnIndex = i;

    // Start the turn (energy gain, status ticks, passives)
    try {
      const { skipped } = startTurn(clone);
      if (skipped) {
        // Turn was skipped (e.g., fainted from status damage)
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
