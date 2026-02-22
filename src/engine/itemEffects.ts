/**
 * Centralized held item effect dispatch.
 * All item-specific logic lives here, grouped by trigger hook.
 * Other engine files call these functions instead of scattering item checks.
 */
import type { Combatant, CombatState, MoveDefinition, LogEntry, Position } from './types';
import { applyStatus, getStatusStacks } from './status';
import { applyHeal, applyBypassDamage } from './damage';
import { drawExtraCards } from './deck';

// Local utility — mirrors isAttackCard in passives.ts.
// Duplicated here to avoid circular import (passives → itemEffects → passives).
function isAttack(card: MoveDefinition): boolean {
  return card.effects.some(e =>
    e.type === 'damage' || e.type === 'multi_hit' ||
    e.type === 'heal_on_hit' || e.type === 'recoil' ||
    e.type === 'self_ko' || e.type === 'set_damage' ||
    e.type === 'percent_hp'
  );
}

/** Check if a combatant holds a specific item. */
export function hasItem(c: { heldItemIds: string[] }, itemId: string): boolean {
  return c.heldItemIds.includes(itemId);
}

// ============================================================
// Hook: onBattleStart
// ============================================================

/** Apply one-time item effects at battle start (Quick Claw, Eviolite, Toxic Orb). */
export function processItemBattleStart(
  state: CombatState,
  combatant: Combatant,
): LogEntry[] {
  const logs: LogEntry[] = [];
  if (!combatant.alive || combatant.heldItemIds.length === 0) return logs;

  // Quick Claw: Bonus turn at battle start
  if (hasItem(combatant, 'quick_claw')) {
    combatant.turnFlags.quickClawBonusTurn = true;
    logs.push({
      round: state.round,
      combatantId: combatant.id,
      message: `Quick Claw: ${combatant.name} will act first with a burst of energy!`,
    });
  }

  // Eviolite: +15 max HP at battle start
  if (hasItem(combatant, 'eviolite')) {
    combatant.maxHp += 15;
    combatant.hp += 15;
    logs.push({
      round: state.round,
      combatantId: combatant.id,
      message: `Eviolite: ${combatant.name}'s max HP increased to ${combatant.maxHp}!`,
    });
  }

  // Toxic Orb: Self-poison 1 at battle start
  if (hasItem(combatant, 'toxic_orb')) {
    applyStatus(state, combatant, 'poison', 1, combatant.id);
    logs.push({
      round: state.round,
      combatantId: combatant.id,
      message: `Toxic Orb: ${combatant.name} is poisoned!`,
    });
  }

  // Pewter Stone: Start combat with 8 Block
  if (hasItem(combatant, 'pewter_stone')) {
    combatant.block += 8;
    logs.push({
      round: state.round,
      combatantId: combatant.id,
      message: `Pewter Stone: ${combatant.name} starts with 8 Block!`,
    });
  }

  // Rocky Helmet: Apply Thorns 5 at battle start
  if (hasItem(combatant, 'rocky_helmet')) {
    applyStatus(state, combatant, 'thorns', 5, combatant.id);
    logs.push({
      round: state.round,
      combatantId: combatant.id,
      message: `Rocky Helmet: ${combatant.name} gains Thorns 5!`,
    });
  }

  // Choice Scarf: +1 energy per turn
  if (hasItem(combatant, 'choice_scarf')) {
    combatant.energyPerTurn += 1;
    logs.push({
      round: state.round,
      combatantId: combatant.id,
      message: `Choice Scarf: ${combatant.name}'s energy per turn increased to ${combatant.energyPerTurn}!`,
    });
  }

  // Black Sludge: +1 energy per turn
  if (hasItem(combatant, 'black_sludge')) {
    combatant.energyPerTurn += 1;
    logs.push({
      round: state.round,
      combatantId: combatant.id,
      message: `Black Sludge: ${combatant.name}'s energy per turn increased to ${combatant.energyPerTurn}!`,
    });
  }

  // Flame Orb: +1 energy per turn, self-Burn 2
  if (hasItem(combatant, 'flame_orb')) {
    combatant.energyPerTurn += 1;
    applyStatus(state, combatant, 'burn', 2, combatant.id);
    logs.push({
      round: state.round,
      combatantId: combatant.id,
      message: `Flame Orb: ${combatant.name} gains +1 energy/turn and is burned!`,
    });
  }

  // Toxic Plate: Poison 1 to all enemies
  if (hasItem(combatant, 'toxic_plate')) {
    const enemies = state.combatants.filter(c => c.alive && c.side !== combatant.side);
    for (const enemy of enemies) {
      applyStatus(state, enemy, 'poison', 1, combatant.id);
    }
    logs.push({
      round: state.round,
      combatantId: combatant.id,
      message: `Toxic Plate: All enemies are poisoned!`,
    });
  }

  return logs;
}

