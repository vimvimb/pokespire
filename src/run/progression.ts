/**
 * Progression System - Defines level-up trees for each Pokemon
 */

// Passive ability IDs
export type PassiveId =
  | 'none'
  // Charmander line
  | 'kindling'
  | 'spreading_flames'
  | 'blaze_strike'
  | 'inferno_momentum'
  // Squirtle line
  | 'baby_shell'
  | 'pressure_hull'
  | 'torrent_shield'
  | 'fortified_cannons'
  // Bulbasaur line
  | 'baby_vines'
  | 'spreading_spores'
  | 'overgrow_heal'
  | 'blooming_cycle'
  // Pikachu line
  | 'numbing_strike'
  | 'static_field'
  | 'counter_current'
  // Pidgey line
  | 'gust_force'
  | 'keen_eye'
  | 'whipping_winds'
  | 'slipstream'
  // Rattata line
  | 'scurry'
  | 'quick_feet'
  | 'relentless'
  | 'proletariat'
  | 'hustle'
  // Ekans line
  | 'shed_skin'
  | 'poison_point'
  | 'intimidate'
  | 'predators_patience'
  // Tauros
  | 'thick_hide'
  | 'anger_point'
  | 'raging_bull'
  // Snorlax
  | 'thick_fat'
  | 'immunity'
  | 'leftovers'
  | 'power_nap'
  // Kangaskhan
  | 'scrappy'
  | 'parental_bond'
  | 'protective_instinct'
  | 'family_fury'
  // Meowth/Persian line (shared with Giovanni boss)
  | 'technician'
  // Nidoking line - "Rampage"
  | 'poison_point'  // Already exists for Ekans, shared with Nido lines
  // anger_point shared with Tauros
  | 'toxic_horn'
  | 'sheer_force'
  // Nidoqueen line - "Matriarch"
  // poison_point shared
  // thick_hide shared with Tauros
  | 'protective_toxins'
  // sheer_force shared
  // Rhyhorn/Rhydon line
  // thick_hide shared
  | 'rock_head'
  | 'lightning_rod'
  | 'reckless'
  // Drowzee/Hypno line
  | 'insomnia'
  | 'drowsy_aura'
  | 'inner_focus'
  | 'hypnotic_gaze'
  // Growlithe/Arcanine line
  | 'flash_fire'
  | 'flame_body'
  | 'impact_guard'
  // Charmander line (new)
  | 'consuming_flame'
  // Voltorb/Electrode line
  | 'static'
  | 'charge'
  | 'volatile'
  | 'final_spark'
  // Caterpie/Butterfree line
  | 'shield_dust'
  | 'compound_eyes'
  | 'powder_spread'
  | 'tinted_lens'
  | 'resonance'
  | 'pollinate'
  // Weedle/Beedrill line
  | 'poison_barb'
  | 'adaptability'
  | 'swarm_strike'
  // Magikarp/Gyarados line
  | 'great_leap'
  | 'moxie'
  | 'tyrants_tantrum'
  // Lapras
  | 'water_absorb'
  | 'shell_armor'
  | 'fortifying_aria'
  // Magmar & Electabuzz (shared)
  | 'vital_spirit'
  | 'searing_fury'
  | 'volt_fury'
  | 'surge_momentum'
  // Dratini/Dragonair/Dragonite line
  | 'multiscale'
  | 'dragons_majesty'
  // Spearow/Fearow line
  | 'sharp_beak'
  | 'sniper'
  // Sandshrew/Sandslash line
  | 'spiked_hide'
  | 'bristling_rampart'
  | 'fortified_spines'
  // Gastly/Gengar line
  | 'intangible'
  | 'counter_stance'
  | 'phase_form'
  | 'night_assassin'
  // Clefairy/Clefable line
  | 'lucky_star'
  | 'cute_charm'
  | 'friend_guard'
  | 'magic_guard'
  // Machop/Machoke/Machamp line
  | 'guts'
  | 'no_guard'
  | 'rapid_strike'
  | 'finisher'
  // Vulpix/Ninetales line
  | 'mysticism'
  | 'malice'
  | 'hex_mastery'
  // Oddish/Gloom/Vileplume line
  | 'effect_spore'
  | 'stench'
  | 'luna'
  | 'verdant_drain'
  // Meowth/Persian line (player)
  | 'pickup'
  | 'limber'
  // 'technician' already defined under Persian (Giovanni)
  | 'aristocrat'
  // Jigglypuff/Wigglytuff line
  // cute_charm shared with Clefairy line
  // friend_guard shared with Clefairy line
  | 'lullaby'
  | 'rude_awakening'
  // Paras/Parasect line
  // effect_spore shared with Oddish line
  | 'blind_aggression'
  | 'dry_skin'
  | 'spore_mastery'
  // Zubat/Golbat/Crobat line
  // inner_focus shared with Drowzee line
  // static_field shared with Pikachu line (renamed to Swift Guard)
  | 'vampiricism'
  | 'zephyr_king'
  // Porygon line
  | 'download'
  | 'data_transfer'
  | 'overclock'
  | 'upload';

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
    description: 'The first Fire attack you play each turn deals 30% more damage.',
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
  torrent_shield: {
    name: 'Torrent Shield',
    description: 'Your first Water attack each turn grants Block equal to the damage dealt.',
  },
  fortified_cannons: {
    name: 'Fortified Cannons',
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
  overgrow_heal: {
    name: 'Overgrow Heal',
    description: 'The first Grass attack you play each turn heals you equal to damage dealt.',
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
    name: 'Swift Guard',
    description: 'Your speed advantage over attackers reduces their damage to you.',
  },
  counter_current: {
    name: 'Counter-Current',
    description: 'Your speed advantage over a target increases your damage to them.',
  },
  // Pidgey line
  gust_force: {
    name: 'Gust Force',
    description: 'Gust applies +1 Slow.',
  },
  keen_eye: {
    name: 'Keen Eye',
    description: 'Enemies with Slow take +1 damage from your attacks.',
  },
  whipping_winds: {
    name: 'Whipping Winds',
    description: 'Your row-targeting attacks hit ALL enemies instead.',
  },
  slipstream: {
    name: 'Slipstream',
    description: 'When you use Gust, allies act immediately after you.',
  },
  // Rattata line
  scurry: {
    name: 'Scurry',
    description: 'Gain 2 Haste at the start of combat.',
  },
  quick_feet: {
    name: 'Quick Feet',
    description: 'Your first attack each turn costs 1 less.',
  },
  relentless: {
    name: 'Relentless',
    description: 'Each card you play this turn gives your next attack +1 damage.',
  },
  proletariat: {
    name: 'Proletariat',
    description: 'Basic or Common rarity cards that cost 1 deal +2 damage.',
  },
  hustle: {
    name: 'Hustle',
    description: 'Draw an extra card at start of turn. Your attacks deal +3 damage but cost +1.',
  },
  // Ekans line
  shed_skin: {
    name: 'Shed Skin',
    description: 'At end of turn, remove 1 stack from all debuffs.',
  },
  poison_point: {
    name: 'Poison Point',
    description: 'Unblocked Poison attacks apply +1 Poison.',
  },
  intimidate: {
    name: 'Intimidate',
    description: 'Start of combat: apply Enfeeble 2 to all enemies.',
  },
  predators_patience: {
    name: "Predator's Patience",
    description: 'Enemies with Poison take +2 damage from your attacks.',
  },
  // Tauros (shared with Nido lines)
  thick_hide: {
    name: 'Thick Hide',
    description: 'Take 1 less damage from all attacks.',
  },
  anger_point: {
    name: 'Anger Point',
    description: 'Your attacks deal +50% damage when below 50% HP.',
  },
  raging_bull: {
    name: 'Raging Bull',
    description: 'When you take unblocked damage, gain 4 Strength.',
  },
  // Snorlax
  thick_fat: {
    name: 'Thick Fat',
    description: 'Take 25% less damage from Fire and Ice attacks.',
  },
  immunity: {
    name: 'Immunity',
    description: 'You cannot be Poisoned.',
  },
  leftovers: {
    name: 'Leftovers',
    description: 'At the end of your turn, heal 4 HP.',
  },
  power_nap: {
    name: 'Power Nap',
    description: 'When you play Rest, also gain 3 Strength for 2 turns.',
  },
  // Kangaskhan
  scrappy: {
    name: 'Scrappy',
    description: 'Your Normal attacks deal +2 damage.',
  },
  parental_bond: {
    name: 'Parental Bond',
    description: 'The first attack each turn triggers twice (second hit deals 50% damage).',
  },
  protective_instinct: {
    name: 'Protective Instinct',
    description: 'When an ally takes damage, gain 3 Block.',
  },
  family_fury: {
    name: 'Family Fury',
    description: 'When below 50% HP, ALL your attacks trigger Parental Bond.',
  },
  // Meowth/Persian line
  pickup: {
    name: 'Pickup',
    description: 'Earn 25% more gold from battles.',
  },
  limber: {
    name: 'Limber',
    description: 'You cannot be Paralyzed.',
  },
  technician: {
    name: 'Technician',
    description: 'Your 1-cost cards deal 30% more damage.',
  },
  aristocrat: {
    name: 'Aristocrat',
    description: 'Your Epic rarity cards deal 30% more damage.',
  },
  // Nidoking line - "Rampage"
  // anger_point shared with Tauros (L2)
  toxic_horn: {
    name: 'Toxic Horn',
    description: 'When attacking poisoned enemies, gain Strength equal to total damage dealt / 4.',
  },
  sheer_force: {
    name: 'Sheer Force',
    description: 'Your attacks deal 30% more damage. Your moves cannot apply status effects.',
  },
  // Nidoqueen line - "Matriarch"
  // thick_hide shared with Tauros (L2)
  protective_toxins: {
    name: 'Protective Toxins',
    description: 'When attacking poisoned enemies, all allies gain Block equal to half the damage dealt.',
  },
  // Rhyhorn/Rhydon line
  rock_head: {
    name: 'Rock Head',
    description: 'You take no recoil damage from your attacks.',
  },
  lightning_rod: {
    name: 'Lightning Rod',
    description: 'Electric attacks targeting allies hit you instead.',
  },
  reckless: {
    name: 'Reckless',
    description: 'Your recoil moves deal 30% more damage.',
  },
  // Drowzee/Hypno line
  insomnia: {
    name: 'Insomnia',
    description: 'You are immune to Sleep.',
  },
  drowsy_aura: {
    name: 'Drowsy Aura',
    description: 'When you apply Sleep, also apply Enfeeble 1.',
  },
  inner_focus: {
    name: 'Inner Focus',
    description: 'You are immune to Enfeeble.',
  },
  hypnotic_gaze: {
    name: 'Hypnotic Gaze',
    description: 'Unblocked Psychic attacks apply +1 Sleep. Psychic cards cost +1 energy.',
  },
  // Growlithe/Arcanine line
  flash_fire: {
    name: 'Flash Fire',
    description: 'You are immune to Burn. When hit by a Fire attack, gain 2 Strength.',
  },
  flame_body: {
    name: 'Flame Body',
    description: 'When hit by a front-row attack, apply Burn 1 to the attacker.',
  },
  // Voltorb/Electrode line
  static: {
    name: 'Static',
    description: 'When hit by a front-row attack, apply Paralysis 1 to the attacker.',
  },
  charge: {
    name: 'Charge',
    description: 'At the start of your turn, gain 1 Strength.',
  },
  volatile: {
    name: 'Volatile',
    description: 'Self-KO attacks deal 50% more damage.',
  },
  final_spark: {
    name: 'Final Spark',
    description: 'When you play a Self-KO card, all allies gain 3 Strength and 2 Haste.',
  },
  // Caterpie/Butterfree line
  shield_dust: {
    name: 'Shield Dust',
    description: 'You are immune to Poison.',
  },
  tinted_lens: {
    name: 'Tinted Lens',
    description: 'Your not-very-effective attacks have no damage penalty.',
  },
  resonance: {
    name: 'Resonance',
    description: 'When you deal unblocked damage with a Psychic attack, allies in your column gain 1 Strength.',
  },
  pollinate: {
    name: 'Pollinate',
    description: 'At the start of your turn, allies in your column restore 1 energy.',
  },
  // Venonat/Venomoth line (shared passives with Caterpie line)
  compound_eyes: {
    name: 'Compound Eyes',
    description: 'When you apply a debuff to an enemy, gain 1 Evasion.',
  },
  powder_spread: {
    name: 'Powder Spread',
    description: 'When you apply a debuff to an enemy, also apply 1 stack to both adjacent enemies.',
  },
  // Weedle/Beedrill line
  poison_barb: {
    name: 'Poison Barb',
    description: 'Your Poison-type attacks deal +2 damage.',
  },
  adaptability: {
    name: 'Adaptability',
    description: 'Your STAB bonus is doubled (+4 instead of +2).',
  },
  swarm_strike: {
    name: 'Swarm Strike',
    description: 'The first Bug attack you play each turn deals double damage.',
  },
  // Magikarp/Gyarados line
  great_leap: {
    name: 'Great Leap',
    description: 'When you play Splash, gain 2 Evasion.',
  },
  moxie: {
    name: 'Moxie',
    description: 'When you KO an enemy, gain 3 energy.',
  },
  tyrants_tantrum: {
    name: "Tyrant's Tantrum",
    description: 'When you play an attack, gain Strength equal to its cost.',
  },
  // Lapras
  water_absorb: {
    name: 'Water Absorb',
    description: 'Immune to Water attacks. Instead, heal for the base damage.',
  },
  shell_armor: {
    name: 'Shell Armor',
    description: 'No single attack can deal more than 20 damage to you.',
  },
  fortifying_aria: {
    name: 'Fortifying Aria',
    description: 'At end of round, heal allies for half of your current Block.',
  },
  // Magmar & Electabuzz (shared)
  vital_spirit: {
    name: 'Vital Spirit',
    description: 'You are immune to Sleep.',
  },
  searing_fury: {
    name: 'Searing Fury',
    description: 'Your Fire attacks deal +1 damage per Burn stack across all enemies.',
  },
  volt_fury: {
    name: 'Volt Fury',
    description: 'Your attacks deal +1 damage per Paralysis stack on the target.',
  },
  surge_momentum: {
    name: 'Surge Momentum',
    description: 'At the start of your turn, reduce the cost of your highest-cost Electric card in hand by 3 (min 0).',
  },
  // Dratini/Dragonair/Dragonite line
  multiscale: {
    name: 'Multiscale',
    description: 'If above 75% HP, take half damage from attacks.',
  },
  dragons_majesty: {
    name: "Dragon's Majesty",
    description: 'At the start of your turn, reduce the cost of your highest-cost attack by 3 (min 0). Your attacks deal 30% more damage.',
  },
  // Spearow/Fearow line
  sharp_beak: {
    name: 'Sharp Beak',
    description: 'Your Flying attacks deal +1 damage.',
  },
  sniper: {
    name: 'Sniper',
    description: 'Your first attack each turn ignores evasion and block.',
  },
  // Sandshrew/Sandslash line
  spiked_hide: {
    name: 'Spiked Hide',
    description: 'When you deal damage, gain Thorns equal to damage/4 (min 1).',
  },
  bristling_rampart: {
    name: 'Bristling Rampart',
    description: 'When you take unblocked damage, gain 3 Block.',
  },
  fortified_spines: {
    name: 'Fortified Spines',
    description: 'Your attacks deal bonus damage equal to your Thorns stacks.',
  },
  // Gastly/Gengar line
  intangible: {
    name: 'Intangible',
    description: 'At the start of your turn, gain Evasion 2.',
  },
  counter_stance: {
    name: 'Counter Stance',
    description: 'When an enemy attacks you, deal damage equal to your Evasion stacks.',
  },
  phase_form: {
    name: 'Phase Form',
    description: 'When you play a Ghost-type card, gain Evasion equal to its energy cost.',
  },
  night_assassin: {
    name: 'Night Assassin',
    description: 'Your damage cards deal bonus damage equal to your Evasion stacks (max +15).',
  },
  // Clefairy/Clefable line
  lucky_star: {
    name: 'Lucky Star',
    description: 'At the start of combat, gain 4 Evasion.',
  },
  cute_charm: {
    name: 'Cute Charm',
    description: 'When hit by a front-row attack, apply Enfeeble 1 to the attacker.',
  },
  friend_guard: {
    name: 'Friend Guard',
    description: 'Allies take 2 less damage from all attacks.',
  },
  magic_guard: {
    name: 'Magic Guard',
    description: 'Immune to status tick damage (Burn, Poison, Leech deal no damage).',
  },
  // Machop/Machoke/Machamp line
  guts: {
    name: 'Guts',
    description: 'When an enemy applies a debuff to you, gain 1 Strength.',
  },
  no_guard: {
    name: 'No Guard',
    description: 'When you deal unblocked damage, strip 1 Evasion and 1 Block from yourself. Gain 1 Strength.',
  },
  rapid_strike: {
    name: 'Rapid Strike',
    description: '1-cost attack cards in hand at the start of your turn cost 0.',
  },
  finisher: {
    name: 'Finisher',
    description: 'Your first attack with effective cost 3+ each turn deals double damage, then clears all your Strength.',
  },
  mysticism: {
    name: 'Mysticism',
    description: 'Your unblocked Psychic attacks inflict 2 Enfeeble.',
  },
  malice: {
    name: 'Malice',
    description: 'Your attacks deal bonus damage equal to the target\'s Burn + Enfeeble stacks.',
  },
  hex_mastery: {
    name: 'Hex Mastery',
    description: 'Hex costs 0.',
  },
  consuming_flame: {
    name: 'Consuming Flame',
    description: 'Your Fire cards deal 20% more damage but Vanish after use.',
  },
  impact_guard: {
    name: 'Impact Guard',
    description: 'Your contact front-row attacks grant 4 Block.',
  },
  effect_spore: {
    name: 'Effect Spore',
    description: 'When hit by a front-row attack, inflict 1 Paralysis on the attacker.',
  },
  stench: {
    name: 'Stench',
    description: 'At end of your turn, the enemy directly facing you gains 2 Poison.',
  },
  luna: {
    name: 'Luna',
    description: 'At end of round, heal all allies for 4 HP.',
  },
  verdant_drain: {
    name: 'Verdant Drain',
    description: 'Your drain attacks heal for 100% of damage dealt instead of 50%.',
  },
  // Jigglypuff/Wigglytuff line
  lullaby: {
    name: 'Lullaby',
    description: 'Sing costs 1 energy.',
  },
  rude_awakening: {
    name: 'Rude Awakening',
    description: 'Your attacks deal double damage to sleeping targets.',
  },
  // Paras/Parasect line
  blind_aggression: {
    name: 'Blind Aggression',
    description: 'Your attacks deal +2 damage to enemies in the same column as you.',
  },
  dry_skin: {
    name: 'Dry Skin',
    description: 'Immune to Water attacks (heal for base damage). Take 25% more damage from Fire.',
  },
  spore_mastery: {
    name: 'Spore Mastery',
    description: 'Spore costs 0 energy.',
  },
  // Zubat/Golbat/Crobat line
  vampiricism: {
    name: 'Vampiricism',
    description: 'Unblocked front-row attacks apply +1 Leech.',
  },
  zephyr_king: {
    name: 'Zephyr King',
    description: 'Your Flying attacks grant you 1 Haste.',
  },
  // Porygon line
  download: {
    name: 'Download',
    description: 'Swapping costs 1 energy instead of 2, and grants the ally 5 Block.',
  },
  data_transfer: {
    name: 'Data Transfer',
    description: 'Swapping also grants the ally 2 Evasion and 2 Strength.',
  },
  overclock: {
    name: 'Overclock',
    description: 'Each swap reduces your highest-cost card by 1 this turn. Always targets the same card.',
  },
  upload: {
    name: 'Upload',
    description: 'Swapping also grants the ally 1 energy.',
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
      description: 'Evolve to Charmeleon (+10 HP). Add Flamethrower. Gain Consuming Flame.',
      evolvesTo: 'charmeleon',
      passiveId: 'consuming_flame',
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
      description: 'Evolve to Venusaur (+10 HP). Add Solar Beam. Gain Overgrow Heal.',
      evolvesTo: 'venusaur',
      passiveId: 'overgrow_heal',
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
      description: 'Evolve to Blastoise (+10 HP). Add Hydro Pump. Gain Torrent Shield.',
      evolvesTo: 'blastoise',
      passiveId: 'torrent_shield',
      hpBoost: 0,  // HP increase comes from Blastoise's base stats
      cardsToAdd: ['hydro-pump'],
    },
    {
      level: 4,
      name: 'Blastoise (Mastered)',
      description: 'Gain Fortified Cannons.',
      passiveId: 'fortified_cannons',
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
      description: 'Gain Swift Guard.',
      passiveId: 'static_field',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 3,
      name: 'Raichu',
      description: 'Evolve to Raichu (+20 HP). Gain Counter-Current.',
      evolvesTo: 'raichu',
      passiveId: 'counter_current',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 4,
      name: 'Raichu (Mastered)',
      description: 'Add Body Slam, Mega Punch, Thunder.',
      passiveId: 'none',
      hpBoost: 0,
      cardsToAdd: ['body-slam', 'mega-punch', 'thunder'],
    },
  ],
};

