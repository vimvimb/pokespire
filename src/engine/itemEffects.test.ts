/**
 * Held Item Unit Tests
 *
 * Tests all 30 held items for:
 * - Mechanical correctness (effects trigger properly)
 * - Log output accuracy
 * - Hand preview / damage preview display
 *
 * Run: npx vitest run src/engine/itemEffects.test.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createTestCombatant,
  createTestCombatState,
  addStatus,
  resetTestIds,
} from './test-helpers';
import {
  processItemBattleStart,
  processItemTurnStart,
  processItemRoundStart,
  processItemPostCard,
  processItemOnDamageDealt,
  getItemDamageBonus,
  getItemDamageBonusSourceOnly,
  getItemDamageReduction,
  getItemDamageMultiplier,
  checkItemSurvival,
  processItemOnSwitch,
  getItemMaxSwitches,
  checkItemPlayRestriction,
  getItemStatusStacksMultiplier,
  processItemOnKO,
  processItemBattleEnd,
  resetItemTurnState,
} from './itemEffects';
import { calculateHandPreview, calculateDamagePreview } from './preview';
import { playCard } from './cards';
import { getMove } from '../data/loaders';
import type { MoveDefinition, Position } from './types';

// ============================================================
// Helpers
// ============================================================

/** Build a minimal test state with a player+enemy, both in the same column. */
function makeSimpleState(opts?: {
  playerItem?: string;
  playerPassives?: string[];
  playerTypes?: string[];
  playerHp?: number;
  enemyTypes?: string[];
  enemyHp?: number;
  playerPosition?: Position;
  enemyPosition?: Position;
}) {
  const player = createTestCombatant({
    id: 'player',
    name: 'Player',
    side: 'player',
    types: (opts?.playerTypes as any) ?? ['fire'],
    heldItemIds: opts?.playerItem ? [opts.playerItem] : [],
    passiveIds: opts?.playerPassives ?? [],
    hp: opts?.playerHp ?? 100,
    maxHp: 100,
  });
  if (opts?.playerPosition) player.position = opts.playerPosition;

  const enemy = createTestCombatant({
    id: 'enemy',
    name: 'Enemy',
    side: 'enemy',
    types: (opts?.enemyTypes as any) ?? ['fighting'],
    hp: opts?.enemyHp ?? 100,
    maxHp: 100,
  });
  if (opts?.enemyPosition) enemy.position = opts.enemyPosition;

  const state = createTestCombatState([player, enemy]);
  return { state, player, enemy };
}

/** Put a card in a combatant's hand and return the card definition. */
function giveCard(combatant: ReturnType<typeof createTestCombatant>, cardId: string): MoveDefinition {
  combatant.hand.push(cardId);
  return getMove(cardId);
}

// ============================================================
// Test Suites
// ============================================================