// ============================================================
// Hook: Turn State Reset (called at turn start, before effects)
// ============================================================

/** Reset per-turn item counters (Metronome attacks, Choice Specs lock, Choice Scarf cards). */
export function resetItemTurnState(combatant: Combatant): void {
  combatant.itemState['metronomeAttacks'] = 0;
  combatant.itemState['scarfCardsPlayed'] = 0;
  combatant.itemState['attacksThisTurn'] = 0;
  combatant.itemState['shellBellUsed'] = 0;
  combatant.itemState['cardsPlayedThisTurn'] = 0;
}

// ============================================================
// Hook: onTurnStart (after drawing hand)
// ============================================================

/** Trigger item effects at turn start (Leftovers heal, Sacred Ash heal). */
export function processItemTurnStart(
  state: CombatState,
  combatant: Combatant,
): LogEntry[] {
  const logs: LogEntry[] = [];
  if (!combatant.alive || combatant.heldItemIds.length === 0) return logs;

  // Leftovers: Heal 3 HP at start of your turn
  if (hasItem(combatant, 'leftovers')) {
    const healed = applyHeal(combatant, 3);
    if (healed > 0) {
      logs.push({
        round: state.round,
        combatantId: combatant.id,
        message: `Leftovers: ${combatant.name} heals ${healed} HP! (HP: ${combatant.hp}/${combatant.maxHp})`,
      });
    }
  }

  // Sacred Ash: While in back row with ally in front (same column), heal ally 5 HP
  if (hasItem(combatant, 'sacred_ash') && combatant.position.row === 'back') {
    const allyInFront = state.combatants.find(c =>
      c.alive &&
      c.side === combatant.side &&
      c.id !== combatant.id &&
      c.position.row === 'front' &&
      c.position.column === combatant.position.column
    );
    if (allyInFront) {
      const healed = applyHeal(allyInFront, 5);
      if (healed > 0) {
        logs.push({
          round: state.round,
          combatantId: combatant.id,
          message: `Sacred Ash: ${allyInFront.name} heals ${healed} HP! (HP: ${allyInFront.hp}/${allyInFront.maxHp})`,
        });
      }
    }
  }

  // Power Herb: Turn 1 of combat: +1 energy
  if (hasItem(combatant, 'power_herb') && state.round === 1 && !combatant.itemState['powerHerbUsed']) {
    combatant.itemState['powerHerbUsed'] = 1;
    const energyGained = Math.min(1, combatant.energyCap - combatant.energy);
    if (energyGained > 0) {
      combatant.energy += energyGained;
      logs.push({
        round: state.round,
        combatantId: combatant.id,
        message: `Power Herb: ${combatant.name} gains 1 energy!`,
      });
    }
  }

  // Slow Start Gem: If flagged from previous turn, draw 2 extra cards
  if (hasItem(combatant, 'slow_start_gem') && combatant.itemState['slowStartDraw']) {
    combatant.itemState['slowStartDraw'] = 0;
    const { drawn } = drawExtraCards(combatant, 2);
    if (drawn.length > 0) {
      logs.push({
        round: state.round,
        combatantId: combatant.id,
        message: `Slow Start Gem: ${combatant.name} draws ${drawn.length} extra cards!`,
      });
    }
  }

  // Cerulean Tear: Heal ally in front of you in your column for 5 HP each turn
  if (hasItem(combatant, 'cerulean_tear')) {
    const allyInFront = state.combatants.find(c =>
      c.alive &&
      c.side === combatant.side &&
      c.id !== combatant.id &&
      c.position.row === 'front' &&
      c.position.column === combatant.position.column
    );
    if (allyInFront) {
      const healed = applyHeal(allyInFront, 5);
      if (healed > 0) {
        logs.push({
          round: state.round,
          combatantId: combatant.id,
          message: `Cerulean Tear: ${allyInFront.name} heals ${healed} HP! (HP: ${allyInFront.hp}/${allyInFront.maxHp})`,
        });
      }
    }
  }

  return logs;
}

