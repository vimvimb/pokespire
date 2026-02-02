import type { PokemonLine, PokemonId } from './pokemon';

export type CardEffectType = 
  | 'damage'
  | 'heal'
  | 'block'
  | 'status'
  | 'buff';

export type StatusType = 'poison' | 'burn' | 'freeze' | 'paralyze';
export type BuffType = 'attackUp';

export interface DamageEffect {
  type: 'damage';
  amount: number;
  target: 'single' | 'all';
  side: 'enemy' | 'ally';
}

export interface HealEffect {
  type: 'heal';
  amount: number;
  target: 'single' | 'all';
}

export interface BlockEffect {
  type: 'block';
  amount: number;
  target: 'self' | 'all';
}

export interface StatusEffect {
  type: 'status';
  status: StatusType;
  stacks: number;
  target: 'single' | 'all';
  side: 'enemy' | 'ally';
}

export interface BuffEffect {
  type: 'buff';
  buff: BuffType;
  stacks: number;
  target: 'self' | 'all';
}

export type CardEffect = DamageEffect | HealEffect | BlockEffect | StatusEffect | BuffEffect;

export interface CardDefinition {
  id: string;
  name: string;
  cost: number;
  pokemonLine: PokemonLine;
  effect: CardEffect;
  description: string;
}

// Card definitions for each Pokemon line
// Evolution stages get upgraded versions (+2 damage per stage, etc.)

// Bulbasaur line cards
export const BULBASAUR_CARDS: CardDefinition[] = [
  {
    id: 'vine_whip_1',
    name: 'Vine Whip',
    cost: 1,
    pokemonLine: 'bulbasaur',
    effect: { type: 'damage', amount: 6, target: 'single', side: 'enemy' },
    description: 'Deal 6 damage to a single enemy.',
  },
  {
    id: 'defend_bulbasaur',
    name: 'Defend',
    cost: 1,
    pokemonLine: 'bulbasaur',
    effect: { type: 'block', amount: 5, target: 'self' },
    description: 'Gain 5 block.',
  },
  {
    id: 'poison_powder',
    name: 'Poison Powder',
    cost: 2,
    pokemonLine: 'bulbasaur',
    effect: { type: 'status', status: 'poison', stacks: 2, target: 'single', side: 'enemy' },
    description: 'Apply 2 stacks of poison to a single enemy.',
  },
  {
    id: 'heal',
    name: 'Heal',
    cost: 2,
    pokemonLine: 'bulbasaur',
    effect: { type: 'heal', amount: 10, target: 'single' },
    description: 'Heal 10 HP on a chosen ally.',
  },
];

export const IVYSAUR_CARDS: CardDefinition[] = [
  {
    id: 'vine_whip_2',
    name: 'Vine Whip',
    cost: 1,
    pokemonLine: 'bulbasaur',
    effect: { type: 'damage', amount: 8, target: 'single', side: 'enemy' },
    description: 'Deal 8 damage to a single enemy.',
  },
  {
    id: 'defend_ivysaur',
    name: 'Defend',
    cost: 1,
    pokemonLine: 'bulbasaur',
    effect: { type: 'block', amount: 5, target: 'self' },
    description: 'Gain 5 block.',
  },
  {
    id: 'poison_powder_2',
    name: 'Poison Powder',
    cost: 2,
    pokemonLine: 'bulbasaur',
    effect: { type: 'status', status: 'poison', stacks: 2, target: 'single', side: 'enemy' },
    description: 'Apply 2 stacks of poison to a single enemy.',
  },
  {
    id: 'heal_2',
    name: 'Heal',
    cost: 2,
    pokemonLine: 'bulbasaur',
    effect: { type: 'heal', amount: 10, target: 'single' },
    description: 'Heal 10 HP on a chosen ally.',
  },
];