// Pidgey progression tree - speed manipulation, AoE wind attacks
export const PIDGEY_PROGRESSION: ProgressionTree = {
  baseFormId: 'pidgey',
  rungs: [
    {
      level: 1,
      name: 'Pidgey',
      description: 'Starting form with Gust Force passive.',
      passiveId: 'gust_force',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 2,
      name: 'Pidgeotto',
      description: 'Evolve to Pidgeotto. Gain Keen Eye.',
      evolvesTo: 'pidgeotto',
      passiveId: 'keen_eye',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 3,
      name: 'Pidgeot',
      description: 'Evolve to Pidgeot. Add Razor Wind. Gain Whipping Winds.',
      evolvesTo: 'pidgeot',
      passiveId: 'whipping_winds',
      hpBoost: 0,
      cardsToAdd: ['razor-wind'],
    },
    {
      level: 4,
      name: 'Pidgeot (Mastered)',
      description: 'Gain Slipstream.',
      passiveId: 'slipstream',
      hpBoost: 0,
      cardsToAdd: [],
    },
  ],
};

// Rattata progression tree - multi-hit frenzy, speed advantage
export const RATTATA_PROGRESSION: ProgressionTree = {
  baseFormId: 'rattata',
  rungs: [
    {
      level: 1,
      name: 'Rattata',
      description: 'Starting form. Gain Scurry.',
      passiveId: 'scurry',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 2,
      name: 'Raticate',
      description: 'Evolve to Raticate. Add Fury Swipes. Gain Quick Feet.',
      evolvesTo: 'raticate',
      passiveId: 'quick_feet',
      hpBoost: 0,
      cardsToAdd: ['fury-swipes'],
    },
    {
      level: 3,
      name: 'Raticate',
      description: 'Gain Proletariat.',
      passiveId: 'proletariat',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 4,
      name: 'Raticate (Mastered)',
      description: 'Gain Hustle.',
      passiveId: 'hustle',
      hpBoost: 0,
      cardsToAdd: [],
    },
  ],
};

// Ekans progression tree - poison stacking, debuff on combat start
export const EKANS_PROGRESSION: ProgressionTree = {
  baseFormId: 'ekans',
  rungs: [
    {
      level: 1,
      name: 'Ekans',
      description: 'Starting form with Shed Skin passive.',
      passiveId: 'shed_skin',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 2,
      name: 'Ekans',
      description: 'Add Sludge. Gain Poison Point.',
      passiveId: 'poison_point',
      hpBoost: 0,
      cardsToAdd: ['sludge'],
    },
    {
      level: 3,
      name: 'Arbok',
      description: 'Evolve to Arbok. Add Toxic. Gain Intimidate.',
      evolvesTo: 'arbok',
      passiveId: 'intimidate',
      hpBoost: 0,
      cardsToAdd: ['toxic'],
    },
    {
      level: 4,
      name: 'Arbok (Mastered)',
      description: "Gain Predator's Patience.",
      passiveId: 'predators_patience',
      hpBoost: 0,
      cardsToAdd: [],
    },
  ],
};

// Tauros progression tree - anger/rage theme (no evolution)
export const TAUROS_PROGRESSION: ProgressionTree = {
  baseFormId: 'tauros',
  rungs: [
    {
      level: 1,
      name: 'Tauros',
      description: 'Starting form with Thick Hide passive.',
      passiveId: 'thick_hide',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 2,
      name: 'Tauros',
      description: 'Gain Anger Point.',
      passiveId: 'anger_point',
      hpBoost: 5,
      cardsToAdd: [],
    },
    {
      level: 3,
      name: 'Tauros',
      description: 'Add Double-Edge. Gain Intimidate.',
      passiveId: 'intimidate',
      hpBoost: 5,
      cardsToAdd: ['double-edge'],
    },
    {
      level: 4,
      name: 'Tauros (Mastered)',
      description: 'Gain Raging Bull.',
      passiveId: 'raging_bull',
      hpBoost: 5,
      cardsToAdd: [],
    },
  ],
};

// Snorlax progression tree - rest/recovery theme (no evolution)
export const SNORLAX_PROGRESSION: ProgressionTree = {
  baseFormId: 'snorlax',
  rungs: [
    {
      level: 1,
      name: 'Snorlax',
      description: 'Starting form with Immunity passive.',
      passiveId: 'immunity',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 2,
      name: 'Snorlax',
      description: 'Gain Thick Fat.',
      passiveId: 'thick_fat',
      hpBoost: 10,
      cardsToAdd: [],
    },
    {
      level: 3,
      name: 'Snorlax',
      description: 'Add Body Slam. Gain Leftovers.',
      passiveId: 'leftovers',
      hpBoost: 10,
      cardsToAdd: ['body-slam'],
    },
    {
      level: 4,
      name: 'Snorlax (Mastered)',
      description: 'Gain Power Nap.',
      passiveId: 'power_nap',
      hpBoost: 10,
      cardsToAdd: [],
    },
  ],
};