// ============================================================
// Hook: onRoundStart
// ============================================================

/** Trigger item effects at round start (Iron Plate block, Assault Vest block). */
export function processItemRoundStart(
  state: CombatState,
  combatant: Combatant,
): LogEntry[] {
  const logs: LogEntry[] = [];
  if (!combatant.alive || combatant.heldItemIds.length === 0) return logs;

  // Iron Plate: Gain Block = (allies in same row including self) × 3
  if (hasItem(combatant, 'iron_plate')) {
    const alliesInRow = state.combatants.filter(c =>
      c.alive &&
      c.side === combatant.side &&
      c.position.row === combatant.position.row
    ).length;
    const blockGain = alliesInRow * 3;
    combatant.block += blockGain;
    logs.push({
      round: state.round,
      combatantId: combatant.id,
      message: `Iron Plate: ${combatant.name} gains ${blockGain} Block (${alliesInRow} allies in row)!`,
    });
  }

  // Assault Vest: +10 Block at round start
  if (hasItem(combatant, 'assault_vest')) {
    combatant.block += 10;
    logs.push({
      round: state.round,
      combatantId: combatant.id,
      message: `Assault Vest: ${combatant.name} gains 10 Block!`,
    });
  }

  // Bright Powder: Front row: Evasion +1 each round
  if (hasItem(combatant, 'bright_powder') && combatant.position.row === 'front') {
    applyStatus(state, combatant, 'evasion', 1, combatant.id);
    logs.push({
      round: state.round,
      combatantId: combatant.id,
      message: `Bright Powder: ${combatant.name} gains 1 Evasion!`,
    });
  }

  // Black Sludge: Poison types heal 3, others take 3
  if (hasItem(combatant, 'black_sludge')) {
    if (combatant.types.includes('poison')) {
      const healed = applyHeal(combatant, 3);
      if (healed > 0) {
        logs.push({
          round: state.round,
          combatantId: combatant.id,
          message: `Black Sludge: ${combatant.name} heals ${healed} HP! (HP: ${combatant.hp}/${combatant.maxHp})`,
        });
      }
    } else {
      applyBypassDamage(combatant, 3);
      logs.push({
        round: state.round,
        combatantId: combatant.id,
        message: `Black Sludge: ${combatant.name} takes 3 damage! (HP: ${combatant.hp}/${combatant.maxHp})`,
      });
    }
  }

  // Pewter Stone: Auto-provoke enemies in your column each round
  if (hasItem(combatant, 'pewter_stone')) {
    const enemiesInColumn = state.combatants.filter(c =>
      c.alive && c.side !== combatant.side && c.position.column === combatant.position.column
    );
    for (const enemy of enemiesInColumn) {
      applyStatus(state, enemy, 'provoke', 1, combatant.id);
      logs.push({
        round: state.round,
        combatantId: combatant.id,
        message: `Pewter Stone: ${enemy.name} is provoked by ${combatant.name}!`,
      });
    }
  }

  return logs;
}

// ============================================================
// Hook: onCardPlayed (after effects resolved)
// ============================================================

