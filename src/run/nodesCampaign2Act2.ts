import type { MapNode } from './types';

/**
 * Campaign 2 — Act 2: Past Johto (Ecruteak City Outskirts)
 * Node IDs prefixed with 'c2-a2-'
 *
 * Gold/Silver boss enemy arrays are placeholders — replaced at runtime by
 * assignGoldSilverEnemies() based on the player's starter choice.
 * eventId fields are pre-assigned (not drawn from random pool).
 */
export const CAMPAIGN2_ACT2_NODES: MapNode[] = [
  // Stage 0: Spawn
  {
    id: 'c2-a2-s0-spawn',
    type: 'spawn',
    stage: 0,
    connectsTo: ['c2-a2-s1-battle-stantler'],
    completed: false,
    x: 0.05, y: 0.5,
  },

  // Stage 1: Common — Stantler
  {
    id: 'c2-a2-s1-battle-stantler',
    type: 'battle',
    stage: 1,
    connectsTo: [
      'c2-a2-s2-battle-flaaffy',
      'c2-a2-s2-battle-marill',
      'c2-a2-s2-battle-miltank',
      'c2-a2-s2-event-bell',
      'c2-a2-s2-event-blissey',
    ],
    completed: false,
    enemies: ['stantler', 'stantler'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 2 },
    ],
    x: 0.12, y: 0.5,
  },

  // Stage 2: Common — multiple options
  {
    id: 'c2-a2-s2-battle-flaaffy',
    type: 'battle',
    stage: 2,
    connectsTo: ['c2-a2-split-upper', 'c2-a2-split-lower'],
    completed: false,
    enemies: ['flaaffy', 'flaaffy', 'wobbuffet'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 2 },
      { row: 'back', column: 1 },
    ],
    x: 0.22, y: 0.12,
  },
  {
    id: 'c2-a2-s2-battle-marill',
    type: 'battle',
    stage: 2,
    connectsTo: ['c2-a2-split-upper', 'c2-a2-split-lower'],
    completed: false,
    enemies: ['marill', 'marill', 'marill'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 1 },
      { row: 'front', column: 2 },
    ],
    x: 0.22, y: 0.3,
  },
  {
    id: 'c2-a2-s2-battle-miltank',
    type: 'battle',
    stage: 2,
    connectsTo: ['c2-a2-split-upper', 'c2-a2-split-lower'],
    completed: false,
    enemies: ['miltank'],
    enemyPositions: [{ row: 'front', column: 1 }],
    enemyHpMultiplier: 1.1,
    x: 0.22, y: 0.5,
  },
  {
    id: 'c2-a2-s2-event-bell',
    type: 'event',
    stage: 2,
    connectsTo: ['c2-a2-split-upper', 'c2-a2-split-lower'],
    completed: false,
    eventId: 'c2_ecruteak_bell',
    x: 0.22, y: 0.68,
  },
  {
    id: 'c2-a2-s2-event-blissey',
    type: 'event',
    stage: 2,
    connectsTo: ['c2-a2-split-upper', 'c2-a2-split-lower'],
    completed: false,
    eventId: 'c2_wild_blissey',
    x: 0.22, y: 0.86,
  },

  // ── UPPER PATH (Gold) ──────────────────────────────────────

  // Stage 3 Upper
  {
    id: 'c2-a2-split-upper',
    type: 'battle',
    stage: 3,
    connectsTo: ['c2-a2-upper-s3-battle-forretress', 'c2-a2-upper-rest'],
    completed: false,
    enemies: ['togetic', 'ampharos'],
    enemyPositions: [
      { row: 'back', column: 0 },
      { row: 'front', column: 1 },
    ],
    x: 0.34, y: 0.18,
  },
  {
    id: 'c2-a2-upper-s3-battle-forretress',
    type: 'battle',
    stage: 3,
    connectsTo: ['c2-a2-upper-rest', 'c2-a2-upper-battle-heracross'],
    completed: false,
    enemies: ['forretress', 'scizor'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 2 },
    ],
    x: 0.34, y: 0.04,
  },

  // Stage 4 Upper
  {
    id: 'c2-a2-upper-rest',
    type: 'rest',
    stage: 4,
    connectsTo: ['c2-a2-upper-event-suicune', 'c2-a2-upper-battle-espeon'],
    completed: false,
    x: 0.45, y: 0.1,
  },
  {
    id: 'c2-a2-upper-battle-heracross',
    type: 'battle',
    stage: 4,
    connectsTo: ['c2-a2-upper-event-suicune', 'c2-a2-upper-battle-espeon'],
    completed: false,
    enemies: ['heracross', 'heracross'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 2 },
    ],
    x: 0.45, y: 0.26,
  },
  {
    id: 'c2-a2-upper-event-suicune',
    type: 'event',
    stage: 4,
    connectsTo: ['c2-a2-upper-s5-prep'],
    completed: false,
    eventId: 'c2_suicune_sighting',
    x: 0.54, y: 0.1,
  },
  {
    id: 'c2-a2-upper-battle-espeon',
    type: 'battle',
    stage: 4,
    connectsTo: ['c2-a2-upper-s5-prep'],
    completed: false,
    enemies: ['espeon', 'togetic'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'back', column: 2 },
    ],
    x: 0.54, y: 0.26,
  },

  // Stage 5 Upper
  {
    id: 'c2-a2-upper-s5-prep',
    type: 'battle',
    stage: 5,
    connectsTo: ['c2-a2-upper-recruit'],
    completed: false,
    enemies: ['ampharos', 'heracross'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 2 },
    ],
    enemyHpMultiplier: 1.1,
    x: 0.64, y: 0.16,
  },
  {
    id: 'c2-a2-upper-recruit',
    type: 'recruit',
    stage: 5,
    connectsTo: ['c2-a2-boss-gold'],
    completed: false,
    pokemonId: '',
    recruited: false,
    x: 0.73, y: 0.16,
  },

  // Stage 6 Upper: Gold boss (enemies resolved at runtime by assignGoldSilverEnemies)
  {
    id: 'c2-a2-boss-gold',
    type: 'battle',
    stage: 6,
    connectsTo: ['c2-a2-transition-tin-tower'],
    completed: false,
    enemies: ['feraligatr', 'ampharos', 'espeon'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 2 },
      { row: 'back', column: 1 },
    ],
    enemyHpMultiplier: 1.3,
    size: 'large',
    x: 0.83, y: 0.16,
  },

  // Stage 7 Upper: Transition → Tin Tower
  {
    id: 'c2-a2-transition-tin-tower',
    type: 'act_transition',
    stage: 7,
    connectsTo: [],
    completed: false,
    nextAct: 3,
    actVariant: 'tin_tower',
    x: 0.93, y: 0.16,
  },

  // ── LOWER PATH (Silver) ────────────────────────────────────

  // Stage 3 Lower
  {
    id: 'c2-a2-split-lower',
    type: 'battle',
    stage: 3,
    connectsTo: ['c2-a2-lower-s3-battle-umbreon', 'c2-a2-lower-rest'],
    completed: false,
    enemies: ['houndour', 'houndour', 'murkrow'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 2 },
      { row: 'back', column: 1 },
    ],
    x: 0.34, y: 0.82,
  },
  {
    id: 'c2-a2-lower-s3-battle-umbreon',
    type: 'battle',
    stage: 3,
    connectsTo: ['c2-a2-lower-rest', 'c2-a2-lower-battle-sneasel'],
    completed: false,
    enemies: ['umbreon', 'umbreon'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 2 },
    ],
    x: 0.34, y: 0.96,
  },

  // Stage 4 Lower
  {
    id: 'c2-a2-lower-rest',
    type: 'rest',
    stage: 4,
    connectsTo: ['c2-a2-lower-event-fire', 'c2-a2-lower-battle-ursaring'],
    completed: false,
    x: 0.45, y: 0.74,
  },
  {
    id: 'c2-a2-lower-battle-sneasel',
    type: 'battle',
    stage: 4,
    connectsTo: ['c2-a2-lower-event-fire', 'c2-a2-lower-battle-ursaring'],
    completed: false,
    enemies: ['sneasel', 'sneasel'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 2 },
    ],
    x: 0.45, y: 0.9,
  },
  {
    id: 'c2-a2-lower-event-fire',
    type: 'event',
    stage: 4,
    connectsTo: ['c2-a2-lower-s4-battle-steelix'],
    completed: false,
    eventId: 'c2_tower_fire_aftermath',
    x: 0.54, y: 0.74,
  },
  {
    id: 'c2-a2-lower-battle-ursaring',
    type: 'battle',
    stage: 4,
    connectsTo: ['c2-a2-lower-s4-battle-steelix'],
    completed: false,
    enemies: ['ursaring', 'steelix'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'back', column: 2 },
    ],
    x: 0.54, y: 0.9,
  },

  // Stage 4b Lower: Steelix
  {
    id: 'c2-a2-lower-s4-battle-steelix',
    type: 'battle',
    stage: 4,
    connectsTo: ['c2-a2-lower-s5-tyranitar'],
    completed: false,
    enemies: ['steelix'],
    enemyPositions: [{ row: 'front', column: 1 }],
    enemyHpMultiplier: 1.2,
    x: 0.61, y: 0.82,
  },

  // Stage 5 Lower: Tyranitar + recruit
  {
    id: 'c2-a2-lower-s5-tyranitar',
    type: 'battle',
    stage: 5,
    connectsTo: ['c2-a2-lower-recruit'],
    completed: false,
    enemies: ['tyranitar'],
    enemyPositions: [{ row: 'front', column: 1 }],
    enemyHpMultiplier: 1.3,
    size: 'large',
    x: 0.68, y: 0.82,
  },
  {
    id: 'c2-a2-lower-recruit',
    type: 'recruit',
    stage: 5,
    connectsTo: ['c2-a2-boss-silver'],
    completed: false,
    pokemonId: '',
    recruited: false,
    x: 0.76, y: 0.82,
  },

  // Stage 6 Lower: Silver boss (enemies resolved at runtime)
  {
    id: 'c2-a2-boss-silver',
    type: 'battle',
    stage: 6,
    connectsTo: ['c2-a2-transition-brass-tower'],
    completed: false,
    enemies: ['typhlosion', 'sneasel', 'houndoom'],
    enemyPositions: [
      { row: 'front', column: 1 },
      { row: 'front', column: 0 },
      { row: 'back', column: 1 },
    ],
    enemyHpMultiplier: 1.3,
    size: 'large',
    x: 0.85, y: 0.82,
  },

  // Stage 7 Lower: Transition → Brass Tower
  {
    id: 'c2-a2-transition-brass-tower',
    type: 'act_transition',
    stage: 7,
    connectsTo: [],
    completed: false,
    nextAct: 3,
    actVariant: 'brass_tower',
    x: 0.93, y: 0.82,
  },
];
