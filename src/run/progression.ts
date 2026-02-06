/**
 * Progression System - Defines level-up trees for each Pokemon
 */

// Passive ability IDs
export type PassiveId =
  | 'none'
  | 'kindling'
  | 'spreading_flames'
  | 'blaze_strike'
  | 'inferno_momentum'
  | 'baby_shell'
  | 'pressure_hull'
  | 'fortified_cannons'
  | 'bastion_barrage'
  | 'baby_vines'
  | 'spreading_spores'
  | 'overgrow'
  | 'blooming_cycle'
  | 'numbing_strike'
  | 'static_field'
  | 'counter_current';

// A single rung in the progression ladder
export interface ProgressionRung {
  level: number;              // 1, 2, 3, or 4
  name: string;               // Display name for the rung
  description: string;        // What this rung grants
  evolvesTo?: string;         // New form ID (if evolution)
  hpBoost: number;            // Max HP increase
  passiveId: PassiveId;       // New passive (replaces previous)
  cardsToAdd: string[];       // Card IDs to add to deck
}

// Full progression tree for a Pokemon species
export interface ProgressionTree {
  baseFormId: string;         // Starting form (e.g., "charmander")
  rungs: ProgressionRung[];   // All 4 rungs (including base at level 1)
}

// Passive definitions with descriptions
export const PASSIVE_DEFINITIONS: Record<PassiveId, { name: string; description: string }> = {
  none: {
    name: 'None',
    description: 'No passive ability.',
  },
  kindling: {
    name: 'Kindling',
    description: 'Unblocked Fire attacks you play apply +1 Burn stack.',
  },
  spreading_flames: {
    name: 'Spreading Flames',
    description: 'Whenever you apply Burn to an enemy, apply 1 Burn to adjacent enemies.',
  },
  blaze_strike: {
    name: 'Blaze Strike',
    description: 'The first Fire attack you play each turn deals double damage.',
  },
  inferno_momentum: {
    name: 'Inferno Momentum',
    description: 'At the start of your turn, reduce the cost of your highest-cost card in hand by 3 (min 0).',
  },
  baby_shell: {
    name: 'Baby Shell',
    description: 'At the start of your turn, gain 3 Block.',
  },
  pressure_hull: {
    name: 'Pressure Hull',
    description: 'At the end of your turn, retain 50% of your Block.',
  },
  fortified_cannons: {
    name: 'Fortified Cannons',
    description: 'When you deal damage with a Water attack, gain Block equal to half the damage dealt.',
  },
  bastion_barrage: {
    name: 'Bastion Barrage',
    description: 'Your Water attacks deal bonus damage equal to 25% of your current Block.',
  },
  baby_vines: {
    name: 'Baby Vines',
    description: 'Unblocked Grass attacks apply +1 Leech stack.',
  },
  spreading_spores: {
    name: 'Spreading Spores',
    description: 'When applying Leech, also apply 1 Leech to an adjacent enemy.',
  },
  overgrow: {
    name: 'Overgrow',
    description: 'Baby Vines now applies +2 Leech instead of +1.',
  },
  blooming_cycle: {
    name: 'Blooming Cycle',
    description: 'Enemies with Leech deal reduced damage (floor(stacks/2)).',
  },
  numbing_strike: {
    name: 'Numbing Strike',
    description: 'Unblocked Electric attacks apply +1 Paralysis.',
  },
  static_field: {
    name: 'Static Field',
    description: 'Take reduced damage from slower enemies (floor((yourSpeed - theirSpeed) / 2)).',
  },
  counter_current: {
    name: 'Counter-Current',
    description: 'Deal bonus damage to slower enemies (floor((yourSpeed - theirSpeed) / 2)).',
  },
};

// Charmander progression tree
export const CHARMANDER_PROGRESSION: ProgressionTree = {
  baseFormId: 'charmander',
  rungs: [
    {
      level: 1,
      name: 'Charmander',
      description: 'Starting form with Kindling passive.',
      passiveId: 'kindling',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 2,
      name: 'Charmeleon',
      description: 'Evolve to Charmeleon (+10 HP). Add Flamethrower. Gain Spreading Flames.',
      evolvesTo: 'charmeleon',
      passiveId: 'spreading_flames',
      hpBoost: 0,  // HP increase comes from Charmeleon's base stats
      cardsToAdd: ['flamethrower'],
    },
    {
      level: 3,
      name: 'Charizard',
      description: 'Evolve to Charizard (+10 HP). Add Fire Blast. Gain Blaze Strike.',
      evolvesTo: 'charizard',
      passiveId: 'blaze_strike',
      hpBoost: 0,  // HP increase comes from Charizard's base stats
      cardsToAdd: ['fire-blast'],
    },
    {
      level: 4,
      name: 'Charizard (Mastered)',
      description: 'Gain Inferno Momentum.',
      passiveId: 'inferno_momentum',
      hpBoost: 0,
      cardsToAdd: [],
    },
  ],
};