/** Process item effects after a card is played (Choice Specs lock, Metronome track, Life Orb recoil). */
export function processItemPostCard(
  state: CombatState,
  combatant: Combatant,
  card: MoveDefinition,
  didVanish?: boolean,
): LogEntry[] {
  const logs: LogEntry[] = [];
  if (combatant.heldItemIds.length === 0) return logs;

  // Metronome: Track consecutive attacks
  if (hasItem(combatant, 'metronome_item')) {
    if (isAttack(card)) {
      combatant.itemState['metronomeAttacks'] = (combatant.itemState['metronomeAttacks'] ?? 0) + 1;
    } else {
      combatant.itemState['metronomeAttacks'] = 0;
    }
  }

  // Life Orb: 3 self-damage per attack played
  if (hasItem(combatant, 'life_orb') && isAttack(card) && combatant.alive) {
    applyBypassDamage(combatant, 3);
    logs.push({
      round: state.round,
      combatantId: combatant.id,
      message: `Life Orb: ${combatant.name} takes 3 recoil damage! (HP: ${combatant.hp}/${combatant.maxHp})`,
    });
  }

  // Choice Scarf: Track cards played this turn
  if (hasItem(combatant, 'choice_scarf')) {
    combatant.itemState['scarfCardsPlayed'] = (combatant.itemState['scarfCardsPlayed'] ?? 0) + 1;
  }

  // Razor Fang: Mark as used after first attack
  if (hasItem(combatant, 'razor_fang') && isAttack(card) && !combatant.itemState['razorFangUsed']) {
    combatant.itemState['razorFangUsed'] = 1;
  }

  // Adrenaline Orb: Track attacks, +1 energy every 5th
  if (hasItem(combatant, 'adrenaline_orb') && isAttack(card)) {
    combatant.itemState['adrenalineAttacks'] = (combatant.itemState['adrenalineAttacks'] ?? 0) + 1;
    if (combatant.itemState['adrenalineAttacks'] >= 5) {
      combatant.itemState['adrenalineAttacks'] = 0;
      const energyGained = Math.min(1, combatant.energyCap - combatant.energy);
      if (energyGained > 0) {
        combatant.energy += energyGained;
        logs.push({
          round: state.round,
          combatantId: combatant.id,
          message: `Adrenaline Orb: ${combatant.name} gains 1 energy!`,
        });
      }
    }
  }

  // Protective Pads: Track attacks this turn, gain 5 Block on 2nd
  if (hasItem(combatant, 'protective_pads') && isAttack(card)) {
    combatant.itemState['attacksThisTurn'] = (combatant.itemState['attacksThisTurn'] ?? 0) + 1;
    if (combatant.itemState['attacksThisTurn'] === 2) {
      combatant.block += 5;
      logs.push({
        round: state.round,
        combatantId: combatant.id,
        message: `Protective Pads: ${combatant.name} gains 5 Block!`,
      });
    }
  }

  // Track cards played this turn for Slow Start Gem
  combatant.itemState['cardsPlayedThisTurn'] = (combatant.itemState['cardsPlayedThisTurn'] ?? 0) + 1;

  // Cinnabar Ash: When you play a card with Vanish, draw a card
  // Triggers for native vanish AND passive-granted vanish (e.g. Consuming Flame)
  if (hasItem(combatant, 'cinnabar_ash') && (didVanish ?? card.vanish)) {
    const { drawn } = drawExtraCards(combatant, 1);
    if (drawn.length > 0) {
      logs.push({
        round: state.round,
        combatantId: combatant.id,
        message: `Cinnabar Ash: ${combatant.name} draws a card!`,
      });
    }
  }

  return logs;
}

// ============================================================
// Hook: onTurnEnd
// ============================================================

/** Process item effects at end of turn (Slow Start Gem: draw 2 next turn if ≤1 cards played). */
export function processItemTurnEnd(
  _state: CombatState,
  combatant: Combatant,
): LogEntry[] {
  const logs: LogEntry[] = [];
  if (!combatant.alive || combatant.heldItemIds.length === 0) return logs;

  // Slow Start Gem: If 1 or fewer cards played this turn, draw 2 extra next turn
  if (hasItem(combatant, 'slow_start_gem')) {
    const cardsPlayed = combatant.itemState['cardsPlayedThisTurn'] ?? 0;
    if (cardsPlayed <= 1) {
      combatant.itemState['slowStartDraw'] = 1;
    }
  }

  return logs;
}

// ============================================================
// Hook: onDamageDealt (item effects for the attacker)
// ============================================================

/** Process item effects when the attacker deals damage (Shell Bell heal, Vermilion Spark provoke). */
export function processItemOnDamageDealt(
  state: CombatState,
  attacker: Combatant,
  target: Combatant,
  damageDealt: number,
  card?: MoveDefinition,
): LogEntry[] {
  const logs: LogEntry[] = [];
  if (attacker.heldItemIds.length === 0 || !attacker.alive) return logs;

  // Shell Bell: Heal 2 HP when you deal damage (once per card)
  if (hasItem(attacker, 'shell_bell') && damageDealt > 0 && !attacker.itemState['shellBellUsed']) {
    attacker.itemState['shellBellUsed'] = 1;
    const healed = applyHeal(attacker, 2);
    if (healed > 0) {
      logs.push({
        round: state.round,
        combatantId: attacker.id,
        message: `Shell Bell: ${attacker.name} heals ${healed} HP! (HP: ${attacker.hp}/${attacker.maxHp})`,
      });
    }
  }

  // Vermilion Spark: Contact moves provoke the target
  if (hasItem(attacker, 'vermilion_spark') && card?.contact && target.alive && damageDealt > 0) {
    applyStatus(state, target, 'provoke', 1, attacker.id);
    logs.push({
      round: state.round,
      combatantId: attacker.id,
      message: `Vermilion Spark: ${target.name} is provoked!`,
    });
  }

  return logs;
}

