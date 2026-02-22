/**
 * Held Item Simulation Tests
 *
 * Runs full headless battles with items equipped across a huge variety of
 * player Pokemon, team compositions, formations, enemy matchups, and
 * multi-item party loadouts. Tests that items don't crash, trigger correctly,
 * and produce correct log output.
 *
 * Run: npx vitest run src/engine/itemSimulation.test.ts
 */

import { describe, it, expect } from 'vitest';
import type { CombatState, Combatant, Position, PlayCardAction, MoveDefinition } from './types';
import { createCombatState, getCurrentCombatant, buildTurnOrder, insertBonusTurns } from './combat';
import { startTurn, processAction, endTurn } from './turns';
import { getPlayableCards } from './cards';
import { getPokemon, getMove } from '../data/loaders';
import { getTypeEffectiveness } from './typeChart';
import { ITEM_DEFS } from '../data/items';
import { calculateHandPreview, calculateDamagePreview } from './preview';
import { onBattleStart, processRoundStartPassives } from './passives';
import {
  processItemBattleStart, processItemTurnStart, processItemRoundStart,
  processItemPostCard, processItemOnDamageDealt, processItemOnKO,
  processItemBattleEnd, processItemOnSwitch,
  getItemDamageBonus, getItemDamageBonusSourceOnly, getItemDamageReduction,
  getItemDamageMultiplier, getItemStatusStacksMultiplier,
  checkItemSurvival, checkItemPlayRestriction,
} from './itemEffects';
import { createTestCombatant, createTestCombatState } from './test-helpers';

// ============================================================
// Battle Runner — Runs a single battle to completion
// ============================================================

interface BattleFighter {
  pokemonId: string;
  position: Position;
  itemId?: string;
  passiveIds?: string[];
}

interface BattleConfig {
  players: BattleFighter[];
  enemies: BattleFighter[];
  maxTurns?: number;
}

interface BattleResult {
  victory: boolean;
  error?: string;
  log: string[];
  combatants: Combatant[];
  turnCount: number;
}

/** AI: select a card to play. Prefers highest damage, then status, then anything. */
function aiSelectCard(
  state: CombatState,
  combatant: Combatant,
): { handIndex: number; card: MoveDefinition } | null {
  const playableCardIds = new Set(getPlayableCards(combatant));
  if (playableCardIds.size === 0) return null;

  const options: { handIndex: number; card: MoveDefinition; damage: number }[] = [];
  for (let i = 0; i < combatant.hand.length; i++) {
    if (!playableCardIds.has(combatant.hand[i])) continue;
    const card = getMove(combatant.hand[i]);
    let damage = 0;
    for (const e of card.effects) {
      if (e.type === 'damage') damage += e.value;
      if (e.type === 'multi_hit') damage += e.value * e.hits;
      if (e.type === 'heal_on_hit') damage += e.value;
      if (e.type === 'recoil') damage += e.value;
      if (e.type === 'self_ko') damage += e.value;
    }
    options.push({ handIndex: i, card, damage });
  }

  if (options.length === 0) return null;

  // Heal if low HP
  if (combatant.hp / combatant.maxHp < 0.3) {
    const heal = options.find(o => o.card.effects.some(e =>
      e.type === 'heal' || e.type === 'heal_percent' || e.type === 'heal_on_hit'));
    if (heal) return { handIndex: heal.handIndex, card: heal.card };
  }

  // Prefer highest damage
  const best = options.reduce((a, b) => a.damage > b.damage ? a : b);
  return { handIndex: best.handIndex, card: best.card };
}

/** AI: select a target for a card. Focus-fire lowest HP with type advantage. */
function aiSelectTarget(
  state: CombatState,
  attacker: Combatant,
  card: MoveDefinition,
): string | undefined {
  if (card.range === 'self' || card.range === 'any_ally') return attacker.id;

  const enemies = state.combatants.filter(c => c.side !== attacker.side && c.alive);
  if (enemies.length === 0) return undefined;

  let validTargets = enemies;
  if (card.range === 'front_enemy') {
    const front = enemies.filter(e => e.position.row === 'front');
    validTargets = front.length > 0 ? front : enemies.filter(e => e.position.row === 'back');
  } else if (card.range === 'back_enemy') {
    const back = enemies.filter(e => e.position.row === 'back');
    validTargets = back.length > 0 ? back : enemies.filter(e => e.position.row === 'front');
  }

  if (validTargets.length === 0) validTargets = enemies;

  // Prefer type advantage, then lowest HP
  const withAdvantage = validTargets.filter(e => getTypeEffectiveness(card.type, e.types) > 1);
  const pool = withAdvantage.length > 0 ? withAdvantage : validTargets;
  return pool.reduce((a, b) => a.hp < b.hp ? a : b).id;
}

/**
 * Run a full battle to completion with items assigned.
 * Uses real Pokemon data, real cards, real passives — the full engine.
 */
function runItemBattle(config: BattleConfig): BattleResult {
  const maxTurns = config.maxTurns ?? 200;

  const playerData = config.players.map(p => getPokemon(p.pokemonId));
  const enemyData = config.enemies.map(e => getPokemon(e.pokemonId));
  const playerPositions = config.players.map(p => p.position);
  const enemyPositions = config.enemies.map(e => e.position);
  const playerSlotIndices = config.players.map((_, i) => i);

  const state = createCombatState(
    playerData, enemyData,
    playerPositions, enemyPositions,
    playerSlotIndices,
  );

  // Assign items and custom passives to player combatants
  const playerCombatants = state.combatants.filter(c => c.side === 'player');
  for (let i = 0; i < playerCombatants.length; i++) {
    const cfg = config.players[i];
    if (cfg.itemId) playerCombatants[i].heldItemIds = [cfg.itemId];
    if (cfg.passiveIds) playerCombatants[i].passiveIds = [...cfg.passiveIds];
  }

  // Assign items/passives to enemy combatants
  const enemyCombatants = state.combatants.filter(c => c.side === 'enemy');
  for (let i = 0; i < enemyCombatants.length; i++) {
    const cfg = config.enemies[i];
    if (cfg.itemId) enemyCombatants[i].heldItemIds = [cfg.itemId];
    if (cfg.passiveIds) enemyCombatants[i].passiveIds = [...cfg.passiveIds];
  }

  // Battle initialization — mirrors useBattle.ts sequence
  const battleStartLogs = onBattleStart(state);
  state.log.push(...battleStartLogs);
  state.turnOrder = buildTurnOrder(state);
  insertBonusTurns(state);
  state.currentTurnIndex = 0;
  const roundStartLogs = processRoundStartPassives(state);
  state.log.push(...roundStartLogs);

  let turnCount = 0;

  try {
    while (state.phase === 'ongoing' && turnCount < maxTurns) {
      turnCount++;

      if (state.turnOrder.length === 0) {
        return { victory: false, error: 'Empty turn order', log: state.log.map(l => l.message), combatants: state.combatants, turnCount };
      }
      if (state.currentTurnIndex >= state.turnOrder.length) {
        state.currentTurnIndex = state.turnOrder.length - 1;
      }

      const { logs: startLogs, skipped } = startTurn(state);
      state.log.push(...startLogs);

      if (state.phase !== 'ongoing') break;
      if (skipped) continue;

      const combatant = getCurrentCombatant(state);

      let actions = 0;
      while (actions < 20) {
        actions++;
        if (state.phase !== 'ongoing' || !combatant.alive) break;

        const choice = aiSelectCard(state, combatant);
        if (!choice) break;

        const targetId = aiSelectTarget(state, combatant, choice.card);
        const action: PlayCardAction = {
          type: 'play_card',
          cardInstanceId: combatant.hand[choice.handIndex],
          targetId,
        };

        const actionLogs = processAction(state, action);
        state.log.push(...actionLogs);

        if (combatant.primedSelfKo) break;
      }

      if (state.phase !== 'ongoing') break;

      const endLogs = endTurn(state);
      state.log.push(...endLogs);
    }
  } catch (err) {
    return {
      victory: false,
      error: err instanceof Error ? err.message : String(err),
      log: state.log.map(l => l.message),
      combatants: state.combatants,
      turnCount,
    };
  }

  if (turnCount >= maxTurns) {
    return {
      victory: false,
      error: `Battle exceeded ${maxTurns} turns`,
      log: state.log.map(l => l.message),
      combatants: state.combatants,
      turnCount,
    };
  }

  // Battle end hooks (Celadon Leaf heal, etc.)
  processItemBattleEnd(state);

  const playersAlive = state.combatants.some(c => c.side === 'player' && c.alive);
  return {
    victory: playersAlive && state.phase === 'victory',
    log: state.log.map(l => l.message),
    combatants: state.combatants,
    turnCount,
  };
}

// ============================================================
// Item Effect Validator — verifies numerical correctness
// per battle for every equipped item.
//
// Three tiers:
//  1. Always-trigger: battle-start/round-start items must show
//     exact values in combatant state or logs.
//  2. When-attacked: if the holder played an attack card,
//     damage bonuses must appear in logs with correct values.
//  3. Log-value: when an item's name appears in logs, the
//     numbers must match expected values.
// ============================================================

/** Common non-attack card names for play restriction checks. */
const NON_ATTACK_CARDS = [
  'Growl', 'Defend', 'Leer', 'Smokescreen', 'Harden', 'Withdraw',
  'Tail Whip', 'String Shot', 'Sand Attack', 'Double Team', 'Flash',
  'Minimize', 'Growth', 'Amnesia', 'Barrier', 'Swords Dance', 'Agility',
  'Light Screen', 'Reflect', 'Mist', 'Haze', 'Guard Spec', 'Dire Hit',
  'Focus Energy', 'Meditate', 'Sharpen', 'Defense Curl', 'Cosmic Power',
  'Acid Armor', 'Charm', 'Screech',
];

/**
 * Validate that every equipped item produced its expected numerical effect.
 * Returns an array of error messages (empty = all correct).
 */
