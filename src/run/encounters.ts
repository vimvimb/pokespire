/**
 * Encounter Generation Engine
 *
 * Generates randomized battle encounters for campaign nodes based on:
 * - Per-act species pools (thematic enemy sets)
 * - Fight archetypes (Solo, Duo, Trio, Swarm formations)
 * - Difficulty budget system (basePower + deckBonus + passiveCosts)
 * - Seeded RNG for deterministic, reproducible generation
 *
 * Fixed encounters (bosses, special events) are left unchanged.
 */

import type { Position } from '../engine/types';
import type { MapNode } from './types';
import { getProgressionTree } from './progression';

// ============================================================
// Seeded RNG (Lehmer / Park-Miller, same as state.ts)
// ============================================================

function seededRandom(seed: number): { value: number; nextSeed: number } {
  const next = (seed * 16807) % 2147483647;
  return { value: (next - 1) / 2147483646, nextSeed: next };
}

function randomInt(min: number, max: number, seed: number): { value: number; nextSeed: number } {
  const { value, nextSeed } = seededRandom(seed);
  return { value: min + Math.floor(value * (max - min + 1)), nextSeed };
}

function randomPick<T>(arr: readonly T[], seed: number): { value: T; nextSeed: number } {
  const { value, nextSeed } = seededRandom(seed);
  return { value: arr[Math.floor(value * arr.length)], nextSeed };
}

function weightedPick<T>(items: readonly T[], weights: readonly number[], seed: number): { value: T; nextSeed: number } {
  const total = weights.reduce((a, b) => a + b, 0);
  const { value: roll, nextSeed } = seededRandom(seed);
  let cumulative = 0;
  for (let i = 0; i < items.length; i++) {
    cumulative += weights[i] / total;
    if (roll < cumulative) {
      return { value: items[i], nextSeed };
    }
  }
  return { value: items[items.length - 1], nextSeed };
}

// ============================================================
// Species Base Power (1-5 scale)
// ============================================================

const SPECIES_BASE_POWER: Record<string, number> = {
  // 1 — Weak basics
  rattata: 1, pidgey: 1, caterpie: 1, weedle: 1, magikarp: 1,
  jigglypuff: 1, oddish: 1, paras: 1, zubat: 1, venonat: 1, clefairy: 1,

  // 2 — Moderate basics / starters
  ekans: 2, meowth: 2, spearow: 2, growlithe: 2, vulpix: 2,
  drowzee: 2, machop: 2, sandshrew: 2, 'nidoran-m': 2, 'nidoran-f': 2,
  gastly: 2, voltorb: 2, dratini: 2, porygon: 2, magmar: 2, electabuzz: 2,
  bulbasaur: 2, charmander: 2, squirtle: 2, pikachu: 2,

  // 3 — Mid evolutions
  raticate: 3, pidgeotto: 3, arbok: 3, nidorino: 3, nidorina: 3,
  golbat: 3, haunter: 3, machoke: 3, persian: 3, electrode: 3,
  sandslash: 3, butterfree: 3, beedrill: 3, charmeleon: 3, wartortle: 3,
  ivysaur: 3, parasect: 3, wigglytuff: 3, clefable: 3, venomoth: 3,
  gloom: 3, raichu: 3, dragonair: 3, porygon2: 3,

  // 4 — Strong evolved
  pidgeot: 4, tauros: 4, kangaskhan: 4, snorlax: 4, hypno: 4,
  arcanine: 4, nidoking: 4, nidoqueen: 4, rhydon: 4, lapras: 4,
  fearow: 4, machamp: 4, ninetales: 4, vileplume: 4, crobat: 4,
  gengar: 4, magmortar: 4, electivire: 4, 'porygon-z': 4,

  // 5 — Elite threats
  dragonite: 5, gyarados: 5, charizard: 5, blastoise: 5, venusaur: 5,
};

function getBasePower(speciesId: string): number {
  return SPECIES_BASE_POWER[speciesId] ?? 2;
}

// ============================================================
// Per-Act Species Pools
// ============================================================

const ACT1_POOL: readonly string[] = [
  // Weak basics — common grunt encounters
  'rattata', 'pidgey', 'caterpie', 'weedle', 'zubat', 'oddish',
  'paras', 'jigglypuff', 'venonat', 'clefairy',
  // Moderate basics — tougher grunts
  'ekans', 'meowth', 'spearow', 'growlithe', 'vulpix', 'drowzee',
  'machop', 'sandshrew', 'nidoran-m', 'nidoran-f',
  // Mid evolutions — only for harder Act 1 stages
  'raticate', 'pidgeotto', 'arbok',
];