export const VENUSAUR_CARDS: CardDefinition[] = [
  {
    id: 'vine_whip_3',
    name: 'Vine Whip',
    cost: 1,
    pokemonLine: 'bulbasaur',
    effect: { type: 'damage', amount: 10, target: 'single', side: 'enemy' },
    description: 'Deal 10 damage to a single enemy.',
  },
  {
    id: 'defend_venusaur',
    name: 'Defend',
    cost: 1,
    pokemonLine: 'bulbasaur',
    effect: { type: 'block', amount: 5, target: 'self' },
    description: 'Gain 5 block.',
  },
  {
    id: 'poison_powder_3',
    name: 'Poison Powder',
    cost: 2,
    pokemonLine: 'bulbasaur',
    effect: { type: 'status', status: 'poison', stacks: 2, target: 'single', side: 'enemy' },
    description: 'Apply 2 stacks of poison to a single enemy.',
  },
  {
    id: 'heal_3',
    name: 'Heal',
    cost: 2,
    pokemonLine: 'bulbasaur',
    effect: { type: 'heal', amount: 10, target: 'single' },
    description: 'Heal 10 HP on a chosen ally.',
  },
];

// Squirtle line cards
export const SQUIRTLE_CARDS: CardDefinition[] = [
  {
    id: 'water_gun_1',
    name: 'Water Gun',
    cost: 1,
    pokemonLine: 'squirtle',
    effect: { type: 'damage', amount: 6, target: 'single', side: 'enemy' },
    description: 'Deal 6 damage to a single enemy.',
  },
  {
    id: 'shell_guard',
    name: 'Shell Guard',
    cost: 1,
    pokemonLine: 'squirtle',
    effect: { type: 'block', amount: 5, target: 'self' },
    description: 'Gain 5 block.',
  },
  {
    id: 'wide_guard',
    name: 'Wide Guard',
    cost: 2,
    pokemonLine: 'squirtle',
    effect: { type: 'block', amount: 5, target: 'all' },
    description: 'Give 5 block to all allies.',
  },
  {
    id: 'ice_beam_1',
    name: 'Ice Beam',
    cost: 2,
    pokemonLine: 'squirtle',
    effect: { type: 'status', status: 'freeze', stacks: 2, target: 'single', side: 'enemy' },
    description: 'Apply 2 stacks of freeze to a single enemy.',
  },
];

export const WARTORTLE_CARDS: CardDefinition[] = [
  {
    id: 'water_gun_2',
    name: 'Water Gun',
    cost: 1,
    pokemonLine: 'squirtle',
    effect: { type: 'damage', amount: 8, target: 'single', side: 'enemy' },
    description: 'Deal 8 damage to a single enemy.',
  },
  {
    id: 'shell_guard_2',
    name: 'Shell Guard',
    cost: 1,
    pokemonLine: 'squirtle',
    effect: { type: 'block', amount: 5, target: 'self' },
    description: 'Gain 5 block.',
  },
  {
    id: 'wide_guard_2',
    name: 'Wide Guard',
    cost: 2,
    pokemonLine: 'squirtle',
    effect: { type: 'block', amount: 5, target: 'all' },
    description: 'Give 5 block to all allies.',
  },
  {
    id: 'ice_beam_2',
    name: 'Ice Beam',
    cost: 2,
    pokemonLine: 'squirtle',
    effect: { type: 'status', status: 'freeze', stacks: 2, target: 'single', side: 'enemy' },
    description: 'Apply 2 stacks of freeze to a single enemy.',
  },
];

export const BLASTOISE_CARDS: CardDefinition[] = [
  {
    id: 'water_gun_3',
    name: 'Water Gun',
    cost: 1,
    pokemonLine: 'squirtle',
    effect: { type: 'damage', amount: 10, target: 'single', side: 'enemy' },
    description: 'Deal 10 damage to a single enemy.',
  },
  {
    id: 'shell_guard_3',
    name: 'Shell Guard',
    cost: 1,
    pokemonLine: 'squirtle',
    effect: { type: 'block', amount: 5, target: 'self' },
    description: 'Gain 5 block.',
  },
  {
    id: 'wide_guard_3',
    name: 'Wide Guard',
    cost: 2,
    pokemonLine: 'squirtle',
    effect: { type: 'block', amount: 5, target: 'all' },
    description: 'Give 5 block to all allies.',
  },
  {
    id: 'ice_beam_3',
    name: 'Ice Beam',
    cost: 2,
    pokemonLine: 'squirtle',
    effect: { type: 'status', status: 'freeze', stacks: 2, target: 'single', side: 'enemy' },
    description: 'Apply 2 stacks of freeze to a single enemy.',
  },
];