// Kangaskhan progression tree - parental bond/multi-hit (no evolution)
export const KANGASKHAN_PROGRESSION: ProgressionTree = {
  baseFormId: 'kangaskhan',
  rungs: [
    {
      level: 1,
      name: 'Kangaskhan',
      description: 'Starting form with Scrappy passive.',
      passiveId: 'scrappy',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 2,
      name: 'Kangaskhan',
      description: 'Gain Parental Bond.',
      passiveId: 'parental_bond',
      hpBoost: 5,
      cardsToAdd: [],
    },
    {
      level: 3,
      name: 'Kangaskhan',
      description: 'Add Body Slam. Gain Protective Instinct.',
      passiveId: 'protective_instinct',
      hpBoost: 5,
      cardsToAdd: ['body-slam'],
    },
    {
      level: 4,
      name: 'Kangaskhan (Mastered)',
      description: 'Gain Family Fury.',
      passiveId: 'family_fury',
      hpBoost: 5,
      cardsToAdd: [],
    },
  ],
};

// Nidoran♂ progression tree - "Rampage" offensive poison synergy
export const NIDORAN_M_PROGRESSION: ProgressionTree = {
  baseFormId: 'nidoran-m',
  rungs: [
    {
      level: 1,
      name: 'Nidoran♂',
      description: 'Starting form with Poison Point passive.',
      passiveId: 'poison_point',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 2,
      name: 'Nidorino',
      description: 'Evolve to Nidorino. Add Sludge Bomb. Gain Anger Point.',
      evolvesTo: 'nidorino',
      passiveId: 'anger_point',
      hpBoost: 0,
      cardsToAdd: ['sludge-bomb'],
    },
    {
      level: 3,
      name: 'Nidoking',
      description: 'Evolve to Nidoking. Add Earthquake. Gain Toxic Horn.',
      evolvesTo: 'nidoking',
      passiveId: 'toxic_horn',
      hpBoost: 0,
      cardsToAdd: ['earthquake'],
    },
    {
      level: 4,
      name: 'Nidoking (Mastered)',
      description: 'Add Megahorn. Gain Sheer Force.',
      passiveId: 'sheer_force',
      hpBoost: 0,
      cardsToAdd: ['megahorn'],
    },
  ],
};

// Nidoran♀ progression tree - "Matriarch" defensive poison synergy
export const NIDORAN_F_PROGRESSION: ProgressionTree = {
  baseFormId: 'nidoran-f',
  rungs: [
    {
      level: 1,
      name: 'Nidoran♀',
      description: 'Starting form with Poison Point passive.',
      passiveId: 'poison_point',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 2,
      name: 'Nidorina',
      description: 'Evolve to Nidorina. Add Sludge. Gain Thick Hide.',
      evolvesTo: 'nidorina',
      passiveId: 'thick_hide',
      hpBoost: 0,
      cardsToAdd: ['sludge'],
    },
    {
      level: 3,
      name: 'Nidoqueen',
      description: 'Evolve to Nidoqueen. Add Earthquake. Gain Protective Toxins.',
      evolvesTo: 'nidoqueen',
      passiveId: 'protective_toxins',
      hpBoost: 0,
      cardsToAdd: ['earthquake'],
    },
    {
      level: 4,
      name: 'Nidoqueen (Mastered)',
      description: 'Add Body Slam. Gain Sheer Force.',
      passiveId: 'sheer_force',
      hpBoost: 0,
      cardsToAdd: ['body-slam'],
    },
  ],
};

// Rhyhorn → Rhydon progression tree
export const RHYHORN_PROGRESSION: ProgressionTree = {
  baseFormId: 'rhyhorn',
  rungs: [
    {
      level: 1,
      name: 'Rhyhorn',
      description: 'Starting form with Thick Hide passive.',
      passiveId: 'thick_hide',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 2,
      name: 'Rhyhorn',
      description: 'Add Take-Down. Gain Rock Head.',
      passiveId: 'rock_head',
      hpBoost: 0,
      cardsToAdd: ['take-down'],
    },
    {
      level: 3,
      name: 'Rhydon',
      description: 'Evolve to Rhydon. Add Earthquake. Gain Lightning Rod.',
      evolvesTo: 'rhydon',
      passiveId: 'lightning_rod',
      hpBoost: 0,
      cardsToAdd: ['earthquake'],
    },
    {
      level: 4,
      name: 'Rhydon (Mastered)',
      description: 'Add Double-Edge. Gain Reckless.',
      passiveId: 'reckless',
      hpBoost: 0,
      cardsToAdd: ['double-edge'],
    },
  ],
};

// Drowzee progression tree
export const DROWZEE_PROGRESSION: ProgressionTree = {
  baseFormId: 'drowzee',
  rungs: [
    {
      level: 1,
      name: 'Drowzee',
      description: 'Starting form with Insomnia passive.',
      passiveId: 'insomnia',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 2,
      name: 'Hypno',
      description: 'Evolve to Hypno. Add Dream Eater. Gain Drowsy Aura.',
      evolvesTo: 'hypno',
      passiveId: 'drowsy_aura',
      hpBoost: 5,
      cardsToAdd: ['dream-eater'],
    },
    {
      level: 3,
      name: 'Hypno',
      description: 'Add Psychic. Gain Inner Focus.',
      passiveId: 'inner_focus',
      hpBoost: 5,
      cardsToAdd: ['psychic'],
    },
    {
      level: 4,
      name: 'Hypno (Mastered)',
      description: 'Gain Hypnotic Gaze.',
      passiveId: 'hypnotic_gaze',
      hpBoost: 0,
      cardsToAdd: [],
    },
  ],
};

// Growlithe progression tree - fire vanguard frontliner
export const GROWLITHE_PROGRESSION: ProgressionTree = {
  baseFormId: 'growlithe',
  rungs: [
    {
      level: 1,
      name: 'Growlithe',
      description: 'Starting form with Flash Fire passive.',
      passiveId: 'flash_fire',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 2,
      name: 'Arcanine',
      description: 'Evolve to Arcanine (+30 HP). Add Morning Sun. Gain Intimidate.',
      evolvesTo: 'arcanine',
      passiveId: 'intimidate',
      hpBoost: 0,
      cardsToAdd: ['morning-sun'],
    },
    {
      level: 3,
      name: 'Arcanine',
      description: 'Add Flare Blitz. Gain Impact Guard.',
      passiveId: 'impact_guard',
      hpBoost: 0,
      cardsToAdd: ['flare-blitz'],
    },
    {
      level: 4,
      name: 'Arcanine (Mastered)',
      description: 'Gain Rock Head.',
      passiveId: 'rock_head',
      hpBoost: 0,
      cardsToAdd: [],
    },
  ],
};

// Voltorb progression tree - fastest glass cannon, self-destruct theme
export const VOLTORB_PROGRESSION: ProgressionTree = {
  baseFormId: 'voltorb',
  rungs: [
    {
      level: 1,
      name: 'Voltorb',
      description: 'Starting form with Static passive.',
      passiveId: 'static',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 2,
      name: 'Electrode',
      description: 'Evolve to Electrode (+18 HP). Add Self-Destruct. Gain Charge.',
      evolvesTo: 'electrode',
      passiveId: 'charge',
      hpBoost: 0,
      cardsToAdd: ['self-destruct'],
    },
    {
      level: 3,
      name: 'Electrode',
      description: 'Add Discharge. Gain Volatile.',
      passiveId: 'volatile',
      hpBoost: 0,
      cardsToAdd: ['discharge'],
    },
    {
      level: 4,
      name: 'Electrode (Mastered)',
      description: 'Gain Final Spark.',
      passiveId: 'final_spark',
      hpBoost: 0,
      cardsToAdd: [],
    },
  ],
};

// Caterpie progression tree - psychic support moth
export const CATERPIE_PROGRESSION: ProgressionTree = {
  baseFormId: 'caterpie',
  rungs: [
    {
      level: 1,
      name: 'Caterpie',
      description: 'Starting form with Shield Dust passive.',
      passiveId: 'shield_dust',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 2,
      name: 'Butterfree',
      description: 'Evolve to Butterfree (+20 HP). Add Confusion. Gain Pollinate.',
      evolvesTo: 'butterfree',
      passiveId: 'pollinate',
      hpBoost: 0,
      cardsToAdd: ['confusion'],
    },
    {
      level: 3,
      name: 'Butterfree',
      description: 'Add Psybeam. Gain Resonance.',
      passiveId: 'resonance',
      hpBoost: 0,
      cardsToAdd: ['psybeam'],
    },
    {
      level: 4,
      name: 'Butterfree (Mastered)',
      description: 'Gain Tinted Lens.',
      passiveId: 'tinted_lens',
      hpBoost: 0,
      cardsToAdd: [],
    },
  ],
};

// Venonat progression tree - status-spreading support moth (mirrors Caterpie line)
export const VENONAT_PROGRESSION: ProgressionTree = {
  baseFormId: 'venonat',
  rungs: [
    {
      level: 1,
      name: 'Venonat',
      description: 'Starting form with Shield Dust passive.',
      passiveId: 'shield_dust',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 2,
      name: 'Venomoth',
      description: 'Evolve to Venomoth (+20 HP). Gain Compound Eyes.',
      evolvesTo: 'venomoth',
      passiveId: 'compound_eyes',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 3,
      name: 'Venomoth',
      description: 'Add Silver Wind. Gain Powder Spread.',
      passiveId: 'powder_spread',
      hpBoost: 0,
      cardsToAdd: ['silver-wind'],
    },
    {
      level: 4,
      name: 'Venomoth (Mastered)',
      description: 'Add Sleep Powder. Gain Tinted Lens.',
      passiveId: 'tinted_lens',
      hpBoost: 0,
      cardsToAdd: ['sleep-powder'],
    },
  ],
};

// Weedle progression tree - venom striker, fast glass cannon
export const WEEDLE_PROGRESSION: ProgressionTree = {
  baseFormId: 'weedle',
  rungs: [
    {
      level: 1,
      name: 'Weedle',
      description: 'Starting form with Poison Barb passive.',
      passiveId: 'poison_barb',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 2,
      name: 'Beedrill',
      description: 'Evolve to Beedrill (+18 HP). Add Twineedle. Gain Swarm Strike.',
      evolvesTo: 'beedrill',
      passiveId: 'swarm_strike',
      hpBoost: 0,
      cardsToAdd: ['twineedle'],
    },
    {
      level: 3,
      name: 'Beedrill',
      description: 'Gain Adaptability.',
      passiveId: 'adaptability',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 4,
      name: 'Beedrill (Mastered)',
      description: 'Gain Poison Point.',
      passiveId: 'poison_point',
      hpBoost: 0,
      cardsToAdd: [],
    },
  ],
};

// Magikarp progression tree - weak start, powerful Gyarados evolution
export const MAGIKARP_PROGRESSION: ProgressionTree = {
  baseFormId: 'magikarp',
  rungs: [
    {
      level: 1,
      name: 'Magikarp',
      description: 'Starting form with Great Leap passive.',
      passiveId: 'great_leap',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 2,
      name: 'Gyarados',
      description: 'Evolve to Gyarados (+45 HP). Gain Intimidate.',
      evolvesTo: 'gyarados',
      passiveId: 'intimidate',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 3,
      name: 'Gyarados',
      description: '+5 HP. Add Dragon Rage. Gain Moxie.',
      passiveId: 'moxie',
      hpBoost: 5,
      cardsToAdd: ['dragon-rage'],
    },
    {
      level: 4,
      name: 'Gyarados (Mastered)',
      description: "Add Dragon Dance. Gain Tyrant's Tantrum.",
      passiveId: 'tyrants_tantrum',
      hpBoost: 0,
      cardsToAdd: ['dragon-dance'],
    },
  ],
};

// Lapras progression tree
export const LAPRAS_PROGRESSION: ProgressionTree = {
  baseFormId: 'lapras',
  rungs: [
    {
      level: 1,
      name: 'Lapras',
      description: 'Starting form with Water Absorb passive.',
      passiveId: 'water_absorb',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 2,
      name: 'Lapras',
      description: '+5 HP. Add Surf. Gain Pressure Hull.',
      passiveId: 'pressure_hull',
      hpBoost: 5,
      cardsToAdd: ['surf'],
    },
    {
      level: 3,
      name: 'Lapras',
      description: '+5 HP. Gain Shell Armor.',
      passiveId: 'shell_armor',
      hpBoost: 5,
      cardsToAdd: [],
    },
    {
      level: 4,
      name: 'Lapras (Mastered)',
      description: 'Add Blizzard. Gain Fortifying Aria.',
      passiveId: 'fortifying_aria',
      hpBoost: 0,
      cardsToAdd: ['blizzard'],
    },
  ],
};

