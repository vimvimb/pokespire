/**
 * Sprite configuration for Pokemon sprites used in the game.
 *
 * To add a new Pokemon:
 * 1. Add an entry to pokemon.json (if playable/encounterable)
 * 2. Run the sprite download script: npm run download-sprites
 * 3. Sprites are auto-discovered from POKEMON_SPRITE_IDS
 *
 * See public/assets/sprites/README.md for sprite asset details.
 */

import { POKEMON } from './loaders';

/** NPC sprites used in UI (shop, rest, etc.) that are not in pokemon.json */
const NPC_SPRITE_IDS = ['kecleon', 'chansey'] as const;

/**
 * All Pokemon IDs that require sprite assets.
 * Includes all playable/encounterable Pokemon plus NPC sprites.
 */
export const POKEMON_SPRITE_IDS: readonly string[] = [
  ...Object.keys(POKEMON),
  ...NPC_SPRITE_IDS,
];
