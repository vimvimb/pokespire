import type { MapNode } from './types';

/**
 * Campaign 2 — Act 3B: Brass Tower (Silver's Path — Watery and Mysterious)
 * Node IDs prefixed with 'c2-a3b-'
 *
 * Beast recruit nodes have pokemonId pre-assigned so assignRecruitPokemon
 * skips them (it only assigns to nodes where pokemonId === '').
 */
export const CAMPAIGN2_ACT3B_NODES: MapNode[] = [
  // Stage 0: Spawn
  {
    id: 'c2-a3b-s0-spawn',
    type: 'spawn',
    stage: 0,
    connectsTo: ['c2-a3b-s1-battle-ghost', 'c2-a3b-s1-battle-water'],
    completed: false,
    x: 0.06, y: 0.5,
  },

  // Stage 1
  {
    id: 'c2-a3b-s1-battle-ghost',
    type: 'battle',
    stage: 1,
    connectsTo: ['c2-a3b-s2-battle-slowking', 'c2-a3b-s2-event-lugia'],
    completed: false,
    enemies: ['misdreavus', 'misdreavus'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 2 },
    ],
    x: 0.16, y: 0.3,
  },
  {
    id: 'c2-a3b-s1-battle-water',
    type: 'battle',
    stage: 1,
    connectsTo: ['c2-a3b-s2-battle-slowking', 'c2-a3b-s2-event-lugia'],
    completed: false,
    enemies: ['qwilfish', 'lanturn'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'back', column: 2 },
    ],
    x: 0.16, y: 0.7,
  },

  // Stage 2
  {
    id: 'c2-a3b-s2-battle-slowking',
    type: 'battle',
    stage: 2,
    connectsTo: ['c2-a3b-s3-event-three', 'c2-a3b-s3-battle-kingdra'],
    completed: false,
    enemies: ['slowking', 'corsola'],
    enemyPositions: [
      { row: 'back', column: 1 },
      { row: 'front', column: 1 },
    ],
    x: 0.28, y: 0.28,
  },
  {
    id: 'c2-a3b-s2-event-lugia',
    type: 'event',
    stage: 2,
    connectsTo: ['c2-a3b-s3-event-three', 'c2-a3b-s3-battle-kingdra'],
    completed: false,
    eventId: 'c2_lugia_presence',
    x: 0.28, y: 0.72,
  },

  // Stage 3
  {
    id: 'c2-a3b-s3-event-three',
    type: 'event',
    stage: 3,
    connectsTo: ['c2-a3b-s4-card-removal', 'c2-a3b-s4-event-feather'],
    completed: false,
    eventId: 'c2_the_three_pokemon',
    x: 0.4, y: 0.28,
  },
  {
    id: 'c2-a3b-s3-battle-kingdra',
    type: 'battle',
    stage: 3,
    connectsTo: ['c2-a3b-s4-card-removal', 'c2-a3b-s4-event-feather'],
    completed: false,
    enemies: ['kingdra', 'politoed'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'back', column: 2 },
    ],
    enemyHpMultiplier: 1.1,
    x: 0.4, y: 0.72,
  },

  // Stage 4
  {
    id: 'c2-a3b-s4-card-removal',
    type: 'card_removal',
    stage: 4,
    connectsTo: [
      'c2-a3b-s5-recruit-raikou',
      'c2-a3b-s5-recruit-entei',
      'c2-a3b-s5-recruit-suicune',
    ],
    completed: false,
    maxRemovals: 2,
    x: 0.52, y: 0.28,
  },
  {
    id: 'c2-a3b-s4-event-feather',
    type: 'event',
    stage: 4,
    connectsTo: [
      'c2-a3b-s5-recruit-raikou',
      'c2-a3b-s5-recruit-entei',
      'c2-a3b-s5-recruit-suicune',
    ],
    completed: false,
    eventId: 'c2_silver_feather',
    x: 0.52, y: 0.72,
  },

  // Stage 5: Three-way Legendary Beast Choice
  {
    id: 'c2-a3b-s5-recruit-raikou',
    type: 'recruit',
    stage: 5,
    connectsTo: ['c2-a3b-s6-rest'],
    completed: false,
    pokemonId: 'raikou',
    recruited: false,
    x: 0.63, y: 0.2,
  },
  {
    id: 'c2-a3b-s5-recruit-entei',
    type: 'recruit',
    stage: 5,
    connectsTo: ['c2-a3b-s6-rest'],
    completed: false,
    pokemonId: 'entei',
    recruited: false,
    x: 0.63, y: 0.5,
  },
  {
    id: 'c2-a3b-s5-recruit-suicune',
    type: 'recruit',
    stage: 5,
    connectsTo: ['c2-a3b-s6-rest'],
    completed: false,
    pokemonId: 'suicune',
    recruited: false,
    x: 0.63, y: 0.8,
  },

  // Stage 6: Rest
  {
    id: 'c2-a3b-s6-rest',
    type: 'rest',
    stage: 6,
    connectsTo: ['c2-a3b-s7-boss-lugia'],
    completed: false,
    x: 0.78, y: 0.5,
  },

  // Stage 7: Boss — Lugia
  {
    id: 'c2-a3b-s7-boss-lugia',
    type: 'battle',
    stage: 7,
    connectsTo: [],
    completed: false,
    enemies: ['lugia'],
    enemyPositions: [{ row: 'front', column: 1 }],
    enemyHpMultiplier: 2.0,
    size: 'large',
    x: 0.91, y: 0.5,
  },
];