// Magmar progression tree - burn specialist, single-stage
export const MAGMAR_PROGRESSION: ProgressionTree = {
  baseFormId: 'magmar',
  rungs: [
    {
      level: 1,
      name: 'Magmar',
      description: 'Starting form with Vital Spirit passive.',
      passiveId: 'vital_spirit',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 2,
      name: 'Magmar',
      description: 'Add Lava Plume. Gain Flame Body.',
      passiveId: 'flame_body',
      hpBoost: 5,
      cardsToAdd: ['lava-plume'],
    },
    {
      level: 3,
      name: 'Magmar',
      description: 'Gain Searing Fury.',
      passiveId: 'searing_fury',
      hpBoost: 5,
      cardsToAdd: [],
    },
    {
      level: 4,
      name: 'Magmortar',
      description: 'Evolve to Magmortar. Add Fire Blast. Gain Inferno Momentum.',
      evolvesTo: 'magmortar',
      passiveId: 'inferno_momentum',
      hpBoost: 0,
      cardsToAdd: ['fire-blast'],
    },
  ],
};

// Electabuzz progression tree - paralysis specialist, single-stage
export const ELECTABUZZ_PROGRESSION: ProgressionTree = {
  baseFormId: 'electabuzz',
  rungs: [
    {
      level: 1,
      name: 'Electabuzz',
      description: 'Starting form with Vital Spirit passive.',
      passiveId: 'vital_spirit',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 2,
      name: 'Electabuzz',
      description: 'Add Fire Punch. Gain Static.',
      passiveId: 'static',
      hpBoost: 5,
      cardsToAdd: ['fire-punch'],
    },
    {
      level: 3,
      name: 'Electabuzz',
      description: 'Gain Volt Fury.',
      passiveId: 'volt_fury',
      hpBoost: 5,
      cardsToAdd: [],
    },
    {
      level: 4,
      name: 'Electivire',
      description: 'Evolve to Electivire. Add Thunder. Gain Surge Momentum.',
      evolvesTo: 'electivire',
      passiveId: 'surge_momentum',
      hpBoost: 0,
      cardsToAdd: ['thunder'],
    },
  ],
};

// Dratini progression tree - dragon powerhouse, late-game evolution
export const DRATINI_PROGRESSION: ProgressionTree = {
  baseFormId: 'dratini',
  rungs: [
    {
      level: 1,
      name: 'Dratini',
      description: 'Starting form with Shed Skin passive.',
      passiveId: 'shed_skin',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 2,
      name: 'Dratini',
      description: 'Gain Inner Focus.',
      passiveId: 'inner_focus',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 3,
      name: 'Dragonair',
      description: 'Evolve to Dragonair. Add Dragon Dance. Gain Multiscale.',
      evolvesTo: 'dragonair',
      passiveId: 'multiscale',
      hpBoost: 0,
      cardsToAdd: ['dragon-dance'],
    },
    {
      level: 4,
      name: 'Dragonite',
      description: "Evolve to Dragonite. Add Hyper Beam. Gain Dragon's Majesty.",
      evolvesTo: 'dragonite',
      passiveId: 'dragons_majesty',
      hpBoost: 0,
      cardsToAdd: ['hyper-beam'],
    },
  ],
};

// Spearow progression tree - aggressive flying attacker
export const SPEAROW_PROGRESSION: ProgressionTree = {
  baseFormId: 'spearow',
  rungs: [
    {
      level: 1,
      name: 'Spearow',
      description: 'Starting form with Sharp Beak passive.',
      passiveId: 'sharp_beak',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 2,
      name: 'Fearow',
      description: 'Evolve to Fearow. Gain Keen Eye. Add Rage.',
      evolvesTo: 'fearow',
      passiveId: 'keen_eye',
      hpBoost: 0,
      cardsToAdd: ['rage'],
    },
    {
      level: 3,
      name: 'Fearow',
      description: 'Gain Proletariat. Add Rage.',
      passiveId: 'proletariat',
      hpBoost: 0,
      cardsToAdd: ['rage'],
    },
    {
      level: 4,
      name: 'Fearow',
      description: 'Gain Sniper. First attack each turn ignores evasion and block.',
      passiveId: 'sniper',
      hpBoost: 0,
      cardsToAdd: [],
    },
  ],
};

// Sandshrew progression tree - defensive ground tank
export const SANDSHREW_PROGRESSION: ProgressionTree = {
  baseFormId: 'sandshrew',
  rungs: [
    {
      level: 1,
      name: 'Sandshrew',
      description: 'Starting form with Baby Shell passive.',
      passiveId: 'baby_shell',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 2,
      name: 'Sandslash',
      description: 'Evolve to Sandslash. Gain Spiked Hide. Add Dig.',
      evolvesTo: 'sandslash',
      passiveId: 'spiked_hide',
      hpBoost: 0,
      cardsToAdd: ['dig'],
    },
    {
      level: 3,
      name: 'Sandslash',
      description: 'Gain Bristling Rampart. When you take unblocked damage, gain 3 Block.',
      passiveId: 'bristling_rampart',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 4,
      name: 'Sandslash',
      description: 'Gain Fortified Spines. Attacks deal bonus damage from Thorns. Add Earthquake.',
      passiveId: 'fortified_spines',
      hpBoost: 0,
      cardsToAdd: ['earthquake'],
    },
  ],
};

// Gastly progression tree - evasion-centric ghost assassin
export const GASTLY_PROGRESSION: ProgressionTree = {
  baseFormId: 'gastly',
  rungs: [
    {
      level: 1,
      name: 'Gastly',
      description: 'Starting form with Intangible.',
      passiveId: 'intangible',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 2,
      name: 'Haunter',
      description: 'Evolve to Haunter. Add Minimize. Gain Counter Stance.',
      evolvesTo: 'haunter',
      passiveId: 'counter_stance',
      hpBoost: 0,
      cardsToAdd: ['minimize'],
    },
    {
      level: 3,
      name: 'Gengar',
      description: 'Evolve to Gengar. Add Shadow Ball. Gain Phase Form.',
      evolvesTo: 'gengar',
      passiveId: 'phase_form',
      hpBoost: 0,
      cardsToAdd: ['shadow-ball'],
    },
    {
      level: 4,
      name: 'Gengar (Mastered)',
      description: 'Gain Night Assassin.',
      passiveId: 'night_assassin',
      hpBoost: 0,
      cardsToAdd: [],
    },
  ],
};

// Clefairy progression tree - fairy support, evasion + enfeeble theme
export const CLEFAIRY_PROGRESSION: ProgressionTree = {
  baseFormId: 'clefairy',
  rungs: [
    {
      level: 1,
      name: 'Clefairy',
      description: 'Starting form with Lucky Star passive.',
      passiveId: 'lucky_star',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 2,
      name: 'Clefable',
      description: 'Evolve to Clefable (+15 HP). Add Follow Me. Gain Cute Charm.',
      evolvesTo: 'clefable',
      passiveId: 'cute_charm',
      hpBoost: 0,
      cardsToAdd: ['follow-me'],
    },
    {
      level: 3,
      name: 'Clefable',
      description: 'Gain Friend Guard.',
      passiveId: 'friend_guard',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 4,
      name: 'Clefable (Mastered)',
      description: 'Add Moonblast. Gain Magic Guard.',
      passiveId: 'magic_guard',
      hpBoost: 0,
      cardsToAdd: ['moonblast'],
    },
  ],
};

// Machop progression tree - aggressive Strength-stacking brawler
export const MACHOP_PROGRESSION: ProgressionTree = {
  baseFormId: 'machop',
  rungs: [
    {
      level: 1,
      name: 'Machop',
      description: 'Starting form with Guts passive.',
      passiveId: 'guts',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 2,
      name: 'Machoke',
      description: 'Evolve to Machoke. Add Bulk Up. Gain No Guard.',
      evolvesTo: 'machoke',
      passiveId: 'no_guard',
      hpBoost: 0,
      cardsToAdd: ['bulk-up'],
    },
    {
      level: 3,
      name: 'Machamp',
      description: 'Evolve to Machamp. Add Cross Chop. Gain Rapid Strike.',
      evolvesTo: 'machamp',
      passiveId: 'rapid_strike',
      hpBoost: 0,
      cardsToAdd: ['cross-chop'],
    },
    {
      level: 4,
      name: 'Machamp (Mastered)',
      description: 'Gain Finisher.',
      passiveId: 'finisher',
      hpBoost: 0,
      cardsToAdd: [],
    },
  ],
};

// Vulpix progression tree - debuff stacker, exploits burn + enfeeble
export const VULPIX_PROGRESSION: ProgressionTree = {
  baseFormId: 'vulpix',
  rungs: [
    {
      level: 1,
      name: 'Vulpix',
      description: 'Starting form with Flame Body passive.',
      passiveId: 'flame_body',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 2,
      name: 'Ninetales',
      description: 'Evolve to Ninetales. Add Psychic. Gain Mysticism.',
      evolvesTo: 'ninetales',
      passiveId: 'mysticism',
      hpBoost: 0,
      cardsToAdd: ['psychic'],
    },
    {
      level: 3,
      name: 'Ninetales',
      description: 'Add Hex. Gain Hex Mastery.',
      passiveId: 'hex_mastery',
      hpBoost: 0,
      cardsToAdd: ['hex'],
    },
    {
      level: 4,
      name: 'Ninetales (Mastered)',
      description: 'Gain Malice.',
      passiveId: 'malice',
      hpBoost: 0,
      cardsToAdd: [],
    },
  ],
};

// Oddish progression tree - poison/drain support, heals team
export const ODDISH_PROGRESSION: ProgressionTree = {
  baseFormId: 'oddish',
  rungs: [
    {
      level: 1,
      name: 'Oddish',
      description: 'Starting form with Effect Spore passive.',
      passiveId: 'effect_spore',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 2,
      name: 'Gloom',
      description: 'Evolve to Gloom. Gain Stench.',
      evolvesTo: 'gloom',
      passiveId: 'stench',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 3,
      name: 'Vileplume',
      description: 'Evolve to Vileplume. Add Moonlight. Gain Luna.',
      evolvesTo: 'vileplume',
      passiveId: 'luna',
      hpBoost: 0,
      cardsToAdd: ['moonlight'],
    },
    {
      level: 4,
      name: 'Vileplume (Mastered)',
      description: 'Add Giga Drain. Gain Verdant Drain.',
      passiveId: 'verdant_drain',
      hpBoost: 0,
      cardsToAdd: ['giga-drain'],
    },
  ],
};

// Meowth progression tree - gold earner, precise cheap attacks
export const MEOWTH_PROGRESSION: ProgressionTree = {
  baseFormId: 'meowth',
  rungs: [
    {
      level: 1,
      name: 'Meowth',
      description: 'Starting form with Pickup passive.',
      passiveId: 'pickup',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 2,
      name: 'Persian',
      description: 'Evolve to Persian. Gain Limber.',
      evolvesTo: 'persian',
      passiveId: 'limber',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 3,
      name: 'Persian',
      description: 'Add Pay Day. Gain Technician.',
      passiveId: 'technician',
      hpBoost: 0,
      cardsToAdd: ['pay-day'],
    },
    {
      level: 4,
      name: 'Persian (Mastered)',
      description: 'Gain Aristocrat.',
      passiveId: 'aristocrat',
      hpBoost: 0,
      cardsToAdd: [],
    },
  ],
};

// Jigglypuff progression tree - sleep support, punishes slumbering foes
export const JIGGLYPUFF_PROGRESSION: ProgressionTree = {
  baseFormId: 'jigglypuff',
  rungs: [
    {
      level: 1,
      name: 'Jigglypuff',
      description: 'Starting form with Cute Charm passive.',
      passiveId: 'cute_charm',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 2,
      name: 'Wigglytuff',
      description: 'Evolve to Wigglytuff (+36 HP). Add Body Slam. Gain Friend Guard.',
      evolvesTo: 'wigglytuff',
      passiveId: 'friend_guard',
      hpBoost: 0,
      cardsToAdd: ['body-slam'],
    },
    {
      level: 3,
      name: 'Wigglytuff',
      description: 'Add Play Rough. Gain Lullaby (Sing costs 1).',
      passiveId: 'lullaby',
      hpBoost: 0,
      cardsToAdd: ['play-rough'],
    },
    {
      level: 4,
      name: 'Wigglytuff (Mastered)',
      description: 'Gain Rude Awakening (double damage to sleeping targets).',
      passiveId: 'rude_awakening',
      hpBoost: 0,
      cardsToAdd: [],
    },
  ],
};

