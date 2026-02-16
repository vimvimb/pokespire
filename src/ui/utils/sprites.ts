/**
 * Centralized sprite URL helper for Pokemon sprites.
 * Uses local assets for offline play.
 */

export function getSpriteUrl(
  pokemonId: string,
  variant: 'front' | 'back' = 'front',
): string {
  const subdir = variant === 'front' ? 'normal' : 'back-normal';
  return `${import.meta.env.BASE_URL}assets/sprites/${subdir}/${pokemonId}.gif`;
}
