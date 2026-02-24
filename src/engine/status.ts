import type { Combatant, CombatState, StatusType, StatusInstance, LogEntry } from './types';
import { applyBypassDamage, applyHeal } from './damage';
import { getCombatant } from './combat';
import { getPassiveSpeedBonus } from './passives';

// ============================================================
// Status Effects — Section 7 of spec
// ============================================================

/** Get current stacks for a status type on a combatant (0 if not present). */
export function getStatusStacks(combatant: Combatant, type: StatusType): number {
  const s = combatant.statuses.find(s => s.type === type);
  return s ? s.stacks : 0;
}

/** Get a status instance if present. */
export function getStatus(combatant: Combatant, type: StatusType): StatusInstance | undefined {
  return combatant.statuses.find(s => s.type === type);
}

/** Remove a status entirely. */
export function removeStatus(combatant: Combatant, type: StatusType): void {
  combatant.statuses = combatant.statuses.filter(s => s.type !== type);
}

/** Decay evasion by 1 when attacked (called after damage + onDamageTaken). */
export function decayEvasionOnHit(target: Combatant): void {
  const evasion = target.statuses.find(s => s.type === 'evasion');
  if (evasion) {
    evasion.stacks -= 1;
    if (evasion.stacks <= 0) {
      removeStatus(target, 'evasion');
    }
  }
}

/**
 * Apply a status effect to a combatant.
 * Follows the stacking rules from Section 7.1.
 */
/**
 * Returns true if the status affects speed (paralysis, slow, haste).
 */
export function isSpeedStatus(type: StatusType): boolean {
  return type === 'paralysis' || type === 'slow' || type === 'haste';
}

/**
 * Check if a combatant is immune to a status type.
 * Returns true if the status should be blocked.
 */
export function checkStatusImmunity(
  target: Combatant,
  type: StatusType
): boolean {
  return getStatusImmunitySource(target, type) !== null;
}

/**
 * Get the name of the passive that grants immunity to a status type.
 * Returns null if no immunity applies.
 */
export function getStatusImmunitySource(
  target: Combatant,
  type: StatusType
): string | null {
  // Immunity: You cannot be Poisoned
  if (type === 'poison' && target.passiveIds.includes('immunity')) {
    return 'Immunity';
  }
  // Shield Dust: You cannot be Poisoned
  if (type === 'poison' && target.passiveIds.includes('shield_dust')) {
    return 'Shield Dust';
  }
  // Flash Fire: You cannot be Burned
  if (type === 'burn' && target.passiveIds.includes('flash_fire')) {
    return 'Flash Fire';
  }
  // Insomnia: You cannot be put to Sleep
  if (type === 'sleep' && target.passiveIds.includes('insomnia')) {
    return 'Insomnia';
  }
  // Vital Spirit: You cannot be put to Sleep
  if (type === 'sleep' && target.passiveIds.includes('vital_spirit')) {
    return 'Vital Spirit';
  }
  // Inner Focus: You cannot be Enfeebled
  if (type === 'enfeeble' && target.passiveIds.includes('inner_focus')) {
    return 'Inner Focus';
  }
  // Limber: You cannot be Paralyzed
  if (type === 'paralysis' && target.passiveIds.includes('limber')) {
    return 'Limber';
  }
  return null;
}

export interface ApplyStatusResult {
  applied: boolean;
  affectsSpeed: boolean;
}

export function applyStatus(
  state: CombatState,
  target: Combatant,
  type: StatusType,
  stacks: number,
  sourceId?: string,
): ApplyStatusResult {
  // Check for immunity
  if (checkStatusImmunity(target, type)) {
    return { applied: false, affectsSpeed: false }; // Status was blocked
  }

  const existing = getStatus(target, type);

  switch (type) {
    case 'burn':
    case 'poison':
    case 'sleep':
    case 'strength':
    case 'paralysis':
    case 'slow':
    case 'enfeeble':
    case 'evasion':
    case 'haste':
    case 'taunt':
    case 'fatigue':
    case 'thorns':
    case 'regen':
    case 'mobile':
    case 'energize':
    case 'luck':
      // Additive stacking for all standard statuses
      if (existing) {
        existing.stacks += stacks;
      } else {
        target.statuses.push({
          type,
          stacks,
          appliedOrder: state.statusApplyCounter++,
        });
      }
      break;

    case 'leech':
      // Additive stacking, tracks source for healing
      if (existing) {
        existing.stacks += stacks;
        existing.sourceId = sourceId; // Update source to latest applier
      } else {
        target.statuses.push({
          type,
          stacks,
          sourceId,
          appliedOrder: state.statusApplyCounter++,
        });
      }
      break;

    case 'provoke':
      // Additive stacking, tracks source for forced targeting
      if (existing) {
        existing.stacks += stacks;
        existing.sourceId = sourceId; // Update source to latest applier
      } else {
        target.statuses.push({
          type,
          stacks,
          sourceId,
          appliedOrder: state.statusApplyCounter++,
        });
      }
      break;
  }
  return { applied: true, affectsSpeed: isSpeedStatus(type) };
}

