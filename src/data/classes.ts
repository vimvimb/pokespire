/** Class definitions — design reference (not yet wired into engine). */

export type ClassCategory = 'defensive' | 'offensive' | 'support' | 'specialist';

export interface ClassDef {
  id: string;
  name: string;
  category: ClassCategory;
  switchesPerTurn: number;
  condition: string;
  effect: string;
}

export const CLASS_DEFS: ClassDef[] = [
  // ── Defensive ────────────────────────────────────────────────
  {
    id: 'rogue',
    name: 'Rogue',
    category: 'defensive',
    switchesPerTurn: 1,
    condition: 'When switching columns',
    effect:
      'Provoke all enemies in the column you moved to, forcing them to target you.',
  },
  {
    id: 'vanguard',
    name: 'Vanguard',
    category: 'defensive',
    switchesPerTurn: 1,
    condition: "Didn't move last turn (activates turn 1)",
    effect: 'Gain 5 Block at the start of the round.',
  },
  {
    id: 'defender',
    name: 'Defender',
    category: 'defensive',
    switchesPerTurn: 1,
    condition: 'When swapping with an ally',
    effect: 'Share half your current Block with them.',
  },
  {
    id: 'interceptor',
    name: 'Interceptor',
    category: 'defensive',
    switchesPerTurn: 1,
    condition: 'Ally in your row targeted by a single-target attack',
    effect: 'Once per round, you take the damage instead.',
  },

  // ── Offensive ────────────────────────────────────────────────
  {
    id: 'deadshot',
    name: 'Deadshot',
    category: 'offensive',
    switchesPerTurn: 1,
    condition: 'While in the back row',
    effect: '+5 damage to enemies in your column.',
  },
  {
    id: 'guerilla',
    name: 'Guerilla',
    category: 'offensive',
    switchesPerTurn: 2,
    condition: 'When switching rows',
    effect:
      'Switching to the back row costs 0 energy. Switching to the front row grants your front-row attacks +3 damage for the rest of the turn.',
  },
  {
    id: 'necromancer',
    name: 'Necromancer',
    category: 'offensive',
    switchesPerTurn: 1,
    condition: 'When an enemy in your column dies',
    effect: 'Recover 1 energy.',
  },
  {
    id: 'pugilist',
    name: 'Pugilist',
    category: 'offensive',
    switchesPerTurn: 1,
    condition: 'While in the front row',
    effect: 'Your front-targeting attacks deal +2 damage.',
  },

  // ── Support ──────────────────────────────────────────────────
  {
    id: 'bard',
    name: 'Bard',
    category: 'support',
    switchesPerTurn: 1,
    condition: 'When swapping with an ally',
    effect: 'Give them 1 energy.',
  },
  {
    id: 'herald',
    name: 'Herald',
    category: 'support',
    switchesPerTurn: 1,
    condition: 'When swapping with an ally',
    effect: 'Grant them 2 Haste.',
  },
  {
    id: 'priest',
    name: 'Priest',
    category: 'support',
    switchesPerTurn: 1,
    condition: 'While in back row with an ally in front (same column)',
    effect: 'That ally recovers 5 HP at the start of your turn.',
  },
  {
    id: 'captain',
    name: 'Captain',
    category: 'support',
    switchesPerTurn: 1,
    condition: 'Allies to your sides (same row, adjacent columns)',
    effect: 'They deal +3 damage.',
  },

  // ── Specialist ───────────────────────────────────────────────
  {
    id: 'renegade',
    name: 'Renegade',
    category: 'specialist',
    switchesPerTurn: 1,
    condition: 'No adjacent allies',
    effect: '+4 damage dealt, −4 damage taken.',
  },
];

export const CATEGORY_META: Record<
  ClassCategory,
  { label: string; color: string }
> = {
  defensive: { label: 'Defensive', color: '#6890f0' },
  offensive: { label: 'Offensive', color: '#e85050' },
  support: { label: 'Support', color: '#78c850' },
  specialist: { label: 'Specialist', color: '#a855f7' },
};
