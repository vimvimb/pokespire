import type { MapNode } from './types';

/**
 * Campaign 2 — placeholder map with a single sample battle.
 * Node IDs prefixed with 'c2-' to avoid collisions with Campaign 1.
 *
 * Fill this out with a full multi-act campaign later:
 *   - Add more stage nodes (rest, events, recruits, more battles)
 *   - Add act transition nodes for additional acts
 *   - Create nodesCampaign2Act2.ts, etc.
 */
export const CAMPAIGN2_ACT1_NODES: MapNode[] = [
  // ============================================
  // Stage 0: Spawn
  // ============================================
  {
    id: 'c2-s0-spawn',
    type: 'spawn',
    stage: 0,
    connectsTo: ['c2-s1-battle'],
    completed: false,
    x: 0.2,
    y: 0.5,
  },

  // ============================================
  // Stage 1: Sample Battle (acts as the final boss for now)
  // ============================================
  {
    id: 'c2-s1-battle',
    type: 'battle',
    stage: 1,
    connectsTo: [],
    completed: false,
    enemies: ['murkrow'],
    enemyPositions: [{ row: 'front', column: 1 }],
    enemyHpMultiplier: 1.5,
    size: 'large',
    x: 0.8,
    y: 0.5,
  },
];
