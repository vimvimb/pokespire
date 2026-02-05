import type { Combatant, CombatState, LogEntry, PlayCardAction, MoveDefinition, MoveRange } from './types';
import { getMove } from '../data/loaders';
import { getCombatant, rebuildTurnOrderMidRound } from './combat';
import { applyCardDamage, applyHeal, applyBypassDamage, getBloomingCycleReduction } from './damage';
import { applyStatus, isSpeedStatus } from './status';
import { getEffectiveFrontRow } from './position';
import { checkBlazeStrike, checkBastionBarrage, checkCounterCurrent, checkStaticField, onDamageDealt, onStatusApplied } from './passives';
import { shuffle } from './deck';

// ============================================================
// Card Play & Effect Resolution — Section 6
// ============================================================

/**
 * Validate and play a card from a combatant's hand.
 * Returns log entries describing what happened.
 */
export function playCard(
  state: CombatState,
  combatant: Combatant,
  action: PlayCardAction,
): LogEntry[] {
  const logs: LogEntry[] = [];
  const cardId = action.cardInstanceId;

  // Validate card is in hand
  const handIndex = combatant.hand.indexOf(cardId);
  if (handIndex === -1) {
    throw new Error(`Card ${cardId} not in hand of ${combatant.id}`);
  }

  const card = getMove(cardId);

  // Calculate effective cost (accounting for Inferno Momentum)
  const hasInfernoReduction = combatant.turnFlags.infernoMomentumReducedIndex === handIndex;
  const effectiveCost = Math.max(0, card.cost + (hasInfernoReduction ? -3 : 0));

  // Validate energy
  if (combatant.energy < effectiveCost) {
    throw new Error(`Not enough energy. Have ${combatant.energy}, need ${effectiveCost}`);
  }

  // Spend energy
  combatant.energy -= effectiveCost;

  // Update Inferno Momentum tracking when a card is removed
  const reducedIdx = combatant.turnFlags.infernoMomentumReducedIndex;
  if (reducedIdx !== null) {
    if (handIndex === reducedIdx) {
      // The reduced card was played, clear the flag
      combatant.turnFlags.infernoMomentumReducedIndex = null;
    } else if (handIndex < reducedIdx) {
      // A card before the reduced card was played, shift the index down
      combatant.turnFlags.infernoMomentumReducedIndex = reducedIdx - 1;
    }
    // If handIndex > reducedIdx, no change needed
  }

  // Remove from hand
  combatant.hand.splice(handIndex, 1);

  // Resolve targets
  const targets = resolveTargets(state, combatant, card.range, action.targetId);

  logs.push({
    round: state.round,
    combatantId: combatant.id,
    message: `${combatant.name} plays ${card.name} (cost ${effectiveCost}).`,
  });

  // Resolve effects on each target
  for (const target of targets) {
    const effectLogs = resolveEffects(state, combatant, target, card);
    logs.push(...effectLogs);
  }

  // Vanish or discard
  if (card.vanish) {
    // Card is removed from the game — track in vanished pile
    combatant.vanishedPile.push(cardId);
    logs.push({
      round: state.round,
      combatantId: combatant.id,
      message: `${card.name} vanishes!`,
    });
  } else {
    combatant.discardPile.push(cardId);
  }

  return logs;
}

/**
 * Resolve the targets for a card based on move range.
 */
