import type { MapNode } from './types';

/**
 * Act 1 Branching Map — Room-Aligned Layout
 *
 * Structure (28 nodes):
 * - Stage 0: Spawn
 * - Stage 1: First split (Rattata/Pidgey) + corner recruit detours (TL, BL)
 * - Stage 2: Early mid (rest, duo battles)
 * - Stage 3: Center room (evolved battles) + events (train, meditate)
 * - Stage 4: Harder battles + forget event + top-right recruit detour (TR)
 * - Stage 5: Pre-boss mini-bosses + train event
 * - Stage 6: Ariana Boss Fight (Arbok, Raticate, Hypno)
 *
 * Corner detour mechanic: junction → battle → recruit → backtrack to main path
 * After visiting a recruit node, the player rejoins the main path at the same
 * forward options they would have had from the junction.
 */

export const ACT1_NODES: MapNode[] = [
  // ============================================
  // Stage 0: Spawn
  // ============================================
  {
    id: '1a',
    type: 'spawn',
    stage: 0,
    connectsTo: ['1b', '1c'],
    completed: false,
    x: 0.05, y: 0.44,
  },

  // ============================================
  // Stage 1: First Split
  // ============================================
  {
    id: '1b',
    type: 'battle',
    stage: 1,
    connectsTo: ['1h', '1i', '1d'],
    completed: false,
    enemies: ['rattata'],
    enemyPositions: [{ row: 'front', column: 1 }],
    x: 0.24, y: 0.36,
  },
  {
    id: '1c',
    type: 'battle',
    stage: 1,
    connectsTo: ['1i', '1j', '1f'],
    completed: false,
    enemies: ['pidgey'],
    enemyPositions: [{ row: 'front', column: 1 }],
    x: 0.24, y: 0.52,
  },

  // ============================================
  // Top-Left Corner Detour (recruit path from rattata)
  // ============================================
  {
    id: '1d',
    type: 'battle',
    stage: 1,
    connectsTo: ['1e'],
    completed: false,
    enemies: ['pidgey', 'pidgey'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 2 },
    ],
    x: 0.16, y: 0.16,
  },
  {
    id: '1e',
    type: 'recruit',
    stage: 1,
    connectsTo: ['1h', '1i'],
    completed: false,
    pokemonId: '',
    recruited: false,
    x: 0.08, y: 0.10,
    size: 'large',
  },

  // ============================================
  // Bottom-Left Corner Detour (recruit path from pidgey)
  // ============================================
  {
    id: '1f',
    type: 'battle',
    stage: 1,
    connectsTo: ['1g'],
    completed: false,
    enemies: ['rattata', 'rattata'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 2 },
    ],
    x: 0.16, y: 0.76,
  },
  {
    id: '1g',
    type: 'recruit',
    stage: 1,
    connectsTo: ['1i', '1j'],
    completed: false,
    pokemonId: '',
    recruited: false,
    x: 0.08, y: 0.86,
    size: 'large',
  },

  // ============================================
  // Stage 2: Early Mid
  // ============================================
  {
    id: '1h',
    type: 'battle',
    stage: 2,
    connectsTo: ['1k'],
    completed: false,
    enemies: ['ekans', 'pidgey'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 2 },
    ],
    x: 0.36, y: 0.33,
  },
  {
    id: '1i',
    type: 'battle',
    stage: 2,
    connectsTo: ['1k', '1l'],
    completed: false,
    enemies: ['pidgey', 'rattata'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 2 },
    ],
    x: 0.36, y: 0.515,
  },
  {
    id: '1j',
    type: 'rest',
    stage: 2,
    connectsTo: ['1l', '1m'],
    completed: false,
    x: 0.36, y: 0.70,
  },

  // ============================================
  // Stage 3: Center Room
  // ============================================
  {
    id: '1k',
    type: 'battle',
    stage: 3,
    connectsTo: ['1p', '1r', '1n'],
    completed: false,
    enemies: ['raticate'],
    enemyPositions: [{ row: 'front', column: 1 }],
    x: 0.47, y: 0.33,
  },
  {
    id: '1l',
    type: 'battle',
    stage: 3,
    connectsTo: ['1r', '1s'],
    completed: false,
    enemies: ['pidgeotto'],
    enemyPositions: [{ row: 'front', column: 1 }],
    x: 0.47, y: 0.515,
  },
  {
    id: '1m',
    type: 'battle',
    stage: 3,
    connectsTo: ['1s', '1o'],
    completed: false,
    enemies: ['arbok'],
    enemyPositions: [{ row: 'front', column: 1 }],
    x: 0.47, y: 0.70,
  },

  // ============================================
  // Stage 3: Events (above/below center room)
  // ============================================
  {
    id: '1n',
    type: 'event',
    stage: 3,
    connectsTo: ['1p'],
    completed: false,
    eventId: '',
    x: 0.44, y: 0.14,
  },
  {
    id: '1o',
    type: 'event',
    stage: 3,
    connectsTo: ['1s'],
    completed: false,
    eventId: '',
    x: 0.41, y: 0.90,
  },

  // ============================================
  // Stage 4: Harder
  // ============================================
  {
    id: '1p',
    type: 'rest',
    stage: 4,
    connectsTo: ['1w', '1q'],
    completed: false,
    x: 0.57, y: 0.33,
  },

  // ============================================
  // Top-Center Detour (random event from s4-rest)
  // ============================================
  {
    id: '1q',
    type: 'event',
    stage: 4,
    connectsTo: ['1w'],
    completed: false,
    eventId: '',  // Assigned at runtime by assignRandomEvents()
    x: 0.60, y: 0.14,
  },
  {
    id: '1r',
    type: 'battle',
    stage: 4,
    connectsTo: ['1w', '1x'],
    completed: false,
    enemies: ['raticate', 'pidgeotto'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 2 },
    ],
    x: 0.57, y: 0.515,
  },
  {
    id: '1s',
    type: 'battle',
    stage: 4,
    connectsTo: ['1x', '1y', '1z', '1t'],
    completed: false,
    enemies: ['arbok', 'raticate'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 2 },
    ],
    x: 0.57, y: 0.70,
  },
  {
    id: '1t',
    type: 'event',
    stage: 4,
    connectsTo: ['1y', '1z'],
    completed: false,
    eventId: '',
    x: 0.60, y: 0.90,
  },

  // ============================================
  // Top-Right Corner Detour (recruit path from s4-rest)
  // ============================================
  {
    id: '1u',
    type: 'battle',
    stage: 4,
    connectsTo: ['1v'],
    completed: false,
    enemies: ['kangaskhan'],
    enemyPositions: [{ row: 'front', column: 1 }],
    x: 0.86, y: 0.16,
  },
  {
    id: '1v',
    type: 'recruit',
    stage: 4,
    connectsTo: ['1ab'],
    completed: false,
    pokemonId: '',
    recruited: false,
    x: 0.92, y: 0.10,
    size: 'large',
  },

  // ============================================
  // Stage 5: Pre-Boss
  // ============================================
  {
    id: '1w',
    type: 'battle',
    stage: 5,
    connectsTo: ['1ab', '1u'],
    completed: false,
    enemies: ['tauros'],
    enemyPositions: [{ row: 'front', column: 1 }],
    x: 0.68, y: 0.32,
  },
  {
    id: '1x',
    type: 'battle',
    stage: 5,
    connectsTo: ['1ab'],
    completed: false,
    enemies: ['pidgeot'],
    enemyPositions: [{ row: 'front', column: 1 }],
    x: 0.68, y: 0.45,
  },
  {
    id: '1y',
    type: 'battle',
    stage: 5,
    connectsTo: ['1ab'],
    completed: false,
    enemies: ['snorlax'],
    enemyPositions: [{ row: 'front', column: 1 }],
    x: 0.68, y: 0.58,
  },
  {
    id: '1z',
    type: 'battle',
    stage: 5,
    connectsTo: ['1ab', '1aa'],
    completed: false,
    enemies: ['kangaskhan'],
    enemyPositions: [{ row: 'front', column: 1 }],
    x: 0.68, y: 0.70,
  },
  {
    id: '1aa',
    type: 'rest',
    stage: 5,
    connectsTo: ['1ab'],
    completed: false,
    x: 0.80, y: 0.78,
  },

  // ============================================
  // Stage 6: Ariana Boss Fight
  // ============================================
  {
    id: '1ab',
    type: 'battle',
    stage: 6,
    connectsTo: ['1ac'],
    completed: false,
    enemies: ['arbok', 'raticate', 'hypno'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'back', column: 0 },
      { row: 'front', column: 2 },
    ],
    enemyHpMultiplier: 1.5,
    x: 0.88, y: 0.44,
    size: 'large',
  },

  // ============================================
  // Act Transition Node
  // ============================================
  {
    id: '1ac',
    type: 'act_transition',
    stage: 7,
    connectsTo: [],
    completed: false,
    nextAct: 2,
    x: 0.95, y: 0.44,
  },
];