/**
 * Get the effective speed of a combatant, accounting for Paralysis, Slow, Haste, and passive bonuses.
 */
export function getEffectiveSpeed(combatant: Combatant): number {
  const paralysis = getStatusStacks(combatant, 'paralysis');
  const slow = getStatusStacks(combatant, 'slow');
  const haste = getStatusStacks(combatant, 'haste');
  const passiveBonus = getPassiveSpeedBonus(combatant);
  return Math.max(combatant.baseSpeed + passiveBonus + haste - paralysis - slow, 0);
}

/**
 * Process start-of-turn status decay (Step 1).
 * Decays by 1: strength, evasion, haste, thorns, taunt, enfeeble, slow, paralysis.
 */
export function processStartOfTurnStatuses(
  state: CombatState,
  combatant: Combatant,
): LogEntry[] {
  const logs: LogEntry[] = [];
  const decayTypes: StatusType[] = [
    'strength', 'evasion', 'haste', 'thorns',
    'taunt', 'enfeeble', 'slow', 'paralysis',
  ];

  for (const type of decayTypes) {
    const status = getStatus(combatant, type);
    if (!status) continue;

    const statusName = type.charAt(0).toUpperCase() + type.slice(1);
    logs.push({
      round: state.round,
      combatantId: combatant.id,
      message: `${statusName} on ${combatant.name} fades. (${status.stacks} → ${status.stacks - 1} stacks)`,
    });
    status.stacks -= 1;
    if (status.stacks <= 0) {
      removeStatus(combatant, type);
      logs.push({
        round: state.round,
        combatantId: combatant.id,
        message: `${statusName} on ${combatant.name} expired.`,
      });
    }
  }

  return logs;
}

/**
 * Process end-of-turn status ticks (Step 7).
 * Burn: damage + decay. Poison: damage + escalate. Leech: damage + heal source + decay.
 * Regen: heal + decay. Provoke: decay.
 */
export function processEndOfTurnStatuses(
  state: CombatState,
  combatant: Combatant,
): LogEntry[] {
  const logs: LogEntry[] = [];

  // Process statuses in appliedOrder (oldest first)
  const sorted = [...combatant.statuses].sort((a, b) => a.appliedOrder - b.appliedOrder);

  for (const status of sorted) {
    if (!combatant.alive) break;

    // Burn: deal damage equal to stacks, then decay by 1
    if (status.type === 'burn') {
      if (combatant.passiveIds.includes('magic_guard')) {
        logs.push({
          round: state.round,
          combatantId: combatant.id,
          message: `Magic Guard: ${combatant.name} takes no Burn damage! (${status.stacks} → ${status.stacks - 1} stacks)`,
        });
      } else {
        const dmg = applyBypassDamage(combatant, status.stacks);
        logs.push({
          round: state.round,
          combatantId: combatant.id,
          message: `Burn deals ${dmg} damage to ${combatant.name}. (${status.stacks} → ${status.stacks - 1} stacks)`,
        });
      }
      status.stacks -= 1;
      if (status.stacks <= 0) {
        removeStatus(combatant, 'burn');
        logs.push({
          round: state.round,
          combatantId: combatant.id,
          message: `Burn on ${combatant.name} expired.`,
        });
      }
    }

    // Poison: deal damage equal to stacks, then escalate by 1
    if (status.type === 'poison') {
      if (combatant.passiveIds.includes('magic_guard')) {
        logs.push({
          round: state.round,
          combatantId: combatant.id,
          message: `Magic Guard: ${combatant.name} takes no Poison damage! (${status.stacks} → ${status.stacks + 1} stacks)`,
        });
      } else {
        const hasPotentVenomApplied = status.sourceId
          ? state.combatants.find(comb => comb.id === status.sourceId)?.passiveIds.includes('potent_venom')
          : false;
        const poisonDamage = hasPotentVenomApplied ? status.stacks * 2 : status.stacks;
        const dmg = applyBypassDamage(combatant, poisonDamage);
        const potentNote = hasPotentVenomApplied ? ' (Potent Venom!)' : '';
        logs.push({
          round: state.round,
          combatantId: combatant.id,
          message: `Poison deals ${dmg} damage to ${combatant.name}${potentNote}. (${status.stacks} → ${status.stacks + 1} stacks)`,
        });
      }
      status.stacks += 1; // Poison escalates!
    }

    // Leech: deal damage, heal source, decay by 1
    if (status.type === 'leech') {
      if (combatant.passiveIds.includes('magic_guard')) {
        logs.push({
          round: state.round,
          combatantId: combatant.id,
          message: `Magic Guard: ${combatant.name} takes no Leech damage! (${status.stacks} → ${status.stacks - 1} stacks)`,
        });
      } else {
        const dmg = applyBypassDamage(combatant, status.stacks);
        logs.push({
          round: state.round,
          combatantId: combatant.id,
          message: `Leech deals ${dmg} damage to ${combatant.name}. (${status.stacks} → ${status.stacks - 1} stacks)`,
        });

        // Heal the source
        if (status.sourceId) {
          const source = getCombatant(state, status.sourceId);
          if (source?.alive) {
            const healed = applyHeal(source, status.stacks);
            if (healed > 0) {
              logs.push({
                round: state.round,
                combatantId: source.id,
                message: `${source.name} heals ${healed} HP from Leech.`,
              });
            }
          }
        }
      }

      status.stacks -= 1;
      if (status.stacks <= 0) {
        removeStatus(combatant, 'leech');
        logs.push({
          round: state.round,
          combatantId: combatant.id,
          message: `Leech on ${combatant.name} expired.`,
        });
      }
    }

    // Regen: heal equal to stacks, then decay by 1
    if (status.type === 'regen') {
      const healed = applyHeal(combatant, status.stacks);
      if (healed > 0) {
        logs.push({
          round: state.round,
          combatantId: combatant.id,
          message: `Regen heals ${combatant.name} for ${healed} HP. (${status.stacks} → ${status.stacks - 1} stacks)`,
        });
      }
      status.stacks -= 1;
      if (status.stacks <= 0) {
        removeStatus(combatant, 'regen');
        logs.push({
          round: state.round,
          combatantId: combatant.id,
          message: `Regen on ${combatant.name} expired.`,
        });
      }
    }

    // Provoke: decay by 1
    if (status.type === 'provoke') {
      const statusName = 'Provoke';
      logs.push({
        round: state.round,
        combatantId: combatant.id,
        message: `${statusName} on ${combatant.name} fades. (${status.stacks} → ${status.stacks - 1} stacks)`,
      });
      status.stacks -= 1;
      if (status.stacks <= 0) {
        removeStatus(combatant, 'provoke');
        logs.push({
          round: state.round,
          combatantId: combatant.id,
          message: `${statusName} on ${combatant.name} expired.`,
        });
      }
    }
  }

  return logs;
}

