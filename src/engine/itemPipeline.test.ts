/**
 * Item Pipeline Integration & Invariant Tests
 *
 * Verifies that item bonuses flow correctly through the full damage pipeline
 * (playCard → buildDamageModifiers → applyCardDamage) to produce correct final HP.
 *
 * Layer 1: Hand-calculated exact damage values through playCard
 * Layer 2: Paired with/without-item invariants across many combos
 *
 * Run: npx vitest run src/engine/itemPipeline.test.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createTestCombatant, createTestCombatState, resetTestIds, addStatus } from './test-helpers';
import type { Combatant, CombatState, LogEntry, MoveType } from './types';
import { playCard } from './cards';
import { getMove } from '../data/loaders';
import {
  processItemBattleStart, processItemTurnStart, processItemRoundStart,
  processItemBattleEnd, checkItemPlayRestriction,
  processItemPostCard, processItemTurnEnd, processItemOnDamageDealt,
  processItemOnDamageTaken, processItemOnKO, getItemHealModifier,
} from './itemEffects';
import { getTypeEffectiveness } from './typeChart';
import { applyHeal } from './damage';
import { getStatusStacks } from './status';

// ============================================================
// Helpers
// ============================================================

interface ScenarioOpts {
  sourceTypes: MoveType[];
  targetTypes: MoveType[];
  itemId?: string;
  sourceCol?: number;
  targetCol?: number;
  sourceHp?: number;
  targetHp?: number;
  extras?: Combatant[];
}

function makeScenario(opts: ScenarioOpts) {
  const source = createTestCombatant({
    id: 'src', name: 'Source', side: 'player',
    types: opts.sourceTypes, heldItemIds: opts.itemId ? [opts.itemId] : [],
    hp: opts.sourceHp ?? 100, maxHp: 100,
  });
  source.position = { row: 'front', column: opts.sourceCol ?? 1 };

  const target = createTestCombatant({
    id: 'tgt', name: 'Target', side: 'enemy',
    types: opts.targetTypes,
    hp: opts.targetHp ?? 100, maxHp: 100,
  });
  target.position = { row: 'front', column: opts.targetCol ?? 1 };

  const state = createTestCombatState([source, target, ...(opts.extras ?? [])]);
  return { state, source, target };
}

function playAndMeasure(
  state: CombatState, source: Combatant, target: Combatant, cardId: string,
): { hpLost: number; sourceHpLost: number; logs: LogEntry[] } {
  source.hand.push(cardId);
  const tBefore = target.hp;
  const sBefore = source.hp;
  const logs = playCard(state, source, {
    type: 'play_card', cardInstanceId: cardId, targetId: target.id,
  });
  return { hpLost: tBefore - target.hp, sourceHpLost: sBefore - source.hp, logs };
}

function pairedDamage(opts: {
  sourceTypes: MoveType[]; targetTypes: MoveType[];
  cardId: string; itemId: string;
  sourceCol?: number; targetCol?: number;
}): { withItem: number; withoutItem: number } {
  const s1 = makeScenario({
    sourceTypes: opts.sourceTypes, targetTypes: opts.targetTypes,
    itemId: opts.itemId, sourceCol: opts.sourceCol, targetCol: opts.targetCol,
  });
  const r1 = playAndMeasure(s1.state, s1.source, s1.target, opts.cardId);

  const s2 = makeScenario({
    sourceTypes: opts.sourceTypes, targetTypes: opts.targetTypes,
    sourceCol: opts.sourceCol, targetCol: opts.targetCol,
  });
  const r2 = playAndMeasure(s2.state, s2.source, s2.target, opts.cardId);

  return { withItem: r1.hpLost, withoutItem: r2.hpLost };
}

// ============================================================
// Data Pools for Layer 2
// ============================================================

const SOURCE_POOL: { name: string; types: MoveType[]; cards: string[] }[] = [
  { name: 'Rattata', types: ['normal'], cards: ['scratch', 'tackle', 'bite'] },
  { name: 'Charmander', types: ['fire'], cards: ['scratch', 'ember'] },
  { name: 'Squirtle', types: ['water'], cards: ['tackle', 'water-gun'] },
  { name: 'Bulbasaur', types: ['grass', 'poison'], cards: ['tackle', 'vine-whip'] },
  { name: 'Pikachu', types: ['electric'], cards: ['quick-attack', 'thunder-shock'] },
];

const TARGET_POOL: { name: string; types: MoveType[] }[] = [
  { name: 'Rattata', types: ['normal'] },
  { name: 'Charmander', types: ['fire'] },
  { name: 'Squirtle', types: ['water'] },
  { name: 'Bulbasaur', types: ['grass', 'poison'] },
];

function cardHasDamageAndStatus(cardId: string): boolean {
  const card = getMove(cardId);
  const hasDmg = card.effects.some(e =>
    e.type === 'damage' || e.type === 'multi_hit' ||
    e.type === 'heal_on_hit' || e.type === 'recoil'
  );
  const hasStat = card.effects.some(e => e.type === 'apply_status');
  return hasDmg && hasStat;
}

// ============================================================
// Layer 1: Controlled Integration — Exact Values
// ============================================================

describe('Item Pipeline Integration', () => {
  beforeEach(() => resetTestIds());

  describe('Layer 1: Controlled Integration', () => {

    // ── Flat damage bonus items ────────────────────────────────

    describe('Flat damage bonus items', () => {
      // Scratch: Normal, base 6, front_enemy
      // Normal source → STAB +2 for Normal cards

      it('Wide Lens: +2 → Scratch = 10', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'wide_lens' });
        expect(playAndMeasure(s.state, s.source, s.target, 'scratch').hpLost).toBe(10);
      });

      it('Choice Band: +8 → Scratch = 16', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'choice_band' });
        expect(playAndMeasure(s.state, s.source, s.target, 'scratch').hpLost).toBe(16);
      });

      it('Toxic Orb: +4 → Scratch = 12', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'toxic_orb' });
        expect(playAndMeasure(s.state, s.source, s.target, 'scratch').hpLost).toBe(12);
      });

      it('Scope Lens: +3 single-target → Scratch = 11', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'scope_lens' });
        expect(playAndMeasure(s.state, s.source, s.target, 'scratch').hpLost).toBe(11);
      });

      it('Scope Lens: +0 on AoE (flamethrower)', () => {
        const d = pairedDamage({
          sourceTypes: ['fire'], targetTypes: ['normal'],
          cardId: 'flamethrower', itemId: 'scope_lens',
        });
        expect(d.withItem).toBe(d.withoutItem);
      });

      it('Choice Specs: +8 Ember (Fire→Normal) = 15', () => {
        // 5 base + 2 STAB + 8 CS = 15
        const s = makeScenario({ sourceTypes: ['fire'], targetTypes: ['normal'], itemId: 'choice_specs' });
        expect(playAndMeasure(s.state, s.source, s.target, 'ember').hpLost).toBe(15);
      });

      it('Choice Specs: Ember (Fire→Water) floor(15×0.75) = 11', () => {
        const s = makeScenario({ sourceTypes: ['fire'], targetTypes: ['water'], itemId: 'choice_specs' });
        expect(playAndMeasure(s.state, s.source, s.target, 'ember').hpLost).toBe(11);
      });

      it('Expert Belt: +5 super-eff Ember (Fire→Grass/Poison) = 15', () => {
        // 5+2+5 = 12, floor(12×1.25) = 15
        const s = makeScenario({ sourceTypes: ['fire'], targetTypes: ['grass', 'poison'], itemId: 'expert_belt' });
        expect(playAndMeasure(s.state, s.source, s.target, 'ember').hpLost).toBe(15);
      });

      it('Expert Belt: +0 neutral Ember (Fire→Normal) = 7', () => {
        const s = makeScenario({ sourceTypes: ['fire'], targetTypes: ['normal'], itemId: 'expert_belt' });
        expect(playAndMeasure(s.state, s.source, s.target, 'ember').hpLost).toBe(7);
      });

      it('Sniper Scope: +5 same col = 13', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'sniper_scope', sourceCol: 1, targetCol: 1 });
        expect(playAndMeasure(s.state, s.source, s.target, 'scratch').hpLost).toBe(13);
      });

      it('Sniper Scope: +0 diff col = 8', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'sniper_scope', sourceCol: 0, targetCol: 1 });
        expect(playAndMeasure(s.state, s.source, s.target, 'scratch').hpLost).toBe(8);
      });

      it('Pallet Cannon: +5 same col = 13', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'pallet_cannon', sourceCol: 1, targetCol: 1 });
        expect(playAndMeasure(s.state, s.source, s.target, 'scratch').hpLost).toBe(13);
      });
    });

    // ── Multiplier items ───────────────────────────────────────

    describe('Multiplier items', () => {
      it('Life Orb: floor(8×1.3) = 10 HP lost', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'life_orb' });
        expect(playAndMeasure(s.state, s.source, s.target, 'scratch').hpLost).toBe(10);
      });

      it('Life Orb: source takes 3 recoil', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'life_orb' });
        expect(playAndMeasure(s.state, s.source, s.target, 'scratch').sourceHpLost).toBe(3);
      });

      it('Fuchsia: 0.5x Ember (Fire→Normal) = 3', () => {
        // (5+2)=7, floor(7×0.5)=3
        const s = makeScenario({ sourceTypes: ['fire'], targetTypes: ['normal'], itemId: 'fuchsia_shuriken' });
        expect(playAndMeasure(s.state, s.source, s.target, 'ember').hpLost).toBe(3);
      });

      it('Fuchsia: no effect on dmg-only Scratch = 6', () => {
        // Charmander (Fire) plays Normal Scratch → no STAB, no status → fuchsia inactive
        const s = makeScenario({ sourceTypes: ['fire'], targetTypes: ['normal'], itemId: 'fuchsia_shuriken' });
        expect(playAndMeasure(s.state, s.source, s.target, 'scratch').hpLost).toBe(6);
      });

      it('Fuchsia: doubles burn stacks on Ember → burn 4', () => {
        const s = makeScenario({ sourceTypes: ['fire'], targetTypes: ['normal'], itemId: 'fuchsia_shuriken' });
        playAndMeasure(s.state, s.source, s.target, 'ember');
        const burn = s.target.statuses.find(st => st.type === 'burn');
        expect(burn).toBeDefined();
        expect(burn!.stacks).toBe(4);
      });
    });

    // ── Defensive items ────────────────────────────────────────

    describe('Defensive items', () => {
      it('Buddy Guard: ally takes 4 less (8→4)', () => {
        const bg = createTestCombatant({ id: 'bg', side: 'player', heldItemIds: ['buddy_guard'] });
        bg.position = { row: 'back', column: 1 };
        const ally = createTestCombatant({ id: 'ally', side: 'player', types: ['normal'], hp: 100, maxHp: 100 });
        ally.position = { row: 'front', column: 1 };
        const enemy = createTestCombatant({ id: 'en', side: 'enemy', types: ['normal'], hp: 100, maxHp: 100 });
        enemy.position = { row: 'front', column: 1 };
        const st = createTestCombatState([bg, ally, enemy]);
        expect(playAndMeasure(st, enemy, ally, 'scratch').hpLost).toBe(4);
      });

      it('Buddy Guard: holder NOT protected (8)', () => {
        const bg = createTestCombatant({ id: 'bg', side: 'player', types: ['normal'], hp: 100, maxHp: 100, heldItemIds: ['buddy_guard'] });
        bg.position = { row: 'front', column: 1 };
        const enemy = createTestCombatant({ id: 'en', side: 'enemy', types: ['normal'], hp: 100, maxHp: 100 });
        enemy.position = { row: 'front', column: 1 };
        const st = createTestCombatState([bg, enemy]);
        expect(playAndMeasure(st, enemy, bg, 'scratch').hpLost).toBe(8);
      });

      it('Buddy Guard: no effect on AoE column attack', () => {
        const bg = createTestCombatant({ id: 'bg', side: 'player', heldItemIds: ['buddy_guard'] });
        bg.position = { row: 'back', column: 1 };
        const ally = createTestCombatant({ id: 'ally', side: 'player', types: ['normal'], hp: 100, maxHp: 100 });
        ally.position = { row: 'front', column: 1 };
        const enemy = createTestCombatant({ id: 'en', side: 'enemy', types: ['fire'], hp: 100, maxHp: 100 });
        enemy.position = { row: 'front', column: 1 };
        const st1 = createTestCombatState([bg, ally, enemy]);
        const hpBefore = ally.hp;
        enemy.hand.push('flamethrower');
        playCard(st1, enemy, { type: 'play_card', cardInstanceId: 'flamethrower', targetId: 'ally' });
        const withBG = hpBefore - ally.hp;

        // Same scenario without BG
        const ally2 = createTestCombatant({ id: 'ally2', side: 'player', types: ['normal'], hp: 100, maxHp: 100 });
        ally2.position = { row: 'front', column: 1 };
        const enemy2 = createTestCombatant({ id: 'en2', side: 'enemy', types: ['fire'], hp: 100, maxHp: 100 });
        enemy2.position = { row: 'front', column: 1 };
        const st2 = createTestCombatState([ally2, enemy2]);
        enemy2.hand.push('flamethrower');
        playCard(st2, enemy2, { type: 'play_card', cardInstanceId: 'flamethrower', targetId: 'ally2' });
        const withoutBG = 100 - ally2.hp;

        expect(withBG).toBe(withoutBG);
      });
    });

    // ── Battle-start items ─────────────────────────────────────

    describe('Battle-start items', () => {
      it('Quick Claw: sets bonus turn flag', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'quick_claw' });
        processItemBattleStart(s.state, s.source);
        expect(s.source.turnFlags.quickClawBonusTurn).toBe(true);
      });

      it('Eviolite: maxHp += 15, hp += 15', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'eviolite' });
        processItemBattleStart(s.state, s.source);
        expect(s.source.maxHp).toBe(115);
        expect(s.source.hp).toBe(115);
      });

      it('Toxic Orb: poison 1 on holder', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'toxic_orb' });
        processItemBattleStart(s.state, s.source);
        expect(s.source.statuses.find(st => st.type === 'poison')?.stacks).toBe(1);
      });

      it('Pewter Stone: block = 8', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'pewter_stone' });
        processItemBattleStart(s.state, s.source);
        expect(s.source.block).toBe(8);
      });
    });

    // ── Round-start items ──────────────────────────────────────

    describe('Round-start items', () => {
      it('Assault Vest: +10 block', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'assault_vest' });
        processItemRoundStart(s.state, s.source);
        expect(s.source.block).toBe(10);
      });

      it('Iron Plate: 1 ally → 3 block', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'iron_plate' });
        processItemRoundStart(s.state, s.source);
        expect(s.source.block).toBe(3);
      });

      it('Iron Plate: 3 allies → 9 block', () => {
        const a1 = createTestCombatant({ id: 'a1', side: 'player' });
        a1.position = { row: 'front', column: 0 };
        const a2 = createTestCombatant({ id: 'a2', side: 'player' });
        a2.position = { row: 'front', column: 2 };
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'iron_plate', extras: [a1, a2] });
        processItemRoundStart(s.state, s.source);
        expect(s.source.block).toBe(9);
      });
    });

    // ── Heal items ─────────────────────────────────────────────

    describe('Heal items', () => {
      it('Leftovers: +3 at turn start', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'leftovers', sourceHp: 90 });
        processItemTurnStart(s.state, s.source);
        expect(s.source.hp).toBe(93);
      });

      it('Leftovers: capped at maxHp', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'leftovers', sourceHp: 99 });
        processItemTurnStart(s.state, s.source);
        expect(s.source.hp).toBe(100);
      });

      it('Sacred Ash: heals front ally 5', () => {
        const healer = createTestCombatant({ id: 'h', side: 'player', heldItemIds: ['sacred_ash'] });
        healer.position = { row: 'back', column: 1 };
        const front = createTestCombatant({ id: 'f', side: 'player', hp: 80, maxHp: 100 });
        front.position = { row: 'front', column: 1 };
        const st = createTestCombatState([healer, front]);
        processItemTurnStart(st, healer);
        expect(front.hp).toBe(85);
      });

      it('Cerulean Tear: heals front ally 5', () => {
        const healer = createTestCombatant({ id: 'h', side: 'player', heldItemIds: ['cerulean_tear'] });
        healer.position = { row: 'back', column: 1 };
        const front = createTestCombatant({ id: 'f', side: 'player', hp: 70, maxHp: 100 });
        front.position = { row: 'front', column: 1 };
        const st = createTestCombatState([healer, front]);
        processItemTurnStart(st, healer);
        expect(front.hp).toBe(75);
      });

      it('Shell Bell: +2 HP after dealing damage via playCard', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'shell_bell', sourceHp: 80 });
        playAndMeasure(s.state, s.source, s.target, 'scratch');
        expect(s.source.hp).toBe(82);
      });

      it('Celadon Leaf: +6 at battle end', () => {
        const p = createTestCombatant({ id: 'p', side: 'player', heldItemIds: ['celadon_leaf'], hp: 85, maxHp: 100 });
        const st = createTestCombatState([p]);
        processItemBattleEnd(st);
        expect(p.hp).toBe(91);
      });

      it('Celadon Leaf: capped at maxHp', () => {
        const p = createTestCombatant({ id: 'p', side: 'player', heldItemIds: ['celadon_leaf'], hp: 97, maxHp: 100 });
        const st = createTestCombatState([p]);
        processItemBattleEnd(st);
        expect(p.hp).toBe(100);
      });
    });

    // ── Survival items ─────────────────────────────────────────

    describe('Survival items', () => {
      it('Focus Sash: lethal → hp=1, alive', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], targetHp: 5 });
        s.target.heldItemIds = ['focus_sash'];
        playAndMeasure(s.state, s.source, s.target, 'scratch');
        expect(s.target.hp).toBe(1);
        expect(s.target.alive).toBe(true);
        expect(s.target.focusSashUsed).toBe(true);
      });

      it('Focus Sash used: second lethal → dead', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], targetHp: 5 });
        s.target.heldItemIds = ['focus_sash'];
        playAndMeasure(s.state, s.source, s.target, 'scratch');
        expect(s.target.hp).toBe(1);
        playAndMeasure(s.state, s.source, s.target, 'scratch');
        expect(s.target.hp).toBe(0);
        expect(s.target.alive).toBe(false);
      });
    });

    // ── Play restrictions ──────────────────────────────────────

    describe('Play restrictions', () => {
      it('Choice Band: blocks non-attack cards', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'choice_band' });
        expect(checkItemPlayRestriction(s.source, getMove('growl'))).toBe(false);
      });

      it('Choice Band: allows front_enemy range attacks', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'choice_band' });
        expect(checkItemPlayRestriction(s.source, getMove('scratch'))).toBe(true);
        expect(checkItemPlayRestriction(s.source, getMove('tackle'))).toBe(true);
      });

      it('Choice Band: blocks non-front-row range attacks', () => {
        const s = makeScenario({ sourceTypes: ['fire'], targetTypes: ['normal'], itemId: 'choice_band' });
        expect(checkItemPlayRestriction(s.source, getMove('ember'))).toBe(false);       // any_enemy
        expect(checkItemPlayRestriction(s.source, getMove('flamethrower'))).toBe(false); // column
      });

      it('Assault Vest: blocks non-attack', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'assault_vest' });
        expect(checkItemPlayRestriction(s.source, getMove('growl'))).toBe(false);
        expect(checkItemPlayRestriction(s.source, getMove('tackle'))).toBe(true);
      });

      it('Choice Specs: blocks front_enemy range attacks', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'choice_specs' });
        expect(checkItemPlayRestriction(s.source, getMove('scratch'))).toBe(false);  // front_enemy
        expect(checkItemPlayRestriction(s.source, getMove('tackle'))).toBe(false);   // front_enemy
      });

      it('Choice Specs: allows any_enemy and column range attacks', () => {
        const s = makeScenario({ sourceTypes: ['fire'], targetTypes: ['normal'], itemId: 'choice_specs' });
        expect(checkItemPlayRestriction(s.source, getMove('ember'))).toBe(true);         // any_enemy
        expect(checkItemPlayRestriction(s.source, getMove('flamethrower'))).toBe(true);  // column
      });

      it('Choice Specs: allows non-attack cards', () => {
        const s = makeScenario({ sourceTypes: ['fire'], targetTypes: ['normal'], itemId: 'choice_specs' });
        expect(checkItemPlayRestriction(s.source, getMove('growl'))).toBe(true);
      });
    });

    // ── Metronome scaling ──────────────────────────────────────

    describe('Metronome scaling', () => {
      it('+2 per consecutive attack: 8→10→12', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'metronome_item' });
        s.source.itemState['metronomeAttacks'] = 0;

        const damages: number[] = [];
        for (let i = 0; i < 3; i++) {
          s.source.hand.push('scratch');
          const hpBefore = s.target.hp;
          playCard(s.state, s.source, { type: 'play_card', cardInstanceId: 'scratch', targetId: 'tgt' });
          damages.push(hpBefore - s.target.hp);
        }

        expect(damages[0]).toBe(8);  // 6+2+0
        expect(damages[1]).toBe(10); // 6+2+2
        expect(damages[2]).toBe(12); // 6+2+4
      });

      it('non-attack resets streak', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'metronome_item' });
        s.source.itemState['metronomeAttacks'] = 0;

        // 2 attacks
        s.source.hand.push('scratch');
        playCard(s.state, s.source, { type: 'play_card', cardInstanceId: 'scratch', targetId: 'tgt' });
        s.source.hand.push('scratch');
        playCard(s.state, s.source, { type: 'play_card', cardInstanceId: 'scratch', targetId: 'tgt' });
        expect(s.source.itemState['metronomeAttacks']).toBe(2);

        // Non-attack resets
        s.source.hand.push('growl');
        playCard(s.state, s.source, { type: 'play_card', cardInstanceId: 'growl', targetId: 'tgt' });
        expect(s.source.itemState['metronomeAttacks']).toBe(0);

        // Next attack starts from 0
        const hpBefore = s.target.hp;
        s.source.hand.push('scratch');
        playCard(s.state, s.source, { type: 'play_card', cardInstanceId: 'scratch', targetId: 'tgt' });
        expect(hpBefore - s.target.hp).toBe(8); // 6+2+0
      });
    });

    // ── New Items: Battle-start ──────────────────────────────

    describe('New items: Battle-start', () => {
      it('Rocky Helmet: thorns 5', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'rocky_helmet' });
        processItemBattleStart(s.state, s.source);
        expect(s.source.statuses.find(st => st.type === 'thorns')?.stacks).toBe(5);
      });

      it('Toxic Plate: poison 1 all enemies', () => {
        const enemy2 = createTestCombatant({ id: 'e2', side: 'enemy', types: ['normal'] });
        enemy2.position = { row: 'back', column: 0 };
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'toxic_plate', extras: [enemy2] });
        processItemBattleStart(s.state, s.source);
        expect(s.target.statuses.find(st => st.type === 'poison')?.stacks).toBe(1);
        expect(enemy2.statuses.find(st => st.type === 'poison')?.stacks).toBe(1);
      });

      it('Choice Scarf: +1 energyPerTurn', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'choice_scarf' });
        const before = s.source.energyPerTurn;
        processItemBattleStart(s.state, s.source);
        expect(s.source.energyPerTurn).toBe(before + 1);
      });

      it('Black Sludge: +1 energyPerTurn', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'black_sludge' });
        const before = s.source.energyPerTurn;
        processItemBattleStart(s.state, s.source);
        expect(s.source.energyPerTurn).toBe(before + 1);
      });

      it('Flame Orb: +1 energyPerTurn + burn 2', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'flame_orb' });
        const before = s.source.energyPerTurn;
        processItemBattleStart(s.state, s.source);
        expect(s.source.energyPerTurn).toBe(before + 1);
        expect(s.source.statuses.find(st => st.type === 'burn')?.stacks).toBe(2);
      });
    });

    // ── New Items: Round-start ───────────────────────────────

    describe('New items: Round-start', () => {
      it('Bright Powder: evasion 1 in front row', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'bright_powder' });
        s.source.position = { row: 'front', column: 1 };
        processItemRoundStart(s.state, s.source);
        expect(s.source.statuses.find(st => st.type === 'evasion')?.stacks).toBe(1);
      });

      it('Bright Powder: no evasion in back row', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'bright_powder' });
        s.source.position = { row: 'back', column: 1 };
        processItemRoundStart(s.state, s.source);
        expect(s.source.statuses.find(st => st.type === 'evasion')).toBeUndefined();
      });

      it('Black Sludge: poison type heals 3', () => {
        const s = makeScenario({ sourceTypes: ['poison'], targetTypes: ['normal'], itemId: 'black_sludge', sourceHp: 90 });
        processItemRoundStart(s.state, s.source);
        expect(s.source.hp).toBe(93);
      });

      it('Black Sludge: non-poison takes 3', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'black_sludge' });
        processItemRoundStart(s.state, s.source);
        expect(s.source.hp).toBe(97);
      });
    });

    // ── New Items: Turn-start ────────────────────────────────

    describe('New items: Turn-start', () => {
      it('Power Herb: +1 energy round 1', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'power_herb' });
        s.state.round = 1;
        const before = s.source.energy;
        processItemTurnStart(s.state, s.source);
        expect(s.source.energy).toBe(before + 1);
      });

      it('Power Herb: no effect round 2', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'power_herb' });
        s.state.round = 2;
        const before = s.source.energy;
        processItemTurnStart(s.state, s.source);
        expect(s.source.energy).toBe(before);
      });

      it('Power Herb: only triggers once', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'power_herb' });
        s.state.round = 1;
        processItemTurnStart(s.state, s.source);
        const after1 = s.source.energy;
        processItemTurnStart(s.state, s.source);
        expect(s.source.energy).toBe(after1);
      });

      it('Slow Start Gem: draws 2 if flagged', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'slow_start_gem' });
        s.source.drawPile = ['card-a', 'card-b', 'card-c'];
        s.source.itemState['slowStartDraw'] = 1;
        processItemTurnStart(s.state, s.source);
        expect(s.source.hand).toHaveLength(2);
        expect(s.source.itemState['slowStartDraw']).toBe(0);
      });

      it('Slow Start Gem: no draw if not flagged', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'slow_start_gem' });
        s.source.drawPile = ['card-a', 'card-b'];
        processItemTurnStart(s.state, s.source);
        expect(s.source.hand).toHaveLength(0);
      });
    });

    // ── New Items: Damage bonus (Razor Fang) ─────────────────

    describe('New items: Damage bonus', () => {
      it('Razor Fang: first attack +8 → Scratch = 16', () => {
        // Normal source, STAB: 6+2+8 = 16
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'razor_fang' });
        expect(playAndMeasure(s.state, s.source, s.target, 'scratch').hpLost).toBe(16);
      });

      it('Razor Fang: second attack +0 → Scratch = 8', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'razor_fang' });
        playAndMeasure(s.state, s.source, s.target, 'scratch'); // first: 16
        expect(playAndMeasure(s.state, s.source, s.target, 'scratch').hpLost).toBe(8);
      });

      it('Razor Fang: type-eff applies (Fire→Water floor(15×0.75)=11)', () => {
        // Charmander (Fire), Ember base 5 + STAB 2 + RF 8 = 15, ×0.75 = floor(11.25) = 11
        const s = makeScenario({ sourceTypes: ['fire'], targetTypes: ['water'], itemId: 'razor_fang' });
        expect(playAndMeasure(s.state, s.source, s.target, 'ember').hpLost).toBe(11);
      });
    });

    // ── New Items: Post-card triggers ─────────────────────────

    describe('New items: Post-card triggers', () => {
      it('Adrenaline Orb: +1 energy on 5th attack', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'adrenaline_orb' });
        s.source.energy = 10;
        s.source.itemState['adrenalineAttacks'] = 0;
        for (let i = 0; i < 4; i++) {
          playAndMeasure(s.state, s.source, s.target, 'scratch');
        }
        const energyBefore = s.source.energy;
        playAndMeasure(s.state, s.source, s.target, 'scratch'); // 5th
        // Energy: before - 1 (cost) + 1 (orb) = before
        expect(s.source.energy).toBe(energyBefore);
      });

      it('Adrenaline Orb: no energy on attacks 1-4', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'adrenaline_orb' });
        s.source.itemState['adrenalineAttacks'] = 0;
        const energyBefore = s.source.energy;
        playAndMeasure(s.state, s.source, s.target, 'scratch');
        expect(s.source.energy).toBe(energyBefore - 1); // only cost deducted
      });

      it('Protective Pads: +5 block on 2nd attack', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'protective_pads' });
        s.source.itemState['attacksThisTurn'] = 0;
        playAndMeasure(s.state, s.source, s.target, 'scratch'); // 1st
        expect(s.source.block).toBe(0);
        playAndMeasure(s.state, s.source, s.target, 'scratch'); // 2nd
        expect(s.source.block).toBe(5);
      });

      it('Protective Pads: no extra block on 3rd attack', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'protective_pads' });
        s.source.energy = 10;
        s.source.itemState['attacksThisTurn'] = 0;
        playAndMeasure(s.state, s.source, s.target, 'scratch');
        playAndMeasure(s.state, s.source, s.target, 'scratch'); // +5
        playAndMeasure(s.state, s.source, s.target, 'scratch'); // no more
        expect(s.source.block).toBe(5);
      });
    });

    // ── New Items: Turn-end ──────────────────────────────────

    describe('New items: Turn-end', () => {
      it('Slow Start Gem: ≤1 cards → flag set', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'slow_start_gem' });
        s.source.itemState['cardsPlayedThisTurn'] = 1;
        processItemTurnEnd(s.state, s.source);
        expect(s.source.itemState['slowStartDraw']).toBe(1);
      });

      it('Slow Start Gem: >1 cards → no flag', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'slow_start_gem' });
        s.source.itemState['cardsPlayedThisTurn'] = 2;
        processItemTurnEnd(s.state, s.source);
        expect(s.source.itemState['slowStartDraw']).toBeUndefined();
      });

      it('Slow Start Gem: 0 cards → flag set', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'slow_start_gem' });
        s.source.itemState['cardsPlayedThisTurn'] = 0;
        processItemTurnEnd(s.state, s.source);
        expect(s.source.itemState['slowStartDraw']).toBe(1);
      });
    });

    // ── New Items: On-damage-taken ───────────────────────────

    describe('New items: On-damage-taken', () => {
      it('Sitrus Berry: draw 2 on first damage', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'] });
        s.target.heldItemIds = ['sitrus_berry'];
        s.target.drawPile = ['card-a', 'card-b', 'card-c'];
        processItemOnDamageTaken(s.state, s.target, 5);
        expect(s.target.hand).toHaveLength(2);
        expect(s.target.itemState['sitrusBerryUsed']).toBe(1);
      });

      it('Sitrus Berry: no draw on second damage', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'] });
        s.target.heldItemIds = ['sitrus_berry'];
        s.target.drawPile = ['card-a', 'card-b', 'card-c'];
        processItemOnDamageTaken(s.state, s.target, 5);
        const handAfterFirst = s.target.hand.length;
        processItemOnDamageTaken(s.state, s.target, 5);
        expect(s.target.hand).toHaveLength(handAfterFirst);
      });

      it('Sitrus Berry: no draw on 0 damage', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'] });
        s.target.heldItemIds = ['sitrus_berry'];
        s.target.drawPile = ['card-a', 'card-b'];
        processItemOnDamageTaken(s.state, s.target, 0);
        expect(s.target.hand).toHaveLength(0);
      });
    });

    // ── New Items: On-KO ─────────────────────────────────────

    describe('New items: On-KO', () => {
      it('Moxie Charm: +1 energy, draw 1 on enemy KO', () => {
        const killer = createTestCombatant({ id: 'k', side: 'player', heldItemIds: ['moxie_charm'] });
        killer.energy = 2;
        killer.drawPile = ['card-a', 'card-b'];
        const victim = createTestCombatant({ id: 'v', side: 'enemy', hp: 0 });
        victim.alive = false;
        const st = createTestCombatState([killer, victim]);
        processItemOnKO(st, killer, victim);
        expect(killer.energy).toBe(3);
        expect(killer.hand).toHaveLength(1);
      });

      it('Moxie Charm: no trigger on ally KO', () => {
        const killer = createTestCombatant({ id: 'k', side: 'player', heldItemIds: ['moxie_charm'] });
        killer.energy = 2;
        killer.drawPile = ['card-a'];
        const victim = createTestCombatant({ id: 'v', side: 'player', hp: 0 });
        victim.alive = false;
        const st = createTestCombatState([killer, victim]);
        processItemOnKO(st, killer, victim);
        expect(killer.energy).toBe(2);
        expect(killer.hand).toHaveLength(0);
      });

      it('Venom Sac: transfers poison stacks on KO', () => {
        const killer = createTestCombatant({ id: 'k', side: 'player', heldItemIds: ['venom_sac'] });
        const victim = createTestCombatant({ id: 'v', side: 'enemy', hp: 0 });
        victim.alive = false;
        addStatus(victim, 'poison', 3);
        const other = createTestCombatant({ id: 'o', side: 'enemy' });
        const st = createTestCombatState([killer, victim, other]);
        processItemOnKO(st, killer, victim);
        expect(getStatusStacks(other, 'poison')).toBe(3);
      });

      it('Venom Sac: no transfer if no poison', () => {
        const killer = createTestCombatant({ id: 'k', side: 'player', heldItemIds: ['venom_sac'] });
        const victim = createTestCombatant({ id: 'v', side: 'enemy', hp: 0 });
        victim.alive = false;
        const other = createTestCombatant({ id: 'o', side: 'enemy' });
        const st = createTestCombatState([killer, victim, other]);
        processItemOnKO(st, killer, victim);
        expect(getStatusStacks(other, 'poison')).toBe(0);
      });

      it('Venom Sac: no transfer if no alive enemies', () => {
        const killer = createTestCombatant({ id: 'k', side: 'player', heldItemIds: ['venom_sac'] });
        const victim = createTestCombatant({ id: 'v', side: 'enemy', hp: 0 });
        victim.alive = false;
        addStatus(victim, 'poison', 3);
        const st = createTestCombatState([killer, victim]);
        const logs = processItemOnKO(st, killer, victim);
        expect(logs.filter(l => l.message.includes('Venom Sac'))).toHaveLength(0);
      });
    });

    // ── New Items: Heal modifier ─────────────────────────────

    describe('New items: Heal modifier', () => {
      it('Big Root: +50% healing (10 → 15)', () => {
        const c = createTestCombatant({ id: 'h', side: 'player', heldItemIds: ['big_root'], hp: 70, maxHp: 100 });
        const healed = applyHeal(c, 10);
        expect(healed).toBe(15);
        expect(c.hp).toBe(85);
      });

      it('Big Root: floor rounding (3 → floor(4.5) = 4)', () => {
        const c = createTestCombatant({ id: 'h', side: 'player', heldItemIds: ['big_root'], hp: 90, maxHp: 100 });
        const healed = applyHeal(c, 3);
        expect(healed).toBe(4);
        expect(c.hp).toBe(94);
      });

      it('Big Root: capped at maxHp', () => {
        const c = createTestCombatant({ id: 'h', side: 'player', heldItemIds: ['big_root'], hp: 96, maxHp: 100 });
        const healed = applyHeal(c, 10);
        expect(healed).toBe(4);
        expect(c.hp).toBe(100);
      });
    });

    // ── New Items: Battle-end ────────────────────────────────

    describe('New items: Battle-end', () => {
      it('Oran Berry: heal 15 if below 50% HP', () => {
        const p = createTestCombatant({ id: 'p', side: 'player', heldItemIds: ['oran_berry'], hp: 40, maxHp: 100 });
        const st = createTestCombatState([p]);
        processItemBattleEnd(st);
        expect(p.hp).toBe(55);
      });

      it('Oran Berry: no heal at 50% HP', () => {
        const p = createTestCombatant({ id: 'p', side: 'player', heldItemIds: ['oran_berry'], hp: 50, maxHp: 100 });
        const st = createTestCombatState([p]);
        processItemBattleEnd(st);
        expect(p.hp).toBe(50);
      });

      it('Oran Berry: capped at maxHp', () => {
        // hp=8, maxHp=20 → 8 < 10 (50%) → triggers → 8+15=23 → capped at 20
        const p = createTestCombatant({ id: 'p', side: 'player', heldItemIds: ['oran_berry'], hp: 8, maxHp: 20 });
        const st = createTestCombatState([p]);
        processItemBattleEnd(st);
        expect(p.hp).toBe(20);
      });
    });

    // ── New Items: Damage reduction (Sturdy Charm) ───────────

    describe('New items: Damage reduction (Sturdy Charm)', () => {
      it('Sturdy Charm: 3 HP damage → 1', () => {
        // Thunder Shock (Electric, base 1) from Pikachu (Electric STAB): 1+2=3, ×1.0 → 3 → reduced to 1
        const s = makeScenario({ sourceTypes: ['electric'], targetTypes: ['normal'] });
        s.target.heldItemIds = ['sturdy_charm'];
        expect(playAndMeasure(s.state, s.source, s.target, 'thunder-shock').hpLost).toBe(1);
      });

      it('Sturdy Charm: 5 HP damage → 1', () => {
        // Ember (Fire, base 5) from Fire source → 5+2=7, ×0.75 (vs Water) = 5 → reduced to 1
        const s = makeScenario({ sourceTypes: ['fire'], targetTypes: ['water'] });
        s.target.heldItemIds = ['sturdy_charm'];
        expect(playAndMeasure(s.state, s.source, s.target, 'ember').hpLost).toBe(1);
      });

      it('Sturdy Charm: 8 HP damage → no reduction', () => {
        // Scratch (Normal, base 6) + STAB = 8 → >5 → full damage
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'] });
        s.target.heldItemIds = ['sturdy_charm'];
        expect(playAndMeasure(s.state, s.source, s.target, 'scratch').hpLost).toBe(8);
      });

      it('Sturdy Charm: 1 HP damage → no reduction', () => {
        // Thunder Shock base 1, no STAB from Normal = 1 → ≤1, not triggered
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'] });
        s.target.heldItemIds = ['sturdy_charm'];
        expect(playAndMeasure(s.state, s.source, s.target, 'thunder-shock').hpLost).toBe(1);
      });
    });

    // ── New Items: Status hook (King's Rock) ─────────────────

    describe('New items: Status hook (King\'s Rock)', () => {
      it('King\'s Rock: burn via Ember → also Slow 1', () => {
        const s = makeScenario({ sourceTypes: ['fire'], targetTypes: ['normal'], itemId: 'kings_rock' });
        playAndMeasure(s.state, s.source, s.target, 'ember');
        expect(s.target.statuses.find(st => st.type === 'burn')?.stacks).toBe(2);
        expect(s.target.statuses.find(st => st.type === 'slow')?.stacks).toBe(1);
      });

      it('King\'s Rock: no Slow on damage-only card', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'kings_rock' });
        playAndMeasure(s.state, s.source, s.target, 'scratch');
        expect(s.target.statuses.find(st => st.type === 'slow')).toBeUndefined();
      });
    });

    // ── New Items: Play restrictions (Choice Scarf) ──────────

    describe('New items: Play restrictions (Choice Scarf)', () => {
      it('Choice Scarf: blocks 3rd card', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'choice_scarf' });
        s.source.itemState['scarfCardsPlayed'] = 2;
        expect(checkItemPlayRestriction(s.source, getMove('scratch'))).toBe(false);
      });

      it('Choice Scarf: allows 1st and 2nd card', () => {
        const s = makeScenario({ sourceTypes: ['normal'], targetTypes: ['normal'], itemId: 'choice_scarf' });
        s.source.itemState['scarfCardsPlayed'] = 0;
        expect(checkItemPlayRestriction(s.source, getMove('scratch'))).toBe(true);
        s.source.itemState['scarfCardsPlayed'] = 1;
        expect(checkItemPlayRestriction(s.source, getMove('scratch'))).toBe(true);
      });
    });
  });

  // ============================================================
  // Layer 2: Comparative Invariants
  // ============================================================

  describe('Layer 2: Comparative Invariants', () => {

    // ── Unconditional flat bonus items ─────────────────────────

    describe('Unconditional flat bonus items', () => {
      const ITEMS = [
        { id: 'wide_lens', bonus: 2 },
        { id: 'toxic_orb', bonus: 4 },
      ];

      for (const item of ITEMS) {
        describe(item.id, () => {
          for (const src of SOURCE_POOL) {
            for (const cardId of src.cards) {
              for (const tgt of TARGET_POOL) {
                it(`${src.name}/${cardId} → ${tgt.name}`, () => {
                  const { withItem, withoutItem } = pairedDamage({
                    sourceTypes: src.types, targetTypes: tgt.types,
                    cardId, itemId: item.id,
                  });
                  expect(withItem).toBeGreaterThanOrEqual(withoutItem);

                  const typeEff = getTypeEffectiveness(getMove(cardId).type, tgt.types);
                  if (typeEff === 1.0) {
                    expect(withItem - withoutItem).toBe(item.bonus);
                  } else {
                    const expMin = Math.floor(item.bonus * typeEff);
                    expect(withItem - withoutItem).toBeGreaterThanOrEqual(expMin);
                    expect(withItem - withoutItem).toBeLessThanOrEqual(expMin + 1);
                  }
                });
              }
            }
          }
        });
      }

      // Choice Band: +8 but only front_enemy/front_row range attacks allowed
      describe('choice_band (+8, front-row only)', () => {
        const FRONT_ROW_RANGES = new Set(['front_enemy', 'front_row']);
        for (const src of SOURCE_POOL) {
          for (const cardId of src.cards) {
            const card = getMove(cardId);
            if (!FRONT_ROW_RANGES.has(card.range)) continue; // skip blocked ranges
            for (const tgt of TARGET_POOL) {
              it(`${src.name}/${cardId} → ${tgt.name}`, () => {
                const { withItem, withoutItem } = pairedDamage({
                  sourceTypes: src.types, targetTypes: tgt.types,
                  cardId, itemId: 'choice_band',
                });
                expect(withItem).toBeGreaterThanOrEqual(withoutItem);

                const typeEff = getTypeEffectiveness(card.type, tgt.types);
                if (typeEff === 1.0) {
                  expect(withItem - withoutItem).toBe(8);
                } else {
                  const expMin = Math.floor(8 * typeEff);
                  expect(withItem - withoutItem).toBeGreaterThanOrEqual(expMin);
                  expect(withItem - withoutItem).toBeLessThanOrEqual(expMin + 1);
                }
              });
            }
          }
        }
      });

      // Choice Specs: +8 but blocks front_enemy/front_row/all_enemies range attacks
      describe('choice_specs (+8, non-front-row only)', () => {
        const BLOCKED_RANGES = new Set(['front_enemy', 'front_row', 'all_enemies']);
        for (const src of SOURCE_POOL) {
          for (const cardId of src.cards) {
            const card = getMove(cardId);
            if (BLOCKED_RANGES.has(card.range)) continue; // skip blocked ranges
            for (const tgt of TARGET_POOL) {
              it(`${src.name}/${cardId} → ${tgt.name}`, () => {
                const { withItem, withoutItem } = pairedDamage({
                  sourceTypes: src.types, targetTypes: tgt.types,
                  cardId, itemId: 'choice_specs',
                });
                expect(withItem).toBeGreaterThanOrEqual(withoutItem);

                const typeEff = getTypeEffectiveness(card.type, tgt.types);
                if (typeEff === 1.0) {
                  expect(withItem - withoutItem).toBe(8);
                } else {
                  const expMin = Math.floor(8 * typeEff);
                  expect(withItem - withoutItem).toBeGreaterThanOrEqual(expMin);
                  expect(withItem - withoutItem).toBeLessThanOrEqual(expMin + 1);
                }
              });
            }
          }
        }
      });
    });

    // ── Conditional flat bonus items ───────────────────────────

    describe('Conditional flat bonus items', () => {

      // Scope Lens: +3 for single-target (all test cards qualify)
      describe('scope_lens (+3, single-target)', () => {
        for (const src of SOURCE_POOL) {
          for (const cardId of src.cards) {
            for (const tgt of TARGET_POOL) {
              it(`${src.name}/${cardId} → ${tgt.name}`, () => {
                const { withItem, withoutItem } = pairedDamage({
                  sourceTypes: src.types, targetTypes: tgt.types,
                  cardId, itemId: 'scope_lens',
                });
                expect(withItem).toBeGreaterThanOrEqual(withoutItem);
                const typeEff = getTypeEffectiveness(getMove(cardId).type, tgt.types);
                if (typeEff === 1.0) {
                  expect(withItem - withoutItem).toBe(3);
                }
              });
            }
          }
        }
      });

      // Sniper Scope / Pallet Cannon: +5 same column, +0 diff column
      for (const item of [{ id: 'sniper_scope', bonus: 5 }, { id: 'pallet_cannon', bonus: 5 }]) {
        describe(`${item.id} (+${item.bonus}, same col)`, () => {
          // Same column: bonus applies
          for (const src of SOURCE_POOL) {
            for (const cardId of src.cards) {
              for (const tgt of TARGET_POOL) {
                it(`same col: ${src.name}/${cardId} → ${tgt.name}`, () => {
                  const { withItem, withoutItem } = pairedDamage({
                    sourceTypes: src.types, targetTypes: tgt.types,
                    cardId, itemId: item.id,
                    sourceCol: 1, targetCol: 1,
                  });
                  expect(withItem).toBeGreaterThanOrEqual(withoutItem);
                  const typeEff = getTypeEffectiveness(getMove(cardId).type, tgt.types);
                  if (typeEff === 1.0) {
                    expect(withItem - withoutItem).toBe(item.bonus);
                  }
                });
              }
            }
          }

          // Different column: no bonus
          it('diff col: no bonus', () => {
            const { withItem, withoutItem } = pairedDamage({
              sourceTypes: ['normal'], targetTypes: ['normal'],
              cardId: 'scratch', itemId: item.id,
              sourceCol: 0, targetCol: 1,
            });
            expect(withItem).toBe(withoutItem);
          });
        });
      }

      // Expert Belt: +5 when super-effective, +0 otherwise
      describe('expert_belt (+5, super-effective)', () => {
        for (const src of SOURCE_POOL) {
          for (const cardId of src.cards) {
            for (const tgt of TARGET_POOL) {
              const cardType = getMove(cardId).type;
              const typeEff = getTypeEffectiveness(cardType, tgt.types);
              const isSE = typeEff > 1.0;

              it(`${src.name}/${cardId} → ${tgt.name} (${isSE ? 'SE' : 'neutral'})`, () => {
                const { withItem, withoutItem } = pairedDamage({
                  sourceTypes: src.types, targetTypes: tgt.types,
                  cardId, itemId: 'expert_belt',
                });
                if (isSE) {
                  expect(withItem).toBeGreaterThan(withoutItem);
                  const expMin = Math.floor(5 * typeEff);
                  expect(withItem - withoutItem).toBeGreaterThanOrEqual(expMin);
                  expect(withItem - withoutItem).toBeLessThanOrEqual(expMin + 1);
                } else {
                  expect(withItem).toBe(withoutItem);
                }
              });
            }
          }
        }
      });
    });

    // ── Multiplicative items ───────────────────────────────────

    describe('Multiplicative items', () => {
      describe('life_orb (×1.3)', () => {
        for (const src of SOURCE_POOL) {
          for (const cardId of src.cards) {
            for (const tgt of TARGET_POOL) {
              it(`${src.name}/${cardId} → ${tgt.name}: increased`, () => {
                const { withItem, withoutItem } = pairedDamage({
                  sourceTypes: src.types, targetTypes: tgt.types,
                  cardId, itemId: 'life_orb',
                });
                expect(withItem).toBeGreaterThanOrEqual(withoutItem);
              });
            }
          }
        }
      });

      describe('fuchsia_shuriken (×0.5 on dmg+status)', () => {
        for (const src of SOURCE_POOL) {
          for (const cardId of src.cards) {
            const isDmgStatus = cardHasDamageAndStatus(cardId);
            for (const tgt of TARGET_POOL) {
              if (isDmgStatus) {
                it(`${src.name}/${cardId} → ${tgt.name}: reduced`, () => {
                  const { withItem, withoutItem } = pairedDamage({
                    sourceTypes: src.types, targetTypes: tgt.types,
                    cardId, itemId: 'fuchsia_shuriken',
                  });
                  expect(withItem).toBeLessThanOrEqual(withoutItem);
                });
              } else {
                it(`${src.name}/${cardId} → ${tgt.name}: no effect`, () => {
                  const { withItem, withoutItem } = pairedDamage({
                    sourceTypes: src.types, targetTypes: tgt.types,
                    cardId, itemId: 'fuchsia_shuriken',
                  });
                  expect(withItem).toBe(withoutItem);
                });
              }
            }
          }
        }
      });
    });

    // ── Defensive items ────────────────────────────────────────

    describe('Defensive items (buddy_guard)', () => {
      // Ally is always Normal type → all attack types are neutral (typeEff=1.0)
      for (const src of SOURCE_POOL) {
        for (const cardId of src.cards) {
          it(`${src.name}/${cardId}: ally takes less damage`, () => {
            // With buddy guard
            const bg1 = createTestCombatant({ id: 'bg', side: 'player', heldItemIds: ['buddy_guard'] });
            bg1.position = { row: 'back', column: 1 };
            const ally1 = createTestCombatant({ id: 'ally', side: 'player', types: ['normal'], hp: 100, maxHp: 100 });
            ally1.position = { row: 'front', column: 1 };
            const atk1 = createTestCombatant({ id: 'atk', side: 'enemy', types: src.types, hp: 100, maxHp: 100 });
            atk1.position = { row: 'front', column: 1 };
            const st1 = createTestCombatState([bg1, ally1, atk1]);
            const { hpLost: withBG } = playAndMeasure(st1, atk1, ally1, cardId);

            // Without buddy guard
            const ally2 = createTestCombatant({ id: 'ally2', side: 'player', types: ['normal'], hp: 100, maxHp: 100 });
            ally2.position = { row: 'front', column: 1 };
            const atk2 = createTestCombatant({ id: 'atk2', side: 'enemy', types: src.types, hp: 100, maxHp: 100 });
            atk2.position = { row: 'front', column: 1 };
            const st2 = createTestCombatState([ally2, atk2]);
            const { hpLost: withoutBG } = playAndMeasure(st2, atk2, ally2, cardId);

            expect(withBG).toBeLessThanOrEqual(withoutBG);
            // Reduction is flat -4 after typeEff, capped at 0
            expect(withoutBG - withBG).toBe(Math.min(4, withoutBG));
          });
        }
      }
    });

    // ── Metronome scaling ──────────────────────────────────────

    describe('Metronome scaling invariant', () => {
      // All test cards vs Normal (typeEff=1.0) → exact +2 per attack
      for (const src of SOURCE_POOL) {
        for (const cardId of src.cards) {
          // Only test attack cards
          const card = getMove(cardId);
          const isAtk = card.effects.some(e =>
            e.type === 'damage' || e.type === 'multi_hit' ||
            e.type === 'heal_on_hit' || e.type === 'recoil'
          );
          if (!isAtk) continue;

          it(`${src.name}/${cardId}: 3 attacks escalate by +2`, () => {
            const s = makeScenario({
              sourceTypes: src.types, targetTypes: ['normal'],
              itemId: 'metronome_item',
            });
            s.source.itemState['metronomeAttacks'] = 0;

            const damages: number[] = [];
            for (let i = 0; i < 3; i++) {
              s.source.hand.push(cardId);
              const hpBefore = s.target.hp;
              playCard(s.state, s.source, {
                type: 'play_card', cardInstanceId: cardId, targetId: 'tgt',
              });
              damages.push(hpBefore - s.target.hp);
            }

            expect(damages[1]).toBeGreaterThan(damages[0]);
            expect(damages[2]).toBeGreaterThan(damages[1]);
            expect(damages[1] - damages[0]).toBe(2);
            expect(damages[2] - damages[1]).toBe(2);
          });
        }
      }
    });

    // ── Razor Fang (+8, first attack only) ───────────────────

    describe('Razor Fang (+8, first attack)', () => {
      // First attack: behaves like unconditional +8
      for (const src of SOURCE_POOL) {
        for (const cardId of src.cards) {
          for (const tgt of TARGET_POOL) {
            it(`first: ${src.name}/${cardId} → ${tgt.name}`, () => {
              const { withItem, withoutItem } = pairedDamage({
                sourceTypes: src.types, targetTypes: tgt.types,
                cardId, itemId: 'razor_fang',
              });
              expect(withItem).toBeGreaterThanOrEqual(withoutItem);
              const typeEff = getTypeEffectiveness(getMove(cardId).type, tgt.types);
              if (typeEff === 1.0) {
                expect(withItem - withoutItem).toBe(8);
              } else {
                const expMin = Math.floor(8 * typeEff);
                expect(withItem - withoutItem).toBeGreaterThanOrEqual(expMin);
                expect(withItem - withoutItem).toBeLessThanOrEqual(expMin + 1);
              }
            });
          }
        }
      }

      // Second attack: no bonus (razorFangUsed = true)
      for (const src of SOURCE_POOL) {
        for (const cardId of src.cards) {
          it(`second no bonus: ${src.name}/${cardId}`, () => {
            const s1 = makeScenario({
              sourceTypes: src.types, targetTypes: ['normal'],
              itemId: 'razor_fang',
            });
            playAndMeasure(s1.state, s1.source, s1.target, cardId); // first (uses bonus)
            const hpAfterFirst = s1.target.hp;
            playAndMeasure(s1.state, s1.source, s1.target, cardId); // second (no bonus)
            const secondDmg = hpAfterFirst - s1.target.hp;

            // Without item for comparison
            const s2 = makeScenario({
              sourceTypes: src.types, targetTypes: ['normal'],
            });
            const { hpLost: noDmg } = playAndMeasure(s2.state, s2.source, s2.target, cardId);
            expect(secondDmg).toBe(noDmg);
          });
        }
      }
    });

    // ── Sturdy Charm (damage 2-5 → 1) ───────────────────────

    describe('Sturdy Charm (2-5 HP → 1)', () => {
      for (const src of SOURCE_POOL) {
        for (const cardId of src.cards) {
          for (const tgt of TARGET_POOL) {
            it(`${src.name}/${cardId} → ${tgt.name}`, () => {
              // Without sturdy charm
              const s1 = makeScenario({
                sourceTypes: src.types, targetTypes: tgt.types,
              });
              const { hpLost: withoutItem } = playAndMeasure(s1.state, s1.source, s1.target, cardId);

              // With sturdy charm on target
              const s2 = makeScenario({
                sourceTypes: src.types, targetTypes: tgt.types,
              });
              s2.target.heldItemIds = ['sturdy_charm'];
              const { hpLost: withItem } = playAndMeasure(s2.state, s2.source, s2.target, cardId);

              if (withoutItem > 1 && withoutItem <= 5) {
                expect(withItem).toBe(1);
              } else {
                expect(withItem).toBe(withoutItem);
              }
            });
          }
        }
      }
    });
  });
});