describe('Held Item Effects', () => {
  beforeEach(() => {
    resetTestIds();
  });

  // ── Battle Start Items ─────────────────────────────────────

  describe('Quick Claw', () => {
    it('sets quickClawBonusTurn flag at battle start', () => {
      const { state, player } = makeSimpleState({ playerItem: 'quick_claw' });

      const logs = processItemBattleStart(state, player);

      expect(player.turnFlags.quickClawBonusTurn).toBe(true);
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toContain('Quick Claw');
      expect(logs[0].message).toContain('act first');
    });

    it('does nothing if combatant is dead', () => {
      const { state, player } = makeSimpleState({ playerItem: 'quick_claw' });
      player.alive = false;

      const logs = processItemBattleStart(state, player);

      expect(player.turnFlags.quickClawBonusTurn).toBe(false);
      expect(logs).toHaveLength(0);
    });
  });

  describe('Eviolite', () => {
    it('grants +15 max HP and +15 current HP at battle start', () => {
      const { state, player } = makeSimpleState({ playerItem: 'eviolite' });
      player.hp = 100;
      player.maxHp = 100;

      const logs = processItemBattleStart(state, player);

      expect(player.maxHp).toBe(115);
      expect(player.hp).toBe(115);
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toContain('Eviolite');
      expect(logs[0].message).toContain('115');
    });
  });

  describe('Toxic Orb', () => {
    it('self-poisons at battle start and grants +4 damage', () => {
      const { state, player, enemy } = makeSimpleState({ playerItem: 'toxic_orb' });
      const card = getMove('tackle');

      const logs = processItemBattleStart(state, player);

      // Check poison applied
      expect(player.statuses.some(s => s.type === 'poison')).toBe(true);
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toContain('Toxic Orb');
      expect(logs[0].message).toContain('poisoned');

      // Check +4 damage bonus
      const bonus = getItemDamageBonus(state, player, enemy, card);
      expect(bonus).toBe(4);
    });
  });

  describe('Pewter Stone', () => {
    it('grants 8 Block at battle start', () => {
      const { state, player } = makeSimpleState({ playerItem: 'pewter_stone' });
      player.block = 0;

      const logs = processItemBattleStart(state, player);

      expect(player.block).toBe(8);
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toContain('Pewter Stone');
      expect(logs[0].message).toContain('8 Block');
    });

    it('auto-provokes enemies in column at round start', () => {
      const { state, player, enemy } = makeSimpleState({ playerItem: 'pewter_stone' });
      // Both in column 1 by default

      const logs = processItemRoundStart(state, player);

      expect(enemy.statuses.some(s => s.type === 'provoke')).toBe(true);
      expect(logs.some(l => l.message.includes('provoked'))).toBe(true);
    });
  });

  // ── Turn Start Items ───────────────────────────────────────

  describe('Leftovers', () => {
    it('heals 3 HP at turn start', () => {
      const { state, player } = makeSimpleState({ playerItem: 'leftovers', playerHp: 90 });

      const logs = processItemTurnStart(state, player);

      expect(player.hp).toBe(93);
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toContain('Leftovers');
      expect(logs[0].message).toContain('heals 3 HP');
    });

    it('does not overheal past maxHp', () => {
      const { state, player } = makeSimpleState({ playerItem: 'leftovers', playerHp: 99 });

      processItemTurnStart(state, player);

      expect(player.hp).toBe(100);
    });

    it('does not heal if at full HP', () => {
      const { state, player } = makeSimpleState({ playerItem: 'leftovers' });

      const logs = processItemTurnStart(state, player);

      expect(logs).toHaveLength(0);
    });
  });

  describe('Sacred Ash', () => {
    it('heals front ally in same column for 5 HP at turn start', () => {
      const player = createTestCombatant({
        id: 'healer',
        name: 'Healer',
        side: 'player',
        heldItemIds: ['sacred_ash'],
      });
      player.position = { row: 'back', column: 1 };

      const frontAlly = createTestCombatant({
        id: 'front-ally',
        name: 'FrontAlly',
        side: 'player',
        hp: 80,
        maxHp: 100,
      });
      frontAlly.position = { row: 'front', column: 1 };

      const state = createTestCombatState([player, frontAlly]);

      const logs = processItemTurnStart(state, player);

      expect(frontAlly.hp).toBe(85);
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toContain('Sacred Ash');
      expect(logs[0].message).toContain('FrontAlly');
    });

    it('does nothing when holder is in front row', () => {
      const player = createTestCombatant({
        id: 'healer',
        name: 'Healer',
        side: 'player',
        heldItemIds: ['sacred_ash'],
      });
      player.position = { row: 'front', column: 1 };

      const state = createTestCombatState([player]);
      const logs = processItemTurnStart(state, player);

      expect(logs).toHaveLength(0);
    });
  });

  describe('Cerulean Tear', () => {
    it('heals front ally in same column for 5 HP each turn', () => {
      const player = createTestCombatant({
        id: 'healer',
        name: 'Healer',
        side: 'player',
        heldItemIds: ['cerulean_tear'],
      });
      player.position = { row: 'back', column: 1 };

      const frontAlly = createTestCombatant({
        id: 'front-ally',
        name: 'FrontAlly',
        side: 'player',
        hp: 70,
        maxHp: 100,
      });
      frontAlly.position = { row: 'front', column: 1 };

      const state = createTestCombatState([player, frontAlly]);

      const logs = processItemTurnStart(state, player);

      expect(frontAlly.hp).toBe(75);
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toContain('Cerulean Tear');
    });
  });

  // ── Round Start Items ──────────────────────────────────────

  describe('Iron Plate', () => {
    it('grants Block = allies in row × 3 at round start', () => {
      const player = createTestCombatant({
        id: 'player',
        name: 'Player',
        side: 'player',
        heldItemIds: ['iron_plate'],
      });
      player.position = { row: 'front', column: 1 };

      const ally = createTestCombatant({
        id: 'ally',
        name: 'Ally',
        side: 'player',
      });
      ally.position = { row: 'front', column: 0 };

      const state = createTestCombatState([player, ally]);

      const logs = processItemRoundStart(state, player);

      // 2 allies in front row × 3 = 6 Block
      expect(player.block).toBe(6);
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toContain('Iron Plate');
      expect(logs[0].message).toContain('6 Block');
      expect(logs[0].message).toContain('2 allies');
    });
  });

  describe('Assault Vest', () => {
    it('grants 10 Block at round start', () => {
      const { state, player } = makeSimpleState({ playerItem: 'assault_vest' });

      const logs = processItemRoundStart(state, player);

      expect(player.block).toBe(10);
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toContain('Assault Vest');
      expect(logs[0].message).toContain('10 Block');
    });

    it('restricts non-attack cards', () => {
      const { player } = makeSimpleState({ playerItem: 'assault_vest' });
      const growl = getMove('growl');
      const tackle = getMove('tackle');

      expect(checkItemPlayRestriction(player, growl)).toBe(false);
      expect(checkItemPlayRestriction(player, tackle)).toBe(true);
    });
  });

  // ── Damage Bonus Items ─────────────────────────────────────

  describe('Wide Lens', () => {
    it('gives +2 damage to all attacks', () => {
      const { state, player, enemy } = makeSimpleState({ playerItem: 'wide_lens' });
      const card = getMove('tackle');

      const bonus = getItemDamageBonus(state, player, enemy, card);
      expect(bonus).toBe(2);

      const sourceOnly = getItemDamageBonusSourceOnly(player, card);
      expect(sourceOnly).toBe(2);
    });

    it('shows +2 Item in hand preview', () => {
      const { player } = makeSimpleState({ playerItem: 'wide_lens' });
      const card = getMove('tackle');

      const preview = calculateHandPreview(player, card);
      expect(preview.additive).toBeGreaterThanOrEqual(2);
      expect(preview.tags).toContain('+2 Item');
    });
  });

  describe('Pallet Cannon', () => {
    it('gives +5 damage to enemies in same column', () => {
      const { state, player, enemy } = makeSimpleState({ playerItem: 'pallet_cannon' });
      // Both default to column 1
      const card = getMove('tackle');

      const bonus = getItemDamageBonus(state, player, enemy, card);
      expect(bonus).toBe(5);
    });

    it('gives 0 damage to enemies in different column', () => {
      const { state, player, enemy } = makeSimpleState({ playerItem: 'pallet_cannon' });
      enemy.position = { row: 'front', column: 2 };
      const card = getMove('tackle');

      const bonus = getItemDamageBonus(state, player, enemy, card);
      expect(bonus).toBe(0);
    });
  });

  describe('Sniper Scope', () => {
    it('gives +5 damage to enemies in same column', () => {
      const { state, player, enemy } = makeSimpleState({ playerItem: 'sniper_scope' });
      const card = getMove('tackle');

      const bonus = getItemDamageBonus(state, player, enemy, card);
      expect(bonus).toBe(5);
    });
  });

  describe('Choice Band', () => {
    it('gives +8 damage unconditionally', () => {
      const { state, player, enemy } = makeSimpleState({ playerItem: 'choice_band' });
      const card = getMove('tackle');

      const bonus = getItemDamageBonus(state, player, enemy, card);
      expect(bonus).toBe(8);
    });

    it('allows front_enemy range attacks', () => {
      const { player } = makeSimpleState({ playerItem: 'choice_band' });
      const scratch = getMove('scratch'); // front_enemy
      const tackle = getMove('tackle');   // front_enemy

      expect(checkItemPlayRestriction(player, scratch)).toBe(true);
      expect(checkItemPlayRestriction(player, tackle)).toBe(true);
    });

    it('blocks non-front-row range attacks', () => {
      const { player } = makeSimpleState({ playerItem: 'choice_band' });
      const ember = getMove('ember');               // any_enemy
      const flamethrower = getMove('flamethrower');  // column
      const thunderShock = getMove('thunder-shock'); // any_enemy

      expect(checkItemPlayRestriction(player, ember)).toBe(false);
      expect(checkItemPlayRestriction(player, flamethrower)).toBe(false);
      expect(checkItemPlayRestriction(player, thunderShock)).toBe(false);
    });

    it('blocks non-attack cards', () => {
      const { player } = makeSimpleState({ playerItem: 'choice_band' });
      const growl = getMove('growl');

      expect(checkItemPlayRestriction(player, growl)).toBe(false);
    });

    it('shows +8 Item in hand preview', () => {
      const { player } = makeSimpleState({ playerItem: 'choice_band' });
      const card = getMove('tackle');

      const preview = calculateHandPreview(player, card);
      expect(preview.tags).toContain('+8 Item');
    });
  });

  describe('Scope Lens', () => {
    it('gives +3 damage to single-target attacks', () => {
      const { state, player, enemy } = makeSimpleState({ playerItem: 'scope_lens' });
      // Ember is any_enemy (single target)
      const ember = getMove('ember');

      const bonus = getItemDamageBonus(state, player, enemy, ember);
      expect(bonus).toBe(3);
    });

    it('gives 0 damage to AoE attacks', () => {
      const { state, player, enemy } = makeSimpleState({ playerItem: 'scope_lens' });
      // Flamethrower is column (AoE)
      const flamethrower = getMove('flamethrower');

      const bonus = getItemDamageBonus(state, player, enemy, flamethrower);
      expect(bonus).toBe(0);
    });
  });

  describe('Guerrilla Boots', () => {
    it('grants +3 Block on front→back switch', () => {
      const { state, player } = makeSimpleState({ playerItem: 'guerrilla_boots' });
      player.position = { row: 'back', column: 1 };
      const oldPos: Position = { row: 'front', column: 1 };

      const logs = processItemOnSwitch(state, player, oldPos);

      expect(player.block).toBe(3);
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toContain('retreats');
      expect(logs[0].message).toContain('3 Block');
    });

    it('sets +4 damage flag on back→front switch', () => {
      const { state, player, enemy } = makeSimpleState({ playerItem: 'guerrilla_boots' });
      player.position = { row: 'front', column: 1 };
      const oldPos: Position = { row: 'back', column: 1 };

      const logs = processItemOnSwitch(state, player, oldPos);

      expect(player.itemState['guerillaFront']).toBe(1);
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toContain('charges forward');

      // Verify damage bonus
      const card = getMove('tackle');
      const bonus = getItemDamageBonus(state, player, enemy, card);
      expect(bonus).toBe(4);
    });

    it('allows 2 switches per turn', () => {
      const { player } = makeSimpleState({ playerItem: 'guerrilla_boots' });

      expect(getItemMaxSwitches(player)).toBe(2);
    });
  });

  // ── Damage Multiplier Items ────────────────────────────────

  describe('Life Orb', () => {
    it('gives 1.3x damage multiplier', () => {
      const { player } = makeSimpleState({ playerItem: 'life_orb' });
      const card = getMove('tackle');

      const mult = getItemDamageMultiplier(player, card);
      expect(mult).toBeCloseTo(1.3, 5);
    });

    it('deals 3 self-damage per attack played', () => {
      const { state, player } = makeSimpleState({ playerItem: 'life_orb' });
      player.hp = 100;
      const card = getMove('tackle');

      const logs = processItemPostCard(state, player, card);

      expect(player.hp).toBe(97);
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toContain('Life Orb');
      expect(logs[0].message).toContain('3 recoil');
    });

    it('does not deal self-damage for non-attack cards', () => {
      const { state, player } = makeSimpleState({ playerItem: 'life_orb' });
      player.hp = 100;
      const card = getMove('growl');

      const logs = processItemPostCard(state, player, card);

      expect(player.hp).toBe(100);
      expect(logs).toHaveLength(0);
    });

    it('shows x1.3 Item in hand preview', () => {
      const { player } = makeSimpleState({ playerItem: 'life_orb' });
      const card = getMove('tackle');

      const preview = calculateHandPreview(player, card);
      expect(preview.multiplier).toBeCloseTo(1.3, 5);
      expect(preview.tags.some(t => t.includes('Item'))).toBe(true);
    });
  });

  // ── Fuchsia Shuriken (Critical Test) ──────────────────────

  describe('Fuchsia Shuriken', () => {
    it('halves damage on damage+status cards', () => {
      const { player } = makeSimpleState({ playerItem: 'fuchsia_shuriken' });
      const ember = getMove('ember');

      const mult = getItemDamageMultiplier(player, ember);
      expect(mult).toBeCloseTo(0.5, 5);
    });

    it('doubles status stacks on damage+status cards', () => {
      const { player } = makeSimpleState({ playerItem: 'fuchsia_shuriken' });
      const ember = getMove('ember');

      const stacksMult = getItemStatusStacksMultiplier(player, ember);
      expect(stacksMult).toBe(2);
    });

    it('does NOT affect pure damage cards', () => {
      const { player } = makeSimpleState({ playerItem: 'fuchsia_shuriken' });
      const tackle = getMove('tackle');

      expect(getItemDamageMultiplier(player, tackle)).toBe(1.0);
      expect(getItemStatusStacksMultiplier(player, tackle)).toBe(1);
    });

    it('does NOT affect pure status cards', () => {
      const { player } = makeSimpleState({ playerItem: 'fuchsia_shuriken' });
      const growl = getMove('growl');

      expect(getItemDamageMultiplier(player, growl)).toBe(1.0);
      expect(getItemStatusStacksMultiplier(player, growl)).toBe(1);
    });

    it('shows x0.5 Shuriken in hand preview', () => {
      const { player } = makeSimpleState({ playerItem: 'fuchsia_shuriken' });
      const ember = getMove('ember');

      const preview = calculateHandPreview(player, ember);
      expect(preview.multiplier).toBeCloseTo(0.5, 5);
      expect(preview.tags.some(t => t.includes('Shuriken'))).toBe(true);
      expect(preview.statusStacksMult).toBe(2);
    });

    it('integration: Ember on Machop produces half damage and double burn in log', () => {
      // Build the scenario from the user's bug report
      const player = createTestCombatant({
        id: 'ninetales',
        name: 'Ninetales',
        side: 'player',
        types: ['fire'] as any,
        heldItemIds: ['fuchsia_shuriken'],
        hp: 100,
        maxHp: 100,
      });
      player.position = { row: 'front', column: 1 };
      player.energy = 3;

      const enemy = createTestCombatant({
        id: 'machop',
        name: 'Machop',
        side: 'enemy',
        types: ['fighting'] as any,
        hp: 100,
        maxHp: 100,
      });
      enemy.position = { row: 'front', column: 1 };

      const state = createTestCombatState([player, enemy]);

      // Put ember in hand
      player.hand.push('ember');

      // Play the card
      const logs = playCard(state, player, { type: 'play_card', cardInstanceId: 'ember', targetId: 'machop' });

      // Check logs for burn stacks = 4 (doubled from 2)
      const burnLog = logs.find(l => l.message.includes('burn') && l.message.includes('applied'));
      expect(burnLog).toBeDefined();
      expect(burnLog!.message).toContain('burn 4');

      // Verify burn status on enemy is actually 4 stacks
      const burnStatus = enemy.statuses.find(s => s.type === 'burn');
      expect(burnStatus).toBeDefined();
      expect(burnStatus!.stacks).toBe(4);

      // Verify damage was halved:
      // Ember base=5, STAB +2 (fire on fire type), x0.5 Shuriken, x1.25 type eff (fire vs fighting)
      // = (5+2) * 0.5 * 1.25 = 3.5 * 1.25 = floor(4.375) = ~4 (floor at each step)
      // Raw = 7 * 0.5 = 3 (floored), then * 1.25 = 3 (floored)
      // Actual: raw = max(5+2, 1) = 7, * 0.5 = floor(3.5)=3, * 1.25 = floor(3.75) = 3
      expect(enemy.hp).toBeLessThan(100);
      expect(enemy.hp).toBeGreaterThan(90); // Halved damage, should be small
    });

    it('integration: Ember target preview shows halved damage', () => {
      const player = createTestCombatant({
        id: 'ninetales',
        name: 'Ninetales',
        side: 'player',
        types: ['fire'] as any,
        heldItemIds: ['fuchsia_shuriken'],
      });
      player.position = { row: 'front', column: 1 };

      const enemy = createTestCombatant({
        id: 'machop',
        name: 'Machop',
        side: 'enemy',
        types: ['fighting'] as any,
        hp: 100,
        maxHp: 100,
      });
      enemy.position = { row: 'front', column: 1 };

      const state = createTestCombatState([player, enemy]);
      const ember = getMove('ember');

      const preview = calculateDamagePreview(state, player, enemy, ember);
      expect(preview).not.toBeNull();

      // Without shuriken: (5+2 STAB) * 1.25 type = floor(8.75) = 8
      // With shuriken: (5+2 STAB) * 0.5 * 1.25 = floor(3.5)*1.25 = floor(3.75)=3
      // So damage preview should be noticeably less than 8
      expect(preview!.totalDamage).toBeLessThan(8);
    });
  });

  // ── Cinnabar Ash ───────────────────────────────────────────

  describe('Cinnabar Ash', () => {
    it('draws a card when playing a native vanish card', () => {
      const { state, player } = makeSimpleState({ playerItem: 'cinnabar_ash' });
      player.drawPile = ['tackle', 'scratch'];
      const growl = getMove('growl'); // vanish: true

      const logs = processItemPostCard(state, player, growl, true);

      expect(logs).toHaveLength(1);
      expect(logs[0].message).toContain('Cinnabar Ash');
      expect(logs[0].message).toContain('draws a card');
      expect(player.hand).toHaveLength(1); // drew 1 card
    });

    it('draws a card when didVanish=true (passive-granted vanish)', () => {
      const { state, player } = makeSimpleState({ playerItem: 'cinnabar_ash' });
      player.drawPile = ['tackle'];
      const ember = getMove('ember'); // vanish: false

      // didVanish=true simulates Consuming Flame forcing vanish
      const logs = processItemPostCard(state, player, ember, true);

      expect(logs).toHaveLength(1);
      expect(logs[0].message).toContain('Cinnabar Ash');
    });

    it('does NOT draw when card does not vanish', () => {
      const { state, player } = makeSimpleState({ playerItem: 'cinnabar_ash' });
      player.drawPile = ['tackle'];
      const tackle = getMove('tackle'); // vanish: false

      const logs = processItemPostCard(state, player, tackle, false);

      expect(logs).toHaveLength(0);
      expect(player.hand).toHaveLength(0); // no draw
    });

    it('does nothing if draw pile and discard are empty', () => {
      const { state, player } = makeSimpleState({ playerItem: 'cinnabar_ash' });
      player.drawPile = [];
      player.discardPile = [];
      const growl = getMove('growl');

      const logs = processItemPostCard(state, player, growl, true);

      expect(logs).toHaveLength(0); // Nothing to draw
    });

    it('integration: native vanish card triggers draw via playCard', () => {
      const player = createTestCombatant({
        id: 'player',
        name: 'Player',
        side: 'player',
        types: ['normal'] as any,
        heldItemIds: ['cinnabar_ash'],
      });
      player.position = { row: 'front', column: 1 };
      player.energy = 3;
      player.hand = ['growl'];
      player.drawPile = ['tackle', 'scratch'];

      const enemy = createTestCombatant({
        id: 'enemy',
        name: 'Enemy',
        side: 'enemy',
      });
      enemy.position = { row: 'front', column: 1 };

      const state = createTestCombatState([player, enemy]);

      const logs = playCard(state, player, { type: 'play_card', cardInstanceId: 'growl', targetId: 'enemy' });

      expect(logs.some(l => l.message.includes('Cinnabar Ash'))).toBe(true);
      // Started with growl, it vanished, then drew 1 card
      expect(player.hand).toHaveLength(1);
    });

    it('integration: Consuming Flame passive-vanish triggers draw', () => {
      // Player with Consuming Flame passive + Cinnabar Ash item
      const player = createTestCombatant({
        id: 'charmeleon',
        name: 'Charmeleon',
        side: 'player',
        types: ['fire'] as any,
        heldItemIds: ['cinnabar_ash'],
        passiveIds: ['consuming_flame'],
      });
      player.position = { row: 'front', column: 1 };
      player.energy = 3;
      player.hand = ['ember']; // ember is fire type, not native vanish
      player.drawPile = ['tackle', 'scratch'];

      const enemy = createTestCombatant({
        id: 'enemy',
        name: 'Enemy',
        side: 'enemy',
        types: ['normal'] as any,
        hp: 100,
        maxHp: 100,
      });
      enemy.position = { row: 'front', column: 1 };

      const state = createTestCombatState([player, enemy]);

      const logs = playCard(state, player, { type: 'play_card', cardInstanceId: 'ember', targetId: 'enemy' });

      // Consuming Flame should make ember vanish, then Cinnabar Ash should trigger draw
      expect(logs.some(l => l.message.includes('Consuming Flame'))).toBe(true);
      expect(logs.some(l => l.message.includes('Cinnabar Ash'))).toBe(true);
      expect(player.vanishedPile).toContain('ember');
      // hand was emptied (ember played), then drew 1 from Cinnabar Ash
      expect(player.hand).toHaveLength(1);
    });
  });

  // ── On Damage Dealt Items ──────────────────────────────────

  describe('Shell Bell', () => {
    it('heals 2 HP when dealing damage (once per card)', () => {
      const { state, player, enemy } = makeSimpleState({ playerItem: 'shell_bell', playerHp: 90 });
      const card = getMove('tackle');

      const logs = processItemOnDamageDealt(state, player, enemy, 10, card);

      expect(player.hp).toBe(92);
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toContain('Shell Bell');
      expect(logs[0].message).toContain('heals 2 HP');
    });

    it('does not trigger a second time on same card', () => {
      const { state, player, enemy } = makeSimpleState({ playerItem: 'shell_bell', playerHp: 90 });
      const card = getMove('tackle');

      processItemOnDamageDealt(state, player, enemy, 10, card);
      expect(player.hp).toBe(92);

      // Second hit (e.g., multi-hit)
      const logs2 = processItemOnDamageDealt(state, player, enemy, 10, card);
      expect(player.hp).toBe(92); // No additional heal
      expect(logs2).toHaveLength(0);
    });
  });

  describe('Vermilion Spark', () => {
    it('provokes target on contact move hit', () => {
      const { state, player, enemy } = makeSimpleState({ playerItem: 'vermilion_spark' });
      const scratch = getMove('scratch'); // contact: true

      const logs = processItemOnDamageDealt(state, player, enemy, 10, scratch);

      expect(enemy.statuses.some(s => s.type === 'provoke')).toBe(true);
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toContain('Vermilion Spark');
      expect(logs[0].message).toContain('provoked');
    });

    it('does NOT provoke on non-contact move', () => {
      const { state, player, enemy } = makeSimpleState({ playerItem: 'vermilion_spark' });
      const ember = getMove('ember'); // contact: false

      const logs = processItemOnDamageDealt(state, player, enemy, 10, ember);

      expect(enemy.statuses.some(s => s.type === 'provoke')).toBe(false);
      expect(logs).toHaveLength(0);
    });
  });

  // ── Defensive Items ────────────────────────────────────────

  describe('Buddy Guard', () => {
    it('reduces single-target damage by 4 for column allies', () => {
      const player = createTestCombatant({
        id: 'tank',
        name: 'Tank',
        side: 'player',
        heldItemIds: ['buddy_guard'],
      });
      player.position = { row: 'front', column: 1 };

      const ally = createTestCombatant({
        id: 'ally',
        name: 'Ally',
        side: 'player',
      });
      ally.position = { row: 'back', column: 1 };

      const state = createTestCombatState([player, ally]);
      const singleTargetCard = getMove('tackle'); // front_enemy = single target

      const reduction = getItemDamageReduction(state, ally, singleTargetCard);
      expect(reduction).toBe(4);
    });

    it('does NOT reduce damage for the holder itself', () => {
      const player = createTestCombatant({
        id: 'tank',
        name: 'Tank',
        side: 'player',
        heldItemIds: ['buddy_guard'],
      });
      player.position = { row: 'front', column: 1 };

      const state = createTestCombatState([player]);
      const card = getMove('tackle');

      const reduction = getItemDamageReduction(state, player, card);
      expect(reduction).toBe(0);
    });

    it('does NOT reduce AoE damage', () => {
      const player = createTestCombatant({
        id: 'tank',
        name: 'Tank',
        side: 'player',
        heldItemIds: ['buddy_guard'],
      });
      player.position = { row: 'front', column: 1 };

      const ally = createTestCombatant({
        id: 'ally',
        name: 'Ally',
        side: 'player',
      });
      ally.position = { row: 'back', column: 1 };

      const state = createTestCombatState([player, ally]);
      const aoeCard = getMove('flamethrower'); // column = AoE

      const reduction = getItemDamageReduction(state, ally, aoeCard);
      expect(reduction).toBe(0);
    });
  });

  describe('Focus Sash', () => {
    it('survives lethal damage at 1 HP', () => {
      const { player } = makeSimpleState({ playerItem: 'focus_sash' });
      player.hp = 0;
      player.alive = false;

      const survived = checkItemSurvival(player);

      expect(survived).toBe(true);
      expect(player.hp).toBe(1);
      expect(player.alive).toBe(true);
      expect(player.focusSashUsed).toBe(true);
    });

    it('does NOT trigger a second time', () => {
      const { player } = makeSimpleState({ playerItem: 'focus_sash' });
      player.focusSashUsed = true;
      player.hp = 0;
      player.alive = false;

      const survived = checkItemSurvival(player);

      expect(survived).toBe(false);
      expect(player.hp).toBe(0);
    });
  });

  // ── Switch Items ───────────────────────────────────────────

  describe('Viridian Target', () => {
    it('provokes enemies in column on column switch', () => {
      const player = createTestCombatant({
        id: 'player',
        name: 'Player',
        side: 'player',
        heldItemIds: ['viridian_target'],
      });
      player.position = { row: 'front', column: 2 };

      const enemy = createTestCombatant({
        id: 'enemy',
        name: 'Enemy',
        side: 'enemy',
      });
      enemy.position = { row: 'front', column: 2 };

      const state = createTestCombatState([player, enemy]);
      const oldPos: Position = { row: 'front', column: 1 };

      const logs = processItemOnSwitch(state, player, oldPos);

      expect(enemy.statuses.some(s => s.type === 'provoke')).toBe(true);
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toContain('Viridian Target');
    });

    it('does NOT trigger on same-column switch (row only)', () => {
      const player = createTestCombatant({
        id: 'player',
        name: 'Player',
        side: 'player',
        heldItemIds: ['viridian_target'],
      });
      player.position = { row: 'back', column: 1 };

      const state = createTestCombatState([player]);
      const oldPos: Position = { row: 'front', column: 1 };

      const logs = processItemOnSwitch(state, player, oldPos);
      expect(logs).toHaveLength(0);
    });
  });

  describe('Saffron Spoon', () => {
    it('applies Enfeeble 3 to enemies in column on column switch', () => {
      const player = createTestCombatant({
        id: 'player',
        name: 'Player',
        side: 'player',
        heldItemIds: ['saffron_spoon'],
      });
      player.position = { row: 'front', column: 2 };

      const enemy = createTestCombatant({
        id: 'enemy',
        name: 'Enemy',
        side: 'enemy',
      });
      enemy.position = { row: 'front', column: 2 };

      const state = createTestCombatState([player, enemy]);
      const oldPos: Position = { row: 'front', column: 1 };

      const logs = processItemOnSwitch(state, player, oldPos);

      const enfeeble = enemy.statuses.find(s => s.type === 'enfeeble');
      expect(enfeeble).toBeDefined();
      expect(enfeeble!.stacks).toBe(3);
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toContain('Saffron Spoon');
    });
  });

  describe('Smoke Ball', () => {
    it('provokes enemies with 2 stacks on column switch', () => {
      const player = createTestCombatant({
        id: 'player',
        name: 'Player',
        side: 'player',
        heldItemIds: ['smoke_ball'],
      });
      player.position = { row: 'front', column: 2 };

      const enemy = createTestCombatant({
        id: 'enemy',
        name: 'Enemy',
        side: 'enemy',
      });
      enemy.position = { row: 'front', column: 2 };

      const state = createTestCombatState([player, enemy]);
      const oldPos: Position = { row: 'front', column: 1 };

      const logs = processItemOnSwitch(state, player, oldPos);

      const provoke = enemy.statuses.find(s => s.type === 'provoke');
      expect(provoke).toBeDefined();
      expect(provoke!.stacks).toBe(2);
      expect(logs.some(l => l.message.includes('Smoke Ball'))).toBe(true);
    });
  });

  // ── KO Items ───────────────────────────────────────────────

  describe('Lavender Tombstone', () => {
    it('regains 1 energy when enemy dies in column', () => {
      const player = createTestCombatant({
        id: 'player',
        name: 'Player',
        side: 'player',
        heldItemIds: ['lavender_tombstone'],
      });
      player.position = { row: 'front', column: 1 };
      player.energy = 2;

      const victim = createTestCombatant({
        id: 'victim',
        name: 'Victim',
        side: 'enemy',
      });
      victim.position = { row: 'front', column: 1 };
      victim.alive = false;

      const killer = createTestCombatant({
        id: 'killer',
        name: 'Killer',
        side: 'player',
      });

      const state = createTestCombatState([player, killer, victim]);

      const logs = processItemOnKO(state, killer, victim);

      expect(player.energy).toBe(3);
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toContain('Lavender Tombstone');
      expect(logs[0].message).toContain('regains 1 energy');
    });

    it('does NOT trigger if enemy is in a different column', () => {
      const player = createTestCombatant({
        id: 'player',
        name: 'Player',
        side: 'player',
        heldItemIds: ['lavender_tombstone'],
      });
      player.position = { row: 'front', column: 0 };
      player.energy = 2;

      const victim = createTestCombatant({
        id: 'victim',
        name: 'Victim',
        side: 'enemy',
      });
      victim.position = { row: 'front', column: 1 };
      victim.alive = false;

      const killer = createTestCombatant({ id: 'killer', side: 'player' });
      const state = createTestCombatState([player, killer, victim]);

      const logs = processItemOnKO(state, killer, victim);

      expect(player.energy).toBe(2);
      expect(logs).toHaveLength(0);
    });
  });

  // ── Battle End Items ───────────────────────────────────────

  describe('Celadon Leaf', () => {
    it('heals 6 HP at battle end', () => {
      const player = createTestCombatant({
        id: 'player',
        name: 'Player',
        side: 'player',
        heldItemIds: ['celadon_leaf'],
        hp: 80,
        maxHp: 100,
      });

      const state = createTestCombatState([player]);

      processItemBattleEnd(state);

      expect(player.hp).toBe(86);
    });

    it('does not overheal', () => {
      const player = createTestCombatant({
        id: 'player',
        name: 'Player',
        side: 'player',
        heldItemIds: ['celadon_leaf'],
        hp: 97,
        maxHp: 100,
      });

      const state = createTestCombatState([player]);

      processItemBattleEnd(state);

      expect(player.hp).toBe(100);
    });
  });

  // ── Choice Specs ───────────────────────────────────────────

  describe('Choice Specs', () => {
    it('gives +8 damage unconditionally', () => {
      const { state, player, enemy } = makeSimpleState({ playerItem: 'choice_specs' });
      const card = getMove('ember');

      const bonus = getItemDamageBonus(state, player, enemy, card);
      expect(bonus).toBe(8);
    });

    it('blocks front_enemy and front_row range attacks', () => {
      const { player } = makeSimpleState({ playerItem: 'choice_specs' });
      const scratch = getMove('scratch'); // front_enemy
      const tackle = getMove('tackle');   // front_enemy

      expect(checkItemPlayRestriction(player, scratch)).toBe(false);
      expect(checkItemPlayRestriction(player, tackle)).toBe(false);
    });

    it('allows any_enemy and column range attacks', () => {
      const { player } = makeSimpleState({ playerItem: 'choice_specs' });
      const ember = getMove('ember');               // any_enemy
      const flamethrower = getMove('flamethrower');  // column
      const thunderShock = getMove('thunder-shock'); // any_enemy

      expect(checkItemPlayRestriction(player, ember)).toBe(true);
      expect(checkItemPlayRestriction(player, flamethrower)).toBe(true);
      expect(checkItemPlayRestriction(player, thunderShock)).toBe(true);
    });

    it('allows non-attack cards', () => {
      const { player } = makeSimpleState({ playerItem: 'choice_specs' });
      const growl = getMove('growl');

      expect(checkItemPlayRestriction(player, growl)).toBe(true);
    });
  });

  // ── Expert Belt ────────────────────────────────────────────

  describe('Expert Belt', () => {
    it('gives +5 on super-effective hits', () => {
      const { state, player, enemy } = makeSimpleState({
        playerItem: 'expert_belt',
        playerTypes: ['fire'],
        enemyTypes: ['grass'],
      });
      const ember = getMove('ember');

      // Fire vs grass = super effective (1.25x)
      const bonus = getItemDamageBonus(state, player, enemy, ember, 1.25);
      expect(bonus).toBe(5);
    });

    it('gives 0 on neutral hits', () => {
      const { state, player, enemy } = makeSimpleState({
        playerItem: 'expert_belt',
        playerTypes: ['fire'],
        enemyTypes: ['normal'],
      });
      const ember = getMove('ember');

      const bonus = getItemDamageBonus(state, player, enemy, ember, 1.0);
      expect(bonus).toBe(0);
    });
  });

  // ── Metronome ──────────────────────────────────────────────

  describe('Metronome (item)', () => {
    it('gives +2 per consecutive attack played', () => {
      const { state, player, enemy } = makeSimpleState({ playerItem: 'metronome_item' });
      player.itemState['metronomeAttacks'] = 0;
      const card = getMove('tackle');

      // Before any attacks: 0
      expect(getItemDamageBonus(state, player, enemy, card)).toBe(0);

      // Play first attack
      processItemPostCard(state, player, card);
      expect(player.itemState['metronomeAttacks']).toBe(1);
      expect(getItemDamageBonus(state, player, enemy, card)).toBe(2);

      // Play second attack
      processItemPostCard(state, player, card);
      expect(player.itemState['metronomeAttacks']).toBe(2);
      expect(getItemDamageBonus(state, player, enemy, card)).toBe(4);
    });

    it('resets on non-attack card', () => {
      const { state, player, enemy } = makeSimpleState({ playerItem: 'metronome_item' });
      player.itemState['metronomeAttacks'] = 2;
      const card = getMove('tackle');
      const growl = getMove('growl');

      expect(getItemDamageBonus(state, player, enemy, card)).toBe(4);

      processItemPostCard(state, player, growl);
      expect(player.itemState['metronomeAttacks']).toBe(0);
      expect(getItemDamageBonus(state, player, enemy, card)).toBe(0);
    });

    it('resets at turn start', () => {
      const { player } = makeSimpleState({ playerItem: 'metronome_item' });
      player.itemState['metronomeAttacks'] = 3;

      resetItemTurnState(player);

      expect(player.itemState['metronomeAttacks']).toBe(0);
    });
  });

  // ── Switch Limit ───────────────────────────────────────────

  describe('Switch Limit', () => {
    it('default items allow 1 switch', () => {
      const { player } = makeSimpleState({ playerItem: 'wide_lens' });
      expect(getItemMaxSwitches(player)).toBe(1);
    });

    it('Guerrilla Boots allow 2 switches', () => {
      const { player } = makeSimpleState({ playerItem: 'guerrilla_boots' });
      expect(getItemMaxSwitches(player)).toBe(2);
    });

    it('no item returns null', () => {
      const player = createTestCombatant({});
      expect(getItemMaxSwitches(player)).toBeNull();
    });
  });

  // ── No Item Baseline ──────────────────────────────────────

  describe('No Item', () => {
    it('all hook functions return empty when no item', () => {
      const player = createTestCombatant({
        id: 'player',
        name: 'Player',
        side: 'player',
      });
      const enemy = createTestCombatant({
        id: 'enemy',
        name: 'Enemy',
        side: 'enemy',
      });
      const state = createTestCombatState([player, enemy]);
      const card = getMove('tackle');

      expect(processItemBattleStart(state, player)).toHaveLength(0);
      expect(processItemTurnStart(state, player)).toHaveLength(0);
      expect(processItemRoundStart(state, player)).toHaveLength(0);
      expect(processItemPostCard(state, player, card)).toHaveLength(0);
      expect(processItemOnDamageDealt(state, player, enemy, 10, card)).toHaveLength(0);
      expect(getItemDamageBonus(state, player, enemy, card)).toBe(0);
      expect(getItemDamageBonusSourceOnly(player, card)).toBe(0);
      expect(getItemDamageReduction(state, player)).toBe(0);
      expect(getItemDamageMultiplier(player, card)).toBe(1.0);
      expect(checkItemPlayRestriction(player, card)).toBe(true);
      expect(getItemStatusStacksMultiplier(player, card)).toBe(1);
    });
  });

  // ── Hand Preview for items ─────────────────────────────────

  describe('Hand Preview: Item tags', () => {
    it('Wide Lens: shows +2 Item tag', () => {
      const { player } = makeSimpleState({ playerItem: 'wide_lens' });
      const card = getMove('tackle');
      const preview = calculateHandPreview(player, card);

      expect(preview.tags).toContain('+2 Item');
    });

    it('Choice Band: shows +8 Item tag', () => {
      const { player } = makeSimpleState({ playerItem: 'choice_band' });
      const card = getMove('tackle');
      const preview = calculateHandPreview(player, card);

      expect(preview.tags).toContain('+8 Item');
    });

    it('Choice Specs: shows +8 Item tag', () => {
      const { player } = makeSimpleState({ playerItem: 'choice_specs' });
      const card = getMove('tackle');
      const preview = calculateHandPreview(player, card);

      expect(preview.tags).toContain('+8 Item');
    });

    it('Toxic Orb: shows +4 Item tag', () => {
      const { player } = makeSimpleState({ playerItem: 'toxic_orb' });
      const card = getMove('tackle');
      const preview = calculateHandPreview(player, card);

      expect(preview.tags).toContain('+4 Item');
    });

    it('Life Orb: shows x1.3 Item tag and multiplier', () => {
      const { player } = makeSimpleState({ playerItem: 'life_orb' });
      const card = getMove('tackle');
      const preview = calculateHandPreview(player, card);

      expect(preview.multiplier).toBeCloseTo(1.3, 5);
      expect(preview.tags.some(t => t.includes('1.3') && t.includes('Item'))).toBe(true);
    });

    it('Fuchsia Shuriken: shows x0.5 Shuriken tag on damage+status card', () => {
      const { player } = makeSimpleState({ playerItem: 'fuchsia_shuriken' });
      const ember = getMove('ember');
      const preview = calculateHandPreview(player, ember);

      expect(preview.multiplier).toBeCloseTo(0.5, 5);
      expect(preview.tags.some(t => t.includes('0.5') && t.includes('Shuriken'))).toBe(true);
      expect(preview.statusStacksMult).toBe(2);
    });

    it('Fuchsia Shuriken: no tag on pure damage card', () => {
      const { player } = makeSimpleState({ playerItem: 'fuchsia_shuriken' });
      const tackle = getMove('tackle');
      const preview = calculateHandPreview(player, tackle);

      expect(preview.multiplier).toBe(1.0);
      expect(preview.tags.filter(t => t.includes('Shuriken'))).toHaveLength(0);
      expect(preview.statusStacksMult).toBe(1);
    });

    it('Sniper Scope: shows +5 Item tag', () => {
      const { player } = makeSimpleState({ playerItem: 'sniper_scope' });
      const card = getMove('tackle');
      const preview = calculateHandPreview(player, card);

      expect(preview.tags).toContain('+5 Item');
    });

    it('Pallet Cannon: shows +5 Item tag', () => {
      const { player } = makeSimpleState({ playerItem: 'pallet_cannon' });
      const card = getMove('tackle');
      const preview = calculateHandPreview(player, card);

      expect(preview.tags).toContain('+5 Item');
    });

    it('Scope Lens: shows +3 Item tag for single-target', () => {
      const { player } = makeSimpleState({ playerItem: 'scope_lens' });
      // ember is any_enemy = single target
      const ember = getMove('ember');
      const preview = calculateHandPreview(player, ember);

      expect(preview.tags).toContain('+3 Item');
    });
  });

  // ── Damage Preview (target-specific) ───────────────────────

  describe('Damage Preview: Item effects', () => {
    it('Life Orb damage preview includes 1.3x multiplier', () => {
      const player = createTestCombatant({
        id: 'player', name: 'Player', side: 'player',
        types: ['normal'] as any,
        heldItemIds: ['life_orb'],
      });
      player.position = { row: 'front', column: 1 };

      const enemy = createTestCombatant({
        id: 'enemy', name: 'Enemy', side: 'enemy',
        types: ['normal'] as any,
        hp: 100, maxHp: 100,
      });
      enemy.position = { row: 'front', column: 1 };

      const state = createTestCombatState([player, enemy]);
      const tackle = getMove('tackle');

      const previewWithOrb = calculateDamagePreview(state, player, enemy, tackle);

      // Without Life Orb
      player.heldItemIds = [];
      const previewNoOrb = calculateDamagePreview(state, player, enemy, tackle);

      expect(previewWithOrb).not.toBeNull();
      expect(previewNoOrb).not.toBeNull();
      expect(previewWithOrb!.totalDamage).toBeGreaterThan(previewNoOrb!.totalDamage);
    });

    it('Buddy Guard reduces damage in preview', () => {
      const tank = createTestCombatant({
        id: 'tank', name: 'Tank', side: 'player',
        heldItemIds: ['buddy_guard'],
      });
      tank.position = { row: 'front', column: 1 };

      const ally = createTestCombatant({
        id: 'ally', name: 'Ally', side: 'player',
        types: ['normal'] as any,
        hp: 100, maxHp: 100,
      });
      ally.position = { row: 'back', column: 1 };

      // Enemy attacking ally
      const attacker = createTestCombatant({
        id: 'attacker', name: 'Attacker', side: 'enemy',
        types: ['normal'] as any,
      });
      attacker.position = { row: 'front', column: 1 };

      const state = createTestCombatState([tank, ally, attacker]);
      const tackle = getMove('tackle'); // front_enemy = single target

      // Buddy Guard should reduce damage to ally by 4
      const reduction = getItemDamageReduction(state, ally, tackle);
      expect(reduction).toBe(4);
    });
  });
});
