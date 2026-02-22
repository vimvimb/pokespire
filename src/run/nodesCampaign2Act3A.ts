import type { MapNode } from './types';

/**
 * Campaign 2 — Act 3A: Tin Tower (Gold's Path — Fiery and Ancient)
 * Node IDs prefixed with 'c2-a3a-'
 *
 * Beast recruit nodes have pokemonId pre-assigned so assignRecruitPokemon
 * skips them (it only assigns to nodes where pokemonId === '').
 */
export const CAMPAIGN2_ACT3A_NODES: MapNode[] = [
  // Stage 0: Spawn
  {
    id: 'c2-a3a-s0-spawn',
    type: 'spawn',
    stage: 0,
    connectsTo: ['c2-a3a-s1-battle-slugma', 'c2-a3a-s1-battle-houndour'],
    completed: false,
    x: 0.06, y: 0.5,
  },

  // Stage 1
  {
    id: 'c2-a3a-s1-battle-slugma',
    type: 'battle',
    stage: 1,
    connectsTo: ['c2-a3a-s2-battle-skarmory', 'c2-a3a-s2-event-legends'],
    completed: false,
    enemies: ['slugma', 'slugma', 'murkrow'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 2 },
      { row: 'back', column: 1 },
    ],
    enemyHpMultiplier: 1.2,
    x: 0.16, y: 0.3,
  },
  {
    id: 'c2-a3a-s1-battle-houndour',
    type: 'battle',
    stage: 1,
    connectsTo: ['c2-a3a-s2-battle-skarmory', 'c2-a3a-s2-event-legends'],
    completed: false,
    enemies: ['houndour', 'magcargo'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 2 },
    ],
    enemyHpMultiplier: 1.2,
    x: 0.16, y: 0.7,
  },

  // Stage 2
  {
    id: 'c2-a3a-s2-battle-skarmory',
    type: 'battle',
    stage: 2,
    connectsTo: ['c2-a3a-s3-event-ash', 'c2-a3a-s3-battle-scizor'],
    completed: false,
    enemies: ['skarmory', 'skarmory'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 2 },
    ],
    enemyHpMultiplier: 1.25,
    x: 0.28, y: 0.28,
  },
  {
    id: 'c2-a3a-s2-event-legends',
    type: 'event',
    stage: 2,
    connectsTo: ['c2-a3a-s3-event-ash', 'c2-a3a-s3-battle-scizor'],
    completed: false,
    eventId: 'c2_legends_stir_a',
    x: 0.28, y: 0.72,
  },

  // Stage 3
  {
    id: 'c2-a3a-s3-event-ash',
    type: 'event',
    stage: 3,
    connectsTo: ['c2-a3a-s4-card-removal', 'c2-a3a-s4-event-feather'],
    completed: false,
    eventId: 'c2_sacred_ash',
    x: 0.4, y: 0.28,
  },
  {
    id: 'c2-a3a-s3-battle-scizor',
    type: 'battle',
    stage: 3,
    connectsTo: ['c2-a3a-s4-card-removal', 'c2-a3a-s4-event-feather'],
    completed: false,
    enemies: ['scizor', 'houndoom'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 2 },
    ],
    enemyHpMultiplier: 1.2,
    x: 0.4, y: 0.72,
  },

  // Stage 4
  {
    id: 'c2-a3a-s4-card-removal',
    type: 'card_removal',
    stage: 4,
    connectsTo: [
      'c2-a3a-s5-recruit-raikou',
      'c2-a3a-s5-recruit-entei',
      'c2-a3a-s5-recruit-suicune',
    ],
    completed: false,
    maxRemovals: 2,
    x: 0.52, y: 0.28,
  },
  {
    id: 'c2-a3a-s4-event-feather',
    type: 'event',
    stage: 4,
    connectsTo: [
      'c2-a3a-s5-recruit-raikou',
      'c2-a3a-s5-recruit-entei',
      'c2-a3a-s5-recruit-suicune',
    ],
    completed: false,
    eventId: 'c2_rainbow_feather',
    x: 0.52, y: 0.72,
  },

  // Stage 5: Three-way Legendary Beast Choice
  {
    id: 'c2-a3a-s5-recruit-raikou',
    type: 'recruit',
    stage: 5,
    connectsTo: ['c2-a3a-s6-rest'],
    completed: false,
    pokemonId: 'raikou',
    recruited: false,
    x: 0.63, y: 0.2,
  },
  {
    id: 'c2-a3a-s5-recruit-entei',
    type: 'recruit',
    stage: 5,
    connectsTo: ['c2-a3a-s6-rest'],
    completed: false,
    pokemonId: 'entei',
    recruited: false,
    x: 0.63, y: 0.5,
  },
  {
    id: 'c2-a3a-s5-recruit-suicune',
    type: 'recruit',
    stage: 5,
    connectsTo: ['c2-a3a-s6-rest'],
    completed: false,
    pokemonId: 'suicune',
    recruited: false,
    x: 0.63, y: 0.8,
  },

  // Stage 6: Rest
  {
    id: 'c2-a3a-s6-rest',
    type: 'rest',
    stage: 6,
    connectsTo: ['c2-a3a-s7-boss-ho-oh'],
    completed: false,
    x: 0.78, y: 0.5,
  },

  // Stage 7: Boss — Ho-Oh
  {
    id: 'c2-a3a-s7-boss-ho-oh',
    type: 'battle',
    stage: 7,
    connectsTo: [],
    completed: false,
    enemies: ['ho-oh'],
    enemyPositions: [{ row: 'front', column: 1 }],
    enemyHpMultiplier: 2.0,
    size: 'large',
    x: 0.91, y: 0.5,
  },
];