const ACT2_POOL: readonly string[] = [
  // Weak basics — swarm filler
  'rattata', 'pidgey', 'zubat', 'oddish',
  // Moderate basics — grunt squads
  'ekans', 'meowth', 'drowzee', 'growlithe', 'vulpix', 'machop',
  // Mid evolutions — main threats
  'raticate', 'pidgeotto', 'arbok', 'nidorino', 'nidorina',
  'golbat', 'haunter', 'machoke', 'persian', 'electrode',
  'sandslash', 'butterfree', 'beedrill',
  // Strong evolved — elite encounters
  'pidgeot', 'tauros', 'kangaskhan', 'snorlax', 'hypno', 'arcanine',
];

const ACT3_POOL: readonly string[] = [
  // Mid evolutions — swarm/variety
  'dragonair', 'electrode', 'sandslash', 'golbat', 'haunter',
  // Strong evolved — main threats
  'pidgeot', 'tauros', 'kangaskhan', 'snorlax', 'hypno',
  'arcanine', 'nidoking', 'nidoqueen', 'rhydon', 'lapras',
  'fearow', 'machamp', 'ninetales', 'gengar', 'crobat',
  'magmortar', 'electivire',
  // Elite threats
  'dragonite', 'gyarados',
];

function getSpeciesPool(act: number): readonly string[] {
  if (act === 1) return ACT1_POOL;
  if (act === 2) return ACT2_POOL;
  return ACT3_POOL;
}

// ============================================================
// Banned Passives (never assigned to enemies)
// ============================================================

const BANNED_PASSIVES = new Set([
  'dragons_majesty',   // All dragon attacks hit all enemies — too overwhelming
  'hustle',            // Random miss mechanic — too swingy for AI
  'hypnotic_gaze',     // Permanent sleep lock on player
  'family_fury',       // Scaling AoE damage — too punishing
  'tyrants_tantrum',   // AoE damage when hit — discourages attacking
  'slipstream',        // Speed manipulation — too complex for enemy AI
  'raging_bull',       // Guaranteed crit after damage — too swingy
  'parental_bond',     // Double all attacks — doubles threat level
  'final_spark',       // Massive death explosion — feels unfair
]);

// ============================================================
// Passive Costs (budget cost for each additional passive beyond L1)
// ============================================================

const PASSIVE_COST_OVERRIDES: Record<string, number> = {
  // Cost 1 — minor / defensive
  shield_dust: 1, thick_hide: 1, shed_skin: 1, immunity: 1, baby_shell: 1,
  baby_vines: 1, insomnia: 1, inner_focus: 1, sharp_beak: 1, effect_spore: 1,
  guts: 1, lucky_star: 1, vital_spirit: 1, pickup: 1, download: 1,
  intangible: 1, poison_barb: 1, cute_charm: 1,

  // Cost 3 — powerful / game-changing
  sheer_force: 3, multiscale: 3, moxie: 3, adaptability: 3,
  fortified_cannons: 3, torrent_shield: 3, inferno_momentum: 3,
  night_assassin: 3, magic_guard: 3, finisher: 3, phase_form: 3,
  upload: 3, overclock: 3, surge_momentum: 3, searing_fury: 3,
  volt_fury: 3, fortifying_aria: 3, blooming_cycle: 3,
  rude_awakening: 3, spore_mastery: 3, zephyr_king: 3,
};

function getPassiveCost(passiveId: string): number {
  return PASSIVE_COST_OVERRIDES[passiveId] ?? 2;
}

// ============================================================
// Fight Archetypes
// ============================================================

type ArchetypeId = 'solo' | 'duo_front' | 'duo_column' | 'trio_line' | 'shield_wall' | 'swarm';

const FIGHT_ARCHETYPES: Record<ArchetypeId, { positions: Position[] }> = {
  solo: {
    positions: [{ row: 'front', column: 1 }],
  },
  duo_front: {
    positions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 2 },
    ],
  },
  duo_column: {
    positions: [
      { row: 'front', column: 1 },
      { row: 'back', column: 1 },
    ],
  },
  trio_line: {
    positions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 1 },
      { row: 'front', column: 2 },
    ],
  },
  shield_wall: {
    positions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 2 },
      { row: 'back', column: 1 },
    ],
  },
  swarm: {
    positions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 1 },
      { row: 'front', column: 2 },
      { row: 'back', column: 1 },
    ],
  },
};

// ============================================================
// Difficulty System
// ============================================================

type DifficultyLevel = 'beginner' | 'easy' | 'medium' | 'hard' | 'elite';