// ============================================================
// Hook: onDamageTaken (item effects for the defender)
// ============================================================

/** Process item effects when the defender takes HP damage (Sitrus Berry: draw on first hit). */
export function processItemOnDamageTaken(
  state: CombatState,
  target: Combatant,
  hpDamage: number,
): LogEntry[] {
  const logs: LogEntry[] = [];
  if (target.heldItemIds.length === 0 || !target.alive || hpDamage <= 0) return logs;

  // Sitrus Berry: First damage taken in combat → draw 2 cards
  if (hasItem(target, 'sitrus_berry') && !target.itemState['sitrusBerryUsed']) {
    target.itemState['sitrusBerryUsed'] = 1;
    const { drawn } = drawExtraCards(target, 2);
    if (drawn.length > 0) {
      logs.push({
        round: state.round,
        combatantId: target.id,
        message: `Sitrus Berry: ${target.name} draws ${drawn.length} cards!`,
      });
    }
  }

  return logs;
}

// ============================================================
// Hook: Damage Bonus (offensive, with target)
// ============================================================

/** Calculate item-based offensive damage bonus (requires target for positioning/type checks). */
export function getItemDamageBonus(
  _state: CombatState,
  source: Combatant,
  target: Combatant,
  card: MoveDefinition,
  typeEffectiveness?: number,
): number {
  let bonus = 0;
  if (source.heldItemIds.length === 0) return 0;

  for (const itemId of source.heldItemIds) {
    // Sniper Scope: +5 damage to enemies in your column
    if (itemId === 'sniper_scope' && target.position.column === source.position.column) {
      bonus += 5;
    }

    // Pallet Cannon: +5 damage to enemies in your column
    if (itemId === 'pallet_cannon' && target.position.column === source.position.column) {
      bonus += 5;
    }

    // Guerrilla Boots: +4 after switching forward
    if (itemId === 'guerrilla_boots' && source.itemState['guerillaFront']) {
      bonus += 4;
    }

    // Wide Lens: +2 unconditional
    if (itemId === 'wide_lens') {
      bonus += 2;
    }

    // Choice Band: +8 (restriction in getPlayableCards)
    if (itemId === 'choice_band') {
      bonus += 8;
    }

    // Scope Lens: +3 for single-target attacks
    if (itemId === 'scope_lens') {
      const singleTargetRanges = ['front_enemy', 'back_enemy', 'any_enemy'];
      if (singleTargetRanges.includes(card.range)) {
        bonus += 3;
      }
    }

    // Choice Specs: +8 unconditional (restriction in getPlayableCards)
    if (itemId === 'choice_specs') {
      bonus += 8;
    }

    // Toxic Orb: +4 unconditional
    if (itemId === 'toxic_orb') {
      bonus += 4;
    }

    // Expert Belt: +5 on super-effective hits
    if (itemId === 'expert_belt' && typeEffectiveness !== undefined && typeEffectiveness > 1.0) {
      bonus += 5;
    }

    // Razor Fang: +8 first attack each battle
    if (itemId === 'razor_fang' && !source.itemState['razorFangUsed']) {
      bonus += 8;
    }

    // Metronome: +2 per consecutive attack this turn
    if (itemId === 'metronome_item') {
      bonus += 2 * (source.itemState['metronomeAttacks'] ?? 0);
    }
  }

  return bonus;
}

// ============================================================
// Hook: Damage Bonus (source-only, for hand preview)
// ============================================================