/**
 * Round boundary cleanup — Section 7.2.
 * Called after the last combatant's turn ends.
 * Status ticks have moved to per-turn functions. This handles only:
 * - Fortifying Aria passive
 * - Luna passive
 * - Block decay (50% retention, Pressure Hull 100%)
 */
export function processRoundBoundary(state: CombatState): LogEntry[] {
  const logs: LogEntry[] = [];

  for (const c of state.combatants) {
    if (!c.alive) continue;

    // Fortifying Aria: Heal allies for half of current Block (before block decays)
    if (c.passiveIds.includes('fortifying_aria') && c.block > 0 && c.alive) {
      const healAmount = Math.floor(c.block / 2);
      if (healAmount > 0) {
        const allies = state.combatants.filter(a => a.alive && a.side === c.side && a.id !== c.id);
        for (const ally of allies) {
          const healed = applyHeal(ally, healAmount);
          if (healed > 0) {
            logs.push({
              round: state.round,
              combatantId: c.id,
              message: `Fortifying Aria: ${ally.name} heals ${healed} HP! (${c.name}'s Block: ${c.block})`,
            });
          }
        }
      }
    }

    // Luna: Heal all allies for 4 HP at end of round
    if (c.passiveIds.includes('luna') && c.alive) {
      const allies = state.combatants.filter(a => a.alive && a.side === c.side);
      for (const ally of allies) {
        const healed = applyHeal(ally, 4);
        if (healed > 0) {
          logs.push({
            round: state.round,
            combatantId: c.id,
            message: `Luna: ${ally.name} heals ${healed} HP! (HP: ${ally.hp}/${ally.maxHp})`,
          });
        }
      }
    }

    // Block decay: 50% retention (floor); Pressure Hull retains 100%
    if (c.block > 0) {
      if (c.passiveIds.includes('pressure_hull')) {
        logs.push({
          round: state.round,
          combatantId: c.id,
          message: `${c.name}'s Block (${c.block}) retained (Pressure Hull).`,
        });
      } else {
        const newBlock = Math.floor(c.block / 2);
        logs.push({
          round: state.round,
          combatantId: c.id,
          message: `${c.name}'s Block (${c.block}) decays to ${newBlock}.`,
        });
        c.block = newBlock;
      }
    }
  }

  return logs;
}