const DIFFICULTY_BUDGETS: Record<DifficultyLevel, { min: number; max: number }> = {
  beginner: { min: 2, max: 4 },
  easy:     { min: 5, max: 7 },
  medium:   { min: 8, max: 12 },
  hard:     { min: 13, max: 17 },
  elite:    { min: 18, max: 24 },
};

// Archetype weights per difficulty — determines formation variety
const ARCHETYPE_WEIGHTS: Record<DifficultyLevel, Partial<Record<ArchetypeId, number>>> = {
  beginner: { solo: 60, duo_front: 40 },
  easy:     { solo: 25, duo_front: 40, duo_column: 35 },
  medium:   { duo_front: 25, duo_column: 20, trio_line: 35, shield_wall: 20 },
  hard:     { duo_front: 10, trio_line: 30, shield_wall: 35, swarm: 25 },
  elite:    { trio_line: 20, shield_wall: 30, swarm: 30, duo_front: 20 },
};

/** Map (act, stage) → difficulty level */
function getDifficultyForStage(act: number, stage: number): DifficultyLevel {
  if (act === 1) {
    if (stage <= 1) return 'beginner';
    if (stage <= 3) return 'easy';
    return 'medium';
  }
  if (act === 2) {
    if (stage <= 1) return 'easy';
    if (stage <= 3) return 'medium';
    return 'hard';
  }
  // Act 3
  if (stage <= 2) return 'hard';
  return 'elite';
}

/** Stage-based HP scaling per act */
function getStageHpMultiplier(act: number, stage: number): number {
  if (act === 1) {
    if (stage >= 4) return 1.4;
    if (stage >= 2) return 1.2;
    return 1.0;
  }
  if (act === 2) {
    if (stage >= 5) return 1.2;
    if (stage >= 3) return 1.15;
    return 1.0;
  }
  // Act 3
  if (stage >= 5) return 1.25;
  if (stage >= 3) return 1.2;
  return 1.15;
}

/** Formation-based HP scaling — fewer enemies = tankier each */
function getFormationHpMultiplier(enemyCount: number): number {
  if (enemyCount <= 1) return 2.0;
  if (enemyCount <= 2) return 1.4;
  if (enemyCount <= 3) return 1.15;
  return 1.0;
}

/** Combined HP multiplier from act/stage + formation size */
function getHpMultiplier(act: number, stage: number, enemyCount: number): number | undefined {
  const stageMul = getStageHpMultiplier(act, stage);
  const formMul = getFormationHpMultiplier(enemyCount);
  const combined = stageMul * formMul;
  // Round to 2 decimal places for clean display
  const rounded = Math.round(combined * 100) / 100;
  return rounded > 1.0 ? rounded : undefined;
}

// ============================================================
// Fixed Encounters (bosses & special — not generated)
// ============================================================

const FIXED_ENCOUNTER_IDS = new Set([
  '1ab',
  '2z',
  '2j',
  '3q',
]);

// ============================================================
// Deck Tier Budget
// ============================================================

/** Cumulative budget cost for each deck tier */
const DECK_TIER_COST = [0, 0, 1, 3, 5]; // index = tier (1-4)

function getDeckUpgradeCost(currentTier: number): number {
  if (currentTier >= 4) return Infinity;
  return DECK_TIER_COST[currentTier + 1] - DECK_TIER_COST[currentTier];
}

// ============================================================
// Passive Helpers
// ============================================================

/** Get the L1 passive for a species (always assigned, free). */
function getL1Passive(speciesId: string): string[] {
  const tree = getProgressionTree(speciesId);
  if (!tree) return [];
  const l1 = tree.rungs.find(r => r.level === 1);
  if (!l1 || l1.passiveId === 'none') return [];
  return [l1.passiveId];
}

/** Get additional passives available for assignment (L2-L4, excluding banned). */
function getAvailablePassives(speciesId: string): string[] {
  const tree = getProgressionTree(speciesId);
  if (!tree) return [];
  return tree.rungs
    .filter(r => r.level > 1)
    .map(r => r.passiveId)
    .filter(id => id !== 'none' && !BANNED_PASSIVES.has(id));
}

// ============================================================
// Core Generation
// ============================================================

interface GeneratedEncounter {
  enemies: string[];
  positions: Position[];
  deckTiers: number[];
  passiveIds: string[][];
  hpMultiplier?: number;
  nextSeed: number;
}

