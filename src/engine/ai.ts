import type { CombatState, BattleAction, Combatant, MoveDefinition, CardEffect } from './types';
import { getCurrentCombatant } from './combat';
import { getMove } from '../data/loaders';
import { getValidTargets } from './position';
import { getEffectiveCost, resolveTargets } from './cards';
import { getStatusStacks, checkStatusImmunity } from './status';
import {
  checkCounterCurrent,
  checkKeenEye,
  checkPredatorsPatience,
  checkSearingFury,
  checkVoltFury,
  checkMalice,
  checkBlindAggression,
  checkItemDamageBonus,
  getTotalDebuffStacks,
  getTotalBuffStacks,
} from './passives';
import { calculateHandPreview } from './preview';
import { getTypeEffectiveness } from './typeChart';
import { POKEMON_WEIGHTS } from '../data/heights';

// ============================================================
// Enemy AI — Smart Score-based Card Selection
// ============================================================

/** Debuff status types that target enemies */
const DEBUFF_STATUSES = ['burn', 'poison', 'paralysis', 'slow', 'enfeeble', 'sleep', 'leech', 'provoke', 'fatigue'] as const;

interface ScoredPlay {
  cardId: string;
  handIndex: number;
  card: MoveDefinition;
  score: number;
  targetId?: string;
}

// ============================================================
// 1. Offensive Damage Estimation (source-side only)
// ============================================================

/**
 * Extract base damage from a card's first damage-dealing effect.
 * Handles bonus conditions, HP scaling, weight scaling, and multi-hit.
 */
function extractBaseDamage(
  card: MoveDefinition,
  source: Combatant,
  target: Combatant,
): { baseDamage: number; hits: number } {
  const damageEffect = card.effects.find(e =>
    e.type === 'damage' || e.type === 'multi_hit' || e.type === 'heal_on_hit' ||
    e.type === 'recoil' || e.type === 'self_ko'
  ) as CardEffect | undefined;

  if (!damageEffect) return { baseDamage: 0, hits: 1 };

  let baseDamage = 0;
  let hits = 1;

  switch (damageEffect.type) {
    case 'damage': {
      baseDamage = damageEffect.value;
      // Bonus conditions
      if (damageEffect.bonusValue && damageEffect.bonusCondition) {
        switch (damageEffect.bonusCondition) {
          case 'user_below_half_hp':
            if (source.hp < source.maxHp * 0.5) baseDamage += damageEffect.bonusValue;
            break;
          case 'target_below_half_hp':
            if (target.hp < target.maxHp * 0.5) baseDamage += damageEffect.bonusValue;
            break;
          case 'target_debuff_stacks':
            baseDamage += damageEffect.bonusValue * getTotalDebuffStacks(target);
            break;
          case 'target_burn_stacks':
            baseDamage += damageEffect.bonusValue * getStatusStacks(target, 'burn');
            break;
          case 'target_buff_stacks':
            baseDamage += damageEffect.bonusValue * getTotalBuffStacks(target);
            break;
          case 'user_vanished_cards':
            baseDamage += damageEffect.bonusValue * source.vanishedPile.length;
            break;
        }
      }
      // HP scaling (Eruption)
      if (damageEffect.hpScaling) {
        baseDamage = Math.floor(baseDamage * (source.hp / source.maxHp));
      }
      // Weight scaling (Heat Crash)
      if (damageEffect.weightScaling) {
        const userWeight = POKEMON_WEIGHTS[source.pokemonId] ?? 50;
        const targetWeight = POKEMON_WEIGHTS[target.pokemonId] ?? 50;
        const ratio = Math.min(userWeight / targetWeight, 2.0);
        baseDamage = Math.floor(baseDamage * ratio);
      }
      // Inverse weight scaling (Grass Knot)
      if (damageEffect.inverseWeightScaling) {
        const userWeight = POKEMON_WEIGHTS[source.pokemonId] ?? 50;
        const targetWeight = POKEMON_WEIGHTS[target.pokemonId] ?? 50;
        const ratio = Math.min(targetWeight / userWeight, 2.0);
        baseDamage = Math.floor(baseDamage * ratio);
      }
      break;
    }
    case 'multi_hit':
      baseDamage = damageEffect.value;
      hits = damageEffect.hits;
      break;
    case 'heal_on_hit':
    case 'recoil':
    case 'self_ko':
      baseDamage = damageEffect.value;
      break;
  }

  return { baseDamage, hits };
}

