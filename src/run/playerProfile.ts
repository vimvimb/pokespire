/**
 * Player profile persistence — tracks which Pokemon are unlocked across runs,
 * and which campaigns have been completed (with metadata for story use).
 * localStorage key: pokespire_player_profile
 */

const PROFILE_KEY = "pokespire_player_profile";

/** Arbitrary facts recorded when a campaign run is completed. */
export interface CampaignCompletionRecord {
  completedAt: number;                 // Unix timestamp
  /** Final branch taken, if applicable (e.g. 'tin_tower' or 'brass_tower') */
  path?: string;
  /** Arbitrary metadata for story/progression use (e.g. partyWiped, starter) */
  metadata: Record<string, unknown>;
}

interface PlayerProfile {
  unlockedPokemonIds: string[];
  completedCampaigns: Record<string, CampaignCompletionRecord>;
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
      const parsed = JSON.parse(raw) as PlayerProfile;
      // Migrate old saves that don't have completedCampaigns
      if (!parsed.completedCampaigns) {
        parsed.completedCampaigns = {};
      }
      return parsed;
    }
  } catch (e) {
    console.warn("Failed to load player profile:", e);
  }
  return { unlockedPokemonIds: [...DEFAULT_UNLOCKS], completedCampaigns: {} };
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

/** Record a campaign completion with arbitrary metadata. Overwrites previous. */
export function recordCampaignComplete(
  campaignId: string,
  record: CampaignCompletionRecord
): void {
  const profile = loadProfile();
  profile.completedCampaigns[campaignId] = record;
  saveProfile(profile);
}

/** Get the completion record for a campaign, or null if not completed. */
export function getCampaignCompletion(
  campaignId: string
): CampaignCompletionRecord | null {
  return loadProfile().completedCampaigns[campaignId] ?? null;
}

/** Returns true if the given campaign has been beaten at least once. */
export function isCampaignComplete(campaignId: string): boolean {
  return getCampaignCompletion(campaignId) !== null;
}

/**
 * Debug-only: write completion records for all campaigns except the last one.
 * Call from Debugging screen to quickly unlock all campaigns.
 */
export function unlockAllCampaignsDebug(campaignIds: string[]): void {
  const profile = loadProfile();
  // Mark all except the last as complete (so the last remains unlocked-but-not-beaten)
  for (let i = 0; i < campaignIds.length - 1; i++) {
    const id = campaignIds[i];
    if (!profile.completedCampaigns[id]) {
      profile.completedCampaigns[id] = {
        completedAt: Date.now(),
        metadata: { debugUnlock: true },
      };
    }
  }
  saveProfile(profile);
}

/** Debug-only: clear all campaign completion records. */
export function resetCampaignProgress(): void {
  const profile = loadProfile();
  profile.completedCampaigns = {};
  saveProfile(profile);
}

export function resetProfile(): void {
  try {
    localStorage.removeItem(PROFILE_KEY);
  } catch (e) {
    console.warn("Failed to reset player profile:", e);
  }
}