// Paras progression tree - fungus-infected aggressor with status control
export const PARAS_PROGRESSION: ProgressionTree = {
  baseFormId: 'paras',
  rungs: [
    {
      level: 1,
      name: 'Paras',
      description: 'Starting form with Effect Spore passive.',
      passiveId: 'effect_spore',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 2,
      name: 'Parasect',
      description: 'Evolve to Parasect (+27 HP). Add Fury Cutter. Gain Blind Aggression.',
      evolvesTo: 'parasect',
      passiveId: 'blind_aggression',
      hpBoost: 0,
      cardsToAdd: ['fury-cutter'],
    },
    {
      level: 3,
      name: 'Parasect',
      description: 'Add Spore. Gain Dry Skin (heal from Water, weak to Fire).',
      passiveId: 'dry_skin',
      hpBoost: 0,
      cardsToAdd: ['spore'],
    },
    {
      level: 4,
      name: 'Parasect (Mastered)',
      description: 'Gain Spore Mastery (Spore costs 0).',
      passiveId: 'spore_mastery',
      hpBoost: 0,
      cardsToAdd: [],
    },
  ],
};

// Zubat progression tree - speed-based vampire bat
export const ZUBAT_PROGRESSION: ProgressionTree = {
  baseFormId: 'zubat',
  rungs: [
    {
      level: 1,
      name: 'Zubat',
      description: 'Starting form with Inner Focus passive.',
      passiveId: 'inner_focus',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 2,
      name: 'Golbat',
      description: 'Evolve to Golbat (+17 HP). Add Fly. Gain Vampiricism.',
      evolvesTo: 'golbat',
      passiveId: 'vampiricism',
      hpBoost: 0,
      cardsToAdd: ['fly'],
    },
    {
      level: 3,
      name: 'Crobat',
      description: 'Evolve to Crobat (+12 HP). Add Agility. Gain Swift Guard.',
      evolvesTo: 'crobat',
      passiveId: 'static_field',
      hpBoost: 0,
      cardsToAdd: ['agility'],
    },
    {
      level: 4,
      name: 'Crobat (Mastered)',
      description: 'Gain Zephyr King (Flying attacks grant Haste).',
      passiveId: 'zephyr_king',
      hpBoost: 0,
      cardsToAdd: [],
    },
  ],
};

// Porygon progression tree - swap-based support
export const PORYGON_PROGRESSION: ProgressionTree = {
  baseFormId: 'porygon',
  rungs: [
    {
      level: 1,
      name: 'Porygon',
      description: 'Starting form with Download passive.',
      passiveId: 'download',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 2,
      name: 'Porygon2',
      description: 'Evolve to Porygon2 (+15 HP). Add Tri Attack. Gain Data Transfer.',
      evolvesTo: 'porygon2',
      passiveId: 'data_transfer',
      hpBoost: 0,
      cardsToAdd: ['tri-attack'],
    },
    {
      level: 3,
      name: 'Porygon-Z',
      description: 'Evolve to Porygon-Z (+5 HP). Add Hyper Beam. Gain Overclock.',
      evolvesTo: 'porygon-z',
      passiveId: 'overclock',
      hpBoost: 0,
      cardsToAdd: ['hyper-beam'],
    },
    {
      level: 4,
      name: 'Porygon-Z (Mastered)',
      description: 'Gain Upload.',
      passiveId: 'upload',
      hpBoost: 0,
      cardsToAdd: [],
    },
  ],
};

// ============================================================
// Gen 2 (Johto) Progression Trees
// ============================================================

// Chikorita progression — defensive Grass starter, support-oriented
export const CHIKORITA_PROGRESSION: ProgressionTree = {
  baseFormId: 'chikorita',
  rungs: [
    {
      level: 1,
      name: 'Chikorita',
      description: 'Starting form.',
      passiveId: 'none',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 2,
      name: 'Bayleef',
      description: 'Evolve to Bayleef. Add Razor Leaf.',
      evolvesTo: 'bayleef',
      passiveId: 'none',
      hpBoost: 0,
      cardsToAdd: ['razor-leaf'],
    },
    {
      level: 3,
      name: 'Meganium',
      description: 'Evolve to Meganium. Add Body Slam.',
      evolvesTo: 'meganium',
      passiveId: 'none',
      hpBoost: 0,
      cardsToAdd: ['body-slam'],
    },
    {
      level: 4,
      name: 'Meganium (Mastered)',
      description: 'Add Growth.',
      passiveId: 'none',
      hpBoost: 0,
      cardsToAdd: ['growth'],
    },
  ],
};

// Cyndaquil progression — fast Fire starter, burst attacker
export const CYNDAQUIL_PROGRESSION: ProgressionTree = {
  baseFormId: 'cyndaquil',
  rungs: [
    {
      level: 1,
      name: 'Cyndaquil',
      description: 'Starting form.',
      passiveId: 'none',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 2,
      name: 'Quilava',
      description: 'Evolve to Quilava. Add Flamethrower.',
      evolvesTo: 'quilava',
      passiveId: 'none',
      hpBoost: 0,
      cardsToAdd: ['flamethrower'],
    },
    {
      level: 3,
      name: 'Typhlosion',
      description: 'Evolve to Typhlosion. Add Swift.',
      evolvesTo: 'typhlosion',
      passiveId: 'none',
      hpBoost: 0,
      cardsToAdd: ['swift'],
    },
    {
      level: 4,
      name: 'Typhlosion (Mastered)',
      description: 'Add Slash.',
      passiveId: 'none',
      hpBoost: 0,
      cardsToAdd: ['slash'],
    },
  ],
};

// Totodile progression — aggressive Water starter, biting melee fighter
export const TOTODILE_PROGRESSION: ProgressionTree = {
  baseFormId: 'totodile',
  rungs: [
    {
      level: 1,
      name: 'Totodile',
      description: 'Starting form.',
      passiveId: 'none',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 2,
      name: 'Croconaw',
      description: 'Evolve to Croconaw. Add Slash.',
      evolvesTo: 'croconaw',
      passiveId: 'none',
      hpBoost: 0,
      cardsToAdd: ['slash'],
    },
    {
      level: 3,
      name: 'Feraligatr',
      description: 'Evolve to Feraligatr. Add Surf.',
      evolvesTo: 'feraligatr',
      passiveId: 'none',
      hpBoost: 0,
      cardsToAdd: ['surf'],
    },
    {
      level: 4,
      name: 'Feraligatr (Mastered)',
      description: 'Add Slam.',
      passiveId: 'none',
      hpBoost: 0,
      cardsToAdd: ['slam'],
    },
  ],
};

// Sentret progression — quick Normal-type scrapper
export const SENTRET_PROGRESSION: ProgressionTree = {
  baseFormId: 'sentret',
  rungs: [
    {
      level: 1,
      name: 'Sentret',
      description: 'Starting form.',
      passiveId: 'none',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 2,
      name: 'Furret',
      description: 'Evolve to Furret. Add Slam.',
      evolvesTo: 'furret',
      passiveId: 'none',
      hpBoost: 0,
      cardsToAdd: ['slam'],
    },
    {
      level: 3,
      name: 'Furret',
      description: 'Add Slash.',
      passiveId: 'none',
      hpBoost: 0,
      cardsToAdd: ['slash'],
    },
    {
      level: 4,
      name: 'Furret (Mastered)',
      description: 'Add Fury Swipes.',
      passiveId: 'none',
      hpBoost: 0,
      cardsToAdd: ['fury-swipes'],
    },
  ],
};

// Hoothoot progression — status-utility Flying-type
export const HOOTHOOT_PROGRESSION: ProgressionTree = {
  baseFormId: 'hoothoot',
  rungs: [
    {
      level: 1,
      name: 'Hoothoot',
      description: 'Starting form.',
      passiveId: 'none',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 2,
      name: 'Noctowl',
      description: 'Evolve to Noctowl. Add Wing Attack.',
      evolvesTo: 'noctowl',
      passiveId: 'none',
      hpBoost: 0,
      cardsToAdd: ['wing-attack'],
    },
    {
      level: 3,
      name: 'Noctowl',
      description: 'Add Gust.',
      passiveId: 'none',
      hpBoost: 0,
      cardsToAdd: ['gust'],
    },
    {
      level: 4,
      name: 'Noctowl (Mastered)',
      description: 'Add Swift.',
      passiveId: 'none',
      hpBoost: 0,
      cardsToAdd: ['swift'],
    },
  ],
};

// Ledyba progression — multi-hit Bug/Flying attacker
export const LEDYBA_PROGRESSION: ProgressionTree = {
  baseFormId: 'ledyba',
  rungs: [
    {
      level: 1,
      name: 'Ledyba',
      description: 'Starting form.',
      passiveId: 'none',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 2,
      name: 'Ledian',
      description: 'Evolve to Ledian. Add Comet Punch.',
      evolvesTo: 'ledian',
      passiveId: 'none',
      hpBoost: 0,
      cardsToAdd: ['comet-punch'],
    },
    {
      level: 3,
      name: 'Ledian',
      description: 'Add Swift.',
      passiveId: 'none',
      hpBoost: 0,
      cardsToAdd: ['swift'],
    },
    {
      level: 4,
      name: 'Ledian (Mastered)',
      description: 'Add Wing Attack.',
      passiveId: 'none',
      hpBoost: 0,
      cardsToAdd: ['wing-attack'],
    },
  ],
};

// Spinarak progression — poison/drain Bug/Poison type
export const SPINARAK_PROGRESSION: ProgressionTree = {
  baseFormId: 'spinarak',
  rungs: [
    {
      level: 1,
      name: 'Spinarak',
      description: 'Starting form.',
      passiveId: 'none',
      hpBoost: 0,
      cardsToAdd: [],
    },
    {
      level: 2,
      name: 'Ariados',
      description: 'Evolve to Ariados. Add Night Shade.',
      evolvesTo: 'ariados',
      passiveId: 'none',
      hpBoost: 0,
      cardsToAdd: ['night-shade'],
    },
    {
      level: 3,
      name: 'Ariados',
      description: 'Add Shadow Ball.',
      passiveId: 'none',
      hpBoost: 0,
      cardsToAdd: ['shadow-ball'],
    },
    {
      level: 4,
      name: 'Ariados (Mastered)',
      description: 'Add Leech Life.',
      passiveId: 'none',
      hpBoost: 0,
      cardsToAdd: ['leech-life'],
    },
  ],
};


// ============================================================
// Gen 2 — Batch 1: Ilex Forest Pokemon
// ============================================================