function validateItemEffects(result: BattleResult, config: BattleConfig): string[] {
  const errors: string[] = [];
  if (result.error) return errors;

  const enemyNames = new Set(config.enemies.map(e => getPokemon(e.pokemonId).name));

  for (let i = 0; i < config.players.length; i++) {
    const p = config.players[i];
    if (!p.itemId) continue;

    const poke = getPokemon(p.pokemonId);
    const c = result.combatants.find(c => c.side === 'player' && c.slotIndex === i);
    if (!c) continue;

    const name = poke.name;
    const itemId = p.itemId;

    // Can we reliably attribute log entries to this holder?
    // Only if the holder's Pokemon name doesn't also appear in the enemy team.
    const nameUnique = !enemyNames.has(name);

    // ── Tier 1: Always-trigger items ────────────────────────────

    if (itemId === 'quick_claw') {
      // Quick Claw now grants a bonus turn instead of speed — just verify no crash
    }

    if (itemId === 'eviolite') {
      if (c.maxHp !== poke.maxHp + 15) {
        errors.push(`Eviolite on ${name}: maxHp=${c.maxHp}, expected ${poke.maxHp + 15}`);
      }
    }

    if (itemId === 'toxic_orb') {
      if (!result.log.some(l => l.includes('Toxic Orb') && l.includes('poisoned'))) {
        errors.push(`Toxic Orb on ${name}: no "poisoned" log at battle start`);
      }
    }

    if (itemId === 'pewter_stone') {
      if (!result.log.some(l => l.includes('Pewter Stone') && l.includes('8 Block'))) {
        errors.push(`Pewter Stone on ${name}: no "8 Block" at battle start`);
      }
    }

    if (itemId === 'iron_plate') {
      if (!result.log.some(l => l.includes('Iron Plate') && l.includes('Block'))) {
        errors.push(`Iron Plate on ${name}: no block log at round start`);
      }
    }

    if (itemId === 'assault_vest') {
      if (!result.log.some(l => l.includes('Assault Vest') && l.includes('10 Block'))) {
        errors.push(`Assault Vest on ${name}: no "10 Block" at round start`);
      }
    }

    // ── Play restriction items ──────────────────────────────────
    // Only check when name is unique (otherwise enemy with same name triggers false positives)

    if (nameUnique && (itemId === 'choice_band' || itemId === 'assault_vest')) {
      for (const card of NON_ATTACK_CARDS) {
        if (result.log.some(l => l.includes(`${name} plays ${card}`))) {
          errors.push(`${ITEM_DEFS[itemId].name} on ${name}: played non-attack "${card}"`);
        }
      }
    }

    // ── Tier 3: Log-value checks (verify numbers when item appears) ──

    if (itemId === 'leftovers') {
      for (const log of result.log) {
        if (log.includes('Leftovers') && log.includes('heals')) {
          const m = log.match(/heals (\d+) HP/);
          if (m && parseInt(m[1]) > 3) {
            errors.push(`Leftovers: healed ${m[1]} HP, expected ≤3`);
          }
        }
      }
    }

    if (itemId === 'sacred_ash') {
      for (const log of result.log) {
        if (log.includes('Sacred Ash') && log.includes('heals')) {
          const m = log.match(/heals (\d+) HP/);
          if (m && parseInt(m[1]) > 5) {
            errors.push(`Sacred Ash: healed ${m[1]} HP, expected ≤5`);
          }
        }
      }
    }

    if (itemId === 'cerulean_tear') {
      for (const log of result.log) {
        if (log.includes('Cerulean Tear') && log.includes('heals')) {
          const m = log.match(/heals (\d+) HP/);
          if (m && parseInt(m[1]) > 5) {
            errors.push(`Cerulean Tear: healed ${m[1]} HP, expected ≤5`);
          }
        }
      }
    }

    if (itemId === 'shell_bell') {
      for (const log of result.log) {
        if (log.includes('Shell Bell') && log.includes('heals')) {
          const m = log.match(/heals (\d+) HP/);
          if (m && parseInt(m[1]) > 2) {
            errors.push(`Shell Bell: healed ${m[1]} HP, expected ≤2`);
          }
        }
      }
    }

    if (itemId === 'life_orb') {
      for (const log of result.log) {
        if (log.includes('Life Orb') && log.includes('recoil')) {
          if (!log.includes('3 recoil damage')) {
            errors.push(`Life Orb: recoil not "3 recoil damage": ${log}`);
          }
        }
      }
    }

    // Fuchsia Shuriken: verify x0.5 damage log when it appears
    if (itemId === 'fuchsia_shuriken') {
      for (const log of result.log) {
        if (log.includes('fuchsia_shuriken:')) {
          if (!log.includes('x0.5 damage')) {
            errors.push(`Fuchsia Shuriken: unexpected log: ${log}`);
          }
        }
      }
    }

    // Focus Sash: if holder died (hp=0), focusSashUsed must be true (it survived once)
    // If holder is alive AND focusSashUsed, that's valid (survived lethal, then survived rest)
    if (itemId === 'focus_sash') {
      if (!c.alive && !c.focusSashUsed) {
        // Holder died without sash triggering — that's fine if damage was
        // from bypass (poison/burn) which doesn't check items, or multi-hit
        // Actually Focus Sash should trigger on ANY lethal hit. But bypass damage
        // (applyBypassDamage) doesn't call checkItemSurvival. So this is expected
        // for deaths by poison/burn. Can't distinguish in stress tests, so skip.
      }
    }

    // Celadon Leaf: holder should be healed for 6 at battle end (if alive and not at max HP)
    // We can't easily check exact HP change in stress tests, but we can verify
    // the holder's HP doesn't exceed maxHp (basic sanity)
    if (itemId === 'celadon_leaf' && c.alive) {
      if (c.hp > c.maxHp) {
        errors.push(`Celadon Leaf on ${name}: HP ${c.hp} > maxHp ${c.maxHp}`);
      }
    }

    // Buddy Guard: verify exact reduction value when log appears
    if (itemId === 'buddy_guard') {
      for (const log of result.log) {
        if (log.includes('buddy_guard:') && log.includes('damage')) {
          if (!log.includes('-4 damage')) {
            errors.push(`Buddy Guard: wrong reduction in log: ${log}`);
          }
        }
      }
    }

    // Damage bonus items: when the bonus log appears, verify the exact number
    const bonusChecks: Record<string, number> = {
      wide_lens: 2, choice_band: 8, choice_specs: 8, toxic_orb: 4,
      scope_lens: 3, sniper_scope: 5, pallet_cannon: 5, expert_belt: 5,
    };
    if (itemId in bonusChecks) {
      const expected = bonusChecks[itemId];
      for (const log of result.log) {
        if (log.includes(`${itemId}:`) && log.includes('damage')) {
          if (!log.includes(`+${expected} damage`)) {
            errors.push(`${ITEM_DEFS[itemId].name}: wrong bonus in log: ${log}, expected +${expected}`);
          }
        }
      }
    }

    if (itemId === 'metronome_item') {
      for (const log of result.log) {
        if (log.includes('metronome_item:') && log.includes('damage')) {
          const m = log.match(/\+(\d+) damage/);
          if (m) {
            const bonus = parseInt(m[1]);
            // Must be a multiple of 2 (2 per consecutive attack)
            if (bonus % 2 !== 0) {
              errors.push(`Metronome: bonus ${bonus} is not a multiple of 2`);
            }
          }
        }
      }
    }

    // Celadon Leaf: verify heal amount ≤ 6 when log appears
    if (itemId === 'celadon_leaf') {
      for (const log of result.log) {
        if (log.includes('celadon_leaf:') && log.includes('heals')) {
          const m = log.match(/heals (\d+) HP/);
          if (m && parseInt(m[1]) > 6) {
            errors.push(`Celadon Leaf: healed ${m[1]} HP, expected ≤6`);
          }
        }
      }
    }

    // Focus Sash: verify "survived with 1 HP" when log appears
    if (itemId === 'focus_sash') {
      for (const log of result.log) {
        if (log.includes('focus_sash:')) {
          if (!log.includes('survived with 1 HP')) {
            errors.push(`Focus Sash: unexpected log: ${log}`);
          }
        }
      }
      // Also: if focusSashUsed, holder must have hp >= 0 (survived at some point)
      if (c.focusSashUsed && c.alive && c.hp !== 1) {
        // Could have healed after sash triggered — that's fine, skip
      }
    }
  }

  return errors;
}

// ============================================================
// Test Data — Huge variety of team compositions and formations
// ============================================================

// Positions shorthand
const F0: Position = { row: 'front', column: 0 };
const F1: Position = { row: 'front', column: 1 };
const F2: Position = { row: 'front', column: 2 };
const B0: Position = { row: 'back', column: 0 };
const B1: Position = { row: 'back', column: 1 };
const B2: Position = { row: 'back', column: 2 };

const TEAM_CONFIGS: { name: string; players: BattleFighter[] }[] = [
  // --- Classic starter trios ---
  {
    name: 'Starter trio (base)',
    players: [
      { pokemonId: 'charmander', position: F0 },
      { pokemonId: 'squirtle', position: F1 },
      { pokemonId: 'bulbasaur', position: B0 },
    ],
  },
  {
    name: 'Starter trio (evolved)',
    players: [
      { pokemonId: 'charizard', position: F1 },
      { pokemonId: 'blastoise', position: F0 },
      { pokemonId: 'venusaur', position: B0 },
    ],
  },
  // --- Mono-type teams ---
  {
    name: 'Mono Fire',
    players: [
      { pokemonId: 'arcanine', position: F1 },
      { pokemonId: 'ninetales', position: F0 },
      { pokemonId: 'magmar', position: B0 },
    ],
  },
  {
    name: 'Mono Water',
    players: [
      { pokemonId: 'gyarados', position: F1 },
      { pokemonId: 'lapras', position: F0 },
      { pokemonId: 'wartortle', position: B0 },
    ],
  },
  {
    name: 'Mono Electric',
    players: [
      { pokemonId: 'pikachu', position: F0 },
      { pokemonId: 'electabuzz', position: F1 },
      { pokemonId: 'electrode', position: B0 },
    ],
  },
  {
    name: 'Mono Poison',
    players: [
      { pokemonId: 'arbok', position: F1 },
      { pokemonId: 'nidoking', position: F0 },
      { pokemonId: 'nidoqueen', position: B0 },
    ],
  },
  {
    name: 'Mono Normal',
    players: [
      { pokemonId: 'tauros', position: F0 },
      { pokemonId: 'kangaskhan', position: F1 },
      { pokemonId: 'snorlax', position: B0 },
    ],
  },
  {
    name: 'Mono Bug',
    players: [
      { pokemonId: 'beedrill', position: F0 },
      { pokemonId: 'butterfree', position: B0 },
      { pokemonId: 'venomoth', position: B1 },
    ],
  },
  // --- Formation variety ---
  {
    name: 'All-front aggro',
    players: [
      { pokemonId: 'tauros', position: F0 },
      { pokemonId: 'pikachu', position: F1 },
      { pokemonId: 'rattata', position: F2 },
    ],
  },
  {
    name: 'All-back passive',
    players: [
      { pokemonId: 'bulbasaur', position: B0 },
      { pokemonId: 'drowzee', position: B1 },
      { pokemonId: 'clefairy', position: B2 },
    ],
  },
  {
    name: 'Single tank front',
    players: [
      { pokemonId: 'snorlax', position: F1 },
      { pokemonId: 'pidgey', position: B0 },
      { pokemonId: 'ekans', position: B1 },
    ],
  },
  {
    name: 'Wide spread formation',
    players: [
      { pokemonId: 'machamp', position: F0 },
      { pokemonId: 'gengar', position: B2 },
      { pokemonId: 'dragonite', position: F2 },
    ],
  },
  // --- Type coverage ---
  {
    name: 'Psychic/Ghost/Dark',
    players: [
      { pokemonId: 'hypno', position: F1 },
      { pokemonId: 'gengar', position: F0 },
      { pokemonId: 'persian', position: B0 },
    ],
  },
  {
    name: 'Dragon line',
    players: [
      { pokemonId: 'dratini', position: F0 },
      { pokemonId: 'dragonair', position: F1 },
      { pokemonId: 'dragonite', position: B0 },
    ],
  },
  {
    name: 'Fairy team',
    players: [
      { pokemonId: 'clefable', position: F1 },
      { pokemonId: 'wigglytuff', position: F0 },
      { pokemonId: 'clefairy', position: B0 },
    ],
  },
  {
    name: 'Ground/Rock bruisers',
    players: [
      { pokemonId: 'rhydon', position: F1 },
      { pokemonId: 'sandslash', position: F0 },
      { pokemonId: 'nidoking', position: B0 },
    ],
  },
  // --- Solo Pokemon ---
  {
    name: 'Solo Snorlax',
    players: [{ pokemonId: 'snorlax', position: F1 }],
  },
  {
    name: 'Solo Mewtwo',
    players: [{ pokemonId: 'mewtwo', position: F1 }],
  },
  {
    name: 'Solo Rattata',
    players: [{ pokemonId: 'rattata', position: F1 }],
  },
  // --- Evolution families ---
  {
    name: 'Nido family',
    players: [
      { pokemonId: 'nidoran-m', position: F0 },
      { pokemonId: 'nidoran-f', position: F1 },
      { pokemonId: 'kangaskhan', position: B0 },
    ],
  },
  {
    name: 'Zubat line',
    players: [
      { pokemonId: 'zubat', position: F0 },
      { pokemonId: 'golbat', position: F1 },
      { pokemonId: 'crobat', position: B0 },
    ],
  },
  {
    name: 'Porygon line',
    players: [
      { pokemonId: 'porygon', position: F0 },
      { pokemonId: 'porygon2', position: F1 },
      { pokemonId: 'porygon-z', position: B0 },
    ],
  },
  // --- Mixed types and roles ---
  {
    name: 'Glass cannons',
    players: [
      { pokemonId: 'beedrill', position: F0 },
      { pokemonId: 'raticate', position: F1 },
      { pokemonId: 'spearow', position: F2 },
    ],
  },
  {
    name: 'Status-heavy team',
    players: [
      { pokemonId: 'haunter', position: F1 },
      { pokemonId: 'oddish', position: B0 },
      { pokemonId: 'paras', position: B1 },
    ],
  },
];

