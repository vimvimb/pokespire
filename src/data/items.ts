/**
 * Held Item Definitions — Slay the Spire-style relics.
 *
 * Items are found during runs as battle/event/shop rewards.
 * Each Pokemon holds one item.
 *
 * Three tiers:
 *   starting — offered when drafting a new Pokemon at run start or from wild battles
 *   common   — battle reward pool (50% drop chance after each battle)
 *   boss     — potential reward after defeating Act 1 or Act 2 boss
 */

export type ItemRarity = 'starting' | 'common' | 'boss';

export interface ItemDefinition {
  id: string;
  name: string;
  description: string;
  rarity: ItemRarity;
  icon: string; // emoji for now
}

export const ITEM_DEFS: Record<string, ItemDefinition> = {
  // ── Starting (Kanto City Set) ─────────────────────────────────────
  viridian_target: {
    id: 'viridian_target',
    name: 'Viridian Target',
    description: 'Column switch: provoke enemies in that column.',
    rarity: 'starting',
    icon: '🎯',
  },
  pewter_stone: {
    id: 'pewter_stone',
    name: 'Pewter Stone',
    description: 'Start combat with 8 Block. Auto-provoke enemies in your column.',
    rarity: 'starting',
    icon: '🪨',
  },
  pallet_cannon: {
    id: 'pallet_cannon',
    name: 'Pallet Cannon',
    description: '+5 damage to enemies in your column.',
    rarity: 'starting',
    icon: '💥',
  },
  cerulean_tear: {
    id: 'cerulean_tear',
    name: 'Cerulean Tear',
    description: 'Heal ally in front of you in your column for 5 HP each turn.',
    rarity: 'starting',
    icon: '💧',
  },
  vermilion_spark: {
    id: 'vermilion_spark',
    name: 'Vermilion Spark',
    description: 'Hitting an enemy with a contact move provokes them.',
    rarity: 'starting',
    icon: '⚡',
  },
  celadon_leaf: {
    id: 'celadon_leaf',
    name: 'Celadon Leaf',
    description: 'Heal the holder for 6 HP at combat end.',
    rarity: 'starting',
    icon: '🍃',
  },
  saffron_spoon: {
    id: 'saffron_spoon',
    name: 'Saffron Spoon',
    description: 'Switching into an enemy column applies Enfeeble 3 to all enemies in that column.',
    rarity: 'starting',
    icon: '🥄',
  },
  lavender_tombstone: {
    id: 'lavender_tombstone',
    name: 'Lavender Tombstone',
    description: 'If an enemy dies in your column, regain 1 energy.',
    rarity: 'starting',
    icon: '🪦',
  },
  cinnabar_ash: {
    id: 'cinnabar_ash',
    name: 'Cinnabar Ash',
    description: 'When you play a card with Vanish, draw a card.',
    rarity: 'starting',
    icon: '🔥',
  },
  fuchsia_shuriken: {
    id: 'fuchsia_shuriken',
    name: 'Fuchsia Shuriken',
    description: 'Cards that deal damage AND apply a status: halve damage, double status stacks.',
    rarity: 'starting',
    icon: '⭐',
  },

  // ── Common ─────────────────────────────────────────────────────────
  leftovers: {
    id: 'leftovers',
    name: 'Leftovers',
    description: 'Heal 3 HP at start of your turn.',
    rarity: 'common',
    icon: '🍎',
  },
  shell_bell: {
    id: 'shell_bell',
    name: 'Shell Bell',
    description: 'Heal 2 HP when you deal damage (once per card).',
    rarity: 'common',
    icon: '🔔',
  },
  wide_lens: {
    id: 'wide_lens',
    name: 'Wide Lens',
    description: '+2 damage to all attacks.',
    rarity: 'common',
    icon: '🔍',
  },
  iron_plate: {
    id: 'iron_plate',
    name: 'Iron Plate',
    description: 'Round start: +Block = allies in row × 3 (3-9).',
    rarity: 'common',
    icon: '🛡️',
  },
  buddy_guard: {
    id: 'buddy_guard',
    name: 'Buddy Guard',
    description: 'Column allies take 4 less single-target damage.',
    rarity: 'common',
    icon: '🤝',
  },
  sniper_scope: {
    id: 'sniper_scope',
    name: 'Sniper Scope',
    description: '+5 damage to enemies in your column.',
    rarity: 'common',
    icon: '🎯',
  },
  guerrilla_boots: {
    id: 'guerrilla_boots',
    name: 'Guerrilla Boots',
    description: 'Back→front: +4 all attacks. Front→back: +3 Block.',
    rarity: 'common',
    icon: '👢',
  },
  smoke_ball: {
    id: 'smoke_ball',
    name: 'Smoke Ball',
    description: 'Column switch: provoke enemies (2 stacks).',
    rarity: 'common',
    icon: '💨',
  },
  sacred_ash: {
    id: 'sacred_ash',
    name: 'Sacred Ash',
    description: 'Back row: heal front ally in same column 5 HP at turn start.',
    rarity: 'common',
    icon: '✨',
  },
  choice_band: {
    id: 'choice_band',
    name: 'Choice Band',
    description: '+8 damage, front-row attacks only.',
    rarity: 'common',
    icon: '💪',
  },
  focus_sash: {
    id: 'focus_sash',
    name: 'Focus Sash',
    description: 'Survive one lethal hit at 1 HP (once per battle).',
    rarity: 'common',
    icon: '🎗️',
  },
  scope_lens: {
    id: 'scope_lens',
    name: 'Scope Lens',
    description: '+3 damage to single-target attacks.',
    rarity: 'common',
    icon: '🔭',
  },
  quick_claw: {
    id: 'quick_claw',
    name: 'Quick Claw',
    description: 'At battle start, take a bonus turn with 1 energy before anyone else.',
    rarity: 'common',
    icon: '⚡',
  },
  life_orb: {
    id: 'life_orb',
    name: 'Life Orb',
    description: '×1.3 damage, take 3 self-damage per attack.',
    rarity: 'common',
    icon: '🔮',
  },
  assault_vest: {
    id: 'assault_vest',
    name: 'Assault Vest',
    description: '+10 Block at round start, attacks only.',
    rarity: 'common',
    icon: '🦺',
  },
  metronome_item: {
    id: 'metronome_item',
    name: 'Metronome',
    description: '+2 per consecutive attack this turn (resets on non-attack or turn end).',
    rarity: 'common',
    icon: '🎵',
  },
  eviolite: {
    id: 'eviolite',
    name: 'Eviolite',
    description: '+15 max HP at battle start.',
    rarity: 'common',
    icon: '💎',
  },
  rocky_helmet: {
    id: 'rocky_helmet',
    name: 'Rocky Helmet',
    description: 'Battle start: gain Thorns 5.',
    rarity: 'common',
    icon: '⛑️',
  },
  big_root: {
    id: 'big_root',
    name: 'Big Root',
    description: '+50% healing received.',
    rarity: 'common',
    icon: '🌿',
  },
  bright_powder: {
    id: 'bright_powder',
    name: 'Bright Powder',
    description: 'Front row: gain Evasion 1 each round.',
    rarity: 'common',
    icon: '✨',
  },
  razor_fang: {
    id: 'razor_fang',
    name: 'Razor Fang',
    description: 'First attack each battle: +8 damage.',
    rarity: 'common',
    icon: '🦷',
  },
  toxic_plate: {
    id: 'toxic_plate',
    name: 'Toxic Plate',
    description: 'Battle start: Poison 1 to all enemies.',
    rarity: 'common',
    icon: '☠️',
  },
  power_herb: {
    id: 'power_herb',
    name: 'Power Herb',
    description: 'Turn 1: +1 energy.',
    rarity: 'common',
    icon: '🌱',
  },
  adrenaline_orb: {
    id: 'adrenaline_orb',
    name: 'Adrenaline Orb',
    description: 'Every 5th attack: +1 energy.',
    rarity: 'common',
    icon: '💊',
  },
  venom_sac: {
    id: 'venom_sac',
    name: 'Venom Sac',
    description: 'On KO: transfer victim\'s Poison stacks to a random alive enemy.',
    rarity: 'common',
    icon: '🫧',
  },
  sitrus_berry: {
    id: 'sitrus_berry',
    name: 'Sitrus Berry',
    description: 'First damage taken in combat: draw 2 cards.',
    rarity: 'common',
    icon: '🍋',
  },
  protective_pads: {
    id: 'protective_pads',
    name: 'Protective Pads',
    description: 'Play 2+ attacks in a turn: gain 5 Block.',
    rarity: 'common',
    icon: '🧤',
  },
  slow_start_gem: {
    id: 'slow_start_gem',
    name: 'Slow Start Gem',
    description: 'Play 1 or fewer cards this turn: draw 2 extra next turn.',
    rarity: 'common',
    icon: '💎',
  },
  oran_berry: {
    id: 'oran_berry',
    name: 'Oran Berry',
    description: 'End of battle: heal 15 if below 50% HP.',
    rarity: 'common',
    icon: '🫐',
  },
  kings_rock: {
    id: 'kings_rock',
    name: 'King\'s Rock',
    description: 'When you apply a debuff, also apply Slow 1.',
    rarity: 'common',
    icon: '👑',
  },
  moxie_charm: {
    id: 'moxie_charm',
    name: 'Moxie Charm',
    description: 'On KO: +1 energy, draw 1 card.',
    rarity: 'common',
    icon: '🏆',
  },
  sturdy_charm: {
    id: 'sturdy_charm',
    name: 'Sturdy Charm',
    description: 'Attacks dealing 5 or less HP damage deal 1 instead.',
    rarity: 'common',
    icon: '🛡️',
  },
  black_sludge: {
    id: 'black_sludge',
    name: 'Black Sludge',
    description: '+1 energy/turn. Poison types heal 3/round, others take 3 damage/round.',
    rarity: 'common',
    icon: '🩸',
  },

  // ── Boss ───────────────────────────────────────────────────────────
  choice_specs: {
    id: 'choice_specs',
    name: 'Choice Specs',
    description: '+8 damage, no front-row or AoE attacks.',
    rarity: 'boss',
    icon: '👓',
  },
  toxic_orb: {
    id: 'toxic_orb',
    name: 'Toxic Orb',
    description: 'Self-poison 1 at battle start, +4 damage all attacks.',
    rarity: 'boss',
    icon: '☠️',
  },
  expert_belt: {
    id: 'expert_belt',
    name: 'Expert Belt',
    description: '+5 damage on super-effective hits.',
    rarity: 'boss',
    icon: '🥋',
  },
  choice_scarf: {
    id: 'choice_scarf',
    name: 'Choice Scarf',
    description: '+1 energy/turn, max 2 cards/turn.',
    rarity: 'boss',
    icon: '🧣',
  },
  flame_orb: {
    id: 'flame_orb',
    name: 'Flame Orb',
    description: '+1 energy/turn, self-Burn 2 at battle start.',
    rarity: 'boss',
    icon: '🔥',
  },
};

/** Rarity-based border colors for UI badges. */
export const RARITY_COLORS: Record<ItemRarity, string> = {
  starting: '#f59e0b',
  common: '#9ca3af',
  boss: '#a855f7',
};

/** The 10 Kanto-city starter items offered at run start. */
export const STARTER_ITEM_IDS: string[] = Object.values(ITEM_DEFS)
  .filter(item => item.rarity === 'starting')
  .map(item => item.id);