/** Calculate item damage bonus without a target (used for hand card previews). */
export function getItemDamageBonusSourceOnly(
  source: Combatant,
  card: MoveDefinition,
): number {
  let bonus = 0;
  if (source.heldItemIds.length === 0) return 0;

  for (const itemId of source.heldItemIds) {
    // Sniper Scope: +5 (approximate, any enemy in column would get it)
    if (itemId === 'sniper_scope') {
      bonus += 5;
    }

    // Pallet Cannon: +5 (column bonus, approximate)
    if (itemId === 'pallet_cannon') {
      bonus += 5;
    }

    // Guerrilla Boots: front bonus active → +4
    if (itemId === 'guerrilla_boots' && source.itemState['guerillaFront']) {
      bonus += 4;
    }

    // Wide Lens: +2
    if (itemId === 'wide_lens') {
      bonus += 2;
    }

    // Choice Band: +8
    if (itemId === 'choice_band') {
      bonus += 8;
    }

    // Scope Lens: +3 for single-target
    if (itemId === 'scope_lens') {
      const singleTargetRanges = ['front_enemy', 'back_enemy', 'any_enemy'];
      if (singleTargetRanges.includes(card.range)) {
        bonus += 3;
      }
    }

    // Choice Specs: +8
    if (itemId === 'choice_specs') {
      bonus += 8;
    }

    // Toxic Orb: +4
    if (itemId === 'toxic_orb') {
      bonus += 4;
    }

    // Expert Belt: skip (needs target type)

    // Razor Fang: +8 first attack (source-only approximation)
    if (itemId === 'razor_fang' && !source.itemState['razorFangUsed']) {
      bonus += 8;
    }

    // Metronome: +2 × count
    if (itemId === 'metronome_item') {
      bonus += 2 * (source.itemState['metronomeAttacks'] ?? 0);
    }
  }

  return bonus;
}

// ============================================================
// Hook: Damage Reduction (defensive)
// ============================================================

/** Calculate item-based defensive damage reduction (Buddy Guard column protection). */
export function getItemDamageReduction(
  state: CombatState,
  target: Combatant,
  card?: MoveDefinition,
): number {
  let reduction = 0;

  // Buddy Guard: Allies in Buddy Guard holder's column take 4 less single-target damage.
  // Does NOT protect the Buddy Guard holder itself.
  if (card) {
    const singleTargetRanges = ['front_enemy', 'back_enemy', 'any_enemy'];
    if (singleTargetRanges.includes(card.range)) {
      const buddyGuardAlly = state.combatants.find(c =>
        c.alive &&
        c.side === target.side &&
        c.id !== target.id &&
        hasItem(c, 'buddy_guard') &&
        c.position.column === target.position.column
      );
      if (buddyGuardAlly) {
        reduction += 4;
      }
    }
  }

  return reduction;
}

// ============================================================
// Hook: Damage Multiplier (Life Orb)
// ============================================================

/** Get item-based damage multiplier (Life Orb: 1.3x, Fuchsia Shuriken: 0.5x on damage+status cards). */
export function getItemDamageMultiplier(source: Combatant, card?: MoveDefinition): number {
  let mult = 1.0;
  if (hasItem(source, 'life_orb')) mult *= 1.3;
  if (hasItem(source, 'fuchsia_shuriken') && card && cardHasDamageAndStatus(card)) mult *= 0.5;
  return mult;
}

// ============================================================
// Hook: Survival (Focus Sash)
// ============================================================

/** Check if an item prevents lethal damage (Focus Sash). Returns true if survived. */
export function checkItemSurvival(target: Combatant): boolean {
  if (hasItem(target, 'focus_sash') && !target.focusSashUsed) {
    target.hp = 1;
    target.alive = true;
    target.focusSashUsed = true;
    return true;
  }
  return false;
}

// ============================================================
// Hook: Heal Modifier
// ============================================================

/** Get item-based heal modifier (Big Root: +50% healing). */
export function getItemHealModifier(target: Combatant): number {
  if (hasItem(target, 'big_root')) return 1.5;
  return 1.0;
}

// ============================================================
// Hook: On Switch (position change)
// ============================================================

