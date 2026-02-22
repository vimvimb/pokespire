/** Class definitions — design reference (not yet wired into engine). */

export type ClassCategory = 'defensive' | 'offensive' | 'support' | 'specialist';

export interface ClassDef {
  id: string;
  name: string;
  pinName: string;
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
    pinName: 'Rogue Pin',
    category: 'defensive',
    switchesPerTurn: 1,
    condition: 'When switching columns',
    effect:
      'Provoke (2 stacks) all enemies in the column you moved to, forcing them to target you.',
  },
  {
    id: 'vanguard',
    name: 'Vanguard',
    pinName: 'Vanguard Pin',
    category: 'defensive',
    switchesPerTurn: 1,
    condition: 'At the start of each round',
    effect: 'Gain Block equal to 3 per ally in your row (including self). Range: 3-9.',
  },
  {
    id: 'interceptor',
    name: 'Interceptor',
    pinName: 'Interceptor Pin',
    category: 'defensive',
    switchesPerTurn: 1,
    condition: 'Ally in your column takes single-target damage',
    effect: 'Reduce that damage by 4.',
  },

  // ── Offensive ────────────────────────────────────────────────
  {
    id: 'deadshot',
    name: 'Deadshot',
    pinName: 'Deadshot Pin',
    category: 'offensive',
    switchesPerTurn: 1,
    condition: 'When targeting an enemy in your column',
    effect: '+5 damage.',
  },
  {
    id: 'guerilla',
    name: 'Guerilla',
    pinName: 'Guerilla Pin',
    category: 'offensive',
    switchesPerTurn: 2,
    condition: 'When switching rows',
    effect:
      'Back→front: +4 damage to all attacks this turn. Front→back: gain 3 Block.',
  },

  // ── Support ──────────────────────────────────────────────────
  {
    id: 'priest',
    name: 'Priest',
    pinName: 'Priest Pin',
    category: 'support',
    switchesPerTurn: 1,
    condition: 'While in back row with an ally in front (same column)',
    effect: 'That ally recovers 5 HP at the start of your turn.',
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
