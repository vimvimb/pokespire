export type NodeType = 'battle' | 'event' | 'boss' | 'evolution';

export interface CampaignNode {
  id: string;
  type: NodeType;
  encounterId?: string; // For battle/boss nodes
  name: string;
  nextNodes: string[]; // IDs of nodes that can be reached from this one
}

export interface CampaignMap {
  nodes: Record<string, CampaignNode>;
  startNodeId: string;
}

export const CAMPAIGN_MAP: CampaignMap = {
  startNodeId: 'start',
  nodes: {
    start: {
      id: 'start',
      type: 'event',
      name: 'Team Rocket Lab',
      nextNodes: ['branchA', 'branchB', 'branchC'],
    },
    // Act 1 - First branch (three paths)
    branchA: {
      id: 'branchA',
      type: 'battle',
      encounterId: 'electricSwarm',
      name: 'Electric Swarm',
      nextNodes: ['converge1'],
    },
    branchB: {
      id: 'branchB',
      type: 'battle',
      encounterId: 'poisonSwarm',
      name: 'Poison Swarm',
      nextNodes: ['converge1'],
    },
    branchC: {
      id: 'branchC',
      type: 'battle',
      encounterId: 'normalSwarm',
      name: 'Normal Swarm',
      nextNodes: ['converge1'],
    },
    // Convergence after first branch
    converge1: {
      id: 'converge1',
      type: 'event',
      name: 'Lab Corridor',
      nextNodes: ['firstEvolution'],
    },
    // First evolution checkpoint
    firstEvolution: {
      id: 'firstEvolution',
      type: 'evolution',
      name: 'Evolution Checkpoint',
      nextNodes: ['giovanni'],
    },
    // Act 1 - Boss
    giovanni: {
      id: 'giovanni',
      type: 'boss',
      encounterId: 'giovanni',
      name: 'Giovanni',
      nextNodes: ['converge2'],
    },
    // Convergence after Giovanni
    converge2: {
      id: 'converge2',
      type: 'event',
      name: 'Lab Exit',
      nextNodes: ['cloneA', 'cloneB', 'cloneC'],
    },
    // Act 2 - Clone battles (three paths)
    cloneA: {
      id: 'cloneA',
      type: 'battle',
      encounterId: 'venusaurClone',
      name: 'Venusaur Clone Team',
      nextNodes: ['converge3'],
    },
    cloneB: {
      id: 'cloneB',
      type: 'battle',
      encounterId: 'charizardClone',
      name: 'Charizard Clone Team',
      nextNodes: ['converge3'],
    },
    cloneC: {
      id: 'cloneC',
      type: 'battle',
      encounterId: 'blastoiseClone',
      name: 'Blastoise Clone Team',
      nextNodes: ['converge3'],
    },
    // Convergence after clone battles
    converge3: {
      id: 'converge3',
      type: 'event',
      name: 'Mewtwo\'s Chamber',
      nextNodes: ['secondEvolution'],
    },
    // Second evolution checkpoint
    secondEvolution: {
      id: 'secondEvolution',
      type: 'evolution',
      name: 'Final Evolution',
      nextNodes: ['mewtwo'],
    },
    // Act 2 - Final boss
    mewtwo: {
      id: 'mewtwo',
      type: 'boss',
      encounterId: 'mewtwo',
      name: 'Mewtwo',
      nextNodes: [], // End of campaign
    },
  },
};

export function getNode(nodeId: string): CampaignNode | undefined {
  return CAMPAIGN_MAP.nodes[nodeId];
}

export function getStartNode(): CampaignNode {
  return CAMPAIGN_MAP.nodes[CAMPAIGN_MAP.startNodeId];
}
