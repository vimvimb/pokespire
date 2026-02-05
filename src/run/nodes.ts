import type { MapNode } from './types';

/**
 * Act 1 Branching Map
 *
 * Structure:
 * - Stage 0: Spawn
 * - Stage 1: Easy battles (Rattata, Pidgey) + Rest
 * - Stage 2: Easy battles (mixed basic Pokemon) + Rest
 * - Stage 3: Rest nodes (recovery before mid-game)
 * - Stage 4: Medium battles (Raticate, Pidgeotto, Arbok)
 * - Stage 5: Medium battles + Rest
 * - Stage 6: Hard battles (Tauros, Pidgeot)
 * - Stage 7: Mini-boss choice (Snorlax or Kangaskhan) + Rest
 * - Stage 8: Final Boss (Mewtwo)
 *
 * Difficulty progression:
 * - Early: Single weak Pokemon (Rattata, Pidgey, Ekans)
 * - Mid: Evolved forms (Raticate, Pidgeotto, Arbok)
 * - Late: Strong Pokemon (Tauros, Pidgeot)
 * - Pre-boss: Mini-boss (Snorlax or Kangaskhan)
 * - Boss: Mewtwo
 */

export const ACT1_NODES: MapNode[] = [
  // ============================================
  // Stage 0: Spawn
  // ============================================
  {
    id: 's0-spawn',
    type: 'spawn',
    stage: 0,
    connectsTo: ['s1-battle-rattata', 's1-rest'],
    completed: false,
  },

  // ============================================
  // Stage 1: Easy intro (2 nodes)
  // ============================================
  {
    id: 's1-battle-rattata',
    type: 'battle',
    stage: 1,
    connectsTo: ['s2-battle-duo', 's2-rest'],
    completed: false,
    enemies: ['rattata'],
    enemyPositions: [{ row: 'front', column: 1 }],
  },
  {
    id: 's1-rest',
    type: 'rest',
    stage: 1,
    connectsTo: ['s2-rest', 's2-battle-ekans'],
    completed: false,
  },

  // ============================================
  // Stage 2: More easy battles (3 nodes)
  // ============================================
  {
    id: 's2-battle-duo',
    type: 'battle',
    stage: 2,
    connectsTo: ['s3-rest-upper', 's3-rest-lower'],
    completed: false,
    enemies: ['pidgey', 'rattata'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 2 },
    ],
  },
  {
    id: 's2-rest',
    type: 'rest',
    stage: 2,
    connectsTo: ['s3-rest-upper', 's3-rest-lower'],
    completed: false,
  },
  {
    id: 's2-battle-ekans',
    type: 'battle',
    stage: 2,
    connectsTo: ['s3-rest-lower'],
    completed: false,
    enemies: ['ekans'],
    enemyPositions: [{ row: 'front', column: 1 }],
  },

  // ============================================
  // Stage 3: Recovery (2 nodes)
  // ============================================
  {
    id: 's3-rest-upper',
    type: 'rest',
    stage: 3,
    connectsTo: ['s4-battle-raticate', 's4-battle-pidgeotto'],
    completed: false,
  },
  {
    id: 's3-rest-lower',
    type: 'rest',
    stage: 3,
    connectsTo: ['s4-battle-pidgeotto', 's4-battle-arbok'],
    completed: false,
  },

  // ============================================
  // Stage 4: Medium battles - evolved forms (3 nodes)
  // ============================================
  {
    id: 's4-battle-raticate',
    type: 'battle',
    stage: 4,
    connectsTo: ['s5-rest'],
    completed: false,
    enemies: ['raticate'],
    enemyPositions: [{ row: 'front', column: 1 }],
  },
  {
    id: 's4-battle-pidgeotto',
    type: 'battle',
    stage: 4,
    connectsTo: ['s5-rest', 's5-battle-combo'],
    completed: false,
    enemies: ['pidgeotto'],
    enemyPositions: [{ row: 'front', column: 1 }],
  },
  {
    id: 's4-battle-arbok',
    type: 'battle',
    stage: 4,
    connectsTo: ['s5-battle-combo'],
    completed: false,
    enemies: ['arbok'],
    enemyPositions: [{ row: 'front', column: 1 }],
  },

  // ============================================
  // Stage 5: Mix of rest and harder battle (2 nodes)
  // ============================================
  {
    id: 's5-rest',
    type: 'rest',
    stage: 5,
    connectsTo: ['s6-battle-tauros', 's6-battle-pidgeot'],
    completed: false,
  },
  {
    id: 's5-battle-combo',
    type: 'battle',
    stage: 5,
    connectsTo: ['s6-battle-tauros', 's6-battle-pidgeot'],
    completed: false,
    enemies: ['raticate', 'pidgeotto'],
    enemyPositions: [
      { row: 'front', column: 0 },
      { row: 'front', column: 2 },
    ],
  },

  // ============================================
  // Stage 6: Hard battles (2 nodes)
  // ============================================
  {
    id: 's6-battle-tauros',
    type: 'battle',
    stage: 6,
    connectsTo: ['s7-battle-snorlax', 's7-rest'],
    completed: false,
    enemies: ['tauros'],
    enemyPositions: [{ row: 'front', column: 1 }],
  },
  {
    id: 's6-battle-pidgeot',
    type: 'battle',
    stage: 6,
    connectsTo: ['s7-rest', 's7-battle-kangaskhan'],
    completed: false,
    enemies: ['pidgeot'],
    enemyPositions: [{ row: 'front', column: 1 }],
  },

  // ============================================
  // Stage 7: Mini-boss choice + rest (3 nodes)
  // ============================================
  {
    id: 's7-battle-snorlax',
    type: 'battle',
    stage: 7,
    connectsTo: ['s8-boss'],
    completed: false,
    enemies: ['snorlax'],
    enemyPositions: [{ row: 'front', column: 1 }],
  },
  {
    id: 's7-rest',
    type: 'rest',
    stage: 7,
    connectsTo: ['s8-boss'],
    completed: false,
  },
  {
    id: 's7-battle-kangaskhan',
    type: 'battle',
    stage: 7,
    connectsTo: ['s8-boss'],
    completed: false,
    enemies: ['kangaskhan'],
    enemyPositions: [{ row: 'front', column: 1 }],
  },

  // ============================================
  // Stage 8: Final Boss - Mewtwo
  // ============================================
  {
    id: 's8-boss',
    type: 'battle',
    stage: 8,
    connectsTo: [],
    completed: false,
    enemies: ['mewtwo'],
    enemyPositions: [{ row: 'front', column: 1 }],
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