/**
 * Act 2 Branching Map — Room-Aligned Layout (Destroyed Rocket Lab)
 *
 * Structure (26 nodes):
 * - Stage 0: Spawn (left perimeter)
 * - Stage 1: First split (arbok+pidgeotto / raticate duo) + corner recruit detours (TL, BL)
 * - Stage 2: Left-center (rest, duo battles)
 * - Stage 3: Center crater (scaled battles) + events (top-center random, bottom meditate)
 * - Stage 4: Right-center (harder battles) + forget event
 * - Stage 5: Pre-boss mini-bosses + TR recruit detour + BR rest
 * - Stage 6: Giovanni Boss Fight
 *
 * Corner detour mechanic: junction → battle → recruit → backtrack to main path
 * Perimeter event detours: battle → event → backtrack to main path
 */

export const ACT2_NODES: MapNode[] = [
  // ============================================
  // Stage 0: Spawn
  // ============================================
  {
    id: '2a',
    type: 'spawn',
    stage: 0,
    connectsTo: ['2b', '2c'],
    completed: false,
    x: 0.08, y: 0.48,
  },

  // ============================================
  // Stage 1: First Split
  // ============================================
  {
    id: '2b',
    type: 'battle',
    stage: 1,
    connectsTo: ['2h', '2i', '2d'],
    completed: false,
    enemies: ['arbok', 'pidgeotto'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 2 },
    ],
    x: 0.24, y: 0.36,
  },
  {
    id: '2c',
    type: 'battle',
    stage: 1,
    connectsTo: ['2i', '2k', '2f'],
    completed: false,
    enemies: ['raticate', 'raticate'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 2 },
    ],
    x: 0.24, y: 0.56,
  },

  // ============================================
  // Top-Left Corner Detour (recruit)
  // ============================================
  {
    id: '2d',
    type: 'battle',
    stage: 1,
    connectsTo: ['2e'],
    completed: false,
    enemies: ['pidgeot'],
    enemyPositions: [{ row: 'front', column: 1 }],
    x: 0.16, y: 0.14,
  },
  {
    id: '2e',
    type: 'recruit',
    stage: 1,
    connectsTo: ['2h', '2i'],
    completed: false,
    pokemonId: '',
    recruited: false,
    x: 0.08, y: 0.08,
    size: 'large',
  },

  // ============================================
  // Bottom-Left Corner Detour (recruit)
  // ============================================
  {
    id: '2f',
    type: 'battle',
    stage: 1,
    connectsTo: ['2g'],
    completed: false,
    enemies: ['kangaskhan'],
    enemyPositions: [{ row: 'front', column: 1 }],
    x: 0.16, y: 0.80,
  },
  {
    id: '2g',
    type: 'recruit',
    stage: 1,
    connectsTo: ['2i', '2k'],
    completed: false,
    pokemonId: '',
    recruited: false,
    x: 0.08, y: 0.88,
    size: 'large',
  },

  // ============================================
  // Stage 2: Left-Center
  // ============================================
  {
    id: '2h',
    type: 'rest',
    stage: 2,
    connectsTo: ['2l'],
    completed: false,
    x: 0.36, y: 0.34,
  },
  {
    id: '2i',
    type: 'event',
    stage: 2,
    connectsTo: ['2l', '2m'],
    completed: false,
    eventId: 'the_chasm',
    x: 0.36, y: 0.50,
  },
  // Chasm ghost battle — unlocked by choosing "Brave the Chasm" at the event above
  {
    id: '2j',
    type: 'battle',
    stage: 3,
    connectsTo: ['2u'],
    completed: false,
    enemies: ['gengar', 'haunter', 'gastly'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 1 },
      { row: 'back', column: 1 },
    ],
    x: 0.54, y: 0.50,
  },
  {
    id: '2k',
    type: 'battle',
    stage: 2,
    connectsTo: ['2m'],
    completed: false,
    enemies: ['snorlax'],
    enemyPositions: [{ row: 'front', column: 1 }],
    enemyHpMultiplier: 1.2,
    x: 0.36, y: 0.76,
  },

  // ============================================
  // Stage 3: Center (crater area)
  // ============================================
  {
    id: '2l',
    type: 'battle',
    stage: 3,
    connectsTo: ['2p', '2n'],
    completed: false,
    enemies: ['snorlax', 'kangaskhan'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 2 },
    ],
    enemyHpMultiplier: 1.15,
    x: 0.48, y: 0.34,
  },
  {
    id: '2m',
    type: 'battle',
    stage: 3,
    connectsTo: ['2r', '2o'],
    completed: false,
    enemies: ['arbok', 'raticate', 'pidgeotto'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 1 },
      { row: 'front', column: 2 },
    ],
    x: 0.48, y: 0.76,
  },

  // ============================================
  // Top-Center Detour (random event)
  // ============================================
  {
    id: '2n',
    type: 'event',
    stage: 3,
    connectsTo: ['2p'],
    completed: false,
    eventId: '',  // Assigned at runtime by assignRandomEvents()
    x: 0.44, y: 0.12,
  },

  // ============================================
  // Bottom-Center Detour (meditate)
  // ============================================
  {
    id: '2o',
    type: 'event',
    stage: 3,
    connectsTo: ['2r'],
    completed: false,
    eventId: '',
    x: 0.48, y: 0.90,
  },

  // ============================================
  // Stage 4: Right-Center
  // ============================================
  {
    id: '2p',
    type: 'battle',
    stage: 4,
    connectsTo: ['2t', '2u', '2q'],
    completed: false,
    enemies: ['pidgeot', 'kangaskhan'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 2 },
    ],
    enemyHpMultiplier: 1.2,
    x: 0.60, y: 0.34,
  },

  // ============================================
  // Top-Right Detour (train event from a2-s4-battle-1)
  // ============================================
  {
    id: '2q',
    type: 'event',
    stage: 4,
    connectsTo: ['2t', '2u'],
    completed: false,
    eventId: '',
    x: 0.60, y: 0.12,
  },

  {
    id: '2r',
    type: 'battle',
    stage: 4,
    connectsTo: ['2u', '2v', '2s'],
    completed: false,
    enemies: ['tauros', 'pidgeot'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 2 },
    ],
    enemyHpMultiplier: 1.2,
    x: 0.60, y: 0.76,
  },

  // ============================================
  // Bottom-Right-Center Detour (forget)
  // ============================================
  {
    id: '2s',
    type: 'event',
    stage: 4,
    connectsTo: ['2u', '2v'],
    completed: false,
    eventId: '',
    x: 0.60, y: 0.90,
  },

  // ============================================
  // Stage 5: Pre-Boss
  // ============================================
  {
    id: '2t',
    type: 'battle',
    stage: 5,
    connectsTo: ['2z', '2w'],
    completed: false,
    enemies: ['snorlax', 'tauros', 'kangaskhan'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 1 },
      { row: 'front', column: 2 },
    ],
    x: 0.72, y: 0.36,
  },
  {
    id: '2u',
    type: 'battle',
    stage: 5,
    connectsTo: ['2z'],
    completed: false,
    enemies: ['pidgeot', 'kangaskhan'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 2 },
    ],
    enemyHpMultiplier: 1.2,
    x: 0.72, y: 0.56,
  },
  {
    id: '2v',
    type: 'battle',
    stage: 5,
    connectsTo: ['2z', '2y'],
    completed: false,
    enemies: ['snorlax', 'pidgeot'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 2 },
    ],
    enemyHpMultiplier: 1.2,
    x: 0.72, y: 0.76,
  },

  // ============================================
  // Top-Right Corner Detour (recruit)
  // ============================================
  {
    id: '2w',
    type: 'battle',
    stage: 5,
    connectsTo: ['2x'],
    completed: false,
    enemies: ['snorlax'],
    enemyPositions: [{ row: 'front', column: 1 }],
    enemyHpMultiplier: 1.2,
    x: 0.88, y: 0.14,
  },
  {
    id: '2x',
    type: 'recruit',
    stage: 5,
    connectsTo: ['2z'],
    completed: false,
    pokemonId: '',
    recruited: false,
    x: 0.92, y: 0.08,
    size: 'large',
  },

  // ============================================
  // Bottom-Right Corner Detour (rest)
  // ============================================
  {
    id: '2y',
    type: 'rest',
    stage: 5,
    connectsTo: ['2z'],
    completed: false,
    x: 0.90, y: 0.66,
  },

  // ============================================
  // Stage 6: Giovanni Boss Fight
  // ============================================
  {
    id: '2z',
    type: 'battle',
    stage: 6,
    connectsTo: ['2aa'],
    completed: false,
    enemies: ['persian', 'nidoking', 'rhydon'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 1 },
      { row: 'front', column: 2 },
    ],
    enemyHpMultiplier: 1.75,
    x: 0.90, y: 0.44,
    size: 'large',
  },

  // ============================================
  // Act Transition Node
  // ============================================
  {
    id: '2aa',
    type: 'act_transition',
    stage: 7,
    connectsTo: [],
    completed: false,
    nextAct: 3,
    x: 0.97, y: 0.44,
  },
];

