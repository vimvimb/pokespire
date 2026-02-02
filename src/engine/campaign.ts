import type { CampaignState, GameState } from './types';
import { CAMPAIGN_MAP, getNode } from '../config/campaign';
import { getEvolutionCheckpoint } from '../config/evolution';
import type { PokemonId } from '../config/pokemon';

export function createCampaignState(
  players: Array<{ id: string; name: string; pokemonId: PokemonId }>
): CampaignState {
  return {
    currentNodeId: CAMPAIGN_MAP.startNodeId,
    completedNodes: new Set(),
    party: players.map(p => ({
      playerId: p.id,
      playerName: p.name,
      pokemonId: p.pokemonId,
    })),
  };
}

export function getAvailablePaths(campaignState: CampaignState): string[] {
  const currentNode = getNode(campaignState.currentNodeId);
  if (!currentNode) {
    return [];
  }
  return currentNode.nextNodes;
}

export function progressToNode(
  campaignState: CampaignState,
  nodeId: string
): CampaignState {
  const node = getNode(nodeId);
  if (!node) {
    return campaignState; // Invalid node
  }

  const newCompletedNodes = new Set(campaignState.completedNodes);
  newCompletedNodes.add(campaignState.currentNodeId);

  return {
    ...campaignState,
    currentNodeId: nodeId,
    completedNodes: newCompletedNodes,
  };
}

export function checkEvolutionCheckpoint(
  campaignState: CampaignState,
  nodeId: string
): Array<{ from: PokemonId; to: PokemonId }> {
  const checkpoint = getEvolutionCheckpoint(nodeId);
  if (!checkpoint) {
    return [];
  }

  const evolutions: Array<{ from: PokemonId; to: PokemonId }> = [];
  
  for (const evolution of checkpoint.evolutions) {
    // Check if any party member matches the "from" Pokemon
    const partyMember = campaignState.party.find(p => p.pokemonId === evolution.from);
    if (partyMember) {
      evolutions.push(evolution);
    }
  }

  return evolutions;
}

export function applyEvolutions(
  campaignState: CampaignState,
  evolutions: Array<{ from: PokemonId; to: PokemonId }>
): CampaignState {
  const evolutionMap = new Map(evolutions.map(e => [e.from, e.to]));
  
  return {
    ...campaignState,
    party: campaignState.party.map(p => {
      const evolvedTo = evolutionMap.get(p.pokemonId);
      return evolvedTo ? { ...p, pokemonId: evolvedTo } : p;
    }),
  };
}

export function getCurrentEncounter(campaignState: CampaignState): string | undefined {
  const currentNode = getNode(campaignState.currentNodeId);
  return currentNode?.encounterId;
}