// Bulbasaur progression tree - leech-based sustain theme
export const BULBASAUR_PROGRESSION: ProgressionTree = {
  baseFormId: 'bulbasaur',
  rungs: [
    {
      level: 1,
      name: 'Bulbasaur',
      description: 'Starting form with Baby Vines passive.',
      passiveId: 'baby_vines',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 2,
      name: 'Ivysaur',
      description: 'Evolve to Ivysaur (+10 HP). Add 2x Razor Leaf. Gain Spreading Spores.',
      evolvesTo: 'ivysaur',
      passiveId: 'spreading_spores',
      hpBoost: 0,  // HP increase comes from Ivysaur's base stats
      cardsToAdd: ['razor-leaf', 'razor-leaf'],
    },
    {
      level: 3,
      name: 'Venusaur',
      description: 'Evolve to Venusaur (+10 HP). Add Solar Beam. Gain Overgrow.',
      evolvesTo: 'venusaur',
      passiveId: 'overgrow',
      hpBoost: 0,  // HP increase comes from Venusaur's base stats
      cardsToAdd: ['solar-beam'],
    },
    {
      level: 4,
      name: 'Venusaur (Mastered)',
      description: 'Gain Blooming Cycle.',
      passiveId: 'blooming_cycle',
      hpBoost: 0,
      cardsToAdd: [],
    },
  ],
};

// Squirtle progression tree - defensive/water-based theme
export const SQUIRTLE_PROGRESSION: ProgressionTree = {
  baseFormId: 'squirtle',
  rungs: [
    {
      level: 1,
      name: 'Squirtle',
      description: 'Starting form with Baby Shell passive.',
      passiveId: 'baby_shell',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 2,
      name: 'Wartortle',
      description: 'Evolve to Wartortle (+10 HP). Add Bubble Beam. Gain Pressure Hull.',
      evolvesTo: 'wartortle',
      passiveId: 'pressure_hull',
      hpBoost: 0,  // HP increase comes from Wartortle's base stats
      cardsToAdd: ['bubble-beam'],
    },
    {
      level: 3,
      name: 'Blastoise',
      description: 'Evolve to Blastoise (+10 HP). Add Hydro Pump. Gain Fortified Cannons.',
      evolvesTo: 'blastoise',
      passiveId: 'fortified_cannons',
      hpBoost: 0,  // HP increase comes from Blastoise's base stats
      cardsToAdd: ['hydro-pump'],
    },
    {
      level: 4,
      name: 'Blastoise (Mastered)',
      description: 'Gain Bastion Barrage.',
      passiveId: 'bastion_barrage',
      hpBoost: 0,
      cardsToAdd: [],
    },
  ],
};

// Pikachu progression tree - speed/paralysis theme with Raichu evolution tradeoff
export const PIKACHU_PROGRESSION: ProgressionTree = {
  baseFormId: 'pikachu',
  rungs: [
    {
      level: 1,
      name: 'Pikachu',
      description: 'Starting form with Numbing Strike passive.',
      passiveId: 'numbing_strike',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 2,
      name: 'Pikachu',
      description: 'Gain Static Field.',
      passiveId: 'static_field',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 3,
      name: 'Pikachu',
      description: 'Gain Counter-Current.',
      passiveId: 'counter_current',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 4,
      name: 'Raichu',
      description: 'Evolve to Raichu (+20 HP, -2 Speed). Add Body Slam, Mega Punch, Thunder.',
      evolvesTo: 'raichu',
      passiveId: 'none',  // No new passive, retains all previous
      hpBoost: 0,  // HP increase comes from Raichu's base stats
      cardsToAdd: ['body-slam', 'mega-punch', 'thunder'],
    },
  ],
};

// All progression trees indexed by base form ID
export const PROGRESSION_TREES: Record<string, ProgressionTree> = {
  charmander: CHARMANDER_PROGRESSION,
  bulbasaur: BULBASAUR_PROGRESSION,
  squirtle: SQUIRTLE_PROGRESSION,
  pikachu: PIKACHU_PROGRESSION,
};

/**
 * Get the progression tree for a Pokemon.
 * Returns the tree based on the base form (handles evolved forms too).
 */
export function getProgressionTree(pokemonId: string): ProgressionTree | null {
  // Direct match
  if (PROGRESSION_TREES[pokemonId]) {
    return PROGRESSION_TREES[pokemonId];
  }
  // Check if this is an evolved form
  if (pokemonId === 'charmeleon' || pokemonId === 'charizard') {
    return CHARMANDER_PROGRESSION;
  }
  if (pokemonId === 'wartortle' || pokemonId === 'blastoise') {
    return SQUIRTLE_PROGRESSION;
  }
  if (pokemonId === 'ivysaur' || pokemonId === 'venusaur') {
    return BULBASAUR_PROGRESSION;
  }
  if (pokemonId === 'raichu') {
    return PIKACHU_PROGRESSION;
  }
  return null;
}

/**
 * Get the base form ID for any form in a progression line.
 */
export function getBaseFormId(pokemonId: string): string {
  if (pokemonId === 'charmeleon' || pokemonId === 'charizard') {
    return 'charmander';
  }
  if (pokemonId === 'wartortle' || pokemonId === 'blastoise') {
    return 'squirtle';
  }
  if (pokemonId === 'ivysaur' || pokemonId === 'venusaur') {
    return 'bulbasaur';
  }
  if (pokemonId === 'raichu') {
    return 'pikachu';
  }
  return pokemonId;
}

/**
 * Get the rung for a specific level.
 */
export function getRungForLevel(tree: ProgressionTree, level: number): ProgressionRung | null {
  return tree.rungs.find(r => r.level === level) ?? null;
}

/**
 * Check if a Pokemon can level up (has enough EXP).
 * Requires 2 EXP per level up.
 */
export function canLevelUp(level: number, exp: number): boolean {
  // Max level is 4
  if (level >= 4) return false;
  // Need at least 2 EXP to level up
  return exp >= 2;
}