// Charmander line cards
export const CHARMANDER_CARDS: CardDefinition[] = [
  {
    id: 'ember_1',
    name: 'Ember',
    cost: 1,
    pokemonLine: 'charmander',
    effect: { type: 'damage', amount: 6, target: 'single', side: 'enemy' },
    description: 'Deal 6 damage to a single enemy.',
  },
  {
    id: 'defend_charmander',
    name: 'Defend',
    cost: 1,
    pokemonLine: 'charmander',
    effect: { type: 'block', amount: 5, target: 'self' },
    description: 'Gain 5 block.',
  },
  {
    id: 'burn_1',
    name: 'Burn',
    cost: 2,
    pokemonLine: 'charmander',
    effect: { type: 'status', status: 'burn', stacks: 2, target: 'single', side: 'enemy' },
    description: 'Apply 2 stacks of burn to a single enemy.',
  },
  {
    id: 'flamethrower_1',
    name: 'Flamethrower',
    cost: 2,
    pokemonLine: 'charmander',
    effect: { type: 'damage', amount: 6, target: 'all', side: 'enemy' },
    description: 'Deal 6 damage to all enemies.',
  },
];

export const CHARMELEON_CARDS: CardDefinition[] = [
  {
    id: 'ember_2',
    name: 'Ember',
    cost: 1,
    pokemonLine: 'charmander',
    effect: { type: 'damage', amount: 8, target: 'single', side: 'enemy' },
    description: 'Deal 8 damage to a single enemy.',
  },
  {
    id: 'defend_charmeleon',
    name: 'Defend',
    cost: 1,
    pokemonLine: 'charmander',
    effect: { type: 'block', amount: 5, target: 'self' },
    description: 'Gain 5 block.',
  },
  {
    id: 'burn_2',
    name: 'Burn',
    cost: 2,
    pokemonLine: 'charmander',
    effect: { type: 'status', status: 'burn', stacks: 2, target: 'single', side: 'enemy' },
    description: 'Apply 2 stacks of burn to a single enemy.',
  },
  {
    id: 'flamethrower_2',
    name: 'Flamethrower',
    cost: 2,
    pokemonLine: 'charmander',
    effect: { type: 'damage', amount: 8, target: 'all', side: 'enemy' },
    description: 'Deal 8 damage to all enemies.',
  },
];

export const CHARIZARD_CARDS: CardDefinition[] = [
  {
    id: 'ember_3',
    name: 'Ember',
    cost: 1,
    pokemonLine: 'charmander',
    effect: { type: 'damage', amount: 10, target: 'single', side: 'enemy' },
    description: 'Deal 10 damage to a single enemy.',
  },
  {
    id: 'defend_charizard',
    name: 'Defend',
    cost: 1,
    pokemonLine: 'charmander',
    effect: { type: 'block', amount: 5, target: 'self' },
    description: 'Gain 5 block.',
  },
  {
    id: 'burn_3',
    name: 'Burn',
    cost: 2,
    pokemonLine: 'charmander',
    effect: { type: 'status', status: 'burn', stacks: 2, target: 'single', side: 'enemy' },
    description: 'Apply 2 stacks of burn to a single enemy.',
  },
  {
    id: 'flamethrower_3',
    name: 'Flamethrower',
    cost: 2,
    pokemonLine: 'charmander',
    effect: { type: 'damage', amount: 10, target: 'all', side: 'enemy' },
    description: 'Deal 10 damage to all enemies.',
  },
];