export const HOPPIP_PROGRESSION: ProgressionTree = {
  baseFormId: 'hoppip',
  rungs: [
    { level: 1, name: 'Hoppip', description: 'Starting form.', passiveId: 'none', hpBoost: 0, cardsToAdd: [] },
    { level: 2, name: 'Skiploom', description: 'Evolve to Skiploom. Add Gust.', evolvesTo: 'skiploom', passiveId: 'none', hpBoost: 0, cardsToAdd: ['gust'] },
    { level: 3, name: 'Jumpluff', description: 'Evolve to Jumpluff. Add Razor Leaf.', evolvesTo: 'jumpluff', passiveId: 'none', hpBoost: 0, cardsToAdd: ['razor-leaf'] },
    { level: 4, name: 'Jumpluff (Mastered)', description: 'Add Swift.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['swift'] },
  ],
};

export const SUNKERN_PROGRESSION: ProgressionTree = {
  baseFormId: 'sunkern',
  rungs: [
    { level: 1, name: 'Sunkern', description: 'Starting form.', passiveId: 'none', hpBoost: 0, cardsToAdd: [] },
    { level: 2, name: 'Sunflora', description: 'Evolve to Sunflora. Add Razor Leaf.', evolvesTo: 'sunflora', passiveId: 'none', hpBoost: 0, cardsToAdd: ['razor-leaf'] },
    { level: 3, name: 'Sunflora', description: 'Add Solar Beam.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['solar-beam'] },
    { level: 4, name: 'Sunflora (Mastered)', description: 'Add Growth.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['growth'] },
  ],
};

export const AIPOM_PROGRESSION: ProgressionTree = {
  baseFormId: 'aipom',
  rungs: [
    { level: 1, name: 'Aipom', description: 'Starting form.', passiveId: 'none', hpBoost: 0, cardsToAdd: [] },
    { level: 2, name: 'Aipom', description: 'Add Slam.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['slam'] },
    { level: 3, name: 'Aipom', description: 'Add Fury Swipes.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['fury-swipes'] },
    { level: 4, name: 'Aipom (Mastered)', description: '+8 max HP.', passiveId: 'none', hpBoost: 8, cardsToAdd: [] },
  ],
};

export const YANMA_PROGRESSION: ProgressionTree = {
  baseFormId: 'yanma',
  rungs: [
    { level: 1, name: 'Yanma', description: 'Starting form.', passiveId: 'none', hpBoost: 0, cardsToAdd: [] },
    { level: 2, name: 'Yanma', description: 'Add Wing Attack.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['wing-attack'] },
    { level: 3, name: 'Yanma', description: 'Add Gust.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['gust'] },
    { level: 4, name: 'Yanma (Mastered)', description: 'Add Body Slam.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['body-slam'] },
  ],
};

export const MISDREAVUS_PROGRESSION: ProgressionTree = {
  baseFormId: 'misdreavus',
  rungs: [
    { level: 1, name: 'Misdreavus', description: 'Starting form.', passiveId: 'none', hpBoost: 0, cardsToAdd: [] },
    { level: 2, name: 'Misdreavus', description: 'Add Shadow Ball.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['shadow-ball'] },
    { level: 3, name: 'Misdreavus', description: 'Add Confuse Ray.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['confuse-ray'] },
    { level: 4, name: 'Misdreavus (Mastered)', description: '+8 max HP.', passiveId: 'none', hpBoost: 8, cardsToAdd: [] },
  ],
};

export const SUDOWOODO_PROGRESSION: ProgressionTree = {
  baseFormId: 'sudowoodo',
  rungs: [
    { level: 1, name: 'Sudowoodo', description: 'Starting form.', passiveId: 'none', hpBoost: 0, cardsToAdd: [] },
    { level: 2, name: 'Sudowoodo', description: 'Add Slam.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['slam'] },
    { level: 3, name: 'Sudowoodo', description: 'Add Rock Throw.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['rock-throw'] },
    { level: 4, name: 'Sudowoodo (Mastered)', description: '+10 max HP.', passiveId: 'none', hpBoost: 10, cardsToAdd: [] },
  ],
};

export const WOOPER_PROGRESSION: ProgressionTree = {
  baseFormId: 'wooper',
  rungs: [
    { level: 1, name: 'Wooper', description: 'Starting form.', passiveId: 'none', hpBoost: 0, cardsToAdd: [] },
    { level: 2, name: 'Quagsire', description: 'Evolve to Quagsire. Add Body Slam.', evolvesTo: 'quagsire', passiveId: 'none', hpBoost: 0, cardsToAdd: ['body-slam'] },
    { level: 3, name: 'Quagsire', description: 'Add Surf.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['surf'] },
    { level: 4, name: 'Quagsire (Mastered)', description: '+8 max HP.', passiveId: 'none', hpBoost: 8, cardsToAdd: [] },
  ],
};

export const CELEBI_PROGRESSION: ProgressionTree = {
  baseFormId: 'celebi',
  rungs: [
    { level: 1, name: 'Celebi', description: 'Starting form.', passiveId: 'none', hpBoost: 0, cardsToAdd: [] },
    { level: 2, name: 'Celebi', description: 'Add Magical Leaf.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['magical-leaf'] },
    { level: 3, name: 'Celebi', description: 'Add Ancient Power.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['ancient-power'] },
    { level: 4, name: 'Celebi (Mastered)', description: '+10 max HP.', passiveId: 'none', hpBoost: 10, cardsToAdd: [] },
  ],
};

// ============================================================
// Gen 2 — Batch 2: Past Johto Pokemon
// ============================================================

export const STANTLER_PROGRESSION: ProgressionTree = {
  baseFormId: 'stantler',
  rungs: [
    { level: 1, name: 'Stantler', description: 'Starting form.', passiveId: 'none', hpBoost: 0, cardsToAdd: [] },
    { level: 2, name: 'Stantler', description: 'Add Stomp.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['stomp'] },
    { level: 3, name: 'Stantler', description: 'Add Body Slam.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['body-slam'] },
    { level: 4, name: 'Stantler (Mastered)', description: '+10 max HP.', passiveId: 'none', hpBoost: 10, cardsToAdd: [] },
  ],
};

export const MARILL_PROGRESSION: ProgressionTree = {
  baseFormId: 'marill',
  rungs: [
    { level: 1, name: 'Marill', description: 'Starting form.', passiveId: 'none', hpBoost: 0, cardsToAdd: [] },
    { level: 2, name: 'Azumarill', description: 'Evolve to Azumarill. Add Body Slam.', evolvesTo: 'azumarill', passiveId: 'none', hpBoost: 0, cardsToAdd: ['body-slam'] },
    { level: 3, name: 'Azumarill', description: 'Add Surf.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['surf'] },
    { level: 4, name: 'Azumarill (Mastered)', description: '+8 max HP.', passiveId: 'none', hpBoost: 8, cardsToAdd: [] },
  ],
};

export const FLAAFFY_PROGRESSION: ProgressionTree = {
  baseFormId: 'flaaffy',
  rungs: [
    { level: 1, name: 'Flaaffy', description: 'Starting form.', passiveId: 'none', hpBoost: 0, cardsToAdd: [] },
    { level: 2, name: 'Ampharos', description: 'Evolve to Ampharos. Add Thunderbolt.', evolvesTo: 'ampharos', passiveId: 'none', hpBoost: 0, cardsToAdd: ['thunderbolt'] },
    { level: 3, name: 'Ampharos', description: 'Add Thunder.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['thunder'] },
    { level: 4, name: 'Ampharos (Mastered)', description: '+8 max HP.', passiveId: 'none', hpBoost: 8, cardsToAdd: [] },
  ],
};

export const TOGETIC_PROGRESSION: ProgressionTree = {
  baseFormId: 'togetic',
  rungs: [
    { level: 1, name: 'Togetic', description: 'Starting form.', passiveId: 'none', hpBoost: 0, cardsToAdd: [] },
    { level: 2, name: 'Togetic', description: 'Add Wing Attack.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['wing-attack'] },
    { level: 3, name: 'Togetic', description: 'Add Gust.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['gust'] },
    { level: 4, name: 'Togetic (Mastered)', description: '+8 max HP.', passiveId: 'none', hpBoost: 8, cardsToAdd: [] },
  ],
};

export const ESPEON_PROGRESSION: ProgressionTree = {
  baseFormId: 'espeon',
  rungs: [
    { level: 1, name: 'Espeon', description: 'Starting form.', passiveId: 'none', hpBoost: 0, cardsToAdd: [] },
    { level: 2, name: 'Espeon', description: 'Add Shadow Ball.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['shadow-ball'] },
    { level: 3, name: 'Espeon', description: 'Add Confuse Ray.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['confuse-ray'] },
    { level: 4, name: 'Espeon (Mastered)', description: '+10 max HP.', passiveId: 'none', hpBoost: 10, cardsToAdd: [] },
  ],
};

export const UMBREON_PROGRESSION: ProgressionTree = {
  baseFormId: 'umbreon',
  rungs: [
    { level: 1, name: 'Umbreon', description: 'Starting form.', passiveId: 'none', hpBoost: 0, cardsToAdd: [] },
    { level: 2, name: 'Umbreon', description: 'Add Shadow Ball.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['shadow-ball'] },
    { level: 3, name: 'Umbreon', description: 'Add Bite.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['bite'] },
    { level: 4, name: 'Umbreon (Mastered)', description: '+10 max HP.', passiveId: 'none', hpBoost: 10, cardsToAdd: [] },
  ],
};

export const HERACROSS_PROGRESSION: ProgressionTree = {
  baseFormId: 'heracross',
  rungs: [
    { level: 1, name: 'Heracross', description: 'Starting form.', passiveId: 'none', hpBoost: 0, cardsToAdd: [] },
    { level: 2, name: 'Heracross', description: 'Add Slash.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['slash'] },
    { level: 3, name: 'Heracross', description: 'Add Fury Swipes.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['fury-swipes'] },
    { level: 4, name: 'Heracross (Mastered)', description: '+10 max HP.', passiveId: 'none', hpBoost: 10, cardsToAdd: [] },
  ],
};

export const HOUNDOUR_PROGRESSION: ProgressionTree = {
  baseFormId: 'houndour',
  rungs: [
    { level: 1, name: 'Houndour', description: 'Starting form.', passiveId: 'none', hpBoost: 0, cardsToAdd: [] },
    { level: 2, name: 'Houndoom', description: 'Evolve to Houndoom. Add Flamethrower.', evolvesTo: 'houndoom', passiveId: 'none', hpBoost: 0, cardsToAdd: ['flamethrower'] },
    { level: 3, name: 'Houndoom', description: 'Add Shadow Ball.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['shadow-ball'] },
    { level: 4, name: 'Houndoom (Mastered)', description: '+8 max HP.', passiveId: 'none', hpBoost: 8, cardsToAdd: [] },
  ],
};

export const SNEASEL_PROGRESSION: ProgressionTree = {
  baseFormId: 'sneasel',
  rungs: [
    { level: 1, name: 'Sneasel', description: 'Starting form.', passiveId: 'none', hpBoost: 0, cardsToAdd: [] },
    { level: 2, name: 'Sneasel', description: 'Add Ice Beam.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['ice-beam'] },
    { level: 3, name: 'Sneasel', description: 'Add Slash.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['slash'] },
    { level: 4, name: 'Sneasel (Mastered)', description: '+8 max HP.', passiveId: 'none', hpBoost: 8, cardsToAdd: [] },
  ],
};

export const TEDDIURSA_PROGRESSION: ProgressionTree = {
  baseFormId: 'teddiursa',
  rungs: [
    { level: 1, name: 'Teddiursa', description: 'Starting form.', passiveId: 'none', hpBoost: 0, cardsToAdd: [] },
    { level: 2, name: 'Ursaring', description: 'Evolve to Ursaring. Add Body Slam.', evolvesTo: 'ursaring', passiveId: 'none', hpBoost: 0, cardsToAdd: ['body-slam'] },
    { level: 3, name: 'Ursaring', description: 'Add Slam.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['slam'] },
    { level: 4, name: 'Ursaring (Mastered)', description: '+10 max HP.', passiveId: 'none', hpBoost: 10, cardsToAdd: [] },
  ],
};

export const LARVITAR_PROGRESSION: ProgressionTree = {
  baseFormId: 'larvitar',
  rungs: [
    { level: 1, name: 'Larvitar', description: 'Starting form.', passiveId: 'none', hpBoost: 0, cardsToAdd: [] },
    { level: 2, name: 'Pupitar', description: 'Evolve to Pupitar. Add Bite.', evolvesTo: 'pupitar', passiveId: 'none', hpBoost: 0, cardsToAdd: ['bite'] },
    { level: 3, name: 'Tyranitar', description: 'Evolve to Tyranitar. Add Rock Throw.', evolvesTo: 'tyranitar', passiveId: 'none', hpBoost: 0, cardsToAdd: ['rock-throw'] },
    { level: 4, name: 'Tyranitar (Mastered)', description: '+10 max HP.', passiveId: 'none', hpBoost: 10, cardsToAdd: [] },
  ],
};

export const MILTANK_PROGRESSION: ProgressionTree = {
  baseFormId: 'miltank',
  rungs: [
    { level: 1, name: 'Miltank', description: 'Starting form.', passiveId: 'none', hpBoost: 0, cardsToAdd: [] },
    { level: 2, name: 'Miltank', description: 'Add Stomp.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['stomp'] },
    { level: 3, name: 'Miltank', description: 'Add Body Slam.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['body-slam'] },
    { level: 4, name: 'Miltank (Mastered)', description: '+10 max HP.', passiveId: 'none', hpBoost: 10, cardsToAdd: [] },
  ],
};

export const WOBBUFFET_PROGRESSION: ProgressionTree = {
  baseFormId: 'wobbuffet',
  rungs: [
    { level: 1, name: 'Wobbuffet', description: 'Starting form.', passiveId: 'none', hpBoost: 0, cardsToAdd: [] },
    { level: 2, name: 'Wobbuffet', description: 'Add Counter.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['counter'] },
    { level: 3, name: 'Wobbuffet', description: 'Add Confuse Ray.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['confuse-ray'] },
    { level: 4, name: 'Wobbuffet (Mastered)', description: '+10 max HP.', passiveId: 'none', hpBoost: 10, cardsToAdd: [] },
  ],
};

export const BLISSEY_PROGRESSION: ProgressionTree = {
  baseFormId: 'blissey',
  rungs: [
    { level: 1, name: 'Blissey', description: 'Starting form.', passiveId: 'none', hpBoost: 0, cardsToAdd: [] },
    { level: 2, name: 'Blissey', description: 'Add Body Slam.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['body-slam'] },
    { level: 3, name: 'Blissey', description: 'Add Defend.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['defend'] },
    { level: 4, name: 'Blissey (Mastered)', description: '+12 max HP.', passiveId: 'none', hpBoost: 12, cardsToAdd: [] },
  ],
};

export const PINECO_PROGRESSION: ProgressionTree = {
  baseFormId: 'pineco',
  rungs: [
    { level: 1, name: 'Pineco', description: 'Starting form.', passiveId: 'none', hpBoost: 0, cardsToAdd: [] },
    { level: 2, name: 'Forretress', description: 'Evolve to Forretress. Add Metal Claw.', evolvesTo: 'forretress', passiveId: 'none', hpBoost: 0, cardsToAdd: ['metal-claw'] },
    { level: 3, name: 'Forretress', description: 'Add Slam.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['slam'] },
    { level: 4, name: 'Forretress (Mastered)', description: '+8 max HP.', passiveId: 'none', hpBoost: 8, cardsToAdd: [] },
  ],
};

export const STEELIX_PROGRESSION: ProgressionTree = {
  baseFormId: 'steelix',
  rungs: [
    { level: 1, name: 'Steelix', description: 'Starting form.', passiveId: 'none', hpBoost: 0, cardsToAdd: [] },
    { level: 2, name: 'Steelix', description: 'Add Metal Claw.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['metal-claw'] },
    { level: 3, name: 'Steelix', description: 'Add Slam.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['slam'] },
    { level: 4, name: 'Steelix (Mastered)', description: '+10 max HP.', passiveId: 'none', hpBoost: 10, cardsToAdd: [] },
  ],
};

export const SCIZOR_PROGRESSION: ProgressionTree = {
  baseFormId: 'scizor',
  rungs: [
    { level: 1, name: 'Scizor', description: 'Starting form.', passiveId: 'none', hpBoost: 0, cardsToAdd: [] },
    { level: 2, name: 'Scizor', description: 'Add Slash.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['slash'] },
    { level: 3, name: 'Scizor', description: 'Add Fury Swipes.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['fury-swipes'] },
    { level: 4, name: 'Scizor (Mastered)', description: '+8 max HP.', passiveId: 'none', hpBoost: 8, cardsToAdd: [] },
  ],
};

export const DUNSPARCE_PROGRESSION: ProgressionTree = {
  baseFormId: 'dunsparce',
  rungs: [
    { level: 1, name: 'Dunsparce', description: 'Starting form.', passiveId: 'none', hpBoost: 0, cardsToAdd: [] },
    { level: 2, name: 'Dunsparce', description: 'Add Body Slam.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['body-slam'] },
    { level: 3, name: 'Dunsparce', description: 'Add Slam.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['slam'] },
    { level: 4, name: 'Dunsparce (Mastered)', description: '+8 max HP.', passiveId: 'none', hpBoost: 8, cardsToAdd: [] },
  ],
};

export const GIRAFARIG_PROGRESSION: ProgressionTree = {
  baseFormId: 'girafarig',
  rungs: [
    { level: 1, name: 'Girafarig', description: 'Starting form.', passiveId: 'none', hpBoost: 0, cardsToAdd: [] },
    { level: 2, name: 'Girafarig', description: 'Add Psychic.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['psychic'] },
    { level: 3, name: 'Girafarig', description: 'Add Confuse Ray.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['confuse-ray'] },
    { level: 4, name: 'Girafarig (Mastered)', description: '+8 max HP.', passiveId: 'none', hpBoost: 8, cardsToAdd: [] },
  ],
};

// ============================================================
// Gen 2 — Batch 3: Tin Tower Pokemon
// ============================================================

export const SLUGMA_PROGRESSION: ProgressionTree = {
  baseFormId: 'slugma',
  rungs: [
    { level: 1, name: 'Slugma', description: 'Starting form.', passiveId: 'none', hpBoost: 0, cardsToAdd: [] },
    { level: 2, name: 'Magcargo', description: 'Evolve to Magcargo. Add Flamethrower.', evolvesTo: 'magcargo', passiveId: 'none', hpBoost: 0, cardsToAdd: ['flamethrower'] },
    { level: 3, name: 'Magcargo', description: 'Add Body Slam.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['body-slam'] },
    { level: 4, name: 'Magcargo (Mastered)', description: '+8 max HP.', passiveId: 'none', hpBoost: 8, cardsToAdd: [] },
  ],
};

export const PHANPY_PROGRESSION: ProgressionTree = {
  baseFormId: 'phanpy',
  rungs: [
    { level: 1, name: 'Phanpy', description: 'Starting form.', passiveId: 'none', hpBoost: 0, cardsToAdd: [] },
    { level: 2, name: 'Donphan', description: 'Evolve to Donphan. Add Body Slam.', evolvesTo: 'donphan', passiveId: 'none', hpBoost: 0, cardsToAdd: ['body-slam'] },
    { level: 3, name: 'Donphan', description: 'Add Slam.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['slam'] },
    { level: 4, name: 'Donphan (Mastered)', description: '+10 max HP.', passiveId: 'none', hpBoost: 10, cardsToAdd: [] },
  ],
};

export const SKARMORY_PROGRESSION: ProgressionTree = {
  baseFormId: 'skarmory',
  rungs: [
    { level: 1, name: 'Skarmory', description: 'Starting form.', passiveId: 'none', hpBoost: 0, cardsToAdd: [] },
    { level: 2, name: 'Skarmory', description: 'Add Wing Attack.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['wing-attack'] },
    { level: 3, name: 'Skarmory', description: 'Add Metal Claw.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['metal-claw'] },
    { level: 4, name: 'Skarmory (Mastered)', description: '+8 max HP.', passiveId: 'none', hpBoost: 8, cardsToAdd: [] },
  ],
};

export const HO_OH_PROGRESSION: ProgressionTree = {
  baseFormId: 'ho-oh',
  rungs: [
    { level: 1, name: 'Ho-Oh', description: 'Starting form.', passiveId: 'none', hpBoost: 0, cardsToAdd: [] },
    { level: 2, name: 'Ho-Oh', description: 'Add Solar Beam.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['solar-beam'] },
    { level: 3, name: 'Ho-Oh', description: 'Add Earthquake.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['earthquake'] },
    { level: 4, name: 'Ho-Oh (Mastered)', description: '+10 max HP.', passiveId: 'none', hpBoost: 10, cardsToAdd: [] },
  ],
};

// ============================================================
// Gen 2 — Batch 4: Brass Tower Pokemon
// ============================================================

export const SLOWKING_PROGRESSION: ProgressionTree = {
  baseFormId: 'slowking',
  rungs: [
    { level: 1, name: 'Slowking', description: 'Starting form.', passiveId: 'none', hpBoost: 0, cardsToAdd: [] },
    { level: 2, name: 'Slowking', description: 'Add Psychic.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['psychic'] },
    { level: 3, name: 'Slowking', description: 'Add Ice Beam.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['ice-beam'] },
    { level: 4, name: 'Slowking (Mastered)', description: '+10 max HP.', passiveId: 'none', hpBoost: 10, cardsToAdd: [] },
  ],
};

export const CORSOLA_PROGRESSION: ProgressionTree = {
  baseFormId: 'corsola',
  rungs: [
    { level: 1, name: 'Corsola', description: 'Starting form.', passiveId: 'none', hpBoost: 0, cardsToAdd: [] },
    { level: 2, name: 'Corsola', description: 'Add Rock Throw.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['rock-throw'] },
    { level: 3, name: 'Corsola', description: 'Add Body Slam.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['body-slam'] },
    { level: 4, name: 'Corsola (Mastered)', description: '+8 max HP.', passiveId: 'none', hpBoost: 8, cardsToAdd: [] },
  ],
};

export const MANTINE_PROGRESSION: ProgressionTree = {
  baseFormId: 'mantine',
  rungs: [
    { level: 1, name: 'Mantine', description: 'Starting form.', passiveId: 'none', hpBoost: 0, cardsToAdd: [] },
    { level: 2, name: 'Mantine', description: 'Add Wing Attack.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['wing-attack'] },
    { level: 3, name: 'Mantine', description: 'Add Gust.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['gust'] },
    { level: 4, name: 'Mantine (Mastered)', description: '+8 max HP.', passiveId: 'none', hpBoost: 8, cardsToAdd: [] },
  ],
};

export const CHINCHOU_PROGRESSION: ProgressionTree = {
  baseFormId: 'chinchou',
  rungs: [
    { level: 1, name: 'Chinchou', description: 'Starting form.', passiveId: 'none', hpBoost: 0, cardsToAdd: [] },
    { level: 2, name: 'Lanturn', description: 'Evolve to Lanturn. Add Thunderbolt.', evolvesTo: 'lanturn', passiveId: 'none', hpBoost: 0, cardsToAdd: ['thunderbolt'] },
    { level: 3, name: 'Lanturn', description: 'Add Surf.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['surf'] },
    { level: 4, name: 'Lanturn (Mastered)', description: '+10 max HP.', passiveId: 'none', hpBoost: 10, cardsToAdd: [] },
  ],
};

export const POLITOED_PROGRESSION: ProgressionTree = {
  baseFormId: 'politoed',
  rungs: [
    { level: 1, name: 'Politoed', description: 'Starting form.', passiveId: 'none', hpBoost: 0, cardsToAdd: [] },
    { level: 2, name: 'Politoed', description: 'Add Body Slam.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['body-slam'] },
    { level: 3, name: 'Politoed', description: 'Add Hypnosis.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['hypnosis'] },
    { level: 4, name: 'Politoed (Mastered)', description: '+8 max HP.', passiveId: 'none', hpBoost: 8, cardsToAdd: [] },
  ],
};

export const QWILFISH_PROGRESSION: ProgressionTree = {
  baseFormId: 'qwilfish',
  rungs: [
    { level: 1, name: 'Qwilfish', description: 'Starting form.', passiveId: 'none', hpBoost: 0, cardsToAdd: [] },
    { level: 2, name: 'Qwilfish', description: 'Add Water Gun.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['water-gun'] },
    { level: 3, name: 'Qwilfish', description: 'Add Poison Sting.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['poison-sting'] },
    { level: 4, name: 'Qwilfish (Mastered)', description: '+6 max HP.', passiveId: 'none', hpBoost: 6, cardsToAdd: [] },
  ],
};

export const KINGDRA_PROGRESSION: ProgressionTree = {
  baseFormId: 'kingdra',
  rungs: [
    { level: 1, name: 'Kingdra', description: 'Starting form.', passiveId: 'none', hpBoost: 0, cardsToAdd: [] },
    { level: 2, name: 'Kingdra', description: 'Add Hydro Pump.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['hydro-pump'] },
    { level: 3, name: 'Kingdra', description: 'Add Ice Beam.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['ice-beam'] },
    { level: 4, name: 'Kingdra (Mastered)', description: '+8 max HP.', passiveId: 'none', hpBoost: 8, cardsToAdd: [] },
  ],
};

export const LUGIA_PROGRESSION: ProgressionTree = {
  baseFormId: 'lugia',
  rungs: [
    { level: 1, name: 'Lugia', description: 'Starting form.', passiveId: 'none', hpBoost: 0, cardsToAdd: [] },
    { level: 2, name: 'Lugia', description: 'Add Aeroblast.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['aeroblast'] },
    { level: 3, name: 'Lugia', description: 'Add Recover.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['recover'] },
    { level: 4, name: 'Lugia (Mastered)', description: '+10 max HP.', passiveId: 'none', hpBoost: 10, cardsToAdd: [] },
  ],
};

// ============================================================
// Gen 2 — Batch 5: Legendary Beasts
// ============================================================

export const RAIKOU_PROGRESSION: ProgressionTree = {
  baseFormId: 'raikou',
  rungs: [
    { level: 1, name: 'Raikou', description: 'Starting form.', passiveId: 'none', hpBoost: 0, cardsToAdd: [] },
    { level: 2, name: 'Raikou', description: 'Add Thunderbolt.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['thunderbolt'] },
    { level: 3, name: 'Raikou', description: 'Add Shadow Ball.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['shadow-ball'] },
    { level: 4, name: 'Raikou (Mastered)', description: '+10 max HP.', passiveId: 'none', hpBoost: 10, cardsToAdd: [] },
  ],
};

export const ENTEI_PROGRESSION: ProgressionTree = {
  baseFormId: 'entei',
  rungs: [
    { level: 1, name: 'Entei', description: 'Starting form.', passiveId: 'none', hpBoost: 0, cardsToAdd: [] },
    { level: 2, name: 'Entei', description: 'Add Fire Blast.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['fire-blast'] },
    { level: 3, name: 'Entei', description: 'Add Body Slam.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['body-slam'] },
    { level: 4, name: 'Entei (Mastered)', description: '+10 max HP.', passiveId: 'none', hpBoost: 10, cardsToAdd: [] },
  ],
};

export const SUICUNE_PROGRESSION: ProgressionTree = {
  baseFormId: 'suicune',
  rungs: [
    { level: 1, name: 'Suicune', description: 'Starting form.', passiveId: 'none', hpBoost: 0, cardsToAdd: [] },
    { level: 2, name: 'Suicune', description: 'Add Surf.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['surf'] },
    { level: 3, name: 'Suicune', description: 'Add Ice Beam.', passiveId: 'none', hpBoost: 0, cardsToAdd: ['ice-beam'] },
    { level: 4, name: 'Suicune (Mastered)', description: '+10 max HP.', passiveId: 'none', hpBoost: 10, cardsToAdd: [] },
  ],
};


// All progression trees indexed by base form ID
export const PROGRESSION_TREES: Record<string, ProgressionTree> = {
  charmander: CHARMANDER_PROGRESSION,
  bulbasaur: BULBASAUR_PROGRESSION,
  squirtle: SQUIRTLE_PROGRESSION,
  pikachu: PIKACHU_PROGRESSION,
  pidgey: PIDGEY_PROGRESSION,
  rattata: RATTATA_PROGRESSION,
  ekans: EKANS_PROGRESSION,
  tauros: TAUROS_PROGRESSION,
  snorlax: SNORLAX_PROGRESSION,
  kangaskhan: KANGASKHAN_PROGRESSION,
  'nidoran-m': NIDORAN_M_PROGRESSION,
  'nidoran-f': NIDORAN_F_PROGRESSION,
  rhyhorn: RHYHORN_PROGRESSION,
  drowzee: DROWZEE_PROGRESSION,
  growlithe: GROWLITHE_PROGRESSION,
  voltorb: VOLTORB_PROGRESSION,
  caterpie: CATERPIE_PROGRESSION,
  weedle: WEEDLE_PROGRESSION,
  magikarp: MAGIKARP_PROGRESSION,
  lapras: LAPRAS_PROGRESSION,
  magmar: MAGMAR_PROGRESSION,
  electabuzz: ELECTABUZZ_PROGRESSION,
  dratini: DRATINI_PROGRESSION,
  spearow: SPEAROW_PROGRESSION,
  sandshrew: SANDSHREW_PROGRESSION,
  gastly: GASTLY_PROGRESSION,
  clefairy: CLEFAIRY_PROGRESSION,
  machop: MACHOP_PROGRESSION,
  vulpix: VULPIX_PROGRESSION,
  oddish: ODDISH_PROGRESSION,
  meowth: MEOWTH_PROGRESSION,
  jigglypuff: JIGGLYPUFF_PROGRESSION,
  paras: PARAS_PROGRESSION,
  zubat: ZUBAT_PROGRESSION,
  venonat: VENONAT_PROGRESSION,
  porygon: PORYGON_PROGRESSION,
  // Gen 2 (Johto)
  chikorita: CHIKORITA_PROGRESSION,
  cyndaquil: CYNDAQUIL_PROGRESSION,
  totodile: TOTODILE_PROGRESSION,
  sentret: SENTRET_PROGRESSION,
  hoothoot: HOOTHOOT_PROGRESSION,
  ledyba: LEDYBA_PROGRESSION,
  spinarak: SPINARAK_PROGRESSION,
  // Gen 2 — Batch 1 (Ilex Forest)
  hoppip: HOPPIP_PROGRESSION,
  sunkern: SUNKERN_PROGRESSION,
  aipom: AIPOM_PROGRESSION,
  yanma: YANMA_PROGRESSION,
  misdreavus: MISDREAVUS_PROGRESSION,
  sudowoodo: SUDOWOODO_PROGRESSION,
  wooper: WOOPER_PROGRESSION,
  celebi: CELEBI_PROGRESSION,
  // Gen 2 — Batch 2 (Past Johto)
  stantler: STANTLER_PROGRESSION,
  marill: MARILL_PROGRESSION,
  flaaffy: FLAAFFY_PROGRESSION,
  togetic: TOGETIC_PROGRESSION,
  espeon: ESPEON_PROGRESSION,
  umbreon: UMBREON_PROGRESSION,
  heracross: HERACROSS_PROGRESSION,
  houndour: HOUNDOUR_PROGRESSION,
  sneasel: SNEASEL_PROGRESSION,
  teddiursa: TEDDIURSA_PROGRESSION,
  larvitar: LARVITAR_PROGRESSION,
  miltank: MILTANK_PROGRESSION,
  wobbuffet: WOBBUFFET_PROGRESSION,
  blissey: BLISSEY_PROGRESSION,
  pineco: PINECO_PROGRESSION,
  steelix: STEELIX_PROGRESSION,
  scizor: SCIZOR_PROGRESSION,
  dunsparce: DUNSPARCE_PROGRESSION,
  girafarig: GIRAFARIG_PROGRESSION,
  // Gen 2 — Batch 3 (Tin Tower)
  slugma: SLUGMA_PROGRESSION,
  phanpy: PHANPY_PROGRESSION,
  skarmory: SKARMORY_PROGRESSION,
  'ho-oh': HO_OH_PROGRESSION,
  // Gen 2 — Batch 4 (Brass Tower)
  slowking: SLOWKING_PROGRESSION,
  corsola: CORSOLA_PROGRESSION,
  mantine: MANTINE_PROGRESSION,
  chinchou: CHINCHOU_PROGRESSION,
  politoed: POLITOED_PROGRESSION,
  qwilfish: QWILFISH_PROGRESSION,
  kingdra: KINGDRA_PROGRESSION,
  lugia: LUGIA_PROGRESSION,
  // Gen 2 — Batch 5 (Legendary Beasts)
  raikou: RAIKOU_PROGRESSION,
  entei: ENTEI_PROGRESSION,
  suicune: SUICUNE_PROGRESSION,
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
  if (pokemonId === 'pidgeotto' || pokemonId === 'pidgeot') {
    return PIDGEY_PROGRESSION;
  }
  if (pokemonId === 'raticate') {
    return RATTATA_PROGRESSION;
  }
  if (pokemonId === 'arbok') {
    return EKANS_PROGRESSION;
  }
  if (pokemonId === 'nidorino' || pokemonId === 'nidoking') {
    return NIDORAN_M_PROGRESSION;
  }
  if (pokemonId === 'nidorina' || pokemonId === 'nidoqueen') {
    return NIDORAN_F_PROGRESSION;
  }
  if (pokemonId === 'hypno') {
    return DROWZEE_PROGRESSION;
  }
  if (pokemonId === 'arcanine') {
    return GROWLITHE_PROGRESSION;
  }
  if (pokemonId === 'electrode') {
    return VOLTORB_PROGRESSION;
  }
  if (pokemonId === 'butterfree') {
    return CATERPIE_PROGRESSION;
  }
  if (pokemonId === 'beedrill') {
    return WEEDLE_PROGRESSION;
  }
  if (pokemonId === 'gyarados') {
    return MAGIKARP_PROGRESSION;
  }
  if (pokemonId === 'dragonair' || pokemonId === 'dragonite') {
    return DRATINI_PROGRESSION;
  }
  if (pokemonId === 'fearow') {
    return SPEAROW_PROGRESSION;
  }
  if (pokemonId === 'sandslash') {
    return SANDSHREW_PROGRESSION;
  }
  if (pokemonId === 'haunter' || pokemonId === 'gengar') {
    return GASTLY_PROGRESSION;
  }
  if (pokemonId === 'clefable') {
    return CLEFAIRY_PROGRESSION;
  }
  if (pokemonId === 'machoke' || pokemonId === 'machamp') {
    return MACHOP_PROGRESSION;
  }
  if (pokemonId === 'persian') {
    return MEOWTH_PROGRESSION;
  }
  if (pokemonId === 'ninetales') {
    return VULPIX_PROGRESSION;
  }
  if (pokemonId === 'gloom' || pokemonId === 'vileplume') {
    return ODDISH_PROGRESSION;
  }
  if (pokemonId === 'wigglytuff') {
    return JIGGLYPUFF_PROGRESSION;
  }
  if (pokemonId === 'parasect') {
    return PARAS_PROGRESSION;
  }
  if (pokemonId === 'golbat' || pokemonId === 'crobat') {
    return ZUBAT_PROGRESSION;
  }
  if (pokemonId === 'magmortar') {
    return MAGMAR_PROGRESSION;
  }
  if (pokemonId === 'electivire') {
    return ELECTABUZZ_PROGRESSION;
  }
  if (pokemonId === 'venomoth') {
    return VENONAT_PROGRESSION;
  }
  if (pokemonId === 'porygon2' || pokemonId === 'porygon-z') {
    return PORYGON_PROGRESSION;
  }
  // Gen 2 (Johto)
  if (pokemonId === 'bayleef' || pokemonId === 'meganium') {
    return CHIKORITA_PROGRESSION;
  }
  if (pokemonId === 'quilava' || pokemonId === 'typhlosion') {
    return CYNDAQUIL_PROGRESSION;
  }
  if (pokemonId === 'croconaw' || pokemonId === 'feraligatr') {
    return TOTODILE_PROGRESSION;
  }
  if (pokemonId === 'furret') {
    return SENTRET_PROGRESSION;
  }
  if (pokemonId === 'noctowl') {
    return HOOTHOOT_PROGRESSION;
  }
  if (pokemonId === 'ledian') {
    return LEDYBA_PROGRESSION;
  }
  if (pokemonId === 'ariados') {
    return SPINARAK_PROGRESSION;
  }
  // Gen 2 evolved forms
  if (pokemonId === 'skiploom' || pokemonId === 'jumpluff') return HOPPIP_PROGRESSION;
  if (pokemonId === 'sunflora') return SUNKERN_PROGRESSION;
  if (pokemonId === 'quagsire') return WOOPER_PROGRESSION;
  if (pokemonId === 'azumarill') return MARILL_PROGRESSION;
  if (pokemonId === 'ampharos') return FLAAFFY_PROGRESSION;
  if (pokemonId === 'houndoom') return HOUNDOUR_PROGRESSION;
  if (pokemonId === 'ursaring') return TEDDIURSA_PROGRESSION;
  if (pokemonId === 'pupitar' || pokemonId === 'tyranitar') return LARVITAR_PROGRESSION;
  if (pokemonId === 'forretress') return PINECO_PROGRESSION;
  if (pokemonId === 'magcargo') return SLUGMA_PROGRESSION;
  if (pokemonId === 'donphan') return PHANPY_PROGRESSION;
  if (pokemonId === 'lanturn') return CHINCHOU_PROGRESSION;
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
  if (pokemonId === 'pidgeotto' || pokemonId === 'pidgeot') {
    return 'pidgey';
  }
  if (pokemonId === 'raticate') {
    return 'rattata';
  }
  if (pokemonId === 'arbok') {
    return 'ekans';
  }
  if (pokemonId === 'nidorino' || pokemonId === 'nidoking') {
    return 'nidoran-m';
  }
  if (pokemonId === 'nidorina' || pokemonId === 'nidoqueen') {
    return 'nidoran-f';
  }
  if (pokemonId === 'hypno') {
    return 'drowzee';
  }
  if (pokemonId === 'arcanine') {
    return 'growlithe';
  }
  if (pokemonId === 'electrode') {
    return 'voltorb';
  }
  if (pokemonId === 'butterfree') {
    return 'caterpie';
  }
  if (pokemonId === 'beedrill') {
    return 'weedle';
  }
  if (pokemonId === 'gyarados') {
    return 'magikarp';
  }
  if (pokemonId === 'dragonair' || pokemonId === 'dragonite') {
    return 'dratini';
  }
  if (pokemonId === 'fearow') {
    return 'spearow';
  }
  if (pokemonId === 'sandslash') {
    return 'sandshrew';
  }
  if (pokemonId === 'haunter' || pokemonId === 'gengar') {
    return 'gastly';
  }
  if (pokemonId === 'clefable') {
    return 'clefairy';
  }
  if (pokemonId === 'machoke' || pokemonId === 'machamp') {
    return 'machop';
  }
  if (pokemonId === 'persian') {
    return 'meowth';
  }
  if (pokemonId === 'ninetales') {
    return 'vulpix';
  }
  if (pokemonId === 'gloom' || pokemonId === 'vileplume') {
    return 'oddish';
  }
  if (pokemonId === 'wigglytuff') {
    return 'jigglypuff';
  }
  if (pokemonId === 'parasect') {
    return 'paras';
  }
  if (pokemonId === 'golbat' || pokemonId === 'crobat') {
    return 'zubat';
  }
  if (pokemonId === 'magmortar') {
    return 'magmar';
  }
  if (pokemonId === 'electivire') {
    return 'electabuzz';
  }
  if (pokemonId === 'venomoth') {
    return 'venonat';
  }
  if (pokemonId === 'porygon2' || pokemonId === 'porygon-z') {
    return 'porygon';
  }
  // Gen 2 (Johto)
  if (pokemonId === 'bayleef' || pokemonId === 'meganium') {
    return 'chikorita';
  }
  if (pokemonId === 'quilava' || pokemonId === 'typhlosion') {
    return 'cyndaquil';
  }
  if (pokemonId === 'croconaw' || pokemonId === 'feraligatr') {
    return 'totodile';
  }
  if (pokemonId === 'furret') {
    return 'sentret';
  }
  if (pokemonId === 'noctowl') {
    return 'hoothoot';
  }
  if (pokemonId === 'ledian') {
    return 'ledyba';
  }
  if (pokemonId === 'ariados') {
    return 'spinarak';
  }
  // Gen 2 evolved forms
  if (pokemonId === 'skiploom' || pokemonId === 'jumpluff') return 'hoppip';
  if (pokemonId === 'sunflora') return 'sunkern';
  if (pokemonId === 'quagsire') return 'wooper';
  if (pokemonId === 'azumarill') return 'marill';
  if (pokemonId === 'ampharos') return 'flaaffy';
  if (pokemonId === 'houndoom') return 'houndour';
  if (pokemonId === 'ursaring') return 'teddiursa';
  if (pokemonId === 'pupitar' || pokemonId === 'tyranitar') return 'larvitar';
  if (pokemonId === 'forretress') return 'pineco';
  if (pokemonId === 'magcargo') return 'slugma';
  if (pokemonId === 'donphan') return 'phanpy';
  if (pokemonId === 'lanturn') return 'chinchou';
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
 * Must match EXP_PER_LEVEL in state.ts.
 */
export function canLevelUp(level: number, exp: number): boolean {
  if (level >= 4) return false;
  return exp >= 4;
}