function generateEncounter(
  difficulty: DifficultyLevel,
  act: number,
  stage: number,
  seed: number,
): GeneratedEncounter {
  let s = seed;

  // 1. Roll budget within difficulty range
  const range = DIFFICULTY_BUDGETS[difficulty];
  const budgetResult = randomInt(range.min, range.max, s);
  const budget = budgetResult.value;
  s = budgetResult.nextSeed;

  // 2. Pick fight archetype
  const archetypeWeightMap = ARCHETYPE_WEIGHTS[difficulty];
  const archetypeIds = Object.keys(archetypeWeightMap) as ArchetypeId[];
  const archetypeWeightValues = archetypeIds.map(id => archetypeWeightMap[id] ?? 0);
  const archetypeResult = weightedPick(archetypeIds, archetypeWeightValues, s);
  const archetypeId = archetypeResult.value;
  s = archetypeResult.nextSeed;

  const archetype = FIGHT_ARCHETYPES[archetypeId];
  const enemyCount = archetype.positions.length;

  // 3. Pick species for each slot
  const pool = getSpeciesPool(act);
  const enemies: string[] = [];
  let basePowerTotal = 0;

  for (let i = 0; i < enemyCount; i++) {
    // Filter pool: species base power shouldn't exceed remaining budget headroom
    const reserveForOthers = enemyCount - i - 1; // at least 1 base power per remaining slot
    const maxPower = Math.max(1, budget - basePowerTotal - reserveForOthers);
    const eligible = pool.filter(id => getBasePower(id) <= maxPower);
    const pickPool = eligible.length > 0 ? eligible : pool;

    const pickResult = randomPick(pickPool, s);
    s = pickResult.nextSeed;
    enemies.push(pickResult.value);
    basePowerTotal += getBasePower(pickResult.value);
  }

  // 4. Calculate remaining budget for upgrades
  let remaining = Math.max(0, budget - basePowerTotal);

  // 5. Initialize at L1 deck, L1 passives
  const deckTiers = enemies.map(() => 1);
  const passiveIds = enemies.map(id => getL1Passive(id));

  // 6. Distribute remaining budget per-enemy
  //    Split roughly evenly, then each enemy spends on deck upgrades first, then passives
  const perEnemy: number[] = [];
  let pool2 = remaining;
  for (let i = 0; i < enemyCount; i++) {
    if (i === enemyCount - 1) {
      perEnemy.push(pool2);
    } else {
      const fair = Math.round(pool2 / (enemyCount - i));
      // Add ±1 variance
      const lo = Math.max(0, fair - 1);
      const hi = Math.min(pool2, fair + 1);
      const result = randomInt(lo, hi, s);
      s = result.nextSeed;
      perEnemy.push(result.value);
      pool2 -= result.value;
    }
  }

  for (let i = 0; i < enemyCount; i++) {
    let eb = perEnemy[i];

    // Upgrade deck tier
    while (eb > 0 && deckTiers[i] < 4) {
      const cost = getDeckUpgradeCost(deckTiers[i]);
      if (cost <= eb) {
        deckTiers[i]++;
        eb -= cost;
      } else {
        break;
      }
    }

    // Add passives with leftover
    const available = getAvailablePassives(enemies[i])
      .filter(id => !passiveIds[i].includes(id));
    for (const pid of available) {
      if (eb <= 0) break;
      const cost = getPassiveCost(pid);
      if (cost <= eb) {
        passiveIds[i].push(pid);
        eb -= cost;
      }
    }
  }

  // 7. HP multiplier from act/stage + formation size
  const hpMultiplier = getHpMultiplier(act, stage, enemyCount);

  return {
    enemies,
    positions: archetype.positions,
    deckTiers,
    passiveIds,
    hpMultiplier,
    nextSeed: s,
  };
}

// ============================================================
// Public API
// ============================================================

/**
 * Generate randomized encounters for all non-fixed battle nodes in an act.
 * Returns a new nodes array with generated encounter data filled in.
 * Fixed encounters (bosses, special events) are passed through unchanged.
 */
export function generateEncountersForAct(
  nodes: MapNode[],
  act: number,
  seed: number,
): MapNode[] {
  let currentSeed = Math.max(1, Math.abs(seed + act * 50000));

  return nodes.map(node => {
    if (node.type !== 'battle') return node;
    if (FIXED_ENCOUNTER_IDS.has(node.id)) return node;

    const difficulty = getDifficultyForStage(act, node.stage);
    const encounter = generateEncounter(difficulty, act, node.stage, currentSeed);
    currentSeed = encounter.nextSeed;

    return {
      ...node,
      enemies: encounter.enemies,
      enemyPositions: encounter.positions,
      enemyDeckTiers: encounter.deckTiers,
      enemyPassiveIds: encounter.passiveIds,
      ...(encounter.hpMultiplier != null ? { enemyHpMultiplier: encounter.hpMultiplier } : {}),
    };
  });
}
