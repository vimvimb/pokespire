# Pokemon Sprites

Sprites are sourced from PokemonDB (Black/White animated) and stored locally for offline play.

## Adding a new Pokemon

1. Add an entry to `src/data/pokemon.json` (for playable/encounterable Pokemon).
2. For NPC-only sprites (e.g. shop/rest), add the ID to `NPC_SPRITE_IDS` in `scripts/download-sprites.mjs` and `src/data/spriteConfig.ts`.
3. Run: `npm run download-sprites`
4. Sprites are served from `/assets/sprites/normal/{id}.gif` (front) and `/assets/sprites/back-normal/{id}.gif` (back).

## Sprite IDs

The download script uses all keys from `pokemon.json` plus: kecleon, chansey.