// Pikachu line cards
export const PIKACHU_CARDS: CardDefinition[] = [
  {
    id: 'thundershock_1',
    name: 'Thundershock',
    cost: 1,
    pokemonLine: 'pikachu',
    effect: { type: 'damage', amount: 6, target: 'single', side: 'enemy' },
    description: 'Deal 6 damage to a single enemy.',
  },
  {
    id: 'defend_pikachu',
    name: 'Defend',
    cost: 1,
    pokemonLine: 'pikachu',
    effect: { type: 'block', amount: 5, target: 'self' },
    description: 'Gain 5 block.',
  },
  {
    id: 'thunder_wave',
    name: 'Thunder Wave',
    cost: 2,
    pokemonLine: 'pikachu',
    effect: { type: 'status', status: 'paralyze', stacks: 2, target: 'single', side: 'enemy' },
    description: 'Apply 2 stacks of paralyze to a single enemy.',
  },
  {
    id: 'thunderbolt_1',
    name: 'Thunderbolt',
    cost: 2,
    pokemonLine: 'pikachu',
    effect: { type: 'damage', amount: 10, target: 'single', side: 'enemy' },
    description: 'Deal 10 damage to a single enemy.',
  },
];

export const RAICHU_CARDS: CardDefinition[] = [
  {
    id: 'thundershock_2',
    name: 'Thundershock',
    cost: 1,
    pokemonLine: 'pikachu',
    effect: { type: 'damage', amount: 8, target: 'single', side: 'enemy' },
    description: 'Deal 8 damage to a single enemy.',
  },
  {
    id: 'defend_raichu',
    name: 'Defend',
    cost: 1,
    pokemonLine: 'pikachu',
    effect: { type: 'block', amount: 5, target: 'self' },
    description: 'Gain 5 block.',
  },
  {
    id: 'thunder_wave_2',
    name: 'Thunder Wave',
    cost: 2,
    pokemonLine: 'pikachu',
    effect: { type: 'status', status: 'paralyze', stacks: 2, target: 'single', side: 'enemy' },
    description: 'Apply 2 stacks of paralyze to a single enemy.',
  },
  {
    id: 'thunderbolt_2',
    name: 'Thunderbolt',
    cost: 2,
    pokemonLine: 'pikachu',
    effect: { type: 'damage', amount: 12, target: 'single', side: 'enemy' },
    description: 'Deal 12 damage to a single enemy.',
  },
];

