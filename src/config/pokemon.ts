export type PokemonId = 
  | 'bulbasaur' | 'ivysaur' | 'venusaur'
  | 'squirtle' | 'wartortle' | 'blastoise'
  | 'charmander' | 'charmeleon' | 'charizard'
  | 'pikachu' | 'raichu'
  | 'magnemite' | 'magneton'
  | 'grimer' | 'muk'
  | 'zubat'
  | 'rattata' | 'raticate'
  | 'persian' | 'rhydon' | 'nidoqueen' | 'nidoking'
  | 'mewtwo';

export type PokemonLine = 'bulbasaur' | 'squirtle' | 'charmander' | 'pikachu';

export interface PokemonStats {
  id: PokemonId;
  name: string;
  maxHp: number;
  maxMana: number;
  manaRegen: number;
  speed: number;
  pokemonLine?: PokemonLine; // Only for player Pokemon
}

export interface EvolutionChain {
  from: PokemonId;
  to: PokemonId;
  atNode: string; // Node ID where evolution happens
}

export const POKEMON_STATS: Record<PokemonId, PokemonStats> = {
  // Player Pokemon - Bulbasaur line
  bulbasaur: {
    id: 'bulbasaur',
    name: 'Bulbasaur',
    maxHp: 60,
    maxMana: 3,
    manaRegen: 3,
    speed: 45,
    pokemonLine: 'bulbasaur',
  },
  ivysaur: {
    id: 'ivysaur',
    name: 'Ivysaur',
    maxHp: 80,
    maxMana: 4,
    manaRegen: 4,
    speed: 60,
    pokemonLine: 'bulbasaur',
  },
  venusaur: {
    id: 'venusaur',
    name: 'Venusaur',
    maxHp: 100,
    maxMana: 5,
    manaRegen: 5,
    speed: 80,
    pokemonLine: 'bulbasaur',
  },
  // Player Pokemon - Squirtle line
  squirtle: {
    id: 'squirtle',
    name: 'Squirtle',
    maxHp: 70,
    maxMana: 3,
    manaRegen: 3,
    speed: 43,
    pokemonLine: 'squirtle',
  },
  wartortle: {
    id: 'wartortle',
    name: 'Wartortle',
    maxHp: 90,
    maxMana: 4,
    manaRegen: 4,
    speed: 58,
    pokemonLine: 'squirtle',
  },
  blastoise: {
    id: 'blastoise',
    name: 'Blastoise',
    maxHp: 110,
    maxMana: 5,
    manaRegen: 5,
    speed: 78,
    pokemonLine: 'squirtle',
  },
  // Player Pokemon - Charmander line
  charmander: {
    id: 'charmander',
    name: 'Charmander',
    maxHp: 55,
    maxMana: 3,
    manaRegen: 3,
    speed: 65,
    pokemonLine: 'charmander',
  },
  charmeleon: {
    id: 'charmeleon',
    name: 'Charmeleon',
    maxHp: 75,
    maxMana: 4,
    manaRegen: 4,
    speed: 80,
    pokemonLine: 'charmander',
  },
  charizard: {
    id: 'charizard',
    name: 'Charizard',
    maxHp: 95,
    maxMana: 5,
    manaRegen: 5,
    speed: 100,
    pokemonLine: 'charmander',
  },
  // Player Pokemon - Pikachu line
  pikachu: {
    id: 'pikachu',
    name: 'Pikachu',
    maxHp: 50,
    maxMana: 3,
    manaRegen: 3,
    speed: 90,
    pokemonLine: 'pikachu',
  },
  raichu: {
    id: 'raichu',
    name: 'Raichu',
    maxHp: 70,
    maxMana: 4,
    manaRegen: 4,
    speed: 110,
    pokemonLine: 'pikachu',
  },
  // Enemy Pokemon - Electric swarm
  magnemite: {
    id: 'magnemite',
    name: 'Magnemite',
    maxHp: 40,
    maxMana: 2,
    manaRegen: 2,
    speed: 45,
  },
  magneton: {
    id: 'magneton',
    name: 'Magneton',
    maxHp: 70,
    maxMana: 3,
    manaRegen: 3,
    speed: 70,
  },
  // Enemy Pokemon - Poison swarm
  zubat: {
    id: 'zubat',
    name: 'Zubat',
    maxHp: 35,
    maxMana: 2,
    manaRegen: 2,
    speed: 55,
  },
  grimer: {
    id: 'grimer',
    name: 'Grimer',
    maxHp: 50,
    maxMana: 2,
    manaRegen: 2,
    speed: 25,
  },
  muk: {
    id: 'muk',
    name: 'Muk',
    maxHp: 80,
    maxMana: 3,
    manaRegen: 3,
    speed: 50,
  },
  // Enemy Pokemon - Normal swarm
  rattata: {
    id: 'rattata',
    name: 'Rattata',
    maxHp: 30,
    maxMana: 2,
    manaRegen: 2,
    speed: 72,
  },
  raticate: {
    id: 'raticate',
    name: 'Raticate',
    maxHp: 65,
    maxMana: 3,
    manaRegen: 3,
    speed: 97,
  },
  // Enemy Pokemon - Giovanni
  persian: {
    id: 'persian',
    name: 'Persian',
    maxHp: 85,
    maxMana: 4,
    manaRegen: 4,
    speed: 115,
  },
  rhydon: {
    id: 'rhydon',
    name: 'Rhydon',
    maxHp: 120,
    maxMana: 3,
    manaRegen: 3,
    speed: 40,
  },
  nidoqueen: {
    id: 'nidoqueen',
    name: 'Nidoqueen',
    maxHp: 100,
    maxMana: 4,
    manaRegen: 4,
    speed: 76,
  },
  nidoking: {
    id: 'nidoking',
    name: 'Nidoking',
    maxHp: 95,
    maxMana: 4,
    manaRegen: 4,
    speed: 85,
  },
  // Enemy Pokemon - Mewtwo
  mewtwo: {
    id: 'mewtwo',
    name: 'Mewtwo',
    maxHp: 200,
    maxMana: 6,
    manaRegen: 6,
    speed: 130,
  },
};

export const EVOLUTION_CHAINS: EvolutionChain[] = [
  { from: 'bulbasaur', to: 'ivysaur', atNode: 'firstEvolution' },
  { from: 'ivysaur', to: 'venusaur', atNode: 'secondEvolution' },
  { from: 'squirtle', to: 'wartortle', atNode: 'firstEvolution' },
  { from: 'wartortle', to: 'blastoise', atNode: 'secondEvolution' },
  { from: 'charmander', to: 'charmeleon', atNode: 'firstEvolution' },
  { from: 'charmeleon', to: 'charizard', atNode: 'secondEvolution' },
  { from: 'pikachu', to: 'raichu', atNode: 'secondEvolution' },
];

export function getPokemonStats(id: PokemonId): PokemonStats {
  return POKEMON_STATS[id];
}

export function getEvolutionChain(pokemonLine: PokemonLine): EvolutionChain[] {
  return EVOLUTION_CHAINS.filter(chain => {
    const stats = POKEMON_STATS[chain.from];
    return stats.pokemonLine === pokemonLine;
  });
}