/**
 * Act 3 Branching Map — Underground Caverns
 *
 * Structure (~20 nodes, diamond branching pattern):
 * - Stage 0: Spawn
 * - Stage 1: First split (2 battles, evolved Pokemon)
 * - Stage 2: 2 battles + 1 rest
 * - Stage 3: 3 battles (3-4 enemies, 1.15x HP)
 * - Stage 4: 2 battles + 1 train event (3-4 enemies, 1.2x HP)
 * - Stage 5: 3 battles + 1 rest (3-4 enemies, 1.25x HP)
 * - Stage 6: Mewtwo Final Boss
 */

export const ACT3_NODES: MapNode[] = [
  // ============================================
  // Stage 0: Spawn
  // ============================================
  {
    id: '3a',
    type: 'spawn',
    stage: 0,
    connectsTo: ['3b', '3c'],
    completed: false,
    x: 0.05, y: 0.44,
  },

  // ============================================
  // Stage 1: First Split (evolved Pokemon)
  // ============================================
  {
    id: '3b',
    type: 'battle',
    stage: 1,
    connectsTo: ['3d', '3e'],
    completed: false,
    enemies: ['arcanine', 'nidoking', 'sandslash'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 1 },
      { row: 'front', column: 2 },
    ],
    x: 0.18, y: 0.30,
  },
  {
    id: '3c',
    type: 'battle',
    stage: 1,
    connectsTo: ['3e', '3f'],
    completed: false,
    enemies: ['gyarados', 'nidoqueen', 'fearow'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 1 },
      { row: 'front', column: 2 },
    ],
    x: 0.18, y: 0.58,
  },

  // ============================================
  // Stage 2: Mid-early (2 battles + 1 rest)
  // ============================================
  {
    id: '3d',
    type: 'battle',
    stage: 2,
    connectsTo: ['3g', '3h'],
    completed: false,
    enemies: ['rhydon', 'electrode', 'hypno'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 1 },
      { row: 'front', column: 2 },
    ],
    x: 0.30, y: 0.24,
  },
  {
    id: '3e',
    type: 'rest',
    stage: 2,
    connectsTo: ['3h'],
    completed: false,
    x: 0.30, y: 0.44,
  },
  {
    id: '3f',
    type: 'battle',
    stage: 2,
    connectsTo: ['3h', '3i'],
    completed: false,
    enemies: ['dragonair', 'lapras', 'pidgeot'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 1 },
      { row: 'front', column: 2 },
    ],
    x: 0.30, y: 0.64,
  },

  // ============================================
  // Stage 3: Center (3 battles, 3-4 enemies, 1.15x HP)
  // ============================================
  {
    id: '3g',
    type: 'battle',
    stage: 3,
    connectsTo: ['3j', '3k'],
    completed: false,
    enemies: ['nidoking', 'nidoqueen', 'arcanine'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 1 },
      { row: 'front', column: 2 },
    ],
    enemyHpMultiplier: 1.15,
    x: 0.42, y: 0.24,
  },
  {
    id: '3h',
    type: 'battle',
    stage: 3,
    connectsTo: ['3j', '3l'],
    completed: false,
    enemies: ['snorlax', 'kangaskhan', 'lapras', 'hypno'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 1 },
      { row: 'front', column: 2 },
      { row: 'back', column: 1 },
    ],
    enemyHpMultiplier: 1.15,
    x: 0.42, y: 0.44,
  },
  {
    id: '3i',
    type: 'battle',
    stage: 3,
    connectsTo: ['3l', '3k'],
    completed: false,
    enemies: ['gyarados', 'dragonair', 'rhydon'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 1 },
      { row: 'front', column: 2 },
    ],
    enemyHpMultiplier: 1.15,
    x: 0.42, y: 0.64,
  },

  // ============================================
  // Stage 4: Harder (2 battles + 1 train event, 1.2x HP)
  // ============================================
  {
    id: '3j',
    type: 'battle',
    stage: 4,
    connectsTo: ['3m', '3n'],
    completed: false,
    enemies: ['dragonite', 'arcanine', 'nidoking'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 1 },
      { row: 'front', column: 2 },
    ],
    enemyHpMultiplier: 1.2,
    x: 0.55, y: 0.30,
  },
  {
    id: '3k',
    type: 'event',
    stage: 4,
    connectsTo: ['3n'],
    completed: false,
    eventId: '',
    x: 0.55, y: 0.44,
  },
  {
    id: '3l',
    type: 'battle',
    stage: 4,
    connectsTo: ['3n', '3o'],
    completed: false,
    enemies: ['gyarados', 'lapras', 'electrode', 'sandslash'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 1 },
      { row: 'front', column: 2 },
      { row: 'back', column: 1 },
    ],
    enemyHpMultiplier: 1.2,
    x: 0.55, y: 0.58,
  },

  // ============================================
  // Stage 5: Pre-Boss (3 battles + 1 rest, 1.25x HP)
  // ============================================
  {
    id: '3m',
    type: 'battle',
    stage: 5,
    connectsTo: ['3q'],
    completed: false,
    enemies: ['dragonite', 'snorlax', 'kangaskhan'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 1 },
      { row: 'front', column: 2 },
    ],
    enemyHpMultiplier: 1.25,
    x: 0.68, y: 0.26,
  },
  {
    id: '3n',
    type: 'battle',
    stage: 5,
    connectsTo: ['3q', '3p'],
    completed: false,
    enemies: ['nidoking', 'nidoqueen', 'arcanine', 'rhydon'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 1 },
      { row: 'front', column: 2 },
      { row: 'back', column: 1 },
    ],
    enemyHpMultiplier: 1.25,
    x: 0.68, y: 0.44,
  },
  {
    id: '3o',
    type: 'battle',
    stage: 5,
    connectsTo: ['3q'],
    completed: false,
    enemies: ['gyarados', 'dragonite', 'lapras'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 1 },
      { row: 'front', column: 2 },
    ],
    enemyHpMultiplier: 1.25,
    x: 0.68, y: 0.62,
  },
  {
    id: '3p',
    type: 'rest',
    stage: 5,
    connectsTo: ['3q'],
    completed: false,
    x: 0.80, y: 0.58,
  },

  // ============================================
  // Stage 6: Mewtwo Final Boss
  // ============================================
  {
    id: '3q',
    type: 'battle',
    stage: 6,
    connectsTo: [],
    completed: false,
    enemies: ['mewtwo'],
    enemyPositions: [{ row: 'front', column: 1 }],
    enemyHpMultiplier: 2.0,
    x: 0.88, y: 0.44,
    size: 'large',
  },
];

/**
 * Helper to get node by ID
 */
export function getNodeById(nodes: MapNode[], id: string): MapNode | undefined {
  return nodes.find(n => n.id === id);
}

/**
 * Get all nodes at a specific stage
 */
export function getNodesAtStage(nodes: MapNode[], stage: number): MapNode[] {
  return nodes.filter(n => n.stage === stage);
}

/**
 * Get the maximum stage number in the map
 */
export function getMaxStage(nodes: MapNode[]): number {
  return Math.max(...nodes.map(n => n.stage));
}

/**
 * Get nodes for a specific act
 */
export function getNodesForAct(act: number): MapNode[] {
  if (act === 1) return ACT1_NODES;
  if (act === 2) return ACT2_NODES;
  return ACT3_NODES;
}