// Starter deck compositions (10 cards each)
export function getStarterDeck(pokemonId: PokemonId): string[] {
  const decks: Record<PokemonId, string[]> = {
    bulbasaur: [
      'vine_whip_1', 'vine_whip_1', 'vine_whip_1', 'vine_whip_1',
      'defend_bulbasaur', 'defend_bulbasaur', 'defend_bulbasaur',
      'poison_powder', 'poison_powder',
      'heal',
    ],
    ivysaur: [
      'vine_whip_2', 'vine_whip_2', 'vine_whip_2', 'vine_whip_2',
      'defend_ivysaur', 'defend_ivysaur', 'defend_ivysaur',
      'poison_powder_2', 'poison_powder_2',
      'heal_2',
    ],
    venusaur: [
      'vine_whip_3', 'vine_whip_3', 'vine_whip_3', 'vine_whip_3',
      'defend_venusaur', 'defend_venusaur', 'defend_venusaur',
      'poison_powder_3', 'poison_powder_3',
      'heal_3',
    ],
    squirtle: [
      'water_gun_1', 'water_gun_1', 'water_gun_1', 'water_gun_1',
      'shell_guard', 'shell_guard',
      'wide_guard', 'wide_guard',
      'ice_beam_1', 'ice_beam_1',
    ],
    wartortle: [
      'water_gun_2', 'water_gun_2', 'water_gun_2', 'water_gun_2',
      'shell_guard_2', 'shell_guard_2',
      'wide_guard_2', 'wide_guard_2',
      'ice_beam_2', 'ice_beam_2',
    ],
    blastoise: [
      'water_gun_3', 'water_gun_3', 'water_gun_3', 'water_gun_3',
      'shell_guard_3', 'shell_guard_3',
      'wide_guard_3', 'wide_guard_3',
      'ice_beam_3', 'ice_beam_3',
    ],
    charmander: [
      'ember_1', 'ember_1', 'ember_1', 'ember_1',
      'defend_charmander', 'defend_charmander', 'defend_charmander',
      'burn_1', 'burn_1',
      'flamethrower_1',
    ],
    charmeleon: [
      'ember_2', 'ember_2', 'ember_2', 'ember_2',
      'defend_charmeleon', 'defend_charmeleon', 'defend_charmeleon',
      'burn_2', 'burn_2',
      'flamethrower_2',
    ],
    charizard: [
      'ember_3', 'ember_3', 'ember_3', 'ember_3',
      'defend_charizard', 'defend_charizard', 'defend_charizard',
      'burn_3', 'burn_3',
      'flamethrower_3',
    ],
    pikachu: [
      'thundershock_1', 'thundershock_1', 'thundershock_1', 'thundershock_1',
      'defend_pikachu', 'defend_pikachu', 'defend_pikachu',
      'thunder_wave', 'thunder_wave',
      'thunderbolt_1',
    ],
    raichu: [
      'thundershock_2', 'thundershock_2', 'thundershock_2', 'thundershock_2',
      'defend_raichu', 'defend_raichu', 'defend_raichu',
      'thunder_wave_2', 'thunder_wave_2',
      'thunderbolt_2',
    ],
    // Enemy Pokemon decks (simple for prototype)
    magnemite: ['thundershock_1', 'thundershock_1', 'thundershock_1', 'defend_pikachu', 'defend_pikachu'],
    magneton: ['thunderbolt_1', 'thunderbolt_1', 'thunder_wave', 'defend_pikachu', 'defend_pikachu'],
    zubat: ['thundershock_1', 'thundershock_1', 'defend_pikachu'],
    grimer: ['poison_powder', 'poison_powder', 'defend_bulbasaur'],
    muk: ['poison_powder', 'poison_powder', 'poison_powder', 'defend_bulbasaur', 'defend_bulbasaur'],
    rattata: ['thundershock_1', 'thundershock_1', 'defend_pikachu'],
    raticate: ['thunderbolt_1', 'thunderbolt_1', 'defend_pikachu', 'defend_pikachu'],
    persian: ['thunderbolt_1', 'thunderbolt_1', 'thunderbolt_1', 'defend_pikachu', 'defend_pikachu'],
    rhydon: ['thunderbolt_1', 'thunderbolt_1', 'defend_pikachu', 'defend_pikachu', 'defend_pikachu'],
    nidoqueen: ['poison_powder', 'poison_powder', 'poison_powder', 'defend_bulbasaur', 'defend_bulbasaur'],
    nidoking: ['poison_powder', 'poison_powder', 'thunderbolt_1', 'defend_pikachu', 'defend_pikachu'],
    mewtwo: ['thunderbolt_1', 'thunderbolt_1', 'thunderbolt_1', 'flamethrower_1', 'flamethrower_1', 'defend_pikachu'],
  };
  return decks[pokemonId] || [];
}

// Get all card definitions
export const ALL_CARDS: CardDefinition[] = [
  ...BULBASAUR_CARDS,
  ...IVYSAUR_CARDS,
  ...VENUSAUR_CARDS,
  ...SQUIRTLE_CARDS,
  ...WARTORTLE_CARDS,
  ...BLASTOISE_CARDS,
  ...CHARMANDER_CARDS,
  ...CHARMELEON_CARDS,
  ...CHARIZARD_CARDS,
  ...PIKACHU_CARDS,
  ...RAICHU_CARDS,
];

export function getCardDefinition(cardId: string): CardDefinition | undefined {
  return ALL_CARDS.find(card => card.id === cardId);
}
