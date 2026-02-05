import type { Combatant, CombatState, MoveType } from './types';
import { getStatusStacks } from './status';

// ============================================================
// Damage Calculation — Section 8 of spec
// ============================================================

/** STAB (Same Type Attack Bonus) damage bonus */
export const STAB_BONUS = 2;

export interface DamageResult {
  baseDamage: number;
  rawDamage: number;
  strength: number;
  weak: number;
  stab: number;
  blazeStrikeMultiplier: number;  // 2 if Blaze Strike triggered, 1 otherwise
  bastionBarrageBonus: number;    // Bonus damage from Bastion Barrage
  bloomingCycleReduction: number; // Damage reduction from Blooming Cycle
  counterCurrentBonus: number;    // Bonus from Counter-Current
  staticFieldReduction: number;   // Reduction from Static Field
  evasion: number;
  afterEvasion: number;
  blockedAmount: number;
  hpDamage: number;
}

/**
 * Check if a combatant has STAB for a move type.
 */
export function hasSTAB(combatant: Combatant, moveType: MoveType): boolean {
  return combatant.types.includes(moveType);
}

/**
 * Calculate and apply card damage from source to target.
 * Returns a full breakdown of the damage calculation.
 */
export function applyCardDamage(
  source: Combatant,
  target: Combatant,
  baseDamage: number,
  moveType?: MoveType,
  isBlazeStrike?: boolean,
  bastionBarrageBonus?: number,
  bloomingCycleReduction?: number,
  counterCurrentBonus?: number,
  staticFieldReduction?: number,
): DamageResult {
  // Step 1: Apply Strength, Weak, STAB, Bastion Barrage, and Counter-Current from source
  const strength = getStatusStacks(source, 'strength');
  const weak = getStatusStacks(source, 'weak');
  const stab = moveType && hasSTAB(source, moveType) ? STAB_BONUS : 0;
  const bastionBonus = bastionBarrageBonus ?? 0;
  const counterBonus = counterCurrentBonus ?? 0;
  let rawDamage = baseDamage + strength + stab + bastionBonus + counterBonus - weak;
  rawDamage = Math.max(rawDamage, 1); // floor at 1

  // Step 1.5: Apply Blaze Strike multiplier (after STAB, before evasion)
  const blazeStrikeMultiplier = isBlazeStrike ? 2 : 1;
  rawDamage = rawDamage * blazeStrikeMultiplier;

  // Step 1.6: Apply Blooming Cycle reduction (after Blaze Strike, before Static Field)
  const bloomingReduction = bloomingCycleReduction ?? 0;
  rawDamage = Math.max(rawDamage - bloomingReduction, 0);

  // Step 1.7: Apply Static Field reduction (after Blooming Cycle, before Evasion)
  const staticReduction = staticFieldReduction ?? 0;
  rawDamage = Math.max(rawDamage - staticReduction, 0);

  // Step 2: Apply Evasion from target
  const evasion = getStatusStacks(target, 'evasion');
  let afterEvasion = rawDamage - evasion;
  afterEvasion = Math.max(afterEvasion, 0); // evasion can reduce to 0

  // Step 3: Apply Block
  const damageToBlock = Math.min(afterEvasion, target.block);
  target.block -= damageToBlock;

  const damageToHp = afterEvasion - damageToBlock;
  const hpBefore = target.hp;
  target.hp -= damageToHp;

  // Step 4: Check death
  if (target.hp <= 0) {
    target.hp = 0;
    target.alive = false;
  }

  // Actual HP lost (capped at target's remaining HP, no overkill)
  const actualHpDamage = hpBefore - target.hp;

  return {
    baseDamage,
    rawDamage,
    strength,
    weak,
    stab,
    blazeStrikeMultiplier,
    bastionBarrageBonus: bastionBonus,
    bloomingCycleReduction: bloomingReduction,
    counterCurrentBonus: counterBonus,
    staticFieldReduction: staticReduction,
    evasion,
    afterEvasion,
    blockedAmount: damageToBlock,
    hpDamage: actualHpDamage,
  };
}

/**
 * Calculate Blooming Cycle damage reduction.
 * If any player-side combatant has Blooming Cycle, enemies with Leech deal reduced damage.
 */
export function getBloomingCycleReduction(
  state: CombatState,
  attacker: Combatant
): number {
  // Check if any player-side combatant has Blooming Cycle
  const playerHasBloomingCycle = state.combatants.some(
    c => c.side === 'player' && c.passiveIds.includes('blooming_cycle')
  );
  if (!playerHasBloomingCycle) return 0;

  // Check if attacker has Leech
  const leechStacks = getStatusStacks(attacker, 'leech');
  return Math.floor(leechStacks / 2);
}

/**
 * Apply bypass damage (burn, poison, leech) — no Strength, Weak, Evasion, or Block.
 * Returns the actual HP damage dealt.
 */
export function applyBypassDamage(target: Combatant, damage: number): number {
  target.hp -= damage;
  if (target.hp <= 0) {
    target.hp = 0;
    target.alive = false;
  }
  return damage;
}

/**
 * Heal a combatant. Cannot exceed maxHp.
 */
export function applyHeal(target: Combatant, amount: number): number {
  const before = target.hp;
  target.hp = Math.min(target.hp + amount, target.maxHp);
  return target.hp - before;
}
