import type { MapNode } from './types';

/**
 * Campaign 2 — Act 1: Ilex Forest (Present Day)
 * Node IDs prefixed with 'c2-a1-'
 * eventId fields are pre-assigned — not drawn from the random pool.
 */
export const CAMPAIGN2_ACT1_NODES: MapNode[] = [
  // Stage 0: Spawn
  {
    id: 'c2-a1-s0-spawn',
    type: 'spawn',
    stage: 0,
    connectsTo: ['c2-a1-s1-battle-spinarak', 'c2-a1-s1-battle-ledyba'],
    completed: false,
    x: 0.06, y: 0.5,
  },

  // Stage 1: First split
  {
    id: 'c2-a1-s1-battle-spinarak',
    type: 'battle',
    stage: 1,
    connectsTo: ['c2-a1-s2-rest', 'c2-a1-s2-battle-hoothoot'],
    completed: false,
    enemies: ['spinarak', 'spinarak'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 2 },
    ],
    x: 0.16, y: 0.3,
  },
  {
    id: 'c2-a1-s1-battle-ledyba',
    type: 'battle',
    stage: 1,
    connectsTo: ['c2-a1-s2-rest', 'c2-a1-s2-battle-hoothoot'],
    completed: false,
    enemies: ['ledyba', 'ledyba'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 2 },
    ],
    x: 0.16, y: 0.7,
  },

  // Stage 2: Mid-forest
  {
    id: 'c2-a1-s2-rest',
    type: 'rest',
    stage: 2,
    connectsTo: ['c2-a1-s2-event-gs-ball'],
    completed: false,
    x: 0.28, y: 0.25,
  },
  {
    id: 'c2-a1-s2-battle-hoothoot',
    type: 'battle',
    stage: 2,
    connectsTo: ['c2-a1-s2-event-gs-ball'],
    completed: false,
    enemies: ['hoothoot', 'hoothoot'],
    enemyPositions: [
      { row: 'back', column: 0 },
      { row: 'back', column: 2 },
    ],
    x: 0.28, y: 0.75,
  },
  {
    id: 'c2-a1-s2-event-gs-ball',
    type: 'event',
    stage: 2,
    connectsTo: ['c2-a1-s2-recruit'],
    completed: false,
    eventId: 'c2_gs_ball',
    x: 0.36, y: 0.5,
  },
  {
    id: 'c2-a1-s2-recruit',
    type: 'recruit',
    stage: 2,
    connectsTo: ['c2-a1-s3-battle-ariados', 'c2-a1-s3-battle-yanma'],
    completed: false,
    pokemonId: '',
    recruited: false,
    x: 0.44, y: 0.5,
  },

  // Stage 3: Deep forest
  {
    id: 'c2-a1-s3-battle-ariados',
    type: 'battle',
    stage: 3,
    connectsTo: ['c2-a1-s3-event-sprite', 'c2-a1-s4-event-shrine'],
    completed: false,
    enemies: ['ariados', 'misdreavus'],
    enemyPositions: [
      { row: 'front', column: 1 },
      { row: 'back', column: 1 },
    ],
    enemyHpMultiplier: 1.1,
    x: 0.52, y: 0.3,
  },
  {
    id: 'c2-a1-s3-battle-yanma',
    type: 'battle',
    stage: 3,
    connectsTo: ['c2-a1-s3-event-sprite', 'c2-a1-s4-event-shrine'],
    completed: false,
    enemies: ['yanma', 'yanma'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 2 },
    ],
    enemyHpMultiplier: 1.1,
    x: 0.52, y: 0.7,
  },
  {
    id: 'c2-a1-s3-event-sprite',
    type: 'event',
    stage: 3,
    connectsTo: ['c2-a1-s4-event-shrine'],
    completed: false,
    eventId: 'c2_forest_sprite',
    x: 0.6, y: 0.5,
  },

  // Stage 4: Near the shrine
  {
    id: 'c2-a1-s4-event-shrine',
    type: 'event',
    stage: 4,
    connectsTo: ['c2-a1-s5-rest', 'c2-a1-s5-battle-sudowoodo'],
    completed: false,
    eventId: 'c2_shrine_keeper',
    x: 0.67, y: 0.5,
  },

  // Stage 5: Pre-boss
  {
    id: 'c2-a1-s5-rest',
    type: 'rest',
    stage: 5,
    connectsTo: ['c2-a1-s6-boss-celebi'],
    completed: false,
    x: 0.76, y: 0.3,
  },
  {
    id: 'c2-a1-s5-battle-sudowoodo',
    type: 'battle',
    stage: 5,
    connectsTo: ['c2-a1-s6-boss-celebi'],
    completed: false,
    enemies: ['sudowoodo'],
    enemyPositions: [{ row: 'front', column: 1 }],
    enemyHpMultiplier: 1.25,
    x: 0.76, y: 0.7,
  },

  // Stage 6: Boss — Celebi
  {
    id: 'c2-a1-s6-boss-celebi',
    type: 'battle',
    stage: 6,
    connectsTo: ['c2-a1-s7-transition'],
    completed: false,
    enemies: ['celebi'],
    enemyPositions: [{ row: 'front', column: 1 }],
    enemyHpMultiplier: 1.8,
    size: 'large',
    x: 0.87, y: 0.5,
  },

  // Stage 7: Act Transition
  {
    id: 'c2-a1-s7-transition',
    type: 'act_transition',
    stage: 7,
    connectsTo: [],
    completed: false,
    nextAct: 2,
    x: 0.96, y: 0.5,
  },
];