/** Process item effects on position switch (Smoke Ball provoke, Guerrilla Boots). */
export function processItemOnSwitch(
  state: CombatState,
  combatant: Combatant,
  oldPos: Position,
): LogEntry[] {
  const logs: LogEntry[] = [];
  if (combatant.heldItemIds.length === 0) return logs;

  // Viridian Target: Column switch provokes enemies in that column
  if (hasItem(combatant, 'viridian_target') && oldPos.column !== combatant.position.column) {
    const enemiesInColumn = state.combatants.filter(c =>
      c.alive && c.side !== combatant.side && c.position.column === combatant.position.column
    );
    for (const enemy of enemiesInColumn) {
      applyStatus(state, enemy, 'provoke', 1, combatant.id);
      logs.push({
        round: state.round,
        combatantId: combatant.id,
        message: `Viridian Target: ${enemy.name} is provoked by ${combatant.name}!`,
      });
    }
  }

  // Saffron Spoon: Switching into an enemy column applies Enfeeble 3 to all enemies in that column
  if (hasItem(combatant, 'saffron_spoon') && oldPos.column !== combatant.position.column) {
    const enemiesInColumn = state.combatants.filter(c =>
      c.alive && c.side !== combatant.side && c.position.column === combatant.position.column
    );
    for (const enemy of enemiesInColumn) {
      applyStatus(state, enemy, 'enfeeble', 3, combatant.id);
      logs.push({
        round: state.round,
        combatantId: combatant.id,
        message: `Saffron Spoon: ${enemy.name} is enfeebled by ${combatant.name}!`,
      });
    }
  }

  // Smoke Ball: When switching columns, provoke all enemies in the column you moved to
  if (hasItem(combatant, 'smoke_ball') && oldPos.column !== combatant.position.column) {
    const enemiesInColumn = state.combatants.filter(c =>
      c.alive && c.side !== combatant.side && c.position.column === combatant.position.column
    );
    for (const enemy of enemiesInColumn) {
      applyStatus(state, enemy, 'provoke', 2, combatant.id);
      logs.push({
        round: state.round,
        combatantId: combatant.id,
        message: `Smoke Ball: ${enemy.name} is provoked by ${combatant.name}!`,
      });
    }
  }

  // Guerrilla Boots: Front→back: gain 3 Block. Back→front: +4 damage flag.
  if (hasItem(combatant, 'guerrilla_boots')) {
    if (combatant.position.row === 'back' && oldPos.row === 'front') {
      combatant.block += 3;
      logs.push({
        round: state.round,
        combatantId: combatant.id,
        message: `Guerrilla Boots: ${combatant.name} retreats and gains 3 Block!`,
      });
    } else if (combatant.position.row === 'front' && oldPos.row === 'back') {
      combatant.itemState['guerillaFront'] = 1;
      logs.push({
        round: state.round,
        combatantId: combatant.id,
        message: `Guerrilla Boots: ${combatant.name} charges forward! All attacks deal +4 damage this turn!`,
      });
    }
  }

  return logs;
}

// ============================================================
// Hook: Switch Limit
// ============================================================

/** Get item-imposed switch limit, or null if no item. */
export function getItemMaxSwitches(combatant: Combatant): number | null {
  if (combatant.heldItemIds.length === 0) return null;
  // Guerrilla Boots grants 2 switches; all other items grant 1
  return hasItem(combatant, 'guerrilla_boots') ? 2 : 1;
}

// ============================================================
// Hook: Card Playability Restriction
// ============================================================

/** Check if an item restricts playing this card. Returns false = card is blocked. */
export function checkItemPlayRestriction(
  combatant: Combatant,
  card: MoveDefinition,
): boolean {
  if (combatant.heldItemIds.length === 0) return true; // no restriction

  const frontRowRanges = new Set(['front_enemy', 'front_row']);

  for (const itemId of combatant.heldItemIds) {
    // Assault Vest: attacks only
    if (itemId === 'assault_vest' && !isAttack(card)) {
      return false;
    }

    // Choice Band: front-row attacks only (front_enemy/front_row), no all_enemies
    if (itemId === 'choice_band') {
      if (!isAttack(card)) return false;
      if (!frontRowRanges.has(card.range)) return false;
      if (card.range === 'all_enemies') return false;
    }

    // Choice Specs: no front-row attacks, no all_enemies
    if (itemId === 'choice_specs') {
      if (isAttack(card) && (frontRowRanges.has(card.range) || card.range === 'all_enemies')) return false;
    }

    // Choice Scarf: max 2 cards per turn
    if (itemId === 'choice_scarf') {
      if ((combatant.itemState['scarfCardsPlayed'] ?? 0) >= 2) return false;
    }
  }

  return true;
}

// ============================================================
// Helper: Card has both damage and status effects
// ============================================================