function resolveTargets(
  state: CombatState,
  source: Combatant,
  range: MoveRange,
  targetId?: string,
): Combatant[] {
  const enemies = state.combatants.filter(c => c.alive && c.side !== source.side);

  if (enemies.length === 0 && range !== 'self') {
    return [];
  }

  const effectiveFrontRow = enemies.length > 0
    ? getEffectiveFrontRow(state, enemies[0].side)
    : 'front';

  switch (range) {
    case 'self':
      return [source];

    case 'front_enemy': {
      // Single target in front row
      const validTargets = enemies.filter(c => c.position.row === effectiveFrontRow);
      if (targetId) {
        const target = getCombatant(state, targetId);
        if (!validTargets.some(t => t.id === target.id)) {
          throw new Error(`Target ${targetId} is not in front row`);
        }
        return [target];
      }
      if (validTargets.length === 1) return [validTargets[0]];
      if (validTargets.length === 0) return [];
      throw new Error('front_enemy requires targetId when multiple front targets exist');
    }

    case 'back_enemy': {
      // Single target in back row
      if (effectiveFrontRow === 'back') {
        // Row collapsed - no valid back row targets
        return [];
      }
      const validTargets = enemies.filter(c => c.position.row === 'back');
      if (targetId) {
        const target = getCombatant(state, targetId);
        if (!validTargets.some(t => t.id === target.id)) {
          throw new Error(`Target ${targetId} is not in back row`);
        }
        return [target];
      }
      if (validTargets.length === 1) return [validTargets[0]];
      if (validTargets.length === 0) return [];
      throw new Error('back_enemy requires targetId when multiple back targets exist');
    }

    case 'any_enemy': {
      // Single target, any row
      if (targetId) {
        return [getCombatant(state, targetId)];
      }
      if (enemies.length === 1) return [enemies[0]];
      throw new Error('any_enemy requires targetId when multiple enemies exist');
    }

    case 'front_row':
      // AoE: all enemies in effective front row
      return enemies.filter(c => c.position.row === effectiveFrontRow);

    case 'back_row':
      // AoE: all enemies in back row (empty if row collapsed)
      if (effectiveFrontRow === 'back') return [];
      return enemies.filter(c => c.position.row === 'back');

    case 'any_row': {
      // Player picks a row (front or back), hits all enemies in that row
      // targetId should be any enemy in the desired row
      if (!targetId) {
        // If only one row has enemies, target that row
        const frontEnemies = enemies.filter(c => c.position.row === effectiveFrontRow);
        const backEnemies = effectiveFrontRow === 'back' ? [] : enemies.filter(c => c.position.row === 'back');
        if (frontEnemies.length > 0 && backEnemies.length === 0) return frontEnemies;
        if (backEnemies.length > 0 && frontEnemies.length === 0) return backEnemies;
        throw new Error('any_row requires targetId to select which row');
      }
      const target = getCombatant(state, targetId);
      const targetRow = target.position.row;
      return enemies.filter(c => c.position.row === targetRow);
    }

    case 'column': {
      // Hits all enemies in a column (target any enemy, hits all in that column)
      if (!targetId) {
        // If only one column has enemies, target that
        const columns = new Set(enemies.map(e => e.position.column));
        if (columns.size === 1) {
          const col = enemies[0].position.column;
          return enemies.filter(c => c.position.column === col);
        }
        throw new Error('column requires targetId to select which column');
      }
      const target = getCombatant(state, targetId);
      const targetColumn = target.position.column;
      return enemies.filter(c => c.position.column === targetColumn);
    }

    case 'all_enemies':
      // AoE: all enemies
      return enemies;

    default:
      throw new Error(`Unknown range type: ${range}`);
  }
}

/**
 * Resolve an ordered list of effects against a target.
 */