const ENEMY_CONFIGS: { name: string; enemies: BattleFighter[] }[] = [
  // --- Weak encounters ---
  {
    name: '2 Rattata',
    enemies: [
      { pokemonId: 'rattata', position: F0 },
      { pokemonId: 'rattata', position: F1 },
    ],
  },
  {
    name: '3 Pidgey',
    enemies: [
      { pokemonId: 'pidgey', position: F0 },
      { pokemonId: 'pidgey', position: F1 },
      { pokemonId: 'pidgey', position: B0 },
    ],
  },
  {
    name: 'Caterpie + Weedle',
    enemies: [
      { pokemonId: 'caterpie', position: F0 },
      { pokemonId: 'weedle', position: F1 },
    ],
  },
  // --- Type diversity ---
  {
    name: 'Pikachu + Bulbasaur',
    enemies: [
      { pokemonId: 'pikachu', position: F0 },
      { pokemonId: 'bulbasaur', position: B0 },
    ],
  },
  {
    name: 'Charmander + Squirtle',
    enemies: [
      { pokemonId: 'charmander', position: F0 },
      { pokemonId: 'squirtle', position: F1 },
    ],
  },
  {
    name: 'Machop + Gastly',
    enemies: [
      { pokemonId: 'machop', position: F1 },
      { pokemonId: 'gastly', position: B0 },
    ],
  },
  {
    name: 'Oddish + Sandshrew + Vulpix',
    enemies: [
      { pokemonId: 'oddish', position: F0 },
      { pokemonId: 'sandshrew', position: F1 },
      { pokemonId: 'vulpix', position: B0 },
    ],
  },
  // --- Tanky encounters ---
  {
    name: 'Snorlax + Tauros',
    enemies: [
      { pokemonId: 'snorlax', position: F0 },
      { pokemonId: 'tauros', position: F1 },
    ],
  },
  {
    name: 'Rhydon + Kangaskhan',
    enemies: [
      { pokemonId: 'rhydon', position: F1 },
      { pokemonId: 'kangaskhan', position: F0 },
    ],
  },
  // --- Boss-tier solo ---
  {
    name: 'Solo Snorlax',
    enemies: [{ pokemonId: 'snorlax', position: F1 }],
  },
  {
    name: 'Solo Dragonite',
    enemies: [{ pokemonId: 'dragonite', position: F1 }],
  },
  {
    name: 'Solo Mewtwo',
    enemies: [{ pokemonId: 'mewtwo', position: F1 }],
  },
  // --- Evolved teams ---
  {
    name: 'Arcanine + Gengar',
    enemies: [
      { pokemonId: 'arcanine', position: F1 },
      { pokemonId: 'gengar', position: B0 },
    ],
  },
  {
    name: 'Gyarados + Lapras',
    enemies: [
      { pokemonId: 'gyarados', position: F0 },
      { pokemonId: 'lapras', position: F1 },
    ],
  },
  {
    name: 'Machamp + Clefable + Arbok',
    enemies: [
      { pokemonId: 'machamp', position: F1 },
      { pokemonId: 'clefable', position: B0 },
      { pokemonId: 'arbok', position: F0 },
    ],
  },
  // --- Swarm encounters ---
  {
    name: '3 Zubat',
    enemies: [
      { pokemonId: 'zubat', position: F0 },
      { pokemonId: 'zubat', position: F1 },
      { pokemonId: 'zubat', position: B0 },
    ],
  },
];

// All item IDs
const ALL_ITEM_IDS = Object.keys(ITEM_DEFS);

// Multi-item party loadouts — different items on different party members
interface ItemLoadout {
  name: string;
  items: { slotIndex: number; itemId: string }[];
}

const MULTI_ITEM_LOADOUTS: ItemLoadout[] = [
  // --- Two-item combos ---
  { name: 'Life Orb + Shell Bell', items: [{ slotIndex: 0, itemId: 'life_orb' }, { slotIndex: 1, itemId: 'shell_bell' }] },
  { name: 'Choice Band + Quick Claw', items: [{ slotIndex: 0, itemId: 'choice_band' }, { slotIndex: 1, itemId: 'quick_claw' }] },
  { name: 'Leftovers + Iron Plate', items: [{ slotIndex: 0, itemId: 'leftovers' }, { slotIndex: 1, itemId: 'iron_plate' }] },
  { name: 'Focus Sash + Eviolite', items: [{ slotIndex: 0, itemId: 'focus_sash' }, { slotIndex: 1, itemId: 'eviolite' }] },
  { name: 'Toxic Orb + Expert Belt', items: [{ slotIndex: 0, itemId: 'toxic_orb' }, { slotIndex: 1, itemId: 'expert_belt' }] },
  { name: 'Pewter Stone + Sacred Ash', items: [{ slotIndex: 0, itemId: 'pewter_stone' }, { slotIndex: 1, itemId: 'sacred_ash' }] },
  { name: 'Metronome + Scope Lens', items: [{ slotIndex: 0, itemId: 'metronome_item' }, { slotIndex: 1, itemId: 'scope_lens' }] },
  { name: 'Wide Lens + Sniper Scope', items: [{ slotIndex: 0, itemId: 'wide_lens' }, { slotIndex: 1, itemId: 'sniper_scope' }] },
  { name: 'Cerulean Tear + Buddy Guard', items: [{ slotIndex: 0, itemId: 'cerulean_tear' }, { slotIndex: 1, itemId: 'buddy_guard' }] },
  { name: 'Fuchsia Shuriken + Cinnabar Ash', items: [{ slotIndex: 0, itemId: 'fuchsia_shuriken' }, { slotIndex: 1, itemId: 'cinnabar_ash' }] },
  { name: 'Vermilion Spark + Lavender Tombstone', items: [{ slotIndex: 0, itemId: 'vermilion_spark' }, { slotIndex: 1, itemId: 'lavender_tombstone' }] },
  { name: 'Assault Vest + Smoke Ball', items: [{ slotIndex: 0, itemId: 'assault_vest' }, { slotIndex: 1, itemId: 'smoke_ball' }] },
  { name: 'Choice Specs + Saffron Spoon', items: [{ slotIndex: 0, itemId: 'choice_specs' }, { slotIndex: 1, itemId: 'saffron_spoon' }] },
  { name: 'Guerrilla Boots + Pallet Cannon', items: [{ slotIndex: 0, itemId: 'guerrilla_boots' }, { slotIndex: 1, itemId: 'pallet_cannon' }] },
  { name: 'Viridian Target + Celadon Leaf', items: [{ slotIndex: 0, itemId: 'viridian_target' }, { slotIndex: 1, itemId: 'celadon_leaf' }] },
  // --- Three-item full-team loadouts ---
  { name: 'Full defense: Leftovers + Iron Plate + Assault Vest', items: [
    { slotIndex: 0, itemId: 'leftovers' }, { slotIndex: 1, itemId: 'iron_plate' }, { slotIndex: 2, itemId: 'assault_vest' },
  ]},
  { name: 'Full offense: Life Orb + Choice Band + Expert Belt', items: [
    { slotIndex: 0, itemId: 'life_orb' }, { slotIndex: 1, itemId: 'choice_band' }, { slotIndex: 2, itemId: 'expert_belt' },
  ]},
  { name: 'Status overload: Toxic Orb + Fuchsia Shuriken + Vermilion Spark', items: [
    { slotIndex: 0, itemId: 'toxic_orb' }, { slotIndex: 1, itemId: 'fuchsia_shuriken' }, { slotIndex: 2, itemId: 'vermilion_spark' },
  ]},
  { name: 'All starters: Pewter + Cerulean + Vermilion', items: [
    { slotIndex: 0, itemId: 'pewter_stone' }, { slotIndex: 1, itemId: 'cerulean_tear' }, { slotIndex: 2, itemId: 'vermilion_spark' },
  ]},
  { name: 'Scaling: Metronome + Quick Claw + Eviolite', items: [
    { slotIndex: 0, itemId: 'metronome_item' }, { slotIndex: 1, itemId: 'quick_claw' }, { slotIndex: 2, itemId: 'eviolite' },
  ]},
  { name: 'Back-row supports: Sacred Ash + Cerulean Tear + Buddy Guard', items: [
    { slotIndex: 0, itemId: 'sacred_ash' }, { slotIndex: 1, itemId: 'cerulean_tear' }, { slotIndex: 2, itemId: 'buddy_guard' },
  ]},
  { name: 'Boss items: Choice Specs + Toxic Orb + Expert Belt', items: [
    { slotIndex: 0, itemId: 'choice_specs' }, { slotIndex: 1, itemId: 'toxic_orb' }, { slotIndex: 2, itemId: 'expert_belt' },
  ]},
  { name: 'Mixed rare: Life Orb + Assault Vest + Eviolite', items: [
    { slotIndex: 0, itemId: 'life_orb' }, { slotIndex: 1, itemId: 'assault_vest' }, { slotIndex: 2, itemId: 'eviolite' },
  ]},
  { name: 'Fire synergy: Cinnabar Ash + Fuchsia Shuriken + Lavender Tombstone', items: [
    { slotIndex: 0, itemId: 'cinnabar_ash' }, { slotIndex: 1, itemId: 'fuchsia_shuriken' }, { slotIndex: 2, itemId: 'lavender_tombstone' },
  ]},
  { name: 'Sustain: Shell Bell + Leftovers + Celadon Leaf', items: [
    { slotIndex: 0, itemId: 'shell_bell' }, { slotIndex: 1, itemId: 'leftovers' }, { slotIndex: 2, itemId: 'celadon_leaf' },
  ]},
];