/** Check if a card has both a damage-type effect and an apply_status effect. */
function cardHasDamageAndStatus(card: MoveDefinition): boolean {
  const hasDamage = card.effects.some(e =>
    e.type === 'damage' || e.type === 'multi_hit' ||
    e.type === 'heal_on_hit' || e.type === 'recoil'
  );
  const hasStatus = card.effects.some(e => e.type === 'apply_status');
  return hasDamage && hasStatus;
}

// ============================================================
// Hook: Status Stacks Multiplier (Fuchsia Shuriken)
// ============================================================

/** Get item-based status stacks multiplier for cards that deal damage AND apply status. */
export function getItemStatusStacksMultiplier(
  source: Combatant,
  card: MoveDefinition,
): number {
  if (hasItem(source, 'fuchsia_shuriken') && cardHasDamageAndStatus(card)) return 2;
  return 1;
}

// ============================================================
// Hook: onKO (enemy dies)
// ============================================================

/** Process item effects when a combatant is KO'd (Lavender Tombstone, Moxie Charm, Venom Sac). */
export function processItemOnKO(
  state: CombatState,
  killer: Combatant,
  victim: Combatant,
): LogEntry[] {
  const logs: LogEntry[] = [];

  // Moxie Charm: On KO, killer gains +1 energy and draws 1 card
  if (killer.alive && hasItem(killer, 'moxie_charm') && victim.side !== killer.side) {
    const energyGained = Math.min(1, killer.energyCap - killer.energy);
    if (energyGained > 0) {
      killer.energy += energyGained;
    }
    const { drawn } = drawExtraCards(killer, 1);
    logs.push({
      round: state.round,
      combatantId: killer.id,
      message: `Moxie Charm: ${killer.name} gains ${energyGained} energy${drawn.length > 0 ? ' and draws a card' : ''}!`,
    });
  }

  // Venom Sac: Transfer victim's poison stacks to a random alive enemy
  if (killer.alive && hasItem(killer, 'venom_sac') && victim.side !== killer.side) {
    const poisonStacks = getStatusStacks(victim, 'poison');
    if (poisonStacks > 0) {
      const aliveEnemies = state.combatants.filter(c =>
        c.alive && c.side === victim.side && c.id !== victim.id
      );
      if (aliveEnemies.length > 0) {
        const randomTarget = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
        applyStatus(state, randomTarget, 'poison', poisonStacks, killer.id);
        logs.push({
          round: state.round,
          combatantId: killer.id,
          message: `Venom Sac: ${poisonStacks} Poison transferred to ${randomTarget.name}!`,
        });
      }
    }
  }

  // Lavender Tombstone: If an enemy dies in your column, regain 1 energy
  if (victim.side === 'enemy') {
    const holders = state.combatants.filter(c =>
      c.alive && c.side === 'player' &&
      hasItem(c, 'lavender_tombstone') &&
      c.position.column === victim.position.column
    );
    for (const holder of holders) {
      const energyGained = Math.min(1, holder.energyCap - holder.energy);
      if (energyGained > 0) {
        holder.energy += energyGained;
        logs.push({
          round: state.round,
          combatantId: holder.id,
          message: `Lavender Tombstone: ${holder.name} regains 1 energy!`,
        });
      }
    }
  }

  return logs;
}

// ============================================================
// Hook: Battle End (victory only)
// ============================================================

/** Process item effects at battle end (Celadon Leaf: heal 6 HP). */
export function processItemBattleEnd(state: CombatState): void {
  for (const c of state.combatants) {
    if (!c.alive || c.side !== 'player') continue;

    // Celadon Leaf: Heal the holder for 6 HP at combat end
    if (hasItem(c, 'celadon_leaf')) {
      const healed = applyHeal(c, 6);
      if (healed > 0) {
        state.log.push({
          round: state.round,
          combatantId: c.id,
          message: `celadon_leaf: ${c.name} heals ${healed} HP!`,
        });
      }
    }

    // Oran Berry: End of battle, heal 15 if below 50% HP
    if (hasItem(c, 'oran_berry') && c.hp < c.maxHp * 0.5) {
      const healed = applyHeal(c, 15);
      if (healed > 0) {
        state.log.push({
          round: state.round,
          combatantId: c.id,
          message: `Oran Berry: ${c.name} heals ${healed} HP!`,
        });
      }
    }
  }
}
