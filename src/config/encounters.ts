import type { PokemonId } from './pokemon';

export type EncounterType = 'battle' | 'event' | 'boss';

export interface EncounterEnemy {
  pokemonId: PokemonId;
}

export interface EncounterDefinition {
  id: string;
  name: string;
  type: EncounterType;
  enemies: EncounterEnemy[];
}

export const ENCOUNTERS: Record<string, EncounterDefinition> = {
  // Act 1 - First branch
  electricSwarm: {
    id: 'electricSwarm',
    name: 'Electric Swarm',
    type: 'battle',
    enemies: [
      { pokemonId: 'magneton' },
      { pokemonId: 'magnemite' },
      { pokemonId: 'magnemite' },
      { pokemonId: 'magnemite' },
    ],
  },
  poisonSwarm: {
    id: 'poisonSwarm',
    name: 'Poison Swarm',
    type: 'battle',
    enemies: [
      { pokemonId: 'muk' },
      { pokemonId: 'grimer' },
      { pokemonId: 'zubat' },
      { pokemonId: 'zubat' },
    ],
  },
  normalSwarm: {
    id: 'normalSwarm',
    name: 'Normal Swarm',
    type: 'battle',
    enemies: [
      { pokemonId: 'raticate' },
      { pokemonId: 'rattata' },
      { pokemonId: 'rattata' },
      { pokemonId: 'rattata' },
    ],
  },
  // Act 1 - Boss
  giovanni: {
    id: 'giovanni',
    name: 'Giovanni',
    type: 'boss',
    enemies: [
      { pokemonId: 'persian' },
      { pokemonId: 'rhydon' },
      { pokemonId: 'nidoqueen' },
      { pokemonId: 'nidoking' },
    ],
  },
  // Act 2 - Clone battles
  venusaurClone: {
    id: 'venusaurClone',
    name: 'Venusaur Clone Team',
    type: 'battle',
    enemies: [
      { pokemonId: 'venusaur' },
      { pokemonId: 'ivysaur' },
      { pokemonId: 'bulbasaur' },
      { pokemonId: 'bulbasaur' },
    ],
  },
  charizardClone: {
    id: 'charizardClone',
    name: 'Charizard Clone Team',
    type: 'battle',
    enemies: [
      { pokemonId: 'charizard' },
      { pokemonId: 'charmeleon' },
      { pokemonId: 'charmander' },
      { pokemonId: 'charmander' },
    ],
  },
  blastoiseClone: {
    id: 'blastoiseClone',
    name: 'Blastoise Clone Team',
    type: 'battle',
    enemies: [
      { pokemonId: 'blastoise' },
      { pokemonId: 'wartortle' },
      { pokemonId: 'squirtle' },
      { pokemonId: 'squirtle' },
    ],
  },
  // Act 2 - Final boss
  mewtwo: {
    id: 'mewtwo',
    name: 'Mewtwo',
    type: 'boss',
    enemies: [
      { pokemonId: 'mewtwo' },
    ],
  },
};

export function getEncounter(encounterId: string): EncounterDefinition | undefined {
  return ENCOUNTERS[encounterId];
}