function resolveEffects(
  state: CombatState,
  source: Combatant,
  target: Combatant,
  card: MoveDefinition,
): LogEntry[] {
  const logs: LogEntry[] = [];

  for (const effect of card.effects) {
    if (!target.alive && effect.type !== 'apply_status_self' && effect.type !== 'draw_cards' && effect.type !== 'gain_energy') break;

    switch (effect.type) {
      case 'damage': {
        // Check for Blaze Strike (multiplier applied after STAB in applyCardDamage)
        const { shouldApply: isBlazeStrike, logs: blazeLogs } = checkBlazeStrike(
          state, source, card
        );
        logs.push(...blazeLogs);

        // Check for Bastion Barrage (bonus damage from Block for Water attacks)
        const { bonusDamage: bastionBonus, logs: bastionLogs } = checkBastionBarrage(
          state, source, card
        );
        logs.push(...bastionLogs);

        // Check for Blooming Cycle reduction (enemy has Leech)
        const bloomingReduction = getBloomingCycleReduction(state, source);

        // Check for Counter-Current (offensive bonus from speed difference)
        const { bonusDamage: counterBonus, logs: counterLogs } = checkCounterCurrent(
          state, source, target
        );
        logs.push(...counterLogs);

        // Check for Static Field (defensive reduction from speed difference)
        const { reduction: staticReduction, logs: staticLogs } = checkStaticField(
          state, source, target
        );
        logs.push(...staticLogs);

        const r = applyCardDamage(
          source, target, effect.value, card.type,
          isBlazeStrike, bastionBonus, bloomingReduction,
          counterBonus, staticReduction
        );

        // Build a concise breakdown string
        const parts: string[] = [];
        if (r.stab > 0) parts.push(`+${r.stab} STAB`);
        if (r.strength > 0) parts.push(`+${r.strength} Str`);
        if (r.bastionBarrageBonus > 0) parts.push(`+${r.bastionBarrageBonus} Bastion`);
        if (r.counterCurrentBonus > 0) parts.push(`+${r.counterCurrentBonus} Current`);
        if (r.weak > 0) parts.push(`-${r.weak} Weak`);
        if (r.blazeStrikeMultiplier > 1) parts.push(`x${r.blazeStrikeMultiplier} Blaze`);
        if (r.bloomingCycleReduction > 0) parts.push(`-${r.bloomingCycleReduction} Blooming`);
        if (r.staticFieldReduction > 0) parts.push(`-${r.staticFieldReduction} Static`);
        if (r.evasion > 0) parts.push(`-${r.evasion} Evasion`);
        if (r.blockedAmount > 0) parts.push(`${r.blockedAmount} blocked`);
        const breakdown = parts.length > 0 ? ` (${r.baseDamage} base${parts.map(p => ', ' + p).join('')})` : '';
        const dmgMsg = r.hpDamage === 0 && r.blockedAmount > 0
          ? `${target.name} takes 0 damage — fully blocked!${breakdown}`
          : `${target.name} takes ${r.hpDamage} damage.${breakdown} (HP: ${target.hp}/${target.maxHp})`;
        logs.push({
          round: state.round,
          combatantId: target.id,
          message: dmgMsg,
        });

        // Trigger post-damage passive effects (e.g., Kindling)
        if (r.hpDamage > 0) {
          const postDmgLogs = onDamageDealt(state, source, target, card, r.hpDamage);
          logs.push(...postDmgLogs);
        }

        if (!target.alive) {
          logs.push({
            round: state.round,
            combatantId: target.id,
            message: `${target.name} is defeated!`,
          });
        }
        break;
      }

      case 'multi_hit': {
        // Multiple damage instances - each hit triggers Strength separately
        let totalDamage = 0;
        for (let i = 0; i < effect.hits; i++) {
          if (!target.alive) break;

          const { shouldApply: isBlazeStrike, logs: blazeLogs } = checkBlazeStrike(state, source, card);
          logs.push(...blazeLogs);
          const { bonusDamage: bastionBonus, logs: bastionLogs } = checkBastionBarrage(state, source, card);
          logs.push(...bastionLogs);
          const bloomingReduction = getBloomingCycleReduction(state, source);
          const { bonusDamage: counterBonus, logs: counterLogs } = checkCounterCurrent(state, source, target);
          logs.push(...counterLogs);
          const { reduction: staticReduction, logs: staticLogs } = checkStaticField(state, source, target);
          logs.push(...staticLogs);

          const r = applyCardDamage(
            source, target, effect.value, card.type,
            isBlazeStrike, bastionBonus, bloomingReduction,
            counterBonus, staticReduction
          );
          totalDamage += r.hpDamage;

          if (r.hpDamage > 0) {
            const postDmgLogs = onDamageDealt(state, source, target, card, r.hpDamage);
            logs.push(...postDmgLogs);
          }
        }

        logs.push({
          round: state.round,
          combatantId: target.id,
          message: `${target.name} is hit ${effect.hits} times for ${totalDamage} total damage. (HP: ${target.hp}/${target.maxHp})`,
        });

        if (!target.alive) {
          logs.push({
            round: state.round,
            combatantId: target.id,
            message: `${target.name} is defeated!`,
          });
        }
        break;
      }

      case 'heal_on_hit': {
        // Lifesteal attack - deal damage then heal based on damage dealt
        const { shouldApply: isBlazeStrike, logs: blazeLogs } = checkBlazeStrike(state, source, card);
        logs.push(...blazeLogs);
        const { bonusDamage: bastionBonus, logs: bastionLogs } = checkBastionBarrage(state, source, card);
        logs.push(...bastionLogs);
        const bloomingReduction = getBloomingCycleReduction(state, source);
        const { bonusDamage: counterBonus, logs: counterLogs } = checkCounterCurrent(state, source, target);
        logs.push(...counterLogs);
        const { reduction: staticReduction, logs: staticLogs } = checkStaticField(state, source, target);
        logs.push(...staticLogs);

        const r = applyCardDamage(
          source, target, effect.value, card.type,
          isBlazeStrike, bastionBonus, bloomingReduction,
          counterBonus, staticReduction
        );

        logs.push({
          round: state.round,
          combatantId: target.id,
          message: `${target.name} takes ${r.hpDamage} damage. (HP: ${target.hp}/${target.maxHp})`,
        });

        // Heal the source based on damage dealt (after block)
        const healAmount = Math.floor(r.hpDamage * effect.healPercent);
        if (healAmount > 0 && source.alive) {
          const healed = applyHeal(source, healAmount);
          logs.push({
            round: state.round,
            combatantId: source.id,
            message: `${source.name} drains ${healed} HP. (HP: ${source.hp}/${source.maxHp})`,
          });
        }

        if (r.hpDamage > 0) {
          const postDmgLogs = onDamageDealt(state, source, target, card, r.hpDamage);
          logs.push(...postDmgLogs);
        }

        if (!target.alive) {
          logs.push({
            round: state.round,
            combatantId: target.id,
            message: `${target.name} is defeated!`,
          });
        }
        break;
      }

      case 'recoil': {
        // Deal damage then take recoil damage
        const { shouldApply: isBlazeStrike, logs: blazeLogs } = checkBlazeStrike(state, source, card);
        logs.push(...blazeLogs);
        const { bonusDamage: bastionBonus, logs: bastionLogs } = checkBastionBarrage(state, source, card);
        logs.push(...bastionLogs);
        const bloomingReduction = getBloomingCycleReduction(state, source);
        const { bonusDamage: counterBonus, logs: counterLogs } = checkCounterCurrent(state, source, target);
        logs.push(...counterLogs);
        const { reduction: staticReduction, logs: staticLogs } = checkStaticField(state, source, target);
        logs.push(...staticLogs);

        const r = applyCardDamage(
          source, target, effect.value, card.type,
          isBlazeStrike, bastionBonus, bloomingReduction,
          counterBonus, staticReduction
        );

        logs.push({
          round: state.round,
          combatantId: target.id,
          message: `${target.name} takes ${r.hpDamage} damage. (HP: ${target.hp}/${target.maxHp})`,
        });

        if (r.hpDamage > 0) {
          const postDmgLogs = onDamageDealt(state, source, target, card, r.hpDamage);
          logs.push(...postDmgLogs);
        }

        if (!target.alive) {
          logs.push({
            round: state.round,
            combatantId: target.id,
            message: `${target.name} is defeated!`,
          });
        }

        // Apply recoil damage to source (bypasses block/evasion)
        const recoilDamage = Math.floor(r.rawDamage * effect.recoilPercent);
        if (recoilDamage > 0 && source.alive) {
          applyBypassDamage(source, recoilDamage);
          logs.push({
            round: state.round,
            combatantId: source.id,
            message: `${source.name} takes ${recoilDamage} recoil damage! (HP: ${source.hp}/${source.maxHp})`,
          });

          if (!source.alive) {
            logs.push({
              round: state.round,
              combatantId: source.id,
              message: `${source.name} is defeated by recoil!`,
            });
          }
        }
        break;
      }

      case 'set_damage': {
        // Fixed damage - ignores Strength, Weak, Block, and Evasion
        const damage = effect.value;
        const hpBefore = target.hp;
        target.hp -= damage;
        if (target.hp <= 0) {
          target.hp = 0;
          target.alive = false;
        }
        const actualDamage = hpBefore - target.hp;

        logs.push({
          round: state.round,
          combatantId: target.id,
          message: `${target.name} takes ${actualDamage} fixed damage. (HP: ${target.hp}/${target.maxHp})`,
        });

        if (!target.alive) {
          logs.push({
            round: state.round,
            combatantId: target.id,
            message: `${target.name} is defeated!`,
          });
        }
        break;
      }

      case 'percent_hp': {
        // Deal percentage of target's HP
        const baseHp = effect.ofMax ? target.maxHp : target.hp;
        const damage = Math.floor(baseHp * effect.percent);
        const hpBefore = target.hp;
        target.hp -= damage;
        if (target.hp <= 0) {
          target.hp = 0;
          target.alive = false;
        }
        const actualDamage = hpBefore - target.hp;

        logs.push({
          round: state.round,
          combatantId: target.id,
          message: `${target.name} takes ${actualDamage} damage (${Math.round(effect.percent * 100)}% of ${effect.ofMax ? 'max' : 'current'} HP). (HP: ${target.hp}/${target.maxHp})`,
        });

        if (!target.alive) {
          logs.push({
            round: state.round,
            combatantId: target.id,
            message: `${target.name} is defeated!`,
          });
        }
        break;
      }

      case 'self_ko': {
        // Deal massive damage, then user dies
        const { shouldApply: isBlazeStrike, logs: blazeLogs } = checkBlazeStrike(state, source, card);
        logs.push(...blazeLogs);
        const { bonusDamage: bastionBonus, logs: bastionLogs } = checkBastionBarrage(state, source, card);
        logs.push(...bastionLogs);
        const bloomingReduction = getBloomingCycleReduction(state, source);
        const { bonusDamage: counterBonus, logs: counterLogs } = checkCounterCurrent(state, source, target);
        logs.push(...counterLogs);
        const { reduction: staticReduction, logs: staticLogs } = checkStaticField(state, source, target);
        logs.push(...staticLogs);

        const r = applyCardDamage(
          source, target, effect.value, card.type,
          isBlazeStrike, bastionBonus, bloomingReduction,
          counterBonus, staticReduction
        );

        logs.push({
          round: state.round,
          combatantId: target.id,
          message: `${target.name} takes ${r.hpDamage} damage. (HP: ${target.hp}/${target.maxHp})`,
        });

        if (r.hpDamage > 0) {
          const postDmgLogs = onDamageDealt(state, source, target, card, r.hpDamage);
          logs.push(...postDmgLogs);
        }

        if (!target.alive) {
          logs.push({
            round: state.round,
            combatantId: target.id,
            message: `${target.name} is defeated!`,
          });
        }

        // User faints
        source.hp = 0;
        source.alive = false;
        logs.push({
          round: state.round,
          combatantId: source.id,
          message: `${source.name} faints from the attack!`,
        });
        break;
      }

      case 'draw_cards': {
        // Draw additional cards
        let actualDrawn = 0;
        for (let i = 0; i < effect.count; i++) {
          if (source.hand.length >= source.handSize + effect.count) break;
          if (source.drawPile.length === 0 && source.discardPile.length === 0) break;

          if (source.drawPile.length === 0) {
            source.drawPile = shuffle([...source.discardPile]);
            source.discardPile = [];
          }

          const card = source.drawPile.pop();
          if (card) {
            source.hand.push(card);
            actualDrawn++;
          }
        }

        if (actualDrawn > 0) {
          logs.push({
            round: state.round,
            combatantId: source.id,
            message: `${source.name} draws ${actualDrawn} card${actualDrawn > 1 ? 's' : ''}.`,
          });
        }
        break;
      }

      case 'gain_energy': {
        // Gain bonus energy
        const energyGained = Math.min(effect.amount, source.energyCap - source.energy);
        source.energy += energyGained;

        if (energyGained > 0) {
          logs.push({
            round: state.round,
            combatantId: source.id,
            message: `${source.name} gains ${energyGained} energy. (Energy: ${source.energy}/${source.energyCap})`,
          });
        }
        break;
      }

      case 'apply_status_self': {
        // Apply status to self (source), not target
        applyStatus(state, source, effect.status, effect.stacks, source.id);
        logs.push({
          round: state.round,
          combatantId: source.id,
          message: `${effect.status} ${effect.stacks} applied to ${source.name}.`,
        });

        // Trigger passive effects for status application
        const statusPassiveLogs = onStatusApplied(
          state, source, source, effect.status, effect.stacks
        );
        logs.push(...statusPassiveLogs);

        // Rebuild turn order mid-round if speed was affected
        if (isSpeedStatus(effect.status)) {
          const reorderLogs = rebuildTurnOrderMidRound(state);
          logs.push(...reorderLogs);
        }
        break;
      }

      case 'cleanse': {
        // Remove debuffs from self (highest stacks first)
        const debuffTypes = ['burn', 'poison', 'paralysis', 'slow', 'weak', 'sleep', 'leech'];
        const debuffs = source.statuses
          .filter(s => debuffTypes.includes(s.type))
          .sort((a, b) => b.stacks - a.stacks);

        const toRemove = debuffs.slice(0, effect.count);
        const removedNames: string[] = [];

        for (const debuff of toRemove) {
          const idx = source.statuses.findIndex(s => s.type === debuff.type);
          if (idx !== -1) {
            source.statuses.splice(idx, 1);
            removedNames.push(`${debuff.type} ${debuff.stacks}`);
          }
        }

        if (removedNames.length > 0) {
          logs.push({
            round: state.round,
            combatantId: source.id,
            message: `${source.name} cleanses ${removedNames.join(', ')}!`,
          });

          // Rebuild turn order if speed-affecting debuffs were removed
          const speedDebuffs = ['paralysis', 'slow'];
          if (toRemove.some(d => speedDebuffs.includes(d.type))) {
            const reorderLogs = rebuildTurnOrderMidRound(state);
            logs.push(...reorderLogs);
          }
        } else {
          logs.push({
            round: state.round,
            combatantId: source.id,
            message: `${source.name} has no debuffs to cleanse.`,
          });
        }
        break;
      }

      case 'block': {
        target.block += effect.value;
        logs.push({
          round: state.round,
          combatantId: target.id,
          message: `${target.name} gains ${effect.value} Block. (Block: ${target.block})`,
        });
        break;
      }
      case 'heal': {
        const healed = applyHeal(target, effect.value);
        logs.push({
          round: state.round,
          combatantId: target.id,
          message: `${target.name} heals ${healed} HP. (HP: ${target.hp}/${target.maxHp})`,
        });
        break;
      }
      case 'apply_status': {
        applyStatus(state, target, effect.status, effect.stacks, source.id);
        logs.push({
          round: state.round,
          combatantId: target.id,
          message: `${effect.status} ${effect.stacks} applied to ${target.name}.`,
        });

        // Trigger passive effects for status application (e.g., Spreading Flames)
        const statusPassiveLogs = onStatusApplied(
          state, source, target, effect.status, effect.stacks
        );
        logs.push(...statusPassiveLogs);

        // Rebuild turn order mid-round if speed was affected
        if (isSpeedStatus(effect.status)) {
          const reorderLogs = rebuildTurnOrderMidRound(state);
          logs.push(...reorderLogs);
        }
        break;
      }
    }
  }

  return logs;
}

/**
 * Get playable cards from a combatant's hand (cards they can afford).
 */
export function getPlayableCards(combatant: Combatant): string[] {
  return combatant.hand.filter((cardId, idx) => {
    const card = getMove(cardId);
    const hasInfernoReduction = combatant.turnFlags.infernoMomentumReducedIndex === idx;
    const effectiveCost = Math.max(0, card.cost + (hasInfernoReduction ? -3 : 0));
    return combatant.energy >= effectiveCost;
  });
}

/**
 * Get the effective cost of a card at a specific hand index.
 */
export function getEffectiveCost(combatant: Combatant, handIndex: number): number {
  const cardId = combatant.hand[handIndex];
  if (!cardId) return 0;
  const card = getMove(cardId);
  const hasInfernoReduction = combatant.turnFlags.infernoMomentumReducedIndex === handIndex;
  return Math.max(0, card.cost + (hasInfernoReduction ? -3 : 0));
}
