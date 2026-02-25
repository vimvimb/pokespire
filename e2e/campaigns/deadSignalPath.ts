/**
 * Fixed path configuration for the Dead Signal (rocket_tower) e2e test.
 *
 * Node IDs are looked up from the source node arrays at test startup so that
 * if a node is renamed or removed, the test fails immediately with a clear
 * message rather than silently navigating the wrong path.
 *
 * NOTE: Act transition nodes (1ac, 2aa) are intentionally NOT in mapClicks.
 *       Defeating each act boss automatically triggers the act_transition
 *       screen — the player never manually clicks 1ac/2aa on the map.
 */

import { ACT1_NODES, ACT2_NODES, ACT3_NODES } from '../../src/run/nodes';
import type { BattleNode, MapNode } from '../../src/run/types';

function requireNode(nodes: MapNode[], id: string): MapNode {
  const node = nodes.find(n => n.id === id);
  if (!node) {
    throw new Error(
      `Dead Signal e2e path config: node '${id}' not found in node array. ` +
      `If you renamed or removed this node, update deadSignalPath.ts too.`
    );
  }
  return node;
}

// Validate all referenced IDs at module load time.
// Tests import this module before running, so any missing node is caught early.
export const DEAD_SIGNAL = {
  /**
   * Act 1 — Rocket Hideout
   * Path: spawn 1a → 1b → 1h → 1k → 1p → 1w → 1ab (boss) → (auto act_transition)
   */
  act1: {
    mapClicks: ['1b', '1h', '1k', '1p', '1w', '1ab'] as const,
    bossNodeId: '1ab' as const,
    bossNode: requireNode(ACT1_NODES, '1ab') as BattleNode,
    battleNodes: {
      '1b': requireNode(ACT1_NODES, '1b') as BattleNode,
      '1h': requireNode(ACT1_NODES, '1h') as BattleNode,
      '1k': requireNode(ACT1_NODES, '1k') as BattleNode,
      '1w': requireNode(ACT1_NODES, '1w') as BattleNode,
      '1ab': requireNode(ACT1_NODES, '1ab') as BattleNode,
    },
    restNodes: ['1p'] as const,
  },

  /**
   * Act 2 — Destroyed Rocket Lab
   * Path: spawn 2a → 2b → 2h → 2l → 2p → 2t → 2z (boss) → (auto act_transition)
   */
  act2: {
    mapClicks: ['2b', '2h', '2l', '2p', '2t', '2z'] as const,
    bossNodeId: '2z' as const,
    bossNode: requireNode(ACT2_NODES, '2z') as BattleNode,
    battleNodes: {
      '2b': requireNode(ACT2_NODES, '2b') as BattleNode,
      '2l': requireNode(ACT2_NODES, '2l') as BattleNode,
      '2p': requireNode(ACT2_NODES, '2p') as BattleNode,
      '2t': requireNode(ACT2_NODES, '2t') as BattleNode,
      '2z': requireNode(ACT2_NODES, '2z') as BattleNode,
    },
    restNodes: ['2h'] as const,
  },

  /**
   * Act 3 — The Depths
   * Path: spawn 3a → 3b → 3e → 3h → 3j → 3m → 3q (Mewtwo, final boss)
   * Defeating 3q triggers run_victory directly.
   */
  act3: {
    mapClicks: ['3b', '3e', '3h', '3j', '3m', '3q'] as const,
    bossNodeId: '3q' as const,
    bossNode: requireNode(ACT3_NODES, '3q') as BattleNode,
    battleNodes: {
      '3b': requireNode(ACT3_NODES, '3b') as BattleNode,
      '3h': requireNode(ACT3_NODES, '3h') as BattleNode,
      '3j': requireNode(ACT3_NODES, '3j') as BattleNode,
      '3m': requireNode(ACT3_NODES, '3m') as BattleNode,
      '3q': requireNode(ACT3_NODES, '3q') as BattleNode,
    },
    restNodes: ['3e'] as const,
  },
} as const;