/**
 * Estimate offensive damage from source to target.
 * Uses calculateHandPreview() for source-only mods, adds target-dependent
 * SOURCE bonuses, and applies type effectiveness.
 *
 * Deliberately omits: target block, evasion, Thick Fat, Multiscale, Shell Armor,
 * Thick Hide, Friend Guard, Static Field, Blooming Cycle, class damage reduction.
 * This preserves meaningful player counterplay.
 *
 * Returns null if the target is immune (Water Absorb, Dry Skin vs water).
 */
function estimateOffensiveDamage(
  state: CombatState,
  source: Combatant,
  target: Combatant,
  card: MoveDefinition,
): number | null {
  // Water Absorb / Dry Skin immunity to Water
  if ((target.passiveIds.includes('water_absorb') || target.passiveIds.includes('dry_skin')) && card.type === 'water') {
    return null;
  }

  const { baseDamage, hits } = extractBaseDamage(card, source, target);
  if (baseDamage === 0 && hits === 1) return 0;

  // Source-only modifiers from hand preview
  const handPreview = calculateHandPreview(source, card);

  // Target-dependent SOURCE bonuses (attacker's passives that need target info)
  const { bonusDamage: counterBonus } = checkCounterCurrent(state, source, target);
  const keenEyeBonus = checkKeenEye(source, target);
  const predatorsPatienceBonus = checkPredatorsPatience(source, target);
  const searingFuryBonus = checkSearingFury(source, target, card, state);
  const voltFuryBonus = checkVoltFury(source, target);
  const maliceBonus = checkMalice(source, target);
  const blindAggressionBonus = checkBlindAggression(source, target);
  const typeEffForItem = getTypeEffectiveness(card.type, target.types);
  const itemDamageBonus = checkItemDamageBonus(state, source, target, card, typeEffForItem);

  const targetBonus = counterBonus + keenEyeBonus + predatorsPatienceBonus +
    searingFuryBonus + voltFuryBonus + maliceBonus + blindAggressionBonus + itemDamageBonus;

  // Type effectiveness
  const typeEff = getTypeEffectiveness(card.type, target.types);

  // Combine: (base + additive + targetBonus) * multiplier * typeEff
  const perHit = Math.max(
    Math.floor((baseDamage + handPreview.additive + targetBonus) * handPreview.multiplier * typeEff),
    0,
  );

  return perHit * hits;
}

// ============================================================
// 2. Context-Sensitive Debuff Scoring
// ============================================================

/**
 * Score debuff effects on a card against a specific target.
 * Considers: immunity, diminishing returns, and context-dependent weights.
 */
function scoreDebuffs(
  card: MoveDefinition,
  source: Combatant,
  target: Combatant,
  state: CombatState,
): number {
  let score = 0;

  // Compute averages for context scaling
  const enemies = state.combatants.filter(c => c.side !== source.side && c.alive);
  const avgMaxHp = enemies.length > 0
    ? enemies.reduce((sum, e) => sum + e.maxHp, 0) / enemies.length
    : 50;
  const avgSpeed = enemies.length > 0
    ? enemies.reduce((sum, e) => sum + e.baseSpeed, 0) / enemies.length
    : 5;

  for (const e of card.effects) {
    if (e.type !== 'apply_status') continue;
    if (!(DEBUFF_STATUSES as readonly string[]).includes(e.status)) continue;

    // Status immunity check
    if (checkStatusImmunity(target, e.status)) continue;

    // Sheer Force blocks move-applied statuses
    if (source.passiveIds.includes('sheer_force')) continue;

    const existingStacks = getStatusStacks(target, e.status);
    const diminishing = Math.pow(0.7, existingStacks);

    let baseWeight = 0;
    let contextMod = 1;

    switch (e.status) {
      case 'burn':
        baseWeight = 1;
        contextMod = target.hp < 10 ? 0.5 : 1;
        break;
      case 'poison':
        baseWeight = 1.5;
        contextMod = Math.max(0.5, Math.min(2, target.hp / 40));
        break;
      case 'enfeeble':
        baseWeight = 1;
        contextMod = Math.max(0.5, Math.min(2, target.maxHp / avgMaxHp));
        break;
      case 'paralysis':
        baseWeight = 3;
        contextMod = avgSpeed > 0
          ? Math.max(0.5, Math.min(2, target.baseSpeed / avgSpeed))
          : 1;
        break;
      case 'slow':
        baseWeight = 3;
        contextMod = avgSpeed > 0
          ? Math.max(0.5, Math.min(2, target.baseSpeed / avgSpeed))
          : 1;
        break;
      case 'sleep':
        baseWeight = 5;
        break;
      case 'leech':
        baseWeight = 1.5;
        contextMod = 1 + (1 - source.hp / source.maxHp);
        break;
      case 'provoke':
        baseWeight = 2;
        contextMod = Math.max(0.5, Math.min(1.5, source.hp / source.maxHp));
        break;
    }

    score += e.stacks * baseWeight * contextMod * diminishing;
  }

  return score;
}

