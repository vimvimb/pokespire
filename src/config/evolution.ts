import type { PokemonId } from './pokemon';

export interface EvolutionCheckpoint {
  nodeId: string;
  evolutions: Array<{
    from: PokemonId;
    to: PokemonId;
  }>;
}

export const EVOLUTION_CHECKPOINTS: Record<string, EvolutionCheckpoint> = {
  firstEvolution: {
    nodeId: 'firstEvolution',
    evolutions: [
      { from: 'bulbasaur', to: 'ivysaur' },
      { from: 'squirtle', to: 'wartortle' },
      { from: 'charmander', to: 'charmeleon' },
      // Pikachu does not evolve at first checkpoint
    ],
  },
  secondEvolution: {
    nodeId: 'secondEvolution',
    evolutions: [
      { from: 'ivysaur', to: 'venusaur' },
      { from: 'wartortle', to: 'blastoise' },
      { from: 'charmeleon', to: 'charizard' },
      { from: 'pikachu', to: 'raichu' },
    ],
  },
};

export function getEvolutionCheckpoint(nodeId: string): EvolutionCheckpoint | undefined {
  return EVOLUTION_CHECKPOINTS[nodeId];
}