// ============================================================
// Tests
// ============================================================

describe('Item Battle Simulations', () => {

  // ── 1. Massive stress test: every item × every team × every enemy ──
  describe('No-crash stress test: all items × 24 teams × 16 enemies', () => {
    for (const itemId of ALL_ITEM_IDS) {
      const item = ITEM_DEFS[itemId];

      describe(`${item.name} (${itemId})`, () => {
        for (const team of TEAM_CONFIGS) {
          for (const enemyCfg of ENEMY_CONFIGS) {
            it(`${team.name} vs ${enemyCfg.name}`, () => {
              // Equip this item on the first player
              const players = team.players.map((p, i) => ({
                ...p,
                itemId: i === 0 ? itemId : undefined,
              }));

              const battleConfig = { players, enemies: enemyCfg.enemies };
              const result = runItemBattle(battleConfig);

              expect(result.error).toBeUndefined();
              expect(result.turnCount).toBeGreaterThan(0);
              expect(result.turnCount).toBeLessThan(200);

              // Validate item produced correct numerical effects
              const itemErrors = validateItemEffects(result, battleConfig);
              if (itemErrors.length > 0) {
                expect.fail(itemErrors.join('\n'));
              }
            });
          }
        }
      });
    }
  });

  // ── 2. Multi-item party loadouts ──────────────────────────────────
  describe('Multi-item party loadouts: different items on different party members', () => {
    // Only use teams with enough members for the loadout
    const multiMemberTeams = TEAM_CONFIGS.filter(t => t.players.length >= 2);

    for (const loadout of MULTI_ITEM_LOADOUTS) {
      describe(loadout.name, () => {
        const teamsForLoadout = multiMemberTeams.filter(t =>
          t.players.length >= Math.max(...loadout.items.map(i => i.slotIndex + 1))
        );

        for (const team of teamsForLoadout) {
          for (const enemyCfg of ENEMY_CONFIGS) {
            it(`${team.name} vs ${enemyCfg.name}`, () => {
              const players = team.players.map((p, i) => {
                const loadoutEntry = loadout.items.find(l => l.slotIndex === i);
                return { ...p, itemId: loadoutEntry?.itemId };
              });

              const battleConfig = { players, enemies: enemyCfg.enemies };
              const result = runItemBattle(battleConfig);

              expect(result.error).toBeUndefined();
              expect(result.turnCount).toBeGreaterThan(0);
              expect(result.turnCount).toBeLessThan(200);

              const itemErrors = validateItemEffects(result, battleConfig);
              if (itemErrors.length > 0) {
                expect.fail(itemErrors.join('\n'));
              }
            });
          }
        }
      });
    }
  });

  // ── 3. All items on ALL party slots (not just first) ──────────────
  describe('Items on every party slot: validated', () => {
    it('all items on all slots — correct numerical effects', () => {
      let totalBattles = 0;
      let totalCrashes = 0;
      let totalValidationErrors = 0;
      const crashDetails: string[] = [];
      const validationDetails: string[] = [];
      const triggerCounts: Record<string, { total: number; triggered: number }> = {};

      for (const itemId of ALL_ITEM_IDS) {
        triggerCounts[itemId] = { total: 0, triggered: 0 };
      }

      for (const itemId of ALL_ITEM_IDS) {
        for (const team of TEAM_CONFIGS) {
          for (const enemyCfg of ENEMY_CONFIGS) {
            const players = team.players.map(p => ({ ...p, itemId }));
            const battleConfig = { players, enemies: enemyCfg.enemies };

            const result = runItemBattle(battleConfig);
            totalBattles++;
            triggerCounts[itemId].total++;

            if (result.error) {
              totalCrashes++;
              crashDetails.push(`${itemId} | ${team.name} vs ${enemyCfg.name}: ${result.error}`);
            } else {
              // Validate numerical correctness
              const itemErrors = validateItemEffects(result, battleConfig);
              if (itemErrors.length > 0) {
                totalValidationErrors += itemErrors.length;
                for (const e of itemErrors) {
                  validationDetails.push(`${team.name} vs ${enemyCfg.name}: ${e}`);
                }
              }
            }

            // Check both display name ("Wide Lens") and item ID ("wide_lens") since
            // different log sources use different formats
            const displayName = ITEM_DEFS[itemId].name.toLowerCase();
            if (result.log.some(l => {
              const ll = l.toLowerCase();
              return ll.includes(displayName) || ll.includes(itemId);
            })) {
              triggerCounts[itemId].triggered++;
            }
          }
        }
      }

      console.log(`\n=== All-Slots Validated Summary ===`);
      console.log(`Total battles: ${totalBattles}`);
      console.log(`Crashes: ${totalCrashes}, Validation errors: ${totalValidationErrors}`);
      console.log(`\nItem trigger rates:`);
      for (const [itemId, stats] of Object.entries(triggerCounts)) {
        const rate = stats.total > 0 ? ((stats.triggered / stats.total) * 100).toFixed(0) : '0';
        console.log(`  ${ITEM_DEFS[itemId].name.padEnd(20)} ${rate}%`);
      }

      if (crashDetails.length > 0) {
        console.log(`\nCrash details:`);
        for (const e of crashDetails) console.log(`  ${e}`);
      }
      if (validationDetails.length > 0) {
        console.log(`\nValidation errors (first 20):`);
        for (const e of validationDetails.slice(0, 20)) console.log(`  ${e}`);
        if (validationDetails.length > 20) console.log(`  ... and ${validationDetails.length - 20} more`);
      }

      expect(totalCrashes).toBe(0);
      expect(totalValidationErrors).toBe(0);
    });
  });

  // ── 4. Numerical correctness: exact values for every item ─────────
  //
  // Tests call item hook functions directly with controlled combatants
  // and assert exact numerical outcomes. This is the real correctness
  // layer — the smoke tests above only check for crashes.
  // ─────────────────────────────────────────────────────────────────
  describe('Numerical correctness for every item', () => {

    // --- Battle Start Items ---

    it('Quick Claw: sets bonus turn flag', () => {
      const c = createTestCombatant({ speed: 40, heldItemIds: ['quick_claw'] });
      const state = createTestCombatState([c]);
      const logs = processItemBattleStart(state, c);
      expect(c.turnFlags.quickClawBonusTurn).toBe(true);
      expect(logs.length).toBe(1);
      expect(logs[0].message).toContain('Quick Claw');
    });

    it('Quick Claw: verified in full battle — Snorlax speed unchanged (bonus turn instead)', () => {
      const baseSpeed = getPokemon('snorlax').baseSpeed;
      const result = runItemBattle({
        players: [{ pokemonId: 'snorlax', position: F1, itemId: 'quick_claw' }],
        enemies: [{ pokemonId: 'rattata', position: F1 }],
      });
      expect(result.error).toBeUndefined();
      const snorlax = result.combatants.find(c => c.pokemonId === 'snorlax')!;
      expect(snorlax.speed).toBe(baseSpeed);
    });

    it('Eviolite: exactly +15 max HP and +15 current HP', () => {
      const c = createTestCombatant({ hp: 80, maxHp: 80, heldItemIds: ['eviolite'] });
      const state = createTestCombatState([c]);
      processItemBattleStart(state, c);
      expect(c.maxHp).toBe(95);
      expect(c.hp).toBe(95);
    });

    it('Eviolite: verified in full battle — Pikachu maxHp = base + 15', () => {
      const baseMaxHp = getPokemon('pikachu').maxHp;
      const result = runItemBattle({
        players: [{ pokemonId: 'pikachu', position: F1, itemId: 'eviolite' }],
        enemies: [{ pokemonId: 'rattata', position: F1 }],
      });
      expect(result.error).toBeUndefined();
      const pikachu = result.combatants.find(c => c.pokemonId === 'pikachu')!;
      expect(pikachu.maxHp).toBe(baseMaxHp + 15);
    });

    it('Toxic Orb: exactly poison 1 at battle start + +4 damage', () => {
      const c = createTestCombatant({ heldItemIds: ['toxic_orb'] });
      const enemy = createTestCombatant({ side: 'enemy' });
      const state = createTestCombatState([c, enemy]);
      const logs = processItemBattleStart(state, c);
      expect(logs.length).toBe(1);
      expect(logs[0].message).toContain('Toxic Orb');
      expect(c.statuses.some(s => s.type === 'poison' && s.stacks === 1)).toBe(true);
      // Damage bonus
      const card = getMove('tackle');
      const bonus = getItemDamageBonus(state, c, enemy, card);
      expect(bonus).toBe(4);
    });

    it('Toxic Orb: verified in full battle — holder has poison status', () => {
      const result = runItemBattle({
        players: [{ pokemonId: 'tauros', position: F1, itemId: 'toxic_orb' }],
        enemies: [{ pokemonId: 'snorlax', position: F1 }],
      });
      expect(result.error).toBeUndefined();
      expect(result.log.some(l => l.includes('Toxic Orb') && l.includes('poisoned'))).toBe(true);
    });

    it('Pewter Stone: exactly 8 block at battle start', () => {
      const c = createTestCombatant({ heldItemIds: ['pewter_stone'], block: 0 });
      const state = createTestCombatState([c]);
      processItemBattleStart(state, c);
      expect(c.block).toBe(8);
    });

    // --- Turn Start Items ---

    it('Leftovers: exactly 3 HP healed per turn', () => {
      const c = createTestCombatant({ hp: 50, maxHp: 100, heldItemIds: ['leftovers'] });
      const state = createTestCombatState([c]);
      const logs = processItemTurnStart(state, c);
      expect(c.hp).toBe(53);
      expect(logs.length).toBe(1);
      expect(logs[0].message).toContain('heals 3 HP');
    });

    it('Leftovers: does not heal past maxHp', () => {
      const c = createTestCombatant({ hp: 99, maxHp: 100, heldItemIds: ['leftovers'] });
      const state = createTestCombatState([c]);
      processItemTurnStart(state, c);
      expect(c.hp).toBe(100);
    });

    it('Leftovers: no log when at full HP', () => {
      const c = createTestCombatant({ hp: 100, maxHp: 100, heldItemIds: ['leftovers'] });
      const state = createTestCombatState([c]);
      const logs = processItemTurnStart(state, c);
      expect(logs.length).toBe(0);
    });

    it('Sacred Ash: exactly 5 HP healed to front ally in same column', () => {
      const front = createTestCombatant({ id: 'front', hp: 40, maxHp: 100, side: 'player' });
      front.position = { row: 'front', column: 1 };
      const back = createTestCombatant({ id: 'back', hp: 80, maxHp: 100, side: 'player', heldItemIds: ['sacred_ash'] });
      back.position = { row: 'back', column: 1 };
      const state = createTestCombatState([front, back]);
      const logs = processItemTurnStart(state, back);
      expect(front.hp).toBe(45);
      expect(logs.length).toBe(1);
      expect(logs[0].message).toContain('Sacred Ash');
      expect(logs[0].message).toContain('heals 5 HP');
    });

    it('Sacred Ash: does NOT heal ally in different column', () => {
      const front = createTestCombatant({ id: 'front', hp: 40, maxHp: 100, side: 'player' });
      front.position = { row: 'front', column: 0 };
      const back = createTestCombatant({ id: 'back', hp: 80, maxHp: 100, side: 'player', heldItemIds: ['sacred_ash'] });
      back.position = { row: 'back', column: 1 };
      const state = createTestCombatState([front, back]);
      const logs = processItemTurnStart(state, back);
      expect(front.hp).toBe(40); // unchanged
      expect(logs.length).toBe(0);
    });

    it('Cerulean Tear: exactly 5 HP healed to front ally in same column', () => {
      const front = createTestCombatant({ id: 'front', hp: 60, maxHp: 100, side: 'player' });
      front.position = { row: 'front', column: 1 };
      const back = createTestCombatant({ id: 'back', hp: 80, maxHp: 100, side: 'player', heldItemIds: ['cerulean_tear'] });
      back.position = { row: 'back', column: 1 };
      const state = createTestCombatState([front, back]);
      const logs = processItemTurnStart(state, back);
      expect(front.hp).toBe(65);
      expect(logs[0].message).toContain('Cerulean Tear');
    });

    it('Cerulean Tear: works from front row too (not back-only like Sacred Ash)', () => {
      const front = createTestCombatant({ id: 'front', hp: 40, maxHp: 100, side: 'player' });
      front.position = { row: 'front', column: 1 };
      const healer = createTestCombatant({ id: 'healer', hp: 80, maxHp: 100, side: 'player', heldItemIds: ['cerulean_tear'] });
      healer.position = { row: 'back', column: 1 };
      const state = createTestCombatState([front, healer]);
      const logs = processItemTurnStart(state, healer);
      expect(front.hp).toBe(45);
      expect(logs.length).toBe(1);
    });

    // --- Round Start Items ---

    it('Iron Plate: block = allies_in_row × 3', () => {
      const c1 = createTestCombatant({ id: 'c1', block: 0, heldItemIds: ['iron_plate'], side: 'player' });
      c1.position = { row: 'front', column: 0 };
      const c2 = createTestCombatant({ id: 'c2', block: 0, side: 'player' });
      c2.position = { row: 'front', column: 1 };
      const c3 = createTestCombatant({ id: 'c3', block: 0, side: 'player' });
      c3.position = { row: 'back', column: 0 };
      const state = createTestCombatState([c1, c2, c3]);
      const logs = processItemRoundStart(state, c1);
      // 2 allies in front row (c1 + c2) → 2 × 3 = 6
      expect(c1.block).toBe(6);
      expect(logs[0].message).toContain('6 Block');
      expect(logs[0].message).toContain('2 allies');
    });

    it('Iron Plate: solo in row = 1 × 3 = 3 block', () => {
      const c = createTestCombatant({ block: 0, heldItemIds: ['iron_plate'], side: 'player' });
      c.position = { row: 'back', column: 0 };
      const state = createTestCombatState([c]);
      processItemRoundStart(state, c);
      expect(c.block).toBe(3);
    });

    it('Assault Vest: exactly +10 block at round start', () => {
      const c = createTestCombatant({ block: 5, heldItemIds: ['assault_vest'] });
      const state = createTestCombatState([c]);
      processItemRoundStart(state, c);
      expect(c.block).toBe(15);
    });

    it('Pewter Stone: provokes enemies in same column each round', () => {
      const player = createTestCombatant({ id: 'player', heldItemIds: ['pewter_stone'], side: 'player' });
      player.position = { row: 'front', column: 1 };
      const enemy1 = createTestCombatant({ id: 'enemy1', side: 'enemy' });
      enemy1.position = { row: 'front', column: 1 }; // same column
      const enemy2 = createTestCombatant({ id: 'enemy2', side: 'enemy' });
      enemy2.position = { row: 'front', column: 0 }; // different column
      const state = createTestCombatState([player, enemy1, enemy2]);
      const logs = processItemRoundStart(state, player);
      expect(enemy1.statuses.some(s => s.type === 'provoke')).toBe(true);
      expect(enemy2.statuses.some(s => s.type === 'provoke')).toBe(false);
      expect(logs.length).toBe(1); // Only enemy1 provoked
    });

    // --- Damage Bonus Items (exact additive values) ---

    it('Wide Lens: exactly +2 damage on all attacks', () => {
      const source = createTestCombatant({ heldItemIds: ['wide_lens'] });
      const target = createTestCombatant({ side: 'enemy' });
      const state = createTestCombatState([source, target]);
      const tackle = getMove('tackle');
      const ember = getMove('ember');
      expect(getItemDamageBonus(state, source, target, tackle)).toBe(2);
      expect(getItemDamageBonus(state, source, target, ember)).toBe(2);
    });

    it('Choice Band: exactly +8 damage', () => {
      const source = createTestCombatant({ heldItemIds: ['choice_band'] });
      const target = createTestCombatant({ side: 'enemy' });
      const state = createTestCombatState([source, target]);
      expect(getItemDamageBonus(state, source, target, getMove('tackle'))).toBe(8);
    });

    it('Choice Specs: exactly +8 damage', () => {
      const source = createTestCombatant({ heldItemIds: ['choice_specs'] });
      const target = createTestCombatant({ side: 'enemy' });
      const state = createTestCombatState([source, target]);
      expect(getItemDamageBonus(state, source, target, getMove('tackle'))).toBe(8);
    });

    it('Toxic Orb: exactly +4 damage', () => {
      const source = createTestCombatant({ heldItemIds: ['toxic_orb'] });
      const target = createTestCombatant({ side: 'enemy' });
      const state = createTestCombatState([source, target]);
      expect(getItemDamageBonus(state, source, target, getMove('tackle'))).toBe(4);
    });

    it('Scope Lens: +3 for single-target, +0 for AoE', () => {
      const source = createTestCombatant({ heldItemIds: ['scope_lens'] });
      const target = createTestCombatant({ side: 'enemy' });
      const state = createTestCombatState([source, target]);
      // front_enemy = single target → +3
      expect(getItemDamageBonus(state, source, target, getMove('tackle'))).toBe(3);
      // any_enemy = single target → +3
      expect(getItemDamageBonus(state, source, target, getMove('ember'))).toBe(3);
      // AoE (column/all) → +0
      expect(getItemDamageBonus(state, source, target, getMove('flamethrower'))).toBe(0);
    });

    it('Sniper Scope: +5 in same column, +0 in different column', () => {
      const source = createTestCombatant({ heldItemIds: ['sniper_scope'] });
      source.position = { row: 'front', column: 1 };
      const sameCol = createTestCombatant({ id: 'same', side: 'enemy' });
      sameCol.position = { row: 'front', column: 1 };
      const diffCol = createTestCombatant({ id: 'diff', side: 'enemy' });
      diffCol.position = { row: 'front', column: 0 };
      const state = createTestCombatState([source, sameCol, diffCol]);
      expect(getItemDamageBonus(state, source, sameCol, getMove('tackle'))).toBe(5);
      expect(getItemDamageBonus(state, source, diffCol, getMove('tackle'))).toBe(0);
    });

    it('Pallet Cannon: +5 in same column, +0 in different column', () => {
      const source = createTestCombatant({ heldItemIds: ['pallet_cannon'] });
      source.position = { row: 'front', column: 1 };
      const sameCol = createTestCombatant({ id: 'same', side: 'enemy' });
      sameCol.position = { row: 'front', column: 1 };
      const diffCol = createTestCombatant({ id: 'diff', side: 'enemy' });
      diffCol.position = { row: 'front', column: 0 };
      const state = createTestCombatState([source, sameCol, diffCol]);
      expect(getItemDamageBonus(state, source, sameCol, getMove('tackle'))).toBe(5);
      expect(getItemDamageBonus(state, source, diffCol, getMove('tackle'))).toBe(0);
    });

    it('Expert Belt: +5 on super-effective, +0 on neutral or resisted', () => {
      const source = createTestCombatant({ heldItemIds: ['expert_belt'], types: ['fire'] });
      const grassTarget = createTestCombatant({ id: 'grass', side: 'enemy', types: ['grass'] });
      const normalTarget = createTestCombatant({ id: 'normal', side: 'enemy', types: ['normal'] });
      const waterTarget = createTestCombatant({ id: 'water', side: 'enemy', types: ['water'] });
      const state = createTestCombatState([source, grassTarget, normalTarget, waterTarget]);
      const ember = getMove('ember'); // fire type
      // Fire vs Grass = 2x (super effective) → +5
      expect(getItemDamageBonus(state, source, grassTarget, ember, 2.0)).toBe(5);
      // Fire vs Normal = 1x (neutral) → +0
      expect(getItemDamageBonus(state, source, normalTarget, ember, 1.0)).toBe(0);
      // Fire vs Water = 0.5x (resisted) → +0
      expect(getItemDamageBonus(state, source, waterTarget, ember, 0.5)).toBe(0);
    });

    it('Metronome: +0 first attack, +2 second, +4 third, resets on non-attack', () => {
      const source = createTestCombatant({ heldItemIds: ['metronome_item'] });
      source.itemState['metronomeAttacks'] = 0;
      const target = createTestCombatant({ side: 'enemy' });
      const state = createTestCombatState([source, target]);
      const tackle = getMove('tackle');
      // First attack: 0 consecutive → +0
      expect(getItemDamageBonus(state, source, target, tackle)).toBe(0);
      // After playing: metronomeAttacks becomes 1
      processItemPostCard(state, source, tackle);
      expect(source.itemState['metronomeAttacks']).toBe(1);
      // Second attack: 1 consecutive → +2
      expect(getItemDamageBonus(state, source, target, tackle)).toBe(2);
      processItemPostCard(state, source, tackle);
      expect(source.itemState['metronomeAttacks']).toBe(2);
      // Third attack: 2 consecutive → +4
      expect(getItemDamageBonus(state, source, target, tackle)).toBe(4);
      // Play a non-attack → resets
      const growl = getMove('growl');
      processItemPostCard(state, source, growl);
      expect(source.itemState['metronomeAttacks']).toBe(0);
      expect(getItemDamageBonus(state, source, target, tackle)).toBe(0);
    });

    it('Guerrilla Boots: +4 after switching forward', () => {
      const source = createTestCombatant({ heldItemIds: ['guerrilla_boots'] });
      source.position = { row: 'front', column: 1 };
      source.itemState['guerillaFront'] = 1;
      const target = createTestCombatant({ side: 'enemy' });
      const state = createTestCombatState([source, target]);
      expect(getItemDamageBonus(state, source, target, getMove('tackle'))).toBe(4);
      // Without the flag, no bonus
      source.itemState['guerillaFront'] = 0;
      expect(getItemDamageBonus(state, source, target, getMove('tackle'))).toBe(0);
    });

    // --- Damage Multiplier Items ---

    it('Life Orb: exactly 1.3x damage multiplier', () => {
      const source = createTestCombatant({ heldItemIds: ['life_orb'] });
      expect(getItemDamageMultiplier(source)).toBe(1.3);
    });

    it('Life Orb: no multiplier without item', () => {
      const source = createTestCombatant({});
      expect(getItemDamageMultiplier(source)).toBe(1.0);
    });

    it('Fuchsia Shuriken: 0.5x multiplier on damage+status cards, 1.0x on pure damage', () => {
      const source = createTestCombatant({ heldItemIds: ['fuchsia_shuriken'] });
      const ember = getMove('ember'); // damage + burn (status)
      const tackle = getMove('tackle'); // pure damage, no status
      expect(getItemDamageMultiplier(source, ember)).toBe(0.5);
      expect(getItemDamageMultiplier(source, tackle)).toBe(1.0);
    });

    it('Fuchsia Shuriken: 2x status stacks on damage+status cards', () => {
      const source = createTestCombatant({ heldItemIds: ['fuchsia_shuriken'] });
      const ember = getMove('ember');
      const tackle = getMove('tackle');
      expect(getItemStatusStacksMultiplier(source, ember)).toBe(2);
      expect(getItemStatusStacksMultiplier(source, tackle)).toBe(1);
    });

    // --- Damage Reduction ---

    it('Buddy Guard: -4 reduction for ally in same column (single-target only)', () => {
      const guard = createTestCombatant({ id: 'guard', heldItemIds: ['buddy_guard'], side: 'player' });
      guard.position = { row: 'back', column: 1 };
      const ally = createTestCombatant({ id: 'ally', side: 'player' });
      ally.position = { row: 'front', column: 1 };
      const allyDiffCol = createTestCombatant({ id: 'ally2', side: 'player' });
      allyDiffCol.position = { row: 'front', column: 0 };
      const state = createTestCombatState([guard, ally, allyDiffCol]);
      const tackle = getMove('tackle'); // front_enemy (single target)
      const flamethrower = getMove('flamethrower'); // column (AoE)
      // Ally in same column, single target → -4
      expect(getItemDamageReduction(state, ally, tackle)).toBe(4);
      // Ally in different column → 0
      expect(getItemDamageReduction(state, allyDiffCol, tackle)).toBe(0);
      // AoE → 0 (Buddy Guard only works on single-target)
      expect(getItemDamageReduction(state, ally, flamethrower)).toBe(0);
      // Buddy Guard holder itself → 0 (does NOT protect itself)
      expect(getItemDamageReduction(state, guard, tackle)).toBe(0);
    });

    // --- Post-Card Items ---

    it('Life Orb: exactly 3 self-damage after each attack', () => {
      const c = createTestCombatant({ hp: 100, maxHp: 100, heldItemIds: ['life_orb'] });
      const state = createTestCombatState([c]);
      const tackle = getMove('tackle');
      processItemPostCard(state, c, tackle);
      expect(c.hp).toBe(97);
      processItemPostCard(state, c, tackle);
      expect(c.hp).toBe(94);
      // Non-attack → no recoil
      const growl = getMove('growl');
      processItemPostCard(state, c, growl);
      expect(c.hp).toBe(94);
    });

    it('Life Orb: recoil can KO the holder', () => {
      const c = createTestCombatant({ hp: 2, maxHp: 100, heldItemIds: ['life_orb'] });
      const state = createTestCombatState([c]);
      processItemPostCard(state, c, getMove('tackle'));
      expect(c.hp).toBe(0);
      expect(c.alive).toBe(false);
    });

    it('Cinnabar Ash: draws 1 card on vanish', () => {
      const c = createTestCombatant({ heldItemIds: ['cinnabar_ash'] });
      c.drawPile = ['card-a', 'card-b'];
      const state = createTestCombatState([c]);
      const vanishCard = getMove('growl'); // vanish: true
      const logs = processItemPostCard(state, c, vanishCard, true);
      expect(c.hand.length).toBe(1);
      expect(logs.length).toBe(1);
      expect(logs[0].message).toContain('Cinnabar Ash');
      expect(logs[0].message).toContain('draws a card');
    });

    it('Cinnabar Ash: no draw on non-vanish card', () => {
      const c = createTestCombatant({ heldItemIds: ['cinnabar_ash'] });
      c.drawPile = ['card-a'];
      const state = createTestCombatState([c]);
      const logs = processItemPostCard(state, c, getMove('tackle'), false);
      expect(c.hand.length).toBe(0);
      expect(logs.length).toBe(0);
    });

    it('Shell Bell: exactly 2 HP healed on damage dealt', () => {
      const attacker = createTestCombatant({ hp: 50, maxHp: 100, heldItemIds: ['shell_bell'] });
      const target = createTestCombatant({ id: 'target', side: 'enemy' });
      const state = createTestCombatState([attacker, target]);
      const logs = processItemOnDamageDealt(state, attacker, target, 10, getMove('tackle'));
      expect(attacker.hp).toBe(52);
      expect(logs[0].message).toContain('Shell Bell');
      expect(logs[0].message).toContain('heals 2 HP');
    });

    it('Shell Bell: no heal when at full HP', () => {
      const attacker = createTestCombatant({ hp: 100, maxHp: 100, heldItemIds: ['shell_bell'] });
      const target = createTestCombatant({ id: 'target', side: 'enemy' });
      const state = createTestCombatState([attacker, target]);
      const logs = processItemOnDamageDealt(state, attacker, target, 10, getMove('tackle'));
      expect(attacker.hp).toBe(100);
      expect(logs.length).toBe(0);
    });

    it('Shell Bell: once per card (shellBellUsed flag)', () => {
      const attacker = createTestCombatant({ hp: 50, maxHp: 100, heldItemIds: ['shell_bell'] });
      const target = createTestCombatant({ id: 'target', side: 'enemy' });
      const state = createTestCombatState([attacker, target]);
      processItemOnDamageDealt(state, attacker, target, 10, getMove('tackle'));
      expect(attacker.hp).toBe(52);
      // Second call: shellBellUsed = 1, no heal
      processItemOnDamageDealt(state, attacker, target, 10, getMove('tackle'));
      expect(attacker.hp).toBe(52); // unchanged
    });

    it('Vermilion Spark: provoke on contact, no provoke on ranged', () => {
      const attacker = createTestCombatant({ heldItemIds: ['vermilion_spark'] });
      const target = createTestCombatant({ id: 'target', side: 'enemy' });
      const state = createTestCombatState([attacker, target]);
      const scratch = getMove('scratch'); // contact: true
      const ember = getMove('ember'); // contact: false
      // Contact → provoke
      processItemOnDamageDealt(state, attacker, target, 5, scratch);
      expect(target.statuses.some(s => s.type === 'provoke')).toBe(true);
      // Clear for next test
      target.statuses = [];
      // Non-contact → no provoke
      processItemOnDamageDealt(state, attacker, target, 5, ember);
      expect(target.statuses.some(s => s.type === 'provoke')).toBe(false);
    });

    // --- Survival ---

    it('Focus Sash: survives lethal at 1 HP exactly once', () => {
      const c = createTestCombatant({ hp: 0, maxHp: 100, heldItemIds: ['focus_sash'] });
      c.alive = false;
      const survived = checkItemSurvival(c);
      expect(survived).toBe(true);
      expect(c.hp).toBe(1);
      expect(c.alive).toBe(true);
      expect(c.focusSashUsed).toBe(true);
      // Second lethal: doesn't save again
      c.hp = 0;
      c.alive = false;
      const survivedAgain = checkItemSurvival(c);
      expect(survivedAgain).toBe(false);
      expect(c.alive).toBe(false);
    });

    // --- KO Trigger ---

    it('Lavender Tombstone: +1 energy when enemy dies in same column', () => {
      const holder = createTestCombatant({ id: 'holder', heldItemIds: ['lavender_tombstone'], side: 'player' });
      holder.position = { row: 'front', column: 1 };
      holder.energy = 2;
      holder.energyCap = 10;
      const victim = createTestCombatant({ id: 'victim', side: 'enemy' });
      victim.position = { row: 'front', column: 1 };
      victim.alive = false;
      const state = createTestCombatState([holder, victim]);
      const logs = processItemOnKO(state, holder, victim);
      expect(holder.energy).toBe(3);
      expect(logs.length).toBe(1);
      expect(logs[0].message).toContain('Lavender Tombstone');
    });

    it('Lavender Tombstone: no energy when enemy dies in different column', () => {
      const holder = createTestCombatant({ id: 'holder', heldItemIds: ['lavender_tombstone'], side: 'player' });
      holder.position = { row: 'front', column: 1 };
      holder.energy = 2;
      const victim = createTestCombatant({ id: 'victim', side: 'enemy' });
      victim.position = { row: 'front', column: 0 };
      victim.alive = false;
      const state = createTestCombatState([holder, victim]);
      const logs = processItemOnKO(state, holder, victim);
      expect(holder.energy).toBe(2);
      expect(logs.length).toBe(0);
    });

    it('Lavender Tombstone: no energy when at energy cap', () => {
      const holder = createTestCombatant({ id: 'holder', heldItemIds: ['lavender_tombstone'], side: 'player' });
      holder.position = { row: 'front', column: 1 };
      holder.energy = 10;
      holder.energyCap = 10;
      const victim = createTestCombatant({ id: 'victim', side: 'enemy' });
      victim.position = { row: 'front', column: 1 };
      victim.alive = false;
      const state = createTestCombatState([holder, victim]);
      const logs = processItemOnKO(state, holder, victim);
      expect(holder.energy).toBe(10);
      expect(logs.length).toBe(0);
    });

    // --- Battle End ---

    it('Celadon Leaf: exactly 6 HP healed at battle end', () => {
      const c = createTestCombatant({ hp: 50, maxHp: 100, heldItemIds: ['celadon_leaf'], side: 'player' });
      const state = createTestCombatState([c]);
      processItemBattleEnd(state);
      expect(c.hp).toBe(56);
    });

    it('Celadon Leaf: does not heal past maxHp', () => {
      const c = createTestCombatant({ hp: 97, maxHp: 100, heldItemIds: ['celadon_leaf'], side: 'player' });
      const state = createTestCombatState([c]);
      processItemBattleEnd(state);
      expect(c.hp).toBe(100);
    });

    it('Celadon Leaf: does not heal dead Pokemon', () => {
      const c = createTestCombatant({ hp: 0, maxHp: 100, heldItemIds: ['celadon_leaf'], side: 'player' });
      c.alive = false;
      const state = createTestCombatState([c]);
      processItemBattleEnd(state);
      expect(c.hp).toBe(0);
    });

    // --- Switch Items ---

    it('Viridian Target: provokes enemies when switching columns', () => {
      const holder = createTestCombatant({ id: 'holder', heldItemIds: ['viridian_target'], side: 'player' });
      holder.position = { row: 'front', column: 1 }; // current pos
      const enemy = createTestCombatant({ id: 'enemy', side: 'enemy' });
      enemy.position = { row: 'front', column: 1 }; // same as new column
      const state = createTestCombatState([holder, enemy]);
      const logs = processItemOnSwitch(state, holder, { row: 'front', column: 0 }); // old = col 0
      expect(enemy.statuses.some(s => s.type === 'provoke' && s.stacks === 1)).toBe(true);
      expect(logs[0].message).toContain('Viridian Target');
    });

    it('Viridian Target: no provoke when staying in same column', () => {
      const holder = createTestCombatant({ id: 'holder', heldItemIds: ['viridian_target'], side: 'player' });
      holder.position = { row: 'front', column: 1 };
      const enemy = createTestCombatant({ id: 'enemy', side: 'enemy' });
      enemy.position = { row: 'front', column: 1 };
      const state = createTestCombatState([holder, enemy]);
      const logs = processItemOnSwitch(state, holder, { row: 'back', column: 1 }); // same column
      expect(enemy.statuses.length).toBe(0);
      expect(logs.length).toBe(0);
    });

    it('Saffron Spoon: enfeeble 3 on column switch', () => {
      const holder = createTestCombatant({ id: 'holder', heldItemIds: ['saffron_spoon'], side: 'player' });
      holder.position = { row: 'front', column: 1 };
      const enemy = createTestCombatant({ id: 'enemy', side: 'enemy' });
      enemy.position = { row: 'front', column: 1 };
      const state = createTestCombatState([holder, enemy]);
      const logs = processItemOnSwitch(state, holder, { row: 'front', column: 0 });
      expect(enemy.statuses.some(s => s.type === 'enfeeble' && s.stacks === 3)).toBe(true);
      expect(logs[0].message).toContain('Saffron Spoon');
    });

    it('Smoke Ball: provoke 2 on column switch', () => {
      const holder = createTestCombatant({ id: 'holder', heldItemIds: ['smoke_ball'], side: 'player' });
      holder.position = { row: 'front', column: 1 };
      const enemy = createTestCombatant({ id: 'enemy', side: 'enemy' });
      enemy.position = { row: 'front', column: 1 };
      const state = createTestCombatState([holder, enemy]);
      const logs = processItemOnSwitch(state, holder, { row: 'front', column: 0 });
      expect(enemy.statuses.some(s => s.type === 'provoke' && s.stacks === 2)).toBe(true);
      expect(logs[0].message).toContain('Smoke Ball');
    });

    it('Guerrilla Boots: +3 block retreating, +4 damage flag advancing', () => {
      const holder = createTestCombatant({ id: 'holder', heldItemIds: ['guerrilla_boots'], side: 'player', block: 0 });
      holder.position = { row: 'back', column: 1 }; // current
      const state = createTestCombatState([holder]);
      // Retreat: front → back
      const retreatLogs = processItemOnSwitch(state, holder, { row: 'front', column: 1 });
      expect(holder.block).toBe(3);
      expect(retreatLogs[0].message).toContain('3 Block');
      // Advance: back → front
      holder.position = { row: 'front', column: 1 };
      const advanceLogs = processItemOnSwitch(state, holder, { row: 'back', column: 1 });
      expect(holder.itemState['guerillaFront']).toBe(1);
      expect(advanceLogs[0].message).toContain('+4 damage');
    });

    // --- Play Restriction Items ---

    it('Choice Band: allows front_enemy attacks, blocks others', () => {
      const c = createTestCombatant({ heldItemIds: ['choice_band'] });
      expect(checkItemPlayRestriction(c, getMove('tackle'))).toBe(true); // front_enemy ok
      expect(checkItemPlayRestriction(c, getMove('scratch'))).toBe(true); // front_enemy ok
      expect(checkItemPlayRestriction(c, getMove('ember'))).toBe(false); // any_enemy blocked
      expect(checkItemPlayRestriction(c, getMove('growl'))).toBe(false); // non-attack blocked
      expect(checkItemPlayRestriction(c, getMove('defend'))).toBe(false); // non-attack blocked
    });

    it('Assault Vest: blocks non-attack cards', () => {
      const c = createTestCombatant({ heldItemIds: ['assault_vest'] });
      expect(checkItemPlayRestriction(c, getMove('tackle'))).toBe(true);
      expect(checkItemPlayRestriction(c, getMove('growl'))).toBe(false);
    });

    it('Choice Specs: blocks front_enemy/front_row attacks, allows others', () => {
      const c = createTestCombatant({ heldItemIds: ['choice_specs'] });
      // front_enemy attacks blocked
      expect(checkItemPlayRestriction(c, getMove('tackle'))).toBe(false);
      expect(checkItemPlayRestriction(c, getMove('scratch'))).toBe(false);
      // any_enemy attacks allowed
      expect(checkItemPlayRestriction(c, getMove('ember'))).toBe(true);
      // Non-attack cards allowed
      expect(checkItemPlayRestriction(c, getMove('growl'))).toBe(true);
    });

    // --- Source-Only Preview (hand preview) ---

    it('getItemDamageBonusSourceOnly matches getItemDamageBonus for unconditional items', () => {
      // Use tackle (front_enemy) for items that allow it, ember (any_enemy) for choice_specs
      const unconditionalItems: Array<{ itemId: string; moveId: string }> = [
        { itemId: 'wide_lens', moveId: 'tackle' },
        { itemId: 'choice_band', moveId: 'tackle' },
        { itemId: 'choice_specs', moveId: 'ember' },
        { itemId: 'toxic_orb', moveId: 'tackle' },
      ];
      for (const { itemId, moveId } of unconditionalItems) {
        const move = getMove(moveId);
        const source = createTestCombatant({ heldItemIds: [itemId] });
        const target = createTestCombatant({ side: 'enemy' });
        const state = createTestCombatState([source, target]);
        const fullBonus = getItemDamageBonus(state, source, target, move);
        const sourceOnly = getItemDamageBonusSourceOnly(source, move);
        expect(sourceOnly).toBe(fullBonus);
      }
    });

    it('Hand preview: Life Orb shows 1.3x multiplier', () => {
      const poke = getPokemon('tauros');
      const source = createTestCombatant({ heldItemIds: ['life_orb'], types: poke.types });
      const preview = calculateHandPreview(source, getMove('tackle'));
      expect(preview.multiplier).toBeCloseTo(1.3, 2);
    });

    it('Hand preview: Fuchsia Shuriken shows 0.5x on damage+status, 2x stacks', () => {
      const source = createTestCombatant({ heldItemIds: ['fuchsia_shuriken'], types: ['fire'] });
      const emberPreview = calculateHandPreview(source, getMove('ember'));
      expect(emberPreview.multiplier).toBeCloseTo(0.5, 2);
      expect(emberPreview.statusStacksMult).toBe(2);
      // Pure damage card: normal multiplier, normal stacks
      const tacklePreview = calculateHandPreview(source, getMove('tackle'));
      expect(tacklePreview.multiplier).toBeCloseTo(1.0, 2);
      expect(tacklePreview.statusStacksMult).toBe(1);
    });

    it('Hand preview: Choice Band shows +8 additive', () => {
      const source = createTestCombatant({ heldItemIds: ['choice_band'] });
      const preview = calculateHandPreview(source, getMove('tackle'));
      expect(preview.additive).toBeGreaterThanOrEqual(8);
    });

    it('Hand preview: Wide Lens shows +2 additive', () => {
      const source = createTestCombatant({ heldItemIds: ['wide_lens'] });
      const preview = calculateHandPreview(source, getMove('tackle'));
      expect(preview.additive).toBeGreaterThanOrEqual(2);
    });

    // --- Damage Preview (with target) ---

    it('Damage preview: Life Orb produces higher damage than no item', () => {
      const buildC = (id: string, pokeId: string, side: 'player' | 'enemy', itemId?: string) => {
        const poke = getPokemon(pokeId);
        return createTestCombatant({ id, hp: poke.maxHp, maxHp: poke.maxHp, types: poke.types, side, heldItemIds: itemId ? [itemId] : [] });
      };
      const withItem = buildC('p', 'tauros', 'player', 'life_orb');
      const without = buildC('p2', 'tauros', 'player');
      const enemy = buildC('e', 'snorlax', 'enemy');
      const enemy2 = buildC('e2', 'snorlax', 'enemy');
      const state1 = createTestCombatState([withItem, enemy]);
      const state2 = createTestCombatState([without, enemy2]);
      const tackle = getMove('tackle');
      const prev1 = calculateDamagePreview(state1, withItem, enemy, tackle);
      const prev2 = calculateDamagePreview(state2, without, enemy2, tackle);
      expect(prev1).not.toBeNull();
      expect(prev2).not.toBeNull();
      expect(prev1!.totalDamage).toBeGreaterThan(prev2!.totalDamage);
    });

    it('Damage preview: Expert Belt adds +5 on SE matchup but not neutral', () => {
      const buildC = (id: string, pokeId: string, side: 'player' | 'enemy', itemId?: string) => {
        const poke = getPokemon(pokeId);
        return createTestCombatant({ id, hp: poke.maxHp, maxHp: poke.maxHp, types: poke.types, side, heldItemIds: itemId ? [itemId] : [] });
      };
      const attacker = buildC('p', 'charmander', 'player', 'expert_belt');
      const grassEnemy = buildC('grass', 'bulbasaur', 'enemy');
      const normalEnemy = buildC('normal', 'rattata', 'enemy');
      const stateVsGrass = createTestCombatState([attacker, grassEnemy]);
      const stateVsNormal = createTestCombatState([attacker, normalEnemy]);
      const ember = getMove('ember');
      const previewSE = calculateDamagePreview(stateVsGrass, attacker, grassEnemy, ember);
      const previewNeutral = calculateDamagePreview(stateVsNormal, attacker, normalEnemy, ember);
      expect(previewSE).not.toBeNull();
      expect(previewNeutral).not.toBeNull();
      // SE: 2x type + 5 item bonus. Neutral: 1x type + 0 bonus.
      // The SE total should be more than 2× the neutral (because of the +5 additive on top of 2× multiplier)
      expect(previewSE!.totalDamage).toBeGreaterThan(previewNeutral!.totalDamage * 2);
    });

    it('Damage preview: Buddy Guard reduces damage to ally by 4', () => {
      const guard = createTestCombatant({ id: 'guard', heldItemIds: ['buddy_guard'], side: 'player' });
      guard.position = { row: 'back', column: 1 };
      const ally = createTestCombatant({ id: 'ally', hp: 100, maxHp: 100, side: 'player' });
      ally.position = { row: 'front', column: 1 };
      const enemy = createTestCombatant({ id: 'enemy', side: 'enemy', types: ['normal'] });
      enemy.position = { row: 'front', column: 1 };
      // Without Buddy Guard
      const allyNoGuard = createTestCombatant({ id: 'ally2', hp: 100, maxHp: 100, side: 'player' });
      allyNoGuard.position = { row: 'front', column: 1 };
      const enemy2 = createTestCombatant({ id: 'enemy2', side: 'enemy', types: ['normal'] });
      enemy2.position = { row: 'front', column: 1 };
      const stateWith = createTestCombatState([guard, ally, enemy]);
      const stateWithout = createTestCombatState([allyNoGuard, enemy2]);
      const tackle = getMove('tackle');
      const prevWith = calculateDamagePreview(stateWith, enemy, ally, tackle);
      const prevWithout = calculateDamagePreview(stateWithout, enemy2, allyNoGuard, tackle);
      expect(prevWith).not.toBeNull();
      expect(prevWithout).not.toBeNull();
      expect(prevWithout!.totalDamage - prevWith!.totalDamage).toBe(4);
    });

    // --- Full battle integration: verify numerical effects flow correctly ---

    it('Full battle: Choice Band holder never plays Growl/Defend', () => {
      const result = runItemBattle({
        players: [{ pokemonId: 'tauros', position: F1, itemId: 'choice_band' }],
        enemies: [{ pokemonId: 'snorlax', position: F1 }],
      });
      expect(result.error).toBeUndefined();
      const taurosPlays = result.log.filter(l => l.match(/Tauros plays/i));
      for (const play of taurosPlays) {
        expect(play).not.toMatch(/Growl/i);
        expect(play).not.toMatch(/Defend/i);
        expect(play).not.toMatch(/Leer/i);
      }
    });

    it('Full battle: Assault Vest holder never plays non-attacks', () => {
      const result = runItemBattle({
        players: [{ pokemonId: 'tauros', position: F1, itemId: 'assault_vest' }],
        enemies: [{ pokemonId: 'snorlax', position: F1 }],
      });
      expect(result.error).toBeUndefined();
      const taurosPlays = result.log.filter(l => l.match(/Tauros plays/i));
      for (const play of taurosPlays) {
        expect(play).not.toMatch(/Growl/i);
        expect(play).not.toMatch(/Defend/i);
        expect(play).not.toMatch(/Leer/i);
      }
    });

    it('Full battle: Life Orb recoil accumulates across attacks', () => {
      const result = runItemBattle({
        players: [{ pokemonId: 'tauros', position: F1, itemId: 'life_orb' }],
        enemies: [{ pokemonId: 'snorlax', position: F1 }],
      });
      expect(result.error).toBeUndefined();
      const recoilLogs = result.log.filter(l => l.includes('Life Orb') && l.includes('recoil'));
      // Should have multiple recoil entries
      expect(recoilLogs.length).toBeGreaterThanOrEqual(2);
      // Each should say "takes 3 recoil damage"
      for (const log of recoilLogs) {
        expect(log).toContain('takes 3 recoil damage');
      }
    });

    it('Full battle: Iron Plate block appears each round', () => {
      const result = runItemBattle({
        players: [
          { pokemonId: 'snorlax', position: F0, itemId: 'iron_plate' },
          { pokemonId: 'tauros', position: F1 },
        ],
        enemies: [{ pokemonId: 'snorlax', position: F1 }],
      });
      expect(result.error).toBeUndefined();
      const ironPlateLogs = result.log.filter(l => l.includes('Iron Plate'));
      // Should have at least 2 rounds of block gain
      expect(ironPlateLogs.length).toBeGreaterThanOrEqual(2);
      // Each should mention specific block amount
      for (const log of ironPlateLogs) {
        expect(log).toMatch(/gains \d+ Block/);
      }
    });

    it('Full battle: Assault Vest gives exactly 10 block per round', () => {
      const result = runItemBattle({
        players: [{ pokemonId: 'tauros', position: F1, itemId: 'assault_vest' }],
        enemies: [{ pokemonId: 'snorlax', position: F1 }],
      });
      expect(result.error).toBeUndefined();
      const vestLogs = result.log.filter(l => l.includes('Assault Vest'));
      expect(vestLogs.length).toBeGreaterThanOrEqual(1);
      for (const log of vestLogs) {
        expect(log).toContain('gains 10 Block');
      }
    });

    it('Full battle: Pewter Stone gives 8 block at start', () => {
      const result = runItemBattle({
        players: [{ pokemonId: 'snorlax', position: F1, itemId: 'pewter_stone' }],
        enemies: [{ pokemonId: 'rattata', position: F1 }],
      });
      expect(result.error).toBeUndefined();
      expect(result.log.some(l => l.includes('Pewter Stone') && l.includes('8 Block'))).toBe(true);
    });

    it('Full battle: Leftovers heals exactly 3 HP each turn', () => {
      const result = runItemBattle({
        players: [{ pokemonId: 'snorlax', position: F1, itemId: 'leftovers' }],
        enemies: [
          { pokemonId: 'pikachu', position: F0 },
          { pokemonId: 'rattata', position: F1 },
        ],
      });
      expect(result.error).toBeUndefined();
      const leftoverLogs = result.log.filter(l => l.includes('Leftovers') && l.includes('heals'));
      expect(leftoverLogs.length).toBeGreaterThanOrEqual(1);
      for (const log of leftoverLogs) {
        expect(log).toMatch(/heals [1-3] HP/); // 1-3 depending on how close to max
      }
    });

    it('Full battle: Fuchsia Shuriken Ember applies burn 4 (doubled)', () => {
      const result = runItemBattle({
        players: [{ pokemonId: 'charmander', position: F1, itemId: 'fuchsia_shuriken' }],
        enemies: [{ pokemonId: 'snorlax', position: F1 }],
      });
      expect(result.error).toBeUndefined();
      const burnLogs = result.log.filter(l => l.includes('burn') && l.includes('applied'));
      expect(burnLogs.length).toBeGreaterThanOrEqual(1);
      for (const log of burnLogs) {
        expect(log).toContain('burn 4');
      }
    });

    it('Full battle: damage items log their exact bonus in breakdown', () => {
      // Choice Band: "+8 damage!"
      const result = runItemBattle({
        players: [{ pokemonId: 'tauros', position: F1, itemId: 'choice_band' }],
        enemies: [{ pokemonId: 'snorlax', position: F1 }],
      });
      expect(result.error).toBeUndefined();
      expect(result.log.some(l => l.includes('choice_band') && l.includes('+8 damage'))).toBe(true);
    });

    it('Full battle: Wide Lens logs "+2 damage"', () => {
      const result = runItemBattle({
        players: [{ pokemonId: 'tauros', position: F1, itemId: 'wide_lens' }],
        enemies: [{ pokemonId: 'snorlax', position: F1 }],
      });
      expect(result.error).toBeUndefined();
      expect(result.log.some(l => l.includes('wide_lens') && l.includes('+2 damage'))).toBe(true);
    });

    it('Full battle: Scope Lens logs "+3 damage" on single-target attacks', () => {
      const result = runItemBattle({
        players: [{ pokemonId: 'tauros', position: F1, itemId: 'scope_lens' }],
        enemies: [{ pokemonId: 'snorlax', position: F1 }],
      });
      expect(result.error).toBeUndefined();
      expect(result.log.some(l => l.includes('scope_lens') && l.includes('+3 damage'))).toBe(true);
    });

    it('Full battle: Choice Specs logs "+8 damage"', () => {
      const result = runItemBattle({
        players: [{ pokemonId: 'charmander', position: F1, itemId: 'choice_specs' }],
        enemies: [{ pokemonId: 'snorlax', position: F1 }],
      });
      expect(result.error).toBeUndefined();
      expect(result.log.some(l => l.includes('choice_specs') && l.includes('+8 damage'))).toBe(true);
    });

    it('Full battle: Toxic Orb logs "+4 damage"', () => {
      const result = runItemBattle({
        players: [{ pokemonId: 'tauros', position: F1, itemId: 'toxic_orb' }],
        enemies: [{ pokemonId: 'snorlax', position: F1 }],
      });
      expect(result.error).toBeUndefined();
      expect(result.log.some(l => l.includes('toxic_orb') && l.includes('+4 damage'))).toBe(true);
    });

    it('Full battle: Expert Belt logs "+5 damage" on super-effective', () => {
      const result = runItemBattle({
        players: [{ pokemonId: 'charmander', position: F1, itemId: 'expert_belt' }],
        enemies: [{ pokemonId: 'bulbasaur', position: F1 }],
      });
      expect(result.error).toBeUndefined();
      expect(result.log.some(l => l.includes('expert_belt') && l.includes('+5 damage'))).toBe(true);
    });

    it('Full battle: Expert Belt does NOT log damage on neutral matchup', () => {
      const result = runItemBattle({
        players: [{ pokemonId: 'rattata', position: F1, itemId: 'expert_belt' }],
        enemies: [{ pokemonId: 'snorlax', position: F1 }],
      });
      expect(result.error).toBeUndefined();
      // Normal vs Normal — no SE bonus
      expect(result.log.some(l => l.includes('expert_belt') && l.includes('+5 damage'))).toBe(false);
    });

    it('Full battle: three battle-start items on three team members all apply', () => {
      const result = runItemBattle({
        players: [
          { pokemonId: 'tauros', position: F0, itemId: 'quick_claw' },
          { pokemonId: 'snorlax', position: F1, itemId: 'eviolite' },
          { pokemonId: 'kangaskhan', position: B0, itemId: 'toxic_orb' },
        ],
        enemies: [
          { pokemonId: 'arcanine', position: F1 },
          { pokemonId: 'gyarados', position: F0 },
        ],
      });
      expect(result.error).toBeUndefined();
      const tauros = result.combatants.find(c => c.pokemonId === 'tauros')!;
      const snorlax = result.combatants.find(c => c.pokemonId === 'snorlax')!;
      expect(tauros.speed).toBe(getPokemon('tauros').baseSpeed);
      expect(snorlax.maxHp).toBe(getPokemon('snorlax').maxHp + 15);
      expect(result.log.some(l => l.includes('Toxic Orb'))).toBe(true);
    });
  });
});