// ============================================================
// 3. Defense & Self-Buff Scoring
// ============================================================

/**
 * Score defensive effects (block, heal, self-buff) on a card.
 * Scales with source's missing HP.
 */
function scoreDefense(card: MoveDefinition, source: Combatant): number {
  let score = 0;
  const hpPct = source.hp / source.maxHp;

  for (const e of card.effects) {
    switch (e.type) {
      case 'block': {
        // Block is more valuable when low HP, less valuable when already stacked
        const hpMod = hpPct < 0.5 ? 1.5 : hpPct < 0.75 ? 1.0 : 0.4;
        // Diminishing returns: existing block reduces value (halved at HP, near-zero past 2x HP)
        const blockRatio = source.block / source.maxHp;
        const blockDiminishing = 1 / (1 + blockRatio * 3);
        score += e.value * hpMod * blockDiminishing;
        break;
      }
      case 'heal_percent':
        // Heal value scales with missing HP
        score += (e.percent * source.maxHp) * (1 - hpPct) * 0.8;
        break;
      case 'heal':
        score += e.value * (1 - hpPct) * 0.8;
        break;
      case 'apply_status_self': {
        if (!(DEBUFF_STATUSES as readonly string[]).includes(e.status)) {
          // It's a buff (strength, evasion, haste, etc.)
          const existing = getStatusStacks(source, e.status);
          const diminishing = Math.pow(0.8, existing);
          score += e.stacks * 2 * diminishing;
        }
        break;
      }
      case 'draw_cards':
        score += e.count * 2;
        break;
      case 'gain_energy':
        score += e.amount * 3;
        break;
      case 'cleanse': {
        const debuffTypes = ['burn', 'poison', 'paralysis', 'slow', 'enfeeble', 'sleep', 'leech', 'taunt', 'provoke', 'fatigue'];
        const debuffCount = source.statuses.filter(s => debuffTypes.includes(s.type)).length;
        score += Math.min(e.count, debuffCount) * 3;
        break;
      }
    }
  }

  return score;
}

// ============================================================
// 4. Ally Targeting for any_ally cards
// ============================================================

/**
 * Score each alive ally as a target for an any_ally card.
 * Returns the best (allyId, score) pair.
 */
