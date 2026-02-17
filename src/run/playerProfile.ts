/**
 * Player profile persistence — tracks which Pokemon are unlocked across runs.
 * localStorage key: pokespire_player_profile
 */

const PROFILE_KEY = "pokespire_player_profile";

interface PlayerProfile {
  unlockedPokemonIds: string[];
}

/** Budget Pokemon unlocked for all players from the start. */
const DEFAULT_UNLOCKS = [
  "caterpie",
  "weedle",
  "rattata",
  "ekans",
  "spearow",
  "paras",
  "venonat",
];

export function loadProfile(): PlayerProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      return JSON.parse(raw) as PlayerProfile;
    }
  } catch (e) {
    console.warn("Failed to load player profile:", e);
  }
  return { unlockedPokemonIds: [...DEFAULT_UNLOCKS] };
}

export function saveProfile(profile: PlayerProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.warn("Failed to save player profile:", e);
  }
}

export function unlockPokemon(pokemonId: string): void {
  const profile = loadProfile();
  if (!profile.unlockedPokemonIds.includes(pokemonId)) {
    profile.unlockedPokemonIds.push(pokemonId);
    saveProfile(profile);
  }
}

export function getUnlockedPokemonIds(): string[] {
  return loadProfile().unlockedPokemonIds;
}

export function resetProfile(): void {
  try {
    localStorage.removeItem(PROFILE_KEY);
  } catch (e) {
    console.warn("Failed to reset player profile:", e);
  }
}