function scoreBestAllyTarget(
  card: MoveDefinition,
  source: Combatant,
  state: CombatState,
): { targetId: string; score: number } | null {
  const allies = state.combatants.filter(c => c.alive && c.side === source.side);
  if (allies.length === 0) return null;

  let bestScore = -Infinity;
  let bestId = allies[0].id;

  for (const ally of allies) {
    let score = 0;

    for (const e of card.effects) {
      switch (e.type) {
        case 'heal_percent': {
          const hpPct = ally.hp / ally.maxHp;
          const healAmount = e.percent * ally.maxHp;
          score += healAmount * (1 - hpPct);
          break;
        }
        case 'heal': {
          const missing = ally.maxHp - ally.hp;
          score += Math.min(e.value, missing) * 0.8;
          break;
        }
        case 'block':
          // Prefer ally with lowest current block
          score += e.value * (1 / (1 + ally.block * 0.1));
          break;
        case 'apply_status_self': {
          if (!(DEBUFF_STATUSES as readonly string[]).includes(e.status)) {
            const existing = getStatusStacks(ally, e.status);
            score += e.stacks * 2 * Math.pow(0.8, existing);
          }
          break;
        }
        case 'cleanse': {
          const debuffTypes = ['burn', 'poison', 'paralysis', 'slow', 'enfeeble', 'sleep', 'leech', 'taunt', 'provoke', 'fatigue'];
          const debuffCount = ally.statuses.filter(s => debuffTypes.includes(s.type)).length;
          const totalStacks = ally.statuses
            .filter(s => debuffTypes.includes(s.type))
            .reduce((sum, s) => sum + s.stacks, 0);
          score += Math.min(e.count, debuffCount) * 2 + totalStacks * 0.5;
          break;
        }
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestId = ally.id;
    }
  }

  return bestScore > 0 ? { targetId: bestId, score: bestScore } : null;
}

// ============================================================
// 5. Lethal Efficiency
// ============================================================

/**
 * Calculate lethal bonus.
 * Rewards efficient kills: bonus = 20 - (overkill / totalDamage) * 10, min 10.
 */
function getLethalBonus(estimatedDamage: number, targetHp: number): number {
  if (estimatedDamage <= 0 || targetHp <= 0) return 0;
  if (estimatedDamage < targetHp) return 0; // Not a kill

  const overkill = estimatedDamage - targetHp;
  return Math.max(10, 20 - (overkill / estimatedDamage) * 10);
}

// ============================================================
// 6. Self-KO and Recoil Awareness
// ============================================================

/**
 * Calculate penalty for self-KO and recoil effects.
 */
function getSelfDamagePenalty(
  card: MoveDefinition,
  source: Combatant,
  estimatedDamage: number,
  state: CombatState,
): number {
  let penalty = 0;

  for (const e of card.effects) {
    if (e.type === 'self_ko') {
      // Check if this would win the battle
      const aliveEnemies = state.combatants.filter(c => c.side !== source.side && c.alive);
      const wouldWin = aliveEnemies.length === 1 && estimatedDamage >= aliveEnemies[0].hp;
      const isDesperateHp = source.hp < source.maxHp * 0.15;

      if (!wouldWin && !isDesperateHp) {
        // HP-scaled penalty: high HP = huge penalty, low HP = small penalty
        const hpPercent = source.hp / source.maxHp;
        penalty += Math.floor(120 * hpPercent);
      }
    }

    if (e.type === 'recoil') {
      // Rock Head prevents recoil
      if (source.passiveIds.includes('rock_head')) continue;

      const recoilDamage = Math.floor(estimatedDamage * e.recoilPercent);
      const isLowHp = source.hp < source.maxHp * 0.5;
      penalty += recoilDamage * (isLowHp ? 1.5 : 0.3);
    }
  }

  return penalty;
}

// ============================================================
// 7. Unified Scoring Function
// ============================================================

/**
 * Score a (card, target) pair for an enemy-targeting card.
 * Combines damage + debuffs + lethal bonus - penalties.
 */
function scoreEnemyPlay(
  state: CombatState,
  source: Combatant,
  card: MoveDefinition,
  targets: Combatant[],
): number {
  let totalDamage = 0;
  let totalDebuff = 0;
  let lethalBonus = 0;

  for (const target of targets) {
    const dmg = estimateOffensiveDamage(state, source, target, card);
    if (dmg === null) {
      // Immune target — damage portion is worthless, but debuffs might still apply
      totalDebuff += scoreDebuffs(card, source, target, state);
      continue;
    }

    totalDamage += dmg;
    totalDebuff += scoreDebuffs(card, source, target, state);
    lethalBonus += getLethalBonus(dmg, target.hp);
  }

  // Defense effects on the card (block, self-heal, self-buff)
  const defenseScore = scoreDefense(card, source);

  // Self-damage penalty
  const penalty = getSelfDamagePenalty(card, source, totalDamage, state);

  return totalDamage + totalDebuff + defenseScore + lethalBonus - penalty;
}

// ============================================================
// 8. Main AI Entry Point
// ============================================================

/**
 * Choose an action for the current enemy combatant.
 * Smart score-based AI: considers type effectiveness, exact AoE targets,
 * context-sensitive debuffs, and ally targeting.
 */
export function chooseEnemyAction(
  state: CombatState,
  _cardsPlayedThisTurn: number,
): BattleAction {
  const combatant = getCurrentCombatant(state);

  // Primed self-KO: end turn immediately (deferred turn handles detonation)
  if (combatant.primedSelfKo) {
    return { type: 'end_turn' };
  }

  const hand = combatant.hand;

  const plays: ScoredPlay[] = [];
  for (let i = 0; i < hand.length; i++) {
    const cardId = hand[i];
    const card = getMove(cardId);
    const cost = getEffectiveCost(combatant, i);

    // Can't afford
    if (cost > combatant.energy) continue;

    // --- Self-targeting cards ---
    if (card.range === 'self') {
      const score = scoreDefense(card, combatant);
      if (score > 0) {
        plays.push({ cardId, handIndex: i, card, score, targetId: undefined });
      }
      continue;
    }

    // --- Ally-targeting cards: score each ally ---
    if (card.range === 'any_ally') {
      const best = scoreBestAllyTarget(card, combatant, state);
      if (best && best.score > 0) {
        plays.push({ cardId, handIndex: i, card, score: best.score, targetId: best.targetId });
      }
      continue;
    }

    // --- Enemy-targeting cards ---
    const validTargets = getValidTargets(state, combatant, card.range);
    if (validTargets.length === 0) continue;

    // Provoke: force-target the provoke source
    const provokeStatus = combatant.statuses.find(s => s.type === 'provoke');
    if (provokeStatus?.sourceId) {
      const provokeSource = validTargets.find(t => t.id === provokeStatus.sourceId);
      if (provokeSource && provokeSource.alive) {
        // Resolve exact targets through this provoke target
        const targets = resolveAoETargets(state, combatant, card, provokeSource.id);
        const score = scoreEnemyPlay(state, combatant, card, targets);
        if (score > 0) {
          plays.push({ cardId, handIndex: i, card, score, targetId: provokeSource.id });
        }
        continue;
      }
    }

    // Taunt: filter to taunt targets if any
    const tauntTargets = validTargets.filter(t => getStatusStacks(t, 'taunt') > 0);
    const effectiveTargets = tauntTargets.length > 0 ? tauntTargets : validTargets;

    // Is this an AoE card where target selection picks a group?
    const isAoE = ['all_enemies', 'front_row', 'back_row'].includes(card.range);

    if (isAoE) {
      // AoE: resolve exact targets, score the whole group
      const targets = resolveAoETargets(state, combatant, card, effectiveTargets[0].id);
      const score = scoreEnemyPlay(state, combatant, card, targets);
      if (score > 0) {
        plays.push({ cardId, handIndex: i, card, score, targetId: effectiveTargets[0].id });
      }
    } else if (card.range === 'any_row') {
      // any_row: score each row separately, pick the best
      const rowGroups = groupByRow(effectiveTargets);
      for (const [_row, rowTargets] of rowGroups) {
        const representative = rowTargets[0];
        const resolved = resolveAoETargets(state, combatant, card, representative.id);
        const score = scoreEnemyPlay(state, combatant, card, resolved);
        if (score > 0) {
          plays.push({ cardId, handIndex: i, card, score, targetId: representative.id });
        }
      }
    } else if (card.range === 'column') {
      // column: score each column, pick best
      const colGroups = groupByColumn(effectiveTargets);
      for (const [_col, colTargets] of colGroups) {
        const representative = colTargets[0];
        const resolved = resolveAoETargets(state, combatant, card, representative.id);
        const score = scoreEnemyPlay(state, combatant, card, resolved);
        if (score > 0) {
          plays.push({ cardId, handIndex: i, card, score, targetId: representative.id });
        }
      }
    } else {
      // Single-target: score against every valid target, keep best
      for (const target of effectiveTargets) {
        const score = scoreEnemyPlay(state, combatant, card, [target]);
        if (score > 0) {
          plays.push({ cardId, handIndex: i, card, score, targetId: target.id });
        }
      }
    }
  }

  if (plays.length === 0) {
    return { type: 'end_turn' };
  }

  // Sort: 0-cost cards first (free value), then by score descending
  plays.sort((a, b) => {
    const aCost = getEffectiveCost(combatant, a.handIndex);
    const bCost = getEffectiveCost(combatant, b.handIndex);
    if (aCost === 0 && bCost !== 0) return -1;
    if (bCost === 0 && aCost !== 0) return 1;
    return b.score - a.score;
  });

  const best = plays[0];
  return {
    type: 'play_card',
    cardInstanceId: best.cardId,
    targetId: best.targetId,
  };
}

// ============================================================
// Helpers
// ============================================================

/**
 * Resolve AoE targets using the engine's resolveTargets.
 * Wraps the call to handle errors gracefully.
 */
function resolveAoETargets(
  state: CombatState,
  source: Combatant,
  card: MoveDefinition,
  targetId: string,
): Combatant[] {
  try {
    return resolveTargets(state, source, card.range, targetId);
  } catch {
    // Fallback: return the single target
    const target = state.combatants.find(c => c.id === targetId);
    return target ? [target] : [];
  }
}

/** Group combatants by row. */
function groupByRow(targets: Combatant[]): Map<string, Combatant[]> {
  const map = new Map<string, Combatant[]>();
  for (const t of targets) {
    const key = t.position.row;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(t);
  }
  return map;
}

/** Group combatants by column. */
function groupByColumn(targets: Combatant[]): Map<number, Combatant[]> {
  const map = new Map<number, Combatant[]>();
  for (const t of targets) {
    const key = t.position.column;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(t);
  }
  return map;
}
